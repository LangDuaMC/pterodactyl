# Stage 0: build frontend assets.
FROM --platform=$TARGETOS/$TARGETARCH node:22-alpine AS assets
WORKDIR /app
COPY package.json yarn.lock ./
RUN npx yarn@1.22.22 install --frozen-lockfile --ignore-scripts
COPY . ./
RUN npx yarn@1.22.22 run build:production

# Stage 1: FrankenPHP runtime.
FROM --platform=$TARGETOS/$TARGETARCH dunglas/frankenphp:1-php8.3-alpine
WORKDIR /app

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
COPY . ./
COPY --from=assets /app/public/build ./public/build

RUN apk add --no-cache bash ca-certificates curl git mariadb-client netcat-openbsd supervisor tar unzip \
    && install-php-extensions bcmath gd pcntl pdo_mysql zip \
    && cp .env.example .env \
    && mkdir -p /app/var bootstrap/cache storage/logs storage/framework/sessions storage/framework/views storage/framework/cache /var/log/supervisord \
    && chmod 777 -R bootstrap storage /app/var \
    && composer install --no-dev --optimize-autoloader --no-interaction \
    && rm -rf .env bootstrap/cache/*.php \
    && chown -R www-data:www-data /app

COPY .github/docker/Caddyfile /etc/caddy/Caddyfile
COPY .github/docker/supervisord.conf /etc/supervisord.conf

EXPOSE 80 443 443/udp
ENTRYPOINT ["/bin/ash", ".github/docker/entrypoint.sh"]
CMD ["supervisord", "-n", "-c", "/etc/supervisord.conf"]
