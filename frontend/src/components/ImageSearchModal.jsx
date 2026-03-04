

import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';

export default function ImageSearchModal({ isOpen, onClose }) {
  // State machine: 'upload' | 'camera' | 'loading' | 'results'
  const [step, setStep] = useState('upload');
  const [products, setProducts] = useState([]);
  const [detectedText, setDetectedText] = useState('');
  const [matchReason, setMatchReason] = useState('');
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  
  const fileInputRef = useRef();
  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef(null);

  // Clean up on unmount/modal close
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Reset modal state when opened/closed
  useEffect(() => {
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setStep('upload');
      setProducts([]);
      setDetectedText('');
      setMatchReason('');
      setError('');
      setUrlInput('');
      setDragActive(false);
    }
  }, [isOpen]);

  // Start camera
  const startCamera = async () => {
    console.log('📷 [startCamera] Starting camera...');
    setError('');
    setStep('camera');

    try {
      console.log('🎥 [startCamera] Requesting getUserMedia...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      console.log('✅ [startCamera] Stream obtained! Tracks:', stream.getTracks().length);
      streamRef.current = stream;

      // Assign stream to video element
      if (videoRef.current) {
        console.log('🎬 [startCamera] Assigning stream to <video>...');
        videoRef.current.srcObject = stream;
        
        // Try to play the video
        try {
          await videoRef.current.play();
          console.log('✅ [startCamera] Video playing');
        } catch (playErr) {
          console.error('⚠️ [startCamera] Play error:', playErr.message);
        }
      } else {
        console.error('❌ [startCamera] videoRef.current is null!');
        setError('Camera element not found');
        setStep('upload');
      }
    } catch (err) {
      console.error('❌ [startCamera] Error:', err.name, err.message);
      setError(`Camera denied: ${err.message}`);
      setStep('upload');
    }
  };

  // Capture photo from video element and send to backend
  const capturePhoto = () => {
    console.log('📸 [capturePhoto] Capture button clicked');

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      console.error('❌ [capturePhoto] Missing video or canvas ref');
      setError('Capture failed: element refs missing');
      return;
    }

    console.log('📹 [capturePhoto] Video state:', {
      paused: video.paused,
      readyState: video.readyState,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight
    });

    // Wait if video not ready
    if (video.readyState !== 4 || video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn('⏳ [capturePhoto] Video not ready, retrying...');
      setTimeout(capturePhoto, 300);
      return;
    }

    try {
      // Set canvas size and draw frame
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      console.log('✅ [capturePhoto] Frame drawn to canvas');

      // Convert canvas to blob/file
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error('❌ [capturePhoto] toBlob failed');
            setError('Failed to capture image');
            return;
          }

          const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
          console.log('✅ [capturePhoto] File created:', file.name, file.size, 'bytes');

          // Stop camera
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
            console.log('✅ [capturePhoto] Camera stopped');
          }

          // Send to backend
          sendImageToBackend(file);
        },
        'image/jpeg',
        0.95
      );
    } catch (err) {
      console.error('❌ [capturePhoto] Error:', err.message);
      setError(`Capture error: ${err.message}`);
    }
  };

  // Handle file input change - IMMEDIATELY trigger upload
  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    console.log('🎯 [handleUpload] File selected:', file?.name);
    
    if (file) {
      console.log('✅ [handleUpload] Sending to backend immediately');
      sendImageToBackend(file);
    }
  };

  // Drag & Drop handlers
  const handleDrag = e => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };
  const handleDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      sendImageToBackend(e.dataTransfer.files[0]);
    }
  };

  // Handle URL search
  const handleUrlSearch = async () => {
    console.log('🔗 [handleUrlSearch] URL:', urlInput);
    if (!urlInput.trim()) {
      console.warn('⚠️ [handleUrlSearch] URL is empty');
      return;
    }

    setError('');
    setStep('loading');
    console.log('⏳ [handleUrlSearch] Set step to LOADING');

    try {
      console.log('🌐 [handleUrlSearch] POST /api/image-search');
      const res = await axios.post('/api/image-search', { url: urlInput });

      console.log('✅ [handleUrlSearch] Response:', res.data);

      setProducts(res.data.products || []);
      setDetectedText(res.data.detected_text || '');
      setMatchReason(res.data.match_reason || '');
      setStep('results');
      console.log('✅ [handleUrlSearch] Set step to RESULTS');
    } catch (err) {
      console.error('❌ [handleUrlSearch] Error:', err.message);
      setError(`URL search failed: ${err.response?.data?.message || err.message}`);
      setStep('upload');
    }
  };

  // Send image to backend via Axios
  const sendImageToBackend = async (file) => {
    console.log('🚀 [sendImageToBackend] Starting upload for:', file.name);

    // Validate
    if (!file) {
      console.error('❌ [sendImageToBackend] No file provided');
      return;
    }

    const sizeMB = file.size / (1024 * 1024);
    console.log('📊 [sendImageToBackend] File size:', sizeMB.toFixed(2), 'MB');

    if (sizeMB > 2) {
      console.warn('⚠️ [sendImageToBackend] File too large');
      setError('Image must be less than 2MB');
      setStep('upload');
      return;
    }

    // Show loading immediately
    setError('');
    setStep('loading');
    console.log('⏳ [sendImageToBackend] Set step to LOADING');

    // Create FormData
    const formData = new FormData();
    formData.append('image', file);
    console.log('📦 [sendImageToBackend] FormData created');

    try {
      console.log('🌐 [sendImageToBackend] POST /api/image-search');
      const response = await axios.post('/api/image-search', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('✅ [sendImageToBackend] Response received:', response.status);
      console.log('📋 [sendImageToBackend] Data:', response.data);

      // Extract results
      const prods = response.data.products || [];
      const text = response.data.detected_text || '';
      const reason = response.data.match_reason || '';

      console.log('📊 [sendImageToBackend] Results:', {
        productCount: prods.length,
        detected_text: text,
        match_reason: reason
      });

      // Update state
      setProducts(prods);
      setDetectedText(text);
      setMatchReason(reason);
      setStep('results');
      console.log('✅ [sendImageToBackend] Set step to RESULTS');
    } catch (err) {
      console.error('❌ [sendImageToBackend] Error:', err.message);
      if (err.response) {
        console.error('Status:', err.response.status);
        console.error('Data:', err.response.data);
      }
      setError(`Upload failed: ${err.response?.data?.message || err.message}`);
      setStep('upload');
    }
  };

  // Clean up camera on modal close
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative">
        {/* Close Button */}
        <button 
          className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 rounded-full transition"
          onClick={() => { stopCamera(); onClose(); }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Image Search</h1>
              <p className="text-gray-600">Upload an image or paste a URL to find similar items</p>
            </div>

            {/* Large Drag & Drop Zone */}
            <div
              className={`w-full border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              {/* Upload Icon */}
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              
              <p className="text-lg font-semibold text-gray-700 mb-1">Drag & drop an image here</p>
              <p className="text-sm text-gray-500">or click to select from your device</p>
              <input 
                type="file" 
                hidden 
                ref={fileInputRef} 
                onChange={handleUpload} 
                accept="image/*"
              />
            </div>

            {/* OR Separator */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-sm font-medium text-gray-500">OR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* URL Search Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search by URL</label>
              <div className="relative flex items-center">
                <svg className="absolute left-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Paste image URL..."
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleUrlSearch(); }}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <button 
                  onClick={handleUrlSearch}
                  className="absolute right-1 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm sm:text-base font-medium transition"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Camera Button */}
            <button 
              onClick={startCamera}
              className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-base sm:text-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition flex items-center justify-center gap-2 shadow-lg"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Take a Photo
            </button>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Camera Step */}
        {step === 'camera' && (
          <div className="relative bg-black h-screen flex flex-col">
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="flex-1 w-full h-full object-cover bg-black"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Capture Frame Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-2 border-white/50 rounded-xl" />
            </div>
            
            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-6 flex justify-center gap-4">
              <button 
                onClick={() => {
                  if (streamRef.current) {
                    streamRef.current.getTracks().forEach(t => t.stop());
                    streamRef.current = null;
                  }
                  setStep('upload');
                }}
                className="px-6 sm:px-8 py-3 sm:py-3.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-base font-semibold transition"
              >
                Cancel
              </button>
              <button 
                onClick={capturePhoto}
                className="w-16 h-16 sm:w-18 sm:h-18 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center text-3xl font-bold transition transform hover:scale-110 shadow-2xl"
              >
                📷
              </button>
            </div>

            {/* Error message overlaid */}
            {error && (
              <div className="absolute top-4 left-4 right-4 p-3 bg-red-600 text-white text-sm rounded-lg font-medium">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Loading Step */}
        {step === 'loading' && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6" />
              <p className="text-xl font-bold text-gray-900">Scanning image...</p>
              <p className="text-gray-600 text-sm mt-2">Using AI to find similar products</p>
            </div>
          </div>
        )}

        {/* Results Step */}
        {step === 'results' && (
          <div className="p-8 h-screen overflow-y-auto">
            {/* Results Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Search Results</h2>
              {detectedText && (
                <p className="text-sm text-gray-600">Detected: <span className="font-medium text-gray-900">"{detectedText}"</span></p>
              )}
              {matchReason === 'fallback_recent' && (
                <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg mt-2">
                  ℹ️ No exact match found. Showing latest items instead.
                </p>
              )}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {products.length > 0 ? (
                products.map((p) => (
                  <div 
                    key={p.id} 
                    className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer"
                  >
                    <div className="relative bg-gray-100 aspect-square overflow-hidden">
                      <img 
                        src={p.image_url} 
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600">
                        {p.name}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-1">{p.model_info}</p>
                      <p className="text-lg font-bold text-blue-600 mt-2">
                        ${parseFloat(p.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-12">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-500 font-medium">No similar products found</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={() => setStep('upload')}
                className="flex-1 py-3 sm:py-3.5 border border-gray-300 text-gray-700 rounded-lg text-base font-semibold hover:bg-gray-50 transition"
              >
                Search Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}