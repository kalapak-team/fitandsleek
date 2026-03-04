FROM php:8.2-fpm

# Install dependencies
RUN apt-get update && apt-get install -y libpq-dev zip unzip git curl

# Install PHP extensions for PostgreSQL
RUN docker-php-ext-install pdo pdo_pgsql

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www
COPY . .

RUN composer install --no-dev --optimize-autoloader

# បើក Port 8000 សម្រាប់ Render
EXPOSE 8000
CMD php artisan serve --host=0.0.0.0 --port=8000
# ... កូដដែលមានស្រាប់ខាងលើ ...

# បង្កើត Script តូចមួយដើម្បីរត់ Migration រួចទើបបញ្ជាឱ្យ Server ដើរ
CMD php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8000
