import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { ArrowLeft, Camera, Heart, Link as LinkIcon, Search, Upload } from 'lucide-react';
import { resolveImageUrl } from '../lib/images.js';
import { useWishlist } from '../state/wishlist.jsx';

export default function ImageSearch() {
  const nav = useNavigate();
  const wishlist = useWishlist();
  const STORAGE_KEY = 'image_search_state_v1';
  
  // State machine: 'input' | 'camera' | 'loading' | 'results'
  const [step, setStep] = useState('input');
  const [products, setProducts] = useState([]);
  const [sourceImage, setSourceImage] = useState(null); // URL of uploaded/captured image
  const [detectedText, setDetectedText] = useState('');
  const [matchReason, setMatchReason] = useState('');
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  
  const fileInputRef = useRef();
  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (step !== 'input') return;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const cached = JSON.parse(raw);
      if (!cached || !Array.isArray(cached.products) || !cached.sourceImage) return;

      setProducts(cached.products);
      setSourceImage(cached.sourceImage);
      setDetectedText(cached.detectedText || '');
      setMatchReason(cached.matchReason || '');
      setStep('results');
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [step]);

  const persistSearchState = (next) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage errors
    }
  };

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

      if (videoRef.current) {
        console.log('🎬 [startCamera] Assigning stream to <video>...');
        videoRef.current.srcObject = stream;
        
        try {
          await videoRef.current.play();
          console.log('✅ [startCamera] Video playing');
        } catch (playErr) {
          console.error('⚠️ [startCamera] Play error:', playErr.message);
        }
      } else {
        console.error('❌ [startCamera] videoRef.current is null!');
        setError('Camera element not found');
        setStep('input');
      }
    } catch (err) {
      console.error('❌ [startCamera] Error:', err.name, err.message);
      setError(`Camera denied: ${err.message}`);
      setStep('input');
    }
  };

  // Capture photo from video element
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

    if (video.readyState !== 4 || video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn('⏳ [capturePhoto] Video not ready, retrying...');
      setTimeout(capturePhoto, 300);
      return;
    }

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      console.log('✅ [capturePhoto] Frame drawn to canvas');

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error('❌ [capturePhoto] toBlob failed');
            setError('Failed to capture image');
            return;
          }

          const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
          console.log('✅ [capturePhoto] File created:', file.name, file.size, 'bytes');

          if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
            console.log('✅ [capturePhoto] Camera stopped');
          }

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

  // Handle file input change
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
      setError('Please enter a valid URL');
      return;
    }

    setError('');
    setStep('loading');
    console.log('⏳ [handleUrlSearch] Set step to LOADING');
    setSourceImage(urlInput);

    try {
      console.log('🌐 [handleUrlSearch] POST /api/image-search');
      const res = await axios.post('/api/image-search', { url: urlInput });

      console.log('✅ [handleUrlSearch] Response:', res.data);

      const nextProducts = res.data.products || [];
      const nextDetectedText = res.data.detected_text || '';
      const nextMatchReason = res.data.match_reason || '';

      setProducts(nextProducts);
      setDetectedText(nextDetectedText);
      setMatchReason(nextMatchReason);

      persistSearchState({
        products: nextProducts,
        sourceImage: urlInput,
        detectedText: nextDetectedText,
        matchReason: nextMatchReason,
      });
      setStep('results');
      console.log('✅ [handleUrlSearch] Set step to RESULTS');
    } catch (err) {
      console.error('❌ [handleUrlSearch] Error:', err.message);
      setError(`URL search failed: ${err.response?.data?.message || err.message}`);
      setStep('input');
      setSourceImage(null);
    }
  };

  // Send image to backend
  const sendImageToBackend = async (file) => {
    console.log('🚀 [sendImageToBackend] Starting upload for:', file.name);

    if (!file) {
      console.error('❌ [sendImageToBackend] No file provided');
      return;
    }

    const sizeMB = file.size / (1024 * 1024);
    console.log('📊 [sendImageToBackend] File size:', sizeMB.toFixed(2), 'MB');

    if (sizeMB > 2) {
      console.warn('⚠️ [sendImageToBackend] File too large');
      setError('Image must be less than 2MB');
      setStep('input');
      return;
    }

    setError('');
    setStep('loading');
    console.log('⏳ [sendImageToBackend] Set step to LOADING');

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setSourceImage(previewUrl);

    const formData = new FormData();
    formData.append('image', file);
    console.log('📦 [sendImageToBackend] FormData created');

    try {
      console.log('🌐 [sendImageToBackend] POST /api/image-search');
      const response = await api.post('/image-search', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('✅ [sendImageToBackend] Response received:', response.status);
      console.log('📋 [sendImageToBackend] Data:', response.data);

      const prods = response.data.products || [];
      const text = response.data.detected_text || '';
      const reason = response.data.match_reason || '';

      console.log('📊 [sendImageToBackend] Results:', {
        productCount: prods.length,
        detected_text: text,
        match_reason: reason
      });

      setProducts(prods);
      setDetectedText(text);
      setMatchReason(reason);

      persistSearchState({
        products: prods,
        sourceImage: previewUrl,
        detectedText: text,
        matchReason: reason,
      });
      setStep('results');
      console.log('✅ [sendImageToBackend] Set step to RESULTS');
    } catch (err) {
      console.error('❌ [sendImageToBackend] Error:', err.message);
      if (err.response) {
        console.error('Status:', err.response.status);
        console.error('Data:', err.response.data);
      }
      setError(`Upload failed: ${err.response?.data?.message || err.message}`);
      setStep('input');
      URL.revokeObjectURL(previewUrl);
      setSourceImage(null);
    }
  };

  // Reset to input step
  const handleSearchAgain = () => {
    setStep('input');
    setUrlInput('');
    setSourceImage(null);
    setProducts([]);
    setDetectedText('');
    setMatchReason('');
    setError('');
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const showFallbackNote = matchReason === 'fallback_recent';
  const displayProducts = products;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => nav(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              aria-label="Go back"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Image Search</h1>
              <p className="text-sm text-gray-600">Find products by uploading, capturing, or pasting an image</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Input Step */}
        {step === 'input' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Panel - Upload Area */}
            <div className="lg:sticky lg:top-20 h-fit">
              <div className="bg-white border border-zinc-200 rounded-none p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-600" />
                  Upload or Capture
                </h2>

                <div className="grid gap-4 md:grid-cols-2 mb-6">
                  {/* Drag & Drop Zone */}
                  <div
                    className={`w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
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
                    <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm font-semibold text-gray-700 mb-1">Drag & Drop Image</p>
                    <p className="text-xs text-gray-500">or click to browse</p>
                    <input 
                      type="file" 
                      hidden 
                      ref={fileInputRef} 
                      onChange={handleUpload} 
                      accept="image/*"
                    />
                  </div>

                  {/* Camera Button */}
                  <button 
                    onClick={startCamera}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition flex flex-col items-center justify-center gap-2 shadow-md"
                  >
                    <Camera className="w-6 h-6" />
                    <span className="text-sm">Take a Photo</span>
                  </button>
                </div>

                {/* OR Separator */}
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs font-medium text-gray-500 uppercase">Or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* URL Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search by Image URL</label>
                  <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="absolute left-3 w-5 h-5 text-gray-400 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="https://example.com/image.jpg"
                        value={urlInput}
                        onChange={e => setUrlInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleUrlSearch(); }}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                      />
                    </div>
                    <button 
                      onClick={handleUrlSearch}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                    >
                      Search
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Instructions */}
            <div className="space-y-6">
              <div className="bg-white border border-zinc-200 rounded-none p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">How It Works</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-md bg-blue-600 text-white font-bold">
                        1
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Upload or Capture</p>
                      <p className="text-sm text-gray-600">Select an image from your device, take a photo, or paste a URL</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-md bg-blue-600 text-white font-bold">
                        2
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">AI Analysis</p>
                      <p className="text-sm text-gray-600">Our AI analyzes the image for content, colors, and patterns</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-md bg-blue-600 text-white font-bold">
                        3
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">View Results</p>
                      <p className="text-sm text-gray-600">Browse similar products from our catalog</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-zinc-200 rounded-none p-6">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">💡 Tip:</span> For best results, use clear, well-lit images of products you're looking for.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Camera Step */}
        {step === 'camera' && (
          <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl" style={{ aspectRatio: '16/9', maxHeight: '80vh' }}>
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover bg-black"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Capture Frame Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-2 border-white/50 rounded-2xl" />
            </div>
            
            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-8 flex justify-center gap-6">
              <button 
                onClick={() => {
                  if (streamRef.current) {
                    streamRef.current.getTracks().forEach(t => t.stop());
                    streamRef.current = null;
                  }
                  setStep('input');
                }}
                className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button 
                onClick={capturePhoto}
                className="w-20 h-20 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center text-4xl font-bold transition transform hover:scale-110 shadow-2xl"
              >
                📷
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="absolute top-6 left-6 right-6 p-4 bg-red-600 text-white text-sm rounded-lg font-medium shadow-lg">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Loading Step */}
        {step === 'loading' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Panel - Image Preview Skeleton */}
            <div className="lg:sticky lg:top-24 h-fit lg:col-span-1">
              <div className="bg-white border border-zinc-200 rounded-none p-4">
                <h2 className="text-base font-bold text-gray-900 mb-3">Uploaded Image</h2>
                
                {sourceImage && (
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4 h-64 w-full">
                    <img 
                      src={sourceImage} 
                      alt="Uploaded for search"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                <button
                  className="w-full py-3 border border-gray-200 text-gray-700 rounded-lg font-semibold bg-white hover:bg-gray-50 transition cursor-not-allowed"
                  disabled
                >
                  🔍 Search Again
                </button>

                {showFallbackNote && (
                  <div className="mt-4 bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm">
                    No exact match found. Showing latest items instead.
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Loading Skeleton */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Similar Products</h2>
                <div className="text-sm text-gray-500">Searching...</div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-none p-6 mb-6">
                <div className="flex items-center justify-center">
                  <div className="relative w-14 h-14">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full animate-spin" style={{ WebkitMaskImage: 'radial-gradient(circle, transparent 30%, black 70%)' }} />
                  </div>
                </div>
                <p className="text-center text-gray-600 mt-4">Analyzing image and finding matches...</p>
              </div>

              {/* Skeleton Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="bg-white border border-zinc-200 rounded-none overflow-hidden">
                    <div className="aspect-[4/5] bg-gray-200 animate-pulse" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-4/5" />
                      <div className="h-5 bg-gray-200 rounded animate-pulse w-2/5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results Step */}
        {step === 'results' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Panel - Image Preview */}
            <div className="lg:sticky lg:top-24 h-fit lg:col-span-1">
              <div className="bg-white border border-zinc-200 rounded-none p-4">
                <h2 className="text-base font-bold text-gray-900 mb-3">Uploaded Image</h2>
                
                {sourceImage && (
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4 h-64 w-full">
                    <img 
                      src={sourceImage} 
                      alt="Uploaded for search"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                <button 
                  onClick={handleSearchAgain}
                  className="w-full py-3 border border-gray-200 text-gray-700 rounded-lg font-semibold bg-white hover:bg-gray-50 transition flex items-center justify-center gap-2"
                >
                  🔍 Search Again
                </button>

                {showFallbackNote && (
                  <div className="mt-4 bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm">
                    No exact match found. Showing latest items instead.
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Results Grid */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Similar Products ({displayProducts.length})</h2>
              </div>

              {displayProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {displayProducts.map((product) => (
                    product.slug ? (
                      <Link
                        key={product.id}
                        to={`/p/${product.slug}`}
                        state={{ fromImageSearch: true, backTo: '/image-search' }}
                        className="group bg-white border border-zinc-200 rounded-none overflow-hidden transition block"
                      >
                      {/* Product Image */}
                      <div className="relative bg-gray-100 aspect-[4/5] overflow-hidden">
                        <img 
                          src={resolveImageUrl(product.image_url)} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          onError={(e) => {
                            if (e.currentTarget.src.indexOf('/placeholder.svg') === -1) {
                              e.currentTarget.src = '/placeholder.svg';
                            }
                          }}
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            wishlist.toggle(product.id);
                          }}
                          className={
                            `absolute top-3 right-3 h-9 w-9 rounded-full border flex items-center justify-center opacity-0 translate-y-1 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto ` +
                            (wishlist.has(product.id)
                              ? "bg-zinc-900 text-white border-zinc-900"
                              : "bg-white border-zinc-200")
                          }
                          aria-label="Wishlist"
                          title="Wishlist"
                        >
                          <Heart
                            className="w-5 h-5"
                            strokeWidth={1.5}
                            fill={wishlist.has(product.id) ? "currentColor" : "none"}
                          />
                        </button>
                      </div>

                      {/* Product Info */}
                      <div className="p-4">
                        <p className="text-sm text-blue-600 font-medium line-clamp-2">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {product.model_info || product.description || 'Model is 170cm tall / 55kg'}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-lg font-bold text-blue-600">
                            ${parseFloat(product.price || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      </Link>
                    ) : (
                      <div
                        key={product.id}
                        className="group bg-white border border-zinc-200 rounded-none overflow-hidden transition block opacity-80"
                        aria-disabled="true"
                      >
                        {/* Product Image */}
                        <div className="relative bg-gray-100 aspect-[4/5] overflow-hidden">
                          <img 
                            src={resolveImageUrl(product.image_url)} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              if (e.currentTarget.src.indexOf('/placeholder.svg') === -1) {
                                e.currentTarget.src = '/placeholder.svg';
                              }
                            }}
                          />
                          <button
                            onClick={() => wishlist.toggle(product.id)}
                            className={
                              `absolute top-3 right-3 h-9 w-9 rounded-full border flex items-center justify-center opacity-0 translate-y-1 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto ` +
                              (wishlist.has(product.id)
                                ? "bg-zinc-900 text-white border-zinc-900"
                                  : "bg-white border-zinc-200")
                            }
                            aria-label="Wishlist"
                            title="Wishlist"
                          >
                            <Heart
                              className="w-5 h-5"
                              strokeWidth={1.5}
                              fill={wishlist.has(product.id) ? "currentColor" : "none"}
                            />
                          </button>
                          <div className="absolute bottom-3 left-3 text-xs bg-white/95 border border-gray-200 text-gray-700 px-2 py-1 rounded">
                            Details unavailable
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="p-4">
                          <p className="text-sm text-blue-600 font-medium line-clamp-2">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {product.model_info || product.description || 'Model is 170cm tall / 55kg'}
                          </p>
                          <div className="mt-3 flex items-center justify-between">
                            <p className="text-lg font-bold text-blue-600">
                              ${parseFloat(product.price || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-zinc-200 rounded-none p-12 text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Similar Products Found</h3>
                  <p className="text-gray-600 mb-6">Try another image for better matches</p>
                  <button 
                    onClick={handleSearchAgain}
                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    Try Another Image
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
