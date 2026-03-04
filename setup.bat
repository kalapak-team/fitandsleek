@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
set "BACKEND_DIR=%SCRIPT_DIR%\backend"
set "FRONTEND_DIR=%SCRIPT_DIR%\frontend"

call :print_step "Checking required tools"
call :require_command php || exit /b 1
call :require_command composer || exit /b 1
call :require_command npm || exit /b 1
call :require_command docker || exit /b 1

set "DOCKER_COMPOSE_CMD="
docker compose version >nul 2>&1
if %errorlevel%==0 (
  set "DOCKER_COMPOSE_CMD=docker compose"
) else (
  where docker-compose >nul 2>&1
  if %errorlevel%==0 (
    set "DOCKER_COMPOSE_CMD=docker-compose"
  ) else (
    echo [ERROR] Neither "docker compose" nor "docker-compose" is available.
    exit /b 1
  )
)

if not exist "%BACKEND_DIR%" (
  echo [ERROR] Missing backend directory: "%BACKEND_DIR%"
  exit /b 1
)

if not exist "%FRONTEND_DIR%" (
  echo [ERROR] Missing frontend directory: "%FRONTEND_DIR%"
  exit /b 1
)

call :print_step "Environment setup"
if not exist "%BACKEND_DIR%\.env" (
  if exist "%BACKEND_DIR%\.env.example" (
    copy "%BACKEND_DIR%\.env.example" "%BACKEND_DIR%\.env" >nul
    echo Created backend\.env from backend\.env.example
    echo Please review backend\.env ^(DB credentials, mail, API keys^) before first use.
  ) else (
    echo [ERROR] backend\.env.example not found. Cannot create backend\.env
    exit /b 1
  )
) else (
  echo backend\.env already exists.
)

call :print_step "Installing backend dependencies (composer install)"
pushd "%BACKEND_DIR%"
composer install
if errorlevel 1 (
  popd
  exit /b 1
)
popd

call :print_step "Installing frontend dependencies (npm install)"
pushd "%FRONTEND_DIR%"
npm install
if errorlevel 1 (
  popd
  exit /b 1
)
popd

call :print_step "Running database migrations (php artisan migrate)"
pushd "%BACKEND_DIR%"
php artisan migrate --force
if errorlevel 1 (
  popd
  exit /b 1
)
popd

call :print_step "Starting Docker services (docker-compose up -d --build)"
pushd "%SCRIPT_DIR%"
call %DOCKER_COMPOSE_CMD% up -d --build
if errorlevel 1 (
  popd
  exit /b 1
)
popd

echo.
echo ==========================================
echo Setup completed successfully!
echo ==========================================
echo.
echo Next steps (run in separate terminals):
echo 1^) Backend API:
echo    cd backend ^&^& php artisan serve
echo 2^) Frontend app:
echo    cd frontend ^&^& npm run dev
echo.
echo If needed, review backend/.env and frontend/.env settings.
exit /b 0

:print_step
echo.
echo ==^> %~1
exit /b 0

:require_command
where %~1 >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Required command not found: %~1
  exit /b 1
)
exit /b 0
