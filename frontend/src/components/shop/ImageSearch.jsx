import React, { useEffect, useRef, useState } from "react";
import { Camera, Upload, X, Image as ImageIcon, Search } from "lucide-react";
import api from "../lib/api"; // adjust if your path differs
import { errorAlert } from "../../lib/swal";

function dataURLToBlob(dataURL) {
  const [meta, base64] = dataURL.split(",");
  const mime = meta.match(/data:(.*);base64/)?.[1] || "image/jpeg";
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export default function ImageSearch({ onSearch, onClose, isOpen }) {
  const [mode, setMode] = useState(null); // null | camera | preview
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!isOpen) stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const stopCamera = () => {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const closeAll = () => {
    stopCamera();
    setMode(null);
    setPreview(null);
    setLoading(false);
    setSearched(false);
    setError("");
    onSearch?.(null);
    onClose?.();
  };

  const startCamera = async () => {
    setError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera not supported in this browser. Please upload instead.");
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      streamRef.current = mediaStream;
      setMode("camera");

      // Wait one tick so videoRef exists
      setTimeout(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play();
        }
      }, 0);
    } catch {
      setError("Camera not available. Please use upload instead.");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth || 720;
    const h = video.videoHeight || 720;

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, w, h);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setPreview(dataUrl);
    stopCamera();
    setMode("preview");
    setSearched(false);
  };

  const handleFileSelect = (e) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target.result);
      setMode("preview");
      setSearched(false);
      // Automatically trigger search after preview is set
      setTimeout(() => {
        handleSearch();
      }, 100);
    };
    reader.readAsDataURL(file);
  };

  const resetAll = () => {
    stopCamera();
    setMode(null);
    setPreview(null);
    setLoading(false);
    setSearched(false);
    setError("");
    onSearch?.(null);
  };

  const handleSearch = async () => {
    if (!preview) return;

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const blob = dataURLToBlob(preview);
      const form = new FormData();
      form.append("image", blob, "image-search.jpg");

      const res = await api.post("/image-search", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const payload = res?.data || {};
      console.log('Image search payload:', payload); // DEBUG
      onSearch?.({
        image: preview,
        colors: payload.colors || [],
        items: payload.products || [],
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Image search failed. Please try again.";
      setError(msg);
      errorAlert({
        khTitle: "ស្វែងរករូបភាពបរាជ័យ",
        enTitle: "Image search failed",
        detail: msg,
      });
      onSearch?.(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm p-4">
      {/* Center container with max height */}
      <div className="mx-auto w-full max-w-md h-[85vh] flex items-center">
        {/* Dialog */}
        <div className="w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
          {/* Header (fixed) */}
          <div className="flex items-center justify-between p-4 border-b shrink-0">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Search className="w-5 h-5 text-emerald-600" />
              Image Search
            </h2>
            <button
              onClick={closeAll}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body (scrollable) */}
          <div className="p-4 overflow-y-auto flex-1">
            {!preview && mode !== "camera" && (
              <>
                <p className="text-sm text-gray-600 mb-6 text-center">
                  Take a photo or upload an image to find similar items
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={startCamera}
                    className="flex flex-col items-center gap-3 p-6 bg-emerald-50 hover:bg-emerald-100 rounded-2xl transition-colors"
                  >
                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                    <span className="font-medium text-emerald-800">Take Photo</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-3 p-6 bg-blue-50 hover:bg-blue-100 rounded-2xl transition-colors"
                  >
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <span className="font-medium text-blue-800">Upload Image</span>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </>
            )}

            {mode === "camera" && (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-square">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      stopCamera();
                      setMode(null);
                    }}
                    className="flex-1 py-3 rounded-xl bg-gray-100 font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={capturePhoto}
                    className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <div className="w-6 h-6 bg-white rounded-full border-4 border-emerald-500" />
                    Capture
                  </button>
                </div>
              </div>
            )}

            {mode === "preview" && preview && (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-square">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">
                    {error}
                  </div>
                )}

                {searched && !loading && !error && (
                  <div className="p-3 bg-emerald-50 text-emerald-600 text-sm rounded-xl flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Results loaded
                  </div>
                )}

                {loading && (
                  <div className="p-3 bg-blue-50 text-blue-600 text-sm rounded-xl flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    Searching...
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={resetAll}
                    className="flex-1 py-3 rounded-xl bg-gray-100 font-medium hover:bg-gray-200 transition-colors"
                  >
                    Start Over
                  </button>

                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Find Similar
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setPreview(null);
                    setMode(null);
                    setSearched(false);
                    setError("");
                    startCamera();
                  }}
                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  Take different photo
                </button>
              </div>
            )}
          </div>

          {/* Footer (optional fixed area) */}
          <div className="p-3 border-t bg-white/80 text-xs text-gray-500 shrink-0">
            Tip: Upload clear product photos for better matches.
          </div>
        </div>
      </div>
    </div>
  );
}
