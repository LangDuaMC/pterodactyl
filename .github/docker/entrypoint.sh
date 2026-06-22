#!/bin/ash -e
cd /app

mkdir -p /app/var /var/log/panel/logs /var/log/supervisord storage/logs storage/framework/sessions storage/framework/views storage/framework/cache
chmod 777 -R /app/var storage bootstrap/cache
ln -sfn /app/storage/logs /var/log/panel/logs

if [ -f /app/var/.env ]; then
  echo "external vars exist."
  rm -f /app/.env
  ln -s /app/var/.env /app/.env
else
  echo "external vars don't exist."
  rm -f /app/.env
  touch /app/var/.env

  if [ -z "$APP_KEY" ]; then
    echo "Generating key."
    APP_KEY=$(head -c 48 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 32)
  else
    echo "APP_KEY exists in environment, using that."
  fi
  echo "APP_KEY=$APP_KEY" > /app/var/.env

  if [ -z "$HASHIDS_SALT" ]; then
    echo "Generating hashids salt."
    HASHIDS_SALT=$(head -c 48 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 20)
  else
    echo "HASHIDS_SALT exists in environment, using that."
  fi
  echo "HASHIDS_SALT=$HASHIDS_SALT" >> /app/var/.env

  ln -s /app/var/.env /app/.env
fi

if [ -z "$DB_PORT" ]; then
  echo "DB_PORT not specified, defaulting to 3306"
  DB_PORT=3306
fi

echo "Checking log folder permissions."
chown -R www-data:www-data /app/storage /app/bootstrap/cache /app/var

echo "Checking database status."
until nc -z -v -w30 "$DB_HOST" "$DB_PORT"
do
  echo "Waiting for database connection..."
  sleep 1
done

echo "Setting server identifiers mode."
echo "PTERODACTYL_USE_SERVER_IDENTIFIERS=true" >> /app/var/.env

echo "Migrating and seeding database."
php artisan migrate --seed --force

echo "Caching routes."
php artisan route:cache 2>/dev/null || true

echo "Starting supervisord."
exec "$@"
