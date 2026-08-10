FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
        bash \
        git \
        curl \
        unzip \
        libpng-dev \
        libzip-dev \
        postgresql-dev \
        oniguruma-dev \
        icu-dev \
        $PHPIZE_DEPS \
    && docker-php-ext-install \
        pdo \
        pdo_pgsql \
        pgsql \
        mbstring \
        zip \
        gd \
        intl \
        opcache \
    && apk del $PHPIZE_DEPS

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN if [ -f composer.json ]; then \
        composer install --no-interaction --prefer-dist --optimize-autoloader; \
    fi

RUN addgroup -g 1000 www \
    && adduser -G www -u 1000 -D www \
    && chown -R www:www /var/www/html

USER www

EXPOSE 9000

CMD ["php-fpm"]