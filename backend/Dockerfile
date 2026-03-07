FROM php:8.2-fpm

# ១. Install dependencies និងបន្ថែម libicu-dev សម្រាប់ខ្លះៗរបស់ Laravel
RUN apt-get update && apt-get install -y \
    libpq-dev \
    zip \
    unzip \
    git \
    curl \
    && docker-php-ext-install pdo pdo_pgsql

# ២. Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www
COPY . .

# ៣. កំណត់សិទ្ធិ (Permissions) លើ Storage និង Cache (សំខាន់ខ្លាំងសម្រាប់ Laravel)
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache \
    && chmod -R 775 /var/www/storage /var/www/bootstrap/cache

RUN composer install --no-dev --optimize-autoloader

# ៤. បើក Port 8000 សម្រាប់ Render
EXPOSE 8000

# ៥. ប្រើបច្ចេកទេសបូកបញ្ចូលគ្នា (&&) ក្នុង CMD តែមួយគត់
# ខ្ញុំថែមបញ្ជា cache ដើម្បីឱ្យ Backend របស់អ្នកដើរលឿនជាងមុន
CMD php artisan migrate --force && \
    php artisan config:cache && \
    php artisan route:cache && \
    php artisan serve --host=0.0.0.0 --port=8000
