FROM php:8.2-fpm

# ១. ដំឡើង dependencies និងបណ្ណាល័យចាំបាច់
RUN apt-get update && apt-get install -y \
    libpq-dev \
    zip \
    unzip \
    git \
    curl \
    && docker-php-ext-install pdo pdo_pgsql

# ២. ដំឡើង Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# ៣. កំណត់ទីតាំងការងារ
WORKDIR /var/www
COPY . .

# ៤. ដំឡើង PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# ៥. កំណត់សិទ្ធិ (Permissions) - សំខាន់ណាស់សម្រាប់ Laravel
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

# ៦. បើក Port (Render ប្រើផតដែលវាផ្ដល់ឱ្យ ប៉ុន្តែដាក់ 8000 ក៏បាន)
EXPOSE 8000

# ៧. ការប្រើប្រាស់ CMD ជាមួយការ Migrate
# គួរប្រើសញ្ញា "&&" ដើម្បីឱ្យប្រាកដថាបើ Migrate បរាជ័យ Server ក៏មិនដំណើរការដែរ
CMD php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8000
