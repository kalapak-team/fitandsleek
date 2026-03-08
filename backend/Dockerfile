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
    nodejs \
    npm \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_pgsql gd

# ២. ដំឡើង Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# ៣. កំណត់ទីតាំងការងារ
WORKDIR /var/www
COPY . .

# ៤. ដំឡើង PHP dependencies និង KHQR Node deps
# បន្ថែមការបង្កើត .env ប្រសិនបើមិនទាន់មាន (សម្រាប់ជៀសវាង error ពេល build)
RUN composer install --no-dev --optimize-autoloader \
    && cd /var/www/node-khqr \
    && npm install --omit=dev \
    && cd /var/www

# ៥. កំណត់សិទ្ធិ (Permissions) ឱ្យបានត្រឹមត្រូវ
# បង្កើត Folder ក្នុង storage បើមិនទាន់មាន ដើម្បីការពារ error ពេល link
RUN mkdir -p /var/www/storage/app/public /var/www/storage/framework/cache /var/www/storage/framework/sessions /var/www/storage/framework/views /var/www/storage/logs \
    && chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache \
    && chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# ៦. បើក Port
EXPOSE 8000

# ៧. CMD ពេញលេញសម្រាប់ Production (Render)
# - លុប និងបង្កើត storage link ឡើងវិញ ដើម្បីឱ្យរូបភាពបង្ហាញតាម Domain ថ្មី
# - សម្អាត Config/Cache/Route ដើម្បីឱ្យ APP_URL ថ្មី (HTTPS) ដើរបានជោគជ័យ
# - Run migration ដើម្បីបង្កើត Table ថ្មីៗក្នុង Neon Database
# - ចុងក្រោយគឺដំណើរការ Server
CMD ["sh", "-c", "rm -rf public/storage && php artisan storage:link && php artisan config:clear && php artisan cache:clear && php artisan route:clear && php artisan view:clear && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8000"]
