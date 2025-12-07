# Usar imagen oficial de PHP 8.2 con FPM
FROM php:8.2.26-fpm

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    libxml2-dev \
    libxslt-dev \
    default-mysql-client \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip soap

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Establecer el directorio de trabajo
WORKDIR /var/www/html

# Copiar todo el código fuente primero
COPY . .

# Instalar dependencias de PHP (producción)
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# Configurar permisos
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Las optimizaciones y configuración de .env se manejan en el entrypoint

# Copiar configuración de PHP-FPM
COPY php-fpm.conf /usr/local/etc/php-fpm.d/www.conf

# Copiar y configurar entrypoint
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Exponer puerto 9000 (PHP-FPM)
EXPOSE 9000

# Comando para iniciar PHP-FPM
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["php-fpm"]