#!/usr/bin/env bash
set -e

docker compose exec \
  -e DB_CONNECTION=pgsql \
  -e DB_DATABASE=app_test \
  -e DB_URL= \
  app php artisan test "$@"