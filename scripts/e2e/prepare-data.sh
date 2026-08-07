#!/usr/bin/env bash

set -Eeuo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)/lib.sh"
source "$E2E_SCRIPT_DIR/env.sh"

require_e2e_marker

"$E2E_SCRIPT_DIR/reset-data.sh"

cd "$E2E_PROJECT_ROOT"

echo "==> Generating Prisma clients for the current schemas..."
npx prisma generate \
  --config apps/cart-service/prisma.config.ts \
  --schema apps/cart-service/prisma/schema.prisma
npx prisma generate \
  --config apps/products-service/prisma.config.ts \
  --schema apps/products-service/prisma/schema.prisma
npx prisma generate \
  --config apps/notifications-service/prisma.config.ts \
  --schema apps/notifications-service/prisma/schema.prisma

echo "==> Applying migrations to cart_e2e..."
npx prisma migrate deploy \
  --config apps/cart-service/prisma.config.ts \
  --schema apps/cart-service/prisma/schema.prisma

echo "==> Applying migrations to products_e2e..."
npx prisma migrate deploy \
  --config apps/products-service/prisma.config.ts \
  --schema apps/products-service/prisma/schema.prisma

echo "==> Applying migrations to notifications_e2e..."
npx prisma migrate deploy \
  --config apps/notifications-service/prisma.config.ts \
  --schema apps/notifications-service/prisma/schema.prisma

echo "==> Seeding deterministic product data..."
npx tsx --tsconfig tsconfig.json apps/products-service/scripts/seed-products.ts

echo "==> E2E databases are migrated and seeded."
