# FitandSleek Pro

Full-stack eCommerce platform with a Laravel backend and a React (Vite + Tailwind) frontend.

## Tech Stack

- Backend: Laravel 12 (PHP), PostgreSQL, Sanctum auth
- Frontend: React 18 (Vite, Tailwind CSS)

### Framework Versions

- Laravel: ^12.0
- React: ^18.3.1

## Project Structure

- Backend app: [backend/](backend/)
- Frontend app: [frontend/](frontend/)
- Sample database: [fitandsleekpro.sql](fitandsleekpro.sql)

## Prerequisites

- PHP 8.1+ and Composer
- Node.js 18+ and npm
- PostgreSQL 13+

## One-Click Setup (macOS/Linux)

Run this once from the project root:

```bash
sh setup.sh
```

## One-Click Setup (Windows)

Run this once from the project root in Command Prompt or PowerShell:

```bat
setup.bat
```

What `setup.bat` does:

- Checks `backend/.env`; if missing, copies from `backend/.env.example` and reminds you to review config.
- Runs `composer install` in `backend/`.
- Runs `npm install` in `frontend/`.
- Runs `php artisan migrate` in `backend/`.
- Runs `docker compose up -d --build` (or `docker-compose up -d --build` on older setups).

What `setup.sh` does:

- Checks `backend/.env`; if missing, copies from `backend/.env.example` and reminds you to review config.
- Runs `composer install` in `backend/`.
- Runs `npm install` in `frontend/`.
- Runs `php artisan migrate` in `backend/`.
- Runs `docker compose up -d --build` (or `docker-compose up -d --build` on older setups).

After setup completes, start the apps:

```bash
cd backend && php artisan serve
cd frontend && npm run dev
```

## Backend Setup

1. Install PHP dependencies
   ```bash
   cd backend
   composer install
   ```
2. Create backend environment file
   - Copy backend/.env.example to backend/.env
   - Update database credentials in backend/.env
3. Generate application key
   ```bash
   php artisan key:generate
   ```
4. Run migrations and seeders
   ```bash
   php artisan migrate --seed
   ```
5. Link storage
   ```bash
   php artisan storage:link
   ```
6. Start the backend server
   ```bash
   php artisan serve
   ```

The `APP_PORT`/`SERVER_PORT` values in `.env` are set to `8001`, so `php artisan serve` will bind to http://127.0.0.1:8001.

Backend runs on http://127.0.0.1:8001 by default.

## Frontend Setup

1. Install Node dependencies
   ```bash
   cd frontend
   npm install
   ```
2. Create frontend environment file
   - Copy frontend/.env.example to frontend/.env if needed
   - Set API URLs in frontend/.env
     ```env
     VITE_API_BASE_URL=http://127.0.0.1:8001/api
     VITE_BACKEND_ORIGIN=http://127.0.0.1:8001
     ```
3. Start the frontend dev server
   ```bash
   npm run dev
   ```

Frontend runs on http://127.0.0.1:5173 by default.

## Database (Optional Import)

If you want sample data, import the SQL dump:

- File: [fitandsleekpro.sql](fitandsleekpro.sql)
- Import into your PostgreSQL database before running the app

## API Overview

Common endpoints used by the frontend:

- Auth: POST /api/auth/register, POST /api/auth/login, POST /api/auth/logout, GET /api/me
- Catalog: GET /api/categories, GET /api/products, GET /api/products/{slug}
- Cart: GET /api/cart, POST /api/cart/items, PATCH /api/cart/items/{id}, DELETE /api/cart/items/{id}
- Orders: POST /api/checkout, GET /api/orders
- Admin: /api/admin/categories, /api/admin/products, /api/admin/orders, /api/admin/customers

## Notes

- Frontend stores auth token in localStorage key fs_token and sends Authorization: Bearer <token>.
- Product images use VITE_BACKEND_ORIGIN to resolve storage URLs.

## Contributing

Internal project. If you need access or want to contribute, please contact the maintainer.

## License

All rights reserved.
