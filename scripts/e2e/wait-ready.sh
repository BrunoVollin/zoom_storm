#!/usr/bin/env bash

set -Eeuo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)/lib.sh"
source "$E2E_SCRIPT_DIR/env.sh"

prepare_state_directories

echo "==> Waiting for E2E consumers..."
wait_for_log cart-projection "[Kafka] Consumer connected." 120
wait_for_log products-projection "[Kafka] Consumer connected." 120
wait_for_log cart-products-projection "[Kafka] Consumer connected." 120
wait_for_log notifications-consumer "[Kafka] Consumer connected." 120

echo "==> Waiting for E2E HTTP services..."
wait_for_http cart-service "http://127.0.0.1:${E2E_CART_PORT}/openapi.yml" 120
wait_for_http products-service "http://127.0.0.1:${E2E_PRODUCTS_PORT}/products/categories" 120
wait_for_http notifications-service "http://127.0.0.1:${E2E_NOTIFICATIONS_PORT}/health" 120
wait_for_http api-gateway "http://127.0.0.1:${E2E_GATEWAY_PORT}/health" 120
wait_for_http bff "http://127.0.0.1:${E2E_BFF_PORT}/health" 120
wait_for_http web "http://127.0.0.1:${E2E_WEB_PORT}/" 180

echo "==> Waiting for seeded products to reach the MongoDB read model..."
deadline=$((SECONDS + 120))
while ((SECONDS < deadline)); do
  response="$(curl --fail --silent "http://127.0.0.1:${E2E_PRODUCTS_PORT}/products?limit=1" 2>/dev/null || true)"
  if RESPONSE="$response" python3 - <<'PY'
import json
import os

try:
    payload = json.loads(os.environ["RESPONSE"])
except (KeyError, json.JSONDecodeError):
    raise SystemExit(1)

products = payload.get("products") or payload.get("data") or []
raise SystemExit(0 if isinstance(products, list) and products else 1)
PY
  then
    echo "    seeded product projection is ready"
    echo "==> Integrated E2E stack is ready."
    exit 0
  fi
  sleep 1
done

echo "Timed out waiting for seeded product projection." >&2
exit 1
