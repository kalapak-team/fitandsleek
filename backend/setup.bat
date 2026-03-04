@echo off
setlocal

echo [1/6] Checking environment file...
if exist ".env" (
  echo .env already exists. Skipping copy.
) else (
  if not exist ".env.example" (
    echo .env.example not found. Aborting.
    exit /b 1
  )
  copy ".env.example" ".env" >nul
  echo .env created from .env.example
)

echo [2/6] Starting PostgreSQL container...
docker-compose up -d
if errorlevel 1 exit /b 1

echo [3/6] Installing PHP dependencies...
composer install
if errorlevel 1 exit /b 1

echo [4/6] Generating Laravel app key...
php artisan key:generate
if errorlevel 1 exit /b 1

echo [5/6] Waiting for database readiness...
timeout /t 5 /nobreak >nul
php artisan migrate:fresh --seed
if errorlevel 1 exit /b 1

echo [6/6] Completed.
echo Setup Successful! FitAndSleek is ready.
