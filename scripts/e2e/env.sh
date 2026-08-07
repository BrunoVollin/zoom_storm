#!/usr/bin/env bash

# This file is sourced by E2E scripts after lib.sh. Every value targets the
# isolated ports, databases and realm declared in docker-compose.e2e.yml.

export NODE_ENV=test
export OTEL_SDK_DISABLED=true

export DATABASE_URL="postgresql://postgres:e2e-root@127.0.0.1:${E2E_POSTGRES_PORT}/cart_e2e?schema=public"
export PRODUCTS_SERVICE_DATABASE_URL="postgresql://postgres:e2e-root@127.0.0.1:${E2E_POSTGRES_PORT}/products_e2e?schema=public"
export NOTIFICATIONS_SERVICE_DATABASE_URL="postgresql://postgres:e2e-root@127.0.0.1:${E2E_POSTGRES_PORT}/notifications_e2e?schema=public"

export CART_SERVICE_MONGO_URI="mongodb://root:e2e-root@127.0.0.1:${E2E_MONGO_PORT}/?authSource=admin"
export CART_SERVICE_MONGO_DB_NAME=cart_e2e
export PRODUCTS_SERVICE_MONGO_URI="mongodb://root:e2e-root@127.0.0.1:${E2E_MONGO_PORT}/?authSource=admin"
export PRODUCTS_SERVICE_MONGO_DB_NAME=products_e2e
export CART_PROJECTION_MONGO_URI="$CART_SERVICE_MONGO_URI"
export CART_PROJECTION_MONGO_DB_NAME=cart_e2e
export PRODUCTS_PROJECTION_MONGO_URI="$PRODUCTS_SERVICE_MONGO_URI"
export PRODUCTS_PROJECTION_MONGO_DB_NAME=products_e2e
export CART_PRODUCTS_PROJECTION_MONGO_URI="$CART_SERVICE_MONGO_URI"
export CART_PRODUCTS_PROJECTION_MONGO_DB_NAME=cart_e2e

export CART_SERVICE_KAFKA_BROKERS="127.0.0.1:${E2E_KAFKA_PORT}"
export PRODUCTS_SERVICE_KAFKA_BROKERS="$CART_SERVICE_KAFKA_BROKERS"
export NOTIFICATIONS_SERVICE_KAFKA_BROKERS="$CART_SERVICE_KAFKA_BROKERS"
export CART_PROJECTION_KAFKA_BROKERS="$CART_SERVICE_KAFKA_BROKERS"
export PRODUCTS_PROJECTION_KAFKA_BROKERS="$CART_SERVICE_KAFKA_BROKERS"
export CART_PRODUCTS_PROJECTION_KAFKA_BROKERS="$CART_SERVICE_KAFKA_BROKERS"
export CART_SERVICE_KAFKA_CLIENT_ID=cart-service-e2e
export PRODUCTS_SERVICE_KAFKA_CLIENT_ID=products-service-e2e
export NOTIFICATIONS_SERVICE_KAFKA_CLIENT_ID=notifications-service-e2e
export CART_PROJECTION_KAFKA_CLIENT_ID=cart-projection-e2e
export PRODUCTS_PROJECTION_KAFKA_CLIENT_ID=products-projection-e2e
export CART_PRODUCTS_PROJECTION_KAFKA_CLIENT_ID=cart-products-projection-e2e
export NOTIFICATIONS_SERVICE_KAFKA_GROUP_ID=notifications-service-worker-e2e
export CART_PROJECTION_KAFKA_GROUP_ID=cart-projection-worker-e2e
export PRODUCTS_PROJECTION_KAFKA_GROUP_ID=products-projection-worker-e2e
export CART_PRODUCTS_PROJECTION_KAFKA_GROUP_ID=cart-products-projection-worker-e2e
export NOTIFICATIONS_SERVICE_KAFKA_TOPICS=order-events
export CART_PROJECTION_KAFKA_TOPICS=cart-events,checkout-events,order-events
export PRODUCTS_PROJECTION_KAFKA_TOPICS=product-events
export CART_PRODUCTS_PROJECTION_KAFKA_TOPICS=product-events

export REDIS_URL="redis://127.0.0.1:${E2E_REDIS_PORT}/0"
export KEYCLOAK_ISSUER_URL="http://localhost:${E2E_KEYCLOAK_PORT}/realms/zoom-storm-e2e"
export KEYCLOAK_JWKS_URI="$KEYCLOAK_ISSUER_URL/protocol/openid-connect/certs"
export KEYCLOAK_CLIENT_ID=bff-e2e
export KEYCLOAK_CLIENT_SECRET=zoom-storm-e2e-client-secret
export COOKIE_SECRET=zoom-storm-e2e-cookie-secret-with-at-least-32-bytes
export SESSION_COOKIE_NAME=zoom-storm-e2e-session

export CART_SERVICE_PORT="$E2E_CART_PORT"
export PRODUCTS_SERVICE_PORT="$E2E_PRODUCTS_PORT"
export NOTIFICATIONS_SERVICE_PORT="$E2E_NOTIFICATIONS_PORT"
export API_GATEWAY_PORT="$E2E_GATEWAY_PORT"
export BFF_PORT="$E2E_BFF_PORT"
export CART_SERVICE_URL="http://127.0.0.1:${E2E_CART_PORT}"
export PRODUCTS_SERVICE_URL="http://127.0.0.1:${E2E_PRODUCTS_PORT}"
export NOTIFICATIONS_SERVICE_URL="http://127.0.0.1:${E2E_NOTIFICATIONS_PORT}"
export GATEWAY_URL="http://127.0.0.1:${E2E_GATEWAY_PORT}"
export BFF_BASE_URL="http://localhost:${E2E_BFF_PORT}"
export FRONTEND_URL="http://localhost:${E2E_WEB_PORT}"
export NEXT_PUBLIC_SITE_URL="$FRONTEND_URL"
export NEXT_PUBLIC_BFF_WS_URL="ws://localhost:${E2E_BFF_PORT}/ws"

export CART_SERVICE_SKIP_AUTH=false
export PRODUCTS_SERVICE_SKIP_AUTH=false
export NOTIFICATIONS_SERVICE_SKIP_AUTH=false
export INTERNAL_SERVICE_TOKEN=zoom-storm-e2e-internal-service-token
export ORDER_TRANSIT_STEP_MINUTES=1440
export ORDER_SIMULATOR_POLL_INTERVAL_MS=86400000
export INVENTORY_EXPIRATION_POLL_INTERVAL_MS=1000
