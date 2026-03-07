# Fitandsleek Frontend (React + Vite + Tailwind)

This frontend is wired to the Laravel backend you shared (Sanctum token auth + real API routes).

## 1) Install

```bash
npm install
```

## 2) Configure backend URL

Create `.env` (or copy from `.env.example`) and set:

```env
VITE_API_BASE_URL=http://127.0.0.1:8001/api
VITE_BACKEND_ORIGIN=http://127.0.0.1:8001
# Optional alias (same as VITE_BACKEND_ORIGIN) if your host only allows BACKEND_URL naming
VITE_BACKEND_URL=http://127.0.0.1:8001
```

- `VITE_API_BASE_URL` is where `/api/...` routes are served.
- `VITE_BACKEND_ORIGIN` (or `VITE_BACKEND_URL`) is used to resolve relative image URLs (example: `/storage/products/1.jpg`).

On Render: set these to your HTTPS domain (not `127.0.0.1`), then use **Manual Deploy → Clear Build Cache & Deploy** so the new env values are baked into the bundle.

## 3) Run

```bash
npm run dev
```

Open: http://127.0.0.1:5173

## Backend endpoints used

- Public: `GET /api/categories`, `GET /api/products`, `GET /api/products/{slug}`
- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/me`
- Cart: `GET /api/cart`, `POST /api/cart/items`, `PATCH /api/cart/items/{id}`, `DELETE /api/cart/items/{id}`
- Orders: `POST /api/checkout`, `GET /api/orders`
- Admin: `/api/admin/categories`, `/api/admin/products`, `/api/admin/orders`, `/api/admin/customers`

## Notes

- The backend returns a token on login. Frontend stores it in `localStorage` key `fs_token` and sends it as `Authorization: Bearer <token>`.
- If `image_url` in products is empty or invalid, a local placeholder is displayed (`/placeholder.svg`).
