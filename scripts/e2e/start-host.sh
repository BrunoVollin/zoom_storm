#!/usr/bin/env bash

set -Eeuo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)/lib.sh"
source "$E2E_SCRIPT_DIR/env.sh"

require_command setsid
prepare_state_directories

startup_complete=false
cleanup_failed_start() {
  local status=$?
  trap - ERR
  if [[ "$startup_complete" == false ]]; then
    echo "Host startup failed; stopping the E2E processes already started." >&2
    "$E2E_SCRIPT_DIR/stop-host.sh" || true
  fi
  exit "$status"
}
trap cleanup_failed_start ERR

for port in \
  "$E2E_CART_PORT" \
  "$E2E_PRODUCTS_PORT" \
  "$E2E_NOTIFICATIONS_PORT" \
  "$E2E_GATEWAY_PORT" \
  "$E2E_BFF_PORT" \
  "$E2E_WEB_PORT"; do
  assert_port_available "$port"
done

start_process() {
  local name="$1"
  local working_directory="$2"
  shift 2

  local pid_file="$E2E_PID_DIR/$name.pid"
  local log_file="$E2E_LOG_DIR/$name.log"

  if [[ -f "$pid_file" ]]; then
    local existing_pid
    existing_pid="$(<"$pid_file")"
    if kill -0 "$existing_pid" 2>/dev/null; then
      echo "Refusing duplicate E2E process '$name' (PID $existing_pid)." >&2
      exit 1
    fi
    rm -f "$pid_file"
  fi

  : >"$log_file"
  (
    cd "$working_directory"
    exec setsid env ZOOM_STORM_E2E_PROCESS="$name" "$@"
  ) >>"$log_file" 2>&1 &

  local process_pid=$!
  local process_group=""
  for _ in {1..20}; do
    process_group="$(ps -o pgid= -p "$process_pid" 2>/dev/null | tr -d ' ' || true)"
    [[ "$process_group" == "$process_pid" ]] && break
    kill -0 "$process_pid" 2>/dev/null || break
    sleep 0.05
  done
  if [[ "$process_group" != "$process_pid" ]]; then
    kill -TERM "$process_pid" 2>/dev/null || true
    echo "Failed to isolate E2E process group for '$name'." >&2
    exit 1
  fi
  echo "$process_pid" >"$pid_file"
  echo "    started $name (PID $process_pid)"
}

cd "$E2E_PROJECT_ROOT"

echo "==> Starting E2E services on the host without watch mode..."
start_process cart-service "$E2E_PROJECT_ROOT" \
  "$E2E_PROJECT_ROOT/node_modules/.bin/tsx" \
  --tsconfig "$E2E_PROJECT_ROOT/tsconfig.json" \
  apps/cart-service/src/infrastructure/http/server.ts
start_process products-service "$E2E_PROJECT_ROOT" \
  "$E2E_PROJECT_ROOT/node_modules/.bin/tsx" \
  --tsconfig "$E2E_PROJECT_ROOT/tsconfig.json" \
  apps/products-service/src/infrastructure/http/server.ts
start_process notifications-service "$E2E_PROJECT_ROOT" \
  "$E2E_PROJECT_ROOT/node_modules/.bin/tsx" \
  --tsconfig "$E2E_PROJECT_ROOT/tsconfig.json" \
  apps/notifications-service/src/infrastructure/http/server.ts
start_process cart-projection "$E2E_PROJECT_ROOT/apps/cart-projection" \
  "$E2E_PROJECT_ROOT/node_modules/.bin/tsx" index.ts
start_process products-projection "$E2E_PROJECT_ROOT/apps/products-projection" \
  "$E2E_PROJECT_ROOT/node_modules/.bin/tsx" index.ts
start_process cart-products-projection "$E2E_PROJECT_ROOT/apps/cart-products-projection" \
  "$E2E_PROJECT_ROOT/node_modules/.bin/tsx" index.ts
start_process notifications-consumer "$E2E_PROJECT_ROOT/apps/notifications-service" \
  "$E2E_PROJECT_ROOT/node_modules/.bin/tsx" index.ts
start_process api-gateway "$E2E_PROJECT_ROOT" \
  "$E2E_PROJECT_ROOT/node_modules/.bin/tsx" \
  --tsconfig "$E2E_PROJECT_ROOT/tsconfig.json" \
  apps/api-gateway/src/infrastructure/http/server.ts
start_process bff "$E2E_PROJECT_ROOT" \
  "$E2E_PROJECT_ROOT/node_modules/.bin/tsx" \
  --tsconfig "$E2E_PROJECT_ROOT/tsconfig.json" \
  apps/bff/src/infrastructure/http/server.ts

echo "==> Building the storefront for its E2E production server..."
yarn --cwd "$E2E_PROJECT_ROOT/apps/web" build >"$E2E_LOG_DIR/web-build.log" 2>&1
start_process web "$E2E_PROJECT_ROOT/apps/web" \
  "$E2E_PROJECT_ROOT/node_modules/.bin/next" start --port "$E2E_WEB_PORT"

startup_complete=true
trap - ERR
echo "==> E2E host processes started."
