#!/usr/bin/env bash
set -e

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

SKIP_INSTALL=false
SKIP_MIGRATE=false
SKIP_KEYCLOAK=false

for arg in "$@"; do
  case "$arg" in
    --no-install) SKIP_INSTALL=true ;;
    --no-migrate) SKIP_MIGRATE=true ;;
    --no-keycloak) SKIP_KEYCLOAK=true ;;
    -h|--help)
      echo "Usage: ./up.sh [--no-install] [--no-migrate] [--no-keycloak]"
      exit 0
      ;;
  esac
done

if command -v docker compose &> /dev/null || docker compose version &> /dev/null 2>&1; then
  DC="docker compose"
else
  DC="docker-compose"
fi

echo "==> Starting infrastructure (postgres, mongo, redis, keycloak, kafka, akhq)..."
$DC up -d

echo "==> Waiting for postgres to accept connections..."
until docker exec zoom-postgres pg_isready -U postgres &> /dev/null; do
  sleep 1
done
echo "    postgres is up."

if [ "$SKIP_INSTALL" = false ]; then
  echo "==> Installing dependencies (yarn install)..."
  yarn install --ignore-scripts
fi

if [ "$SKIP_MIGRATE" = false ]; then
  export DATABASE_URL=$(grep -m1 '^DATABASE_URL=' apps/cart-service/.env | cut -d= -f2- | tr -d '"')
  export PRODUCTS_SERVICE_DATABASE_URL=$(grep -m1 '^PRODUCTS_SERVICE_DATABASE_URL=' apps/products-service/.env | cut -d= -f2- | tr -d '"')

  echo "==> Generating Prisma clients..."
  npx prisma generate --config apps/cart-service/prisma.config.ts --schema apps/cart-service/prisma/schema.prisma
  npx prisma generate --config apps/products-service/prisma.config.ts --schema apps/products-service/prisma/schema.prisma

  echo "==> Running database migrations..."
  npx prisma migrate deploy --config apps/cart-service/prisma.config.ts --schema apps/cart-service/prisma/schema.prisma
  npx prisma migrate deploy --config apps/products-service/prisma.config.ts --schema apps/products-service/prisma/schema.prisma
fi

if [ "$SKIP_KEYCLOAK" = false ]; then
  echo "==> Waiting for keycloak to accept connections..."
  until curl -s -o /dev/null "http://localhost:3040/realms/master"; do
    sleep 2
  done
  echo "==> Configuring keycloak realm/client/users..."
  ./setup-keycloak.sh || echo "    (keycloak setup skipped/already applied)"
fi

echo "==> Starting all services (yarn dev)..."
exec yarn dev
