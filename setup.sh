#!/usr/bin/env sh
set -e

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

print_step() {
  printf "\n==> %s\n" "$1"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf "[ERROR] Required command not found: %s\n" "$1" >&2
    exit 1
  fi
}

print_step "Checking required tools"
require_command php
require_command composer
require_command npm
require_command docker

if docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DOCKER_COMPOSE_CMD="docker-compose"
else
  printf "[ERROR] Neither 'docker compose' nor 'docker-compose' is available.\n" >&2
  exit 1
fi

if [ ! -d "$BACKEND_DIR" ] || [ ! -d "$FRONTEND_DIR" ]; then
  printf "[ERROR] This script must be run from the project root containing /backend and /frontend.\n" >&2
  exit 1
fi

print_step "Environment setup"
if [ ! -f "$BACKEND_DIR/.env" ]; then
  if [ -f "$BACKEND_DIR/.env.example" ]; then
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    printf "Created backend/.env from backend/.env.example\n"
    printf "Please review backend/.env (DB credentials, mail, API keys) before first use.\n"
  else
    printf "[ERROR] backend/.env.example not found. Cannot create backend/.env\n" >&2
    exit 1
  fi
else
  printf "backend/.env already exists.\n"
fi

print_step "Installing backend dependencies (composer install)"
(
  cd "$BACKEND_DIR"
  composer install
)

print_step "Installing frontend dependencies (npm install)"
(
  cd "$FRONTEND_DIR"
  npm install
)

print_step "Running database migrations (php artisan migrate)"
(
  cd "$BACKEND_DIR"
  php artisan migrate --force
)

print_step "Starting Docker services (docker-compose up -d --build)"
(
  cd "$SCRIPT_DIR"
  # shellcheck disable=SC2086
  $DOCKER_COMPOSE_CMD up -d --build
)

printf "\n==========================================\n"
printf "✅ Setup completed successfully!\n"
printf "==========================================\n"
printf "\nNext steps (run in separate terminals):\n"
printf "1) Backend API:\n"
printf "   cd backend && php artisan serve\n"
printf "2) Frontend app:\n"
printf "   cd frontend && npm run dev\n"
printf "\nIf needed, review backend/.env and frontend/.env settings.\n"
