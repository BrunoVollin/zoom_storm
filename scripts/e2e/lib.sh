#!/usr/bin/env bash

set -Eeuo pipefail

readonly E2E_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
readonly E2E_PROJECT_ROOT="$(cd "$E2E_SCRIPT_DIR/../.." && pwd -P)"
readonly E2E_COMPOSE_FILE="$E2E_PROJECT_ROOT/docker-compose.e2e.yml"
readonly E2E_COMPOSE_PROJECT="zoom-storm-e2e"
readonly E2E_REQUIRED_MARKER="zoom-storm-e2e"
readonly E2E_STATE_DIR="${ZOOM_STORM_E2E_STATE_DIR:-$E2E_PROJECT_ROOT/.e2e}"
readonly E2E_PID_DIR="$E2E_STATE_DIR/pids"
readonly E2E_LOG_DIR="$E2E_STATE_DIR/logs"
readonly E2E_ARTIFACT_DIR="$E2E_STATE_DIR/artifacts"

export E2E_POSTGRES_PORT="${E2E_POSTGRES_PORT:-13010}"
export E2E_MONGO_PORT="${E2E_MONGO_PORT:-13020}"
export E2E_REDIS_PORT="${E2E_REDIS_PORT:-13030}"
export E2E_KEYCLOAK_PORT="${E2E_KEYCLOAK_PORT:-13040}"
export E2E_KEYCLOAK_HEALTH_PORT="${E2E_KEYCLOAK_HEALTH_PORT:-13041}"
export E2E_KAFKA_PORT="${E2E_KAFKA_PORT:-13045}"

export E2E_CART_PORT="${E2E_CART_PORT:-13000}"
export E2E_PRODUCTS_PORT="${E2E_PRODUCTS_PORT:-13001}"
export E2E_NOTIFICATIONS_PORT="${E2E_NOTIFICATIONS_PORT:-13002}"
export E2E_GATEWAY_PORT="${E2E_GATEWAY_PORT:-13087}"
export E2E_BFF_PORT="${E2E_BFF_PORT:-13088}"
export E2E_WEB_PORT="${E2E_WEB_PORT:-13100}"

e2e_compose() {
  docker compose \
    --project-name "$E2E_COMPOSE_PROJECT" \
    --project-directory "$E2E_PROJECT_ROOT" \
    --file "$E2E_COMPOSE_FILE" \
    "$@"
}

require_command() {
  local command_name="$1"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required command not found: $command_name" >&2
    exit 1
  fi
}

require_e2e_marker() {
  if [[ "${ZOOM_STORM_E2E_MARKER:-}" != "$E2E_REQUIRED_MARKER" ]]; then
    echo "Refusing destructive E2E operation: set ZOOM_STORM_E2E_MARKER=$E2E_REQUIRED_MARKER." >&2
    exit 64
  fi
}

require_e2e_container() {
  local service="$1"
  local container_id project_label

  container_id="$(e2e_compose ps -q "$service")"
  if [[ -z "$container_id" ]]; then
    echo "E2E service is not running: $service" >&2
    exit 1
  fi

  project_label="$(docker inspect --format '{{ index .Config.Labels "com.docker.compose.project" }}' "$container_id")"
  if [[ "$project_label" != "$E2E_COMPOSE_PROJECT" ]]; then
    echo "Refusing operation on $service: unexpected Compose project '$project_label'." >&2
    exit 64
  fi
}

prepare_state_directories() {
  mkdir -p "$E2E_PID_DIR" "$E2E_LOG_DIR" "$E2E_ARTIFACT_DIR"
}

wait_for_http() {
  local name="$1"
  local url="$2"
  local timeout_seconds="${3:-120}"
  local deadline=$((SECONDS + timeout_seconds))

  while ((SECONDS < deadline)); do
    if curl --fail --silent --show-error --output /dev/null "$url" 2>/dev/null; then
      echo "    $name is ready: $url"
      return 0
    fi
    sleep 1
  done

  echo "Timed out waiting for $name at $url" >&2
  return 1
}

wait_for_log() {
  local name="$1"
  local pattern="$2"
  local timeout_seconds="${3:-120}"
  local log_file="$E2E_LOG_DIR/$name.log"
  local pid_file="$E2E_PID_DIR/$name.pid"
  local deadline=$((SECONDS + timeout_seconds))

  while ((SECONDS < deadline)); do
    if [[ -f "$log_file" ]] && grep -Fq "$pattern" "$log_file"; then
      echo "    $name is ready"
      return 0
    fi

    if [[ -f "$pid_file" ]]; then
      local pid
      pid="$(<"$pid_file")"
      if ! kill -0 "$pid" 2>/dev/null; then
        echo "$name exited before becoming ready. Last log lines:" >&2
        tail -n 40 "$log_file" >&2 || true
        return 1
      fi
    fi
    sleep 1
  done

  echo "Timed out waiting for $name log marker '$pattern'." >&2
  tail -n 40 "$log_file" >&2 || true
  return 1
}

assert_port_available() {
  local port="$1"

  if command -v ss >/dev/null 2>&1 && ss -H -ltn "sport = :$port" | grep -q .; then
    echo "Port $port is already in use; refusing to start the E2E host stack." >&2
    exit 1
  fi
}
