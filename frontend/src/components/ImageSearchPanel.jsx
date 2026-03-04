import React, { useEffect, useRef, useState } from "react";

function normalizeSimilarity(item) {
  const direct = item?.similarity ?? item?.similarity_score;
  if (typeof direct === "number") {
    return direct <= 1 ? Math.round(direct * 100) : Math.round(direct);
  }

  const score = item?.score;
  if (typeof score === "number") {
    return score <= 1 ? Math.round(score * 100) : Math.round(score);
  }

  return null;
}

function normalizeResults(payload) {
  const candidates = payload?.results || payload?.products || payload?.data || [];
  if (!Array.isArray(candidates)) return [];

  return candidates.map((item) => ({
    id: item?.id ?? item?.product_id ?? item?.slug,
    name: item?.name || item?.title || "Unnamed Product",
    slug: item?.slug || null,
    image:
      item?.image_url ||
      item?.thumbnail ||
      item?.image ||
      item?.media_url ||
      "https://via.placeholder.com/600x600?text=No+Image",
    similarity: normalizeSimilarity(item),
    raw: item,
  }));
}

export default function ImageSearchPanel() {
  const [previewUrl, setPreviewUrl] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const sendImage = async (file) => {
    if (!file) return;

    setError("");
    setLoading(true);
    setResults([]);

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/vision/search", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || "Image search failed");
      }

      setResults(normalizeResults(payload));
    } catch (err) {
      setError(err?.message || "Failed to search image");
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    sendImage(file);
  };

  const openCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setCameraOpen(true);

      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch (err) {
      setError("Could not access camera. Please allow permission.");
    }
  };

  const captureFromCamera = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.videoWidth === 0) {
      setError("Camera is not ready yet.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Failed to capture image.");
          return;
        }

        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
        stopCamera();
        sendImage(file);
      },
      "image/jpeg",
      0.95
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-zinc-900">Image Search</h2>
        <p className="mt-1 text-sm text-zinc-600">Upload an image or capture one to find visually similar products.</p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Upload Image
          </button>

          <button
            type="button"
            onClick={openCamera}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Capture from Camera
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />

        {previewUrl && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Selected Image</p>
            <img src={previewUrl} alt="Preview" className="h-44 w-44 rounded-xl border border-zinc-200 object-cover" />
          </div>
        )}

        {cameraOpen && (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <video ref={videoRef} className="w-full max-h-[420px] rounded-xl bg-black object-contain" autoPlay playsInline muted />
            <canvas ref={canvasRef} className="hidden" />

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={captureFromCamera}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Capture & Search
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="mt-5 rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">Searching similar products...</div>
        )}

        {error && (
          <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-zinc-900">Results</h3>
          <span className="text-sm text-zinc-500">{results.length} item(s)</span>
        </div>

        {results.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
            No results yet. Upload or capture an image to begin.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {results.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                <div className="aspect-square bg-zinc-100">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 text-sm font-semibold text-zinc-900">{item.name}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Similarity</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                      {item.similarity != null ? `${item.similarity}%` : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
