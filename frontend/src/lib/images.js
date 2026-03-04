const backendOrigin = import.meta.env.VITE_BACKEND_ORIGIN || "http://127.0.0.1:8000";

// Normalize any lingering hardcoded dev ports so assets always resolve locally.
const normalizePort = (url) => {
  if (!url) return url;
  return url
    .replace(/localhost:8001/gi, "localhost:8000")
    .replace(/127\.0\.0\.1:8001/g, "127.0.0.1:8000");
};

export function resolveImageUrl(imageUrl) {
  if (!imageUrl) return "/placeholder.svg";

  const sanitizedUrl = normalizePort(imageUrl);

  // Handle base64 data URIs (e.g., data:image/jpeg;base64,...)
  if (/^data:/i.test(sanitizedUrl)) return sanitizedUrl;

  // Handle external URLs
  if (/^https?:\/\//i.test(sanitizedUrl)) return sanitizedUrl;

  // common patterns: /storage/.., storage/.., public/storage/..
  const cleaned = sanitizedUrl.startsWith("/") ? sanitizedUrl : `/${sanitizedUrl}`;
  return `${backendOrigin}${cleaned}`;
}
