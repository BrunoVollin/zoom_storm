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

  echo "==> Seeding products database..."
  npx tsx --tsconfig tsconfig.json apps/products-service/scripts/seed-products.ts
fi

if [ "$SKIP_KEYCLOAK" = false ]; then
  echo "==> Waiting for keycloak to accept connections..."
  until curl -s -o /dev/null "http://localhost:3040/realms/master"; do
    sleep 2
  done

  KEYCLOAK_URL="http://localhost:3040"
  KEYCLOAK_REALM="zoom-storm"

  KEYCLOAK_ADMIN_TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
    -d "client_id=admin-cli&username=admin&password=admin&grant_type=password" \
    | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")

  KEYCLOAK_REALM_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $KEYCLOAK_ADMIN_TOKEN" \
    "$KEYCLOAK_URL/admin/realms/$KEYCLOAK_REALM")

  if [ "$KEYCLOAK_REALM_STATUS" = "200" ]; then
    echo "==> Keycloak realm '$KEYCLOAK_REALM' already configured, skipping."
  else
    echo "==> Configuring keycloak realm/client/users..."
    ./setup-keycloak.sh
  fi
fi

echo "==> Starting all services (yarn dev)..."
exec yarn dev
