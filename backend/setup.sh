#!/usr/bin/env bash
set -e

# Run once after cloning (if needed): chmod +x setup.sh

echo "[1/6] Checking environment file..."
if [ -f ".env" ]; then
  echo ".env already exists. Skipping copy."
else
  if [ ! -f ".env.example" ]; then
    echo ".env.example not found. Aborting."
    exit 1
  fi
  cp .env.example .env
  echo ".env created from .env.example"
fi

echo "[2/6] Starting PostgreSQL container..."
docker-compose up -d

echo "[3/6] Installing PHP dependencies..."
composer install

echo "[4/6] Generating Laravel app key..."
php artisan key:generate

echo "[5/6] Waiting for database readiness..."
sleep 5
php artisan migrate:fresh --seed

echo "[6/6] Completed."
echo "Setup Successful! FitAndSleek is ready."
