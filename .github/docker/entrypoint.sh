#!/bin/ash -e
cd /app

mkdir -p /app/var /var/log/supervisord storage/logs storage/framework/sessions storage/framework/views storage/framework/cache
chmod 777 -R /app/var storage bootstrap/cache

# ── Build .env ────────────────────────────────────────────────────────
# Priority:  1) env vars from container  → 2) mounted /app/var/.env
# If APP_KEY (or HASHIDS_SALT) is missing from both, generate it and
# persist a copy to /app/var/.env so it survives an ephemeral restart.
# Without the /app/var volume the generated key is *lost* (sessions die
# on restart) — for "least mount" you MUST supply APP_KEY + HASHIDS_SALT
# as environment variables.

rm -f /app/.env
touch /app/var/.env

write_env() {
    local key="$1" val="$2"
    echo "$key=$val" >> /app/var/.env
}

# APP_KEY -----------------------------------------------------------------
if [ -n "$APP_KEY" ]; then
    write_env "APP_KEY" "$APP_KEY"
elif grep -q "^APP_KEY=" /app/var/.env 2>/dev/null; then
    : # already persisted
else
    APP_KEY=$(head -c 48 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 32)
    write_env "APP_KEY" "$APP_KEY"
fi

# HASHIDS_SALT ------------------------------------------------------------
if [ -n "$HASHIDS_SALT" ]; then
    write_env "HASHIDS_SALT" "$HASHIDS_SALT"
elif grep -q "^HASHIDS_SALT=" /app/var/.env 2>/dev/null; then
    : # already persisted
else
    HASHIDS_SALT=$(head -c 48 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 20)
    write_env "HASHIDS_SALT" "$HASHIDS_SALT"
fi

# PTERODACTYL_USE_SERVER_IDENTIFIERS --------------------------------------
if ! grep -q "^PTERODACTYL_USE_SERVER_IDENTIFIERS=" /app/var/.env 2>/dev/null; then
    write_env "PTERODACTYL_USE_SERVER_IDENTIFIERS" "true"
fi

# Delegate the rest from env → /app/var/.env (overrides nothing already set)
env | while IFS='=' read -r k v; do
    case "$k" in
        APP_KEY|HASHIDS_SALT|PTERODACTYL_USE_SERVER_IDENTIFIERS) ;;
        HOME|PATH|HOSTNAME|SHLVL|PWD|TERM|PHP_INI_SCAN_DIR) ;;
        *)
            if ! grep -q "^$k=" /app/var/.env 2>/dev/null; then
                echo "$k=$v" >> /app/var/.env
            fi
            ;;
    esac
done

ln -sf /app/var/.env /app/.env

# ── Permissions ─────────────────────────────────────────────────────────
echo "Fixing log folder permissions."
chown -R www-data:www-data /app/storage /app/bootstrap/cache /app/var

# ── Wait for DB ─────────────────────────────────────────────────────────
: "${DB_PORT:=3306}"
echo "Checking database status."
until nc -z -v -w30 "$DB_HOST" "$DB_PORT" 2>/dev/null; do
    echo "Waiting for database connection..."
    sleep 1
done

# ── Laravel bootstrap ───────────────────────────────────────────────────
echo "Migrating and seeding database."
php artisan migrate --seed --force

echo "Caching routes."
php artisan route:cache 2>/dev/null || true

echo "Starting supervisord."
exec "$@"
