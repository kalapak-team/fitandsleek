FROM php:8.2-fpm

# ១. ដំឡើង dependencies (បន្ថែម libpng, libjpeg សម្រាប់ Process រូបភាព)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    zip \
    unzip \
    git \
    curl \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_pgsql gd

# ២. ដំឡើង Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# ៣. កំណត់ទីតាំងការងារ
WORKDIR /var/www
COPY . .

# ៤. ដំឡើង PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# ៥. កំណត់សិទ្ធិ (Permissions)
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

# ៦. បើក Port
EXPOSE 8000

# ៧. CMD លំនាំដើម (សម្រាប់ Web)
# Use sh -c so the migrate step runs before the server starts, and to avoid passing
# literal "&&" as an argument to artisan.
CMD ["sh", "-c", "php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8000"]