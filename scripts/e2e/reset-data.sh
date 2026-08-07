#!/usr/bin/env bash

set -Eeuo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)/lib.sh"
source "$E2E_SCRIPT_DIR/env.sh"

require_e2e_marker
require_e2e_container postgres-e2e
require_e2e_container mongo-e2e
require_e2e_container redis-e2e
require_e2e_container kafka-e2e

readonly -a E2E_POSTGRES_TARGETS=(
  "$DATABASE_URL|cart_e2e"
  "$PRODUCTS_SERVICE_DATABASE_URL|products_e2e"
  "$NOTIFICATIONS_SERVICE_DATABASE_URL|notifications_e2e"
)
for database_target in "${E2E_POSTGRES_TARGETS[@]}"; do
  database_url="${database_target%%|*}"
  database_name="${database_target##*|}"
  if [[ "$database_url" != *":${E2E_POSTGRES_PORT}/${database_name}?"* ]]; then
    echo "Refusing reset: URL does not target ${database_name} on the E2E port." >&2
    exit 64
  fi
done

for mongo_database in \
  "$CART_SERVICE_MONGO_DB_NAME" \
  "$PRODUCTS_SERVICE_MONGO_DB_NAME"; do
  if [[ "$mongo_database" != *_e2e ]]; then
    echo "Refusing reset: unsafe MongoDB database '$mongo_database'." >&2
    exit 64
  fi
done

echo "==> Recreating isolated PostgreSQL databases..."
for database_name in cart_e2e products_e2e notifications_e2e; do
  e2e_compose exec --no-TTY postgres-e2e \
    psql --username postgres --dbname zoom_storm_e2e_control \
    --set ON_ERROR_STOP=1 \
    --command "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${database_name}' AND pid <> pg_backend_pid();"
  e2e_compose exec --no-TTY postgres-e2e \
    dropdb --username postgres --if-exists "$database_name"
  e2e_compose exec --no-TTY postgres-e2e \
    createdb --username postgres "$database_name"
done

echo "==> Dropping isolated MongoDB read models..."
for database_name in cart_e2e products_e2e; do
  e2e_compose exec --no-TTY mongo-e2e \
    mongosh --quiet \
    --username root \
    --password e2e-root \
    --authenticationDatabase admin \
    --eval "db.getSiblingDB('${database_name}').dropDatabase()"
done

echo "==> Clearing isolated Redis data..."
e2e_compose exec --no-TTY redis-e2e redis-cli FLUSHALL >/dev/null

echo "==> Recreating topics in the isolated Kafka broker..."
readonly -a E2E_KAFKA_TOPICS=(
  cart-events
  checkout-events
  order-events
  product-events
)

for topic in "${E2E_KAFKA_TOPICS[@]}"; do
  e2e_compose exec --no-TTY kafka-e2e \
    kafka-topics --bootstrap-server localhost:29092 --delete --if-exists --topic "$topic" \
    >/dev/null 2>&1 || true
done

for topic in "${E2E_KAFKA_TOPICS[@]}"; do
  deadline=$((SECONDS + 30))
  while e2e_compose exec --no-TTY kafka-e2e \
    kafka-topics --bootstrap-server localhost:29092 --list 2>/dev/null | grep -Fxq "$topic"; do
    if ((SECONDS >= deadline)); then
      echo "Timed out deleting Kafka topic '$topic'." >&2
      exit 1
    fi
    sleep 1
  done

  e2e_compose exec --no-TTY kafka-e2e \
    kafka-topics --bootstrap-server localhost:29092 --create \
    --topic "$topic" --partitions 1 --replication-factor 1 >/dev/null
done

echo "==> Isolated E2E data reset completed."
