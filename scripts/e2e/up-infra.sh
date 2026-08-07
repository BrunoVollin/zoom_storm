#!/usr/bin/env bash

set -Eeuo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)/lib.sh"

require_command docker
prepare_state_directories

echo "==> Starting isolated E2E infrastructure ($E2E_COMPOSE_PROJECT)..."
e2e_compose up --detach --wait --wait-timeout 180

wait_for_http \
  "Keycloak E2E realm" \
  "http://127.0.0.1:${E2E_KEYCLOAK_PORT}/realms/zoom-storm-e2e/.well-known/openid-configuration" \
  180

echo "==> E2E infrastructure is ready."
