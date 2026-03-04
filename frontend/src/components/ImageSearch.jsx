import React, { useRef, useState } from 'react';
import axios from 'axios';

export default function ImageSearch() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [detectedText, setDetectedText] = useState('');
  const [matchReason, setMatchReason] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  const handleFileChange = async (e) => {
    setError('');
    setProducts([]);
    setDetectedText('');
    setMatchReason('');
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError('Only JPEG/PNG images under 2MB are allowed.');
      return;
    }
    const formData = new FormData();
    formData.append('image', file);
    setLoading(true);
    try {
      const res = await axios.post('/api/image-search', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });
      setDetectedText(res.data.detected_text || '');
      setMatchReason(res.data.match_reason || '');
      setProducts(res.data.products || []);
      if (res.data.vision_error) {
        setError('Image scan failed. Check Vision API configuration.');
      }
    } catch (err) {
      setError('Failed to process image.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <input
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="mb-4"
      />
      {loading && <div className="text-center my-4">Scanning... <span className="animate-spin">🔄</span></div>}
      {detectedText && (
        <div className="mb-2 text-sm text-gray-600">
          <strong>Detected Text:</strong> {detectedText}
        </div>
      )}
      {matchReason === 'fallback_recent' && (
        <div className="mb-2 text-xs text-amber-600">No close match found. Showing latest items.</div>
      )}
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((p) => (
          <div key={p.id} className="border rounded-lg p-2 text-center">
            <img src={p.image_url} alt={p.name} className="w-full h-32 object-cover mb-2 rounded" />
            <div className="font-semibold">{p.name}</div>
            <div className="text-sm text-gray-500">{p.price}</div>
          </div>
        ))}
      </div>
      {!loading && products.length === 0 && detectedText && (
        <div className="text-center text-gray-500 mt-4">No products found.</div>
      )}
    </div>
  );
}
