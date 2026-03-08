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

# ៥. កំណត់សិទ្ធិ (Permissions) ឱ្យបានត្រឹមត្រូវសម្រាប់អាការៈ Upload រូបភាព
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache \
    && chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# ៦. បើក Port
EXPOSE 8000

# ៧. CMD ពេញលេញសម្រាប់ Production (Render)
# - លុប និងបង្កើត storage link ឡើងវិញដើម្បីជួបបញ្ហា Path នៅលើ Cloud
# - សម្អាត Config/Cache ដើម្បីឱ្យ APP_URL ថ្មីដើរ (HTTPS)
# - Run migration ដើម្បីបង្កើត Table ថ្មីៗ
CMD ["sh", "-c", "rm -rf public/storage && php artisan storage:link && php artisan config:clear && php artisan cache:clear && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8000"]
