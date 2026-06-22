# Stage 0: build frontend assets.
FROM --platform=$TARGETOS/$TARGETARCH oven/bun:1 AS assets
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts
COPY . ./
RUN bun run build:production

# Stage 1: FrankenPHP runtime.
FROM --platform=$TARGETOS/$TARGETARCH dunglas/frankenphp:1-php8.3-alpine
WORKDIR /app

# System deps + PHP extensions (cached until these lines change).
RUN apk add --no-cache bash ca-certificates curl git mariadb-client netcat-openbsd supervisor tar unzip \
    && install-php-extensions bcmath gd pcntl pdo_mysql zip

# Composer deps (cached unless composer.json or lock changes).
# --no-scripts skips post-install hooks that need app source files.
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# App source + built assets.
COPY . ./
COPY --from=assets /app/public/build ./public/build
COPY --from=assets /app/public/icons ./public/icons

# Regenerate autoloader so the classmap includes the actual app source.
RUN composer dump-autoload

# Runtime setup (dirs, permissions, env).
RUN cp .env.example .env \
    && mkdir -p /app/var bootstrap/cache storage/logs storage/framework/sessions storage/framework/views storage/framework/cache /var/log/supervisord \
    && chmod 777 -R bootstrap storage /app/var \
    && rm -rf .env bootstrap/cache/*.php \
    && chown -R www-data:www-data /app

COPY .github/docker/Caddyfile /etc/caddy/Caddyfile
COPY .github/docker/supervisord.conf /etc/supervisord.conf

EXPOSE 80 443 443/udp
ENTRYPOINT ["/bin/ash", ".github/docker/entrypoint.sh"]
CMD ["supervisord", "-n", "-c", "/etc/supervisord.conf"]
