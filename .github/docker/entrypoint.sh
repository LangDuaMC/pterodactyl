#!/bin/ash -e
cd /app

# ── Setup directories ──────────────────────────────────────────
mkdir -p /app/var /var/log/supervisord storage/logs \
  storage/framework/sessions storage/framework/views storage/framework/cache
chmod 777 -R /app/var storage bootstrap/cache

# ── .env ────────────────────────────────────────────────────────
# If /app/var is mounted with a persisted .env, use it directly.
# Otherwise build one from env vars (mountless mode).
rm -f /app/.env
if [ -f /app/var/.env ]; then
  # Strip lines that aren't valid VAR=value (old entrypoints dumped
  # env vars like PHP_LDFLAGS with spaces into the file).
  sed -ni '/^[a-zA-Z_][a-zA-Z0-9_]*=/ p' /app/var/.env
  ln -s /app/var/.env /app/.env
else
  touch /app/var/.env
  for var in APP_KEY HASHIDS_SALT; do
    val="$(eval echo \$$var)"
    [ -n "$val" ] && echo "$var=$val" >> /app/var/.env
  done
  grep -q ^APP_KEY= /app/var/.env 2>/dev/null \
    || echo "APP_KEY=$(head -c 48 /dev/urandom | base64 | tr -dc a-zA-Z0-9 | head -c 32)" >> /app/var/.env
  grep -q ^HASHIDS_SALT= /app/var/.env 2>/dev/null \
    || echo "HASHIDS_SALT=$(head -c 48 /dev/urandom | base64 | tr -dc a-zA-Z0-9 | head -c 20)" >> /app/var/.env
  grep -q ^PTERODACTYL_USE_SERVER_IDENTIFIERS= /app/var/.env 2>/dev/null \
    || echo "PTERODACTYL_USE_SERVER_IDENTIFIERS=true" >> /app/var/.env
  ln -s /app/var/.env /app/.env
fi

# ── Blueprint extension ────────────────────────────────────────
if [ -d /app/.blueprint ]; then
  mkdir -p /app/public/assets/extensions /app/public/extensions
  [ -f /app/.blueprint/extensions/blueprint/assets/logo.jpg ] && \
    [ ! -s /app/.blueprint/extensions/blueprint/assets/logo.jpg ] && \
    cp /app/.blueprint/extensions/blueprint/assets/byte.png \
       /app/.blueprint/extensions/blueprint/assets/logo.jpg 2>/dev/null || true
  ln -sfn /app/.blueprint/extensions/blueprint/assets /app/public/assets/extensions/blueprint 2>/dev/null || true
  ln -sfn /app/.blueprint/extensions/blueprint/public /app/public/extensions/blueprint 2>/dev/null || true
  ln -sfn /app/resources/views/admin/extensions/extensions.blade.php \
    /app/resources/views/admin/extensions.blade.php 2>/dev/null || true
fi

# ── Permissions ────────────────────────────────────────────────
chown -R www-data:www-data /app/storage /app/bootstrap/cache /app/var

# ── Wait for DB ────────────────────────────────────────────────
: "${DB_PORT:=3306}"
until nc -z -w30 "$DB_HOST" "$DB_PORT" 2>/dev/null; do
  echo "Waiting for database..."
  sleep 1
done

# ── Octane ─────────────────────────────────────────────────────
if ! php artisan list --raw 2>/dev/null | grep -q "^octane:start$"; then
  echo "Installing Octane..."
  composer require laravel/octane --no-interaction --no-scripts --no-progress -q 2>/dev/null
  php artisan octane:install --server=frankenphp --no-interaction 2>/dev/null || true
  sed -i 's/encode zstd br gzip/encode gzip/' \
    /app/vendor/laravel/octane/src/Commands/stubs/Caddyfile 2>/dev/null || true
fi

# ── Laravel bootstrap ──────────────────────────────────────────
echo "Migrating and seeding database."
php artisan migrate --seed --force

echo "Caching..."
php artisan route:cache 2>/dev/null || true
php artisan config:cache
php artisan view:cache
php artisan event:cache
php artisan bp:cache 2>/dev/null || true

echo "Starting supervisord."
exec "$@"
