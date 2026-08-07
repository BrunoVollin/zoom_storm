#!/usr/bin/env bash

set -Eeuo pipefail

readonly PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
readonly SHUTDOWN_TIMEOUT_SECONDS=8
readonly -a MANAGED_PORTS=(
  3000 3001 3002 3100
  8087 8088
  9229 9230 9231 9232 9233 9234 9235 9236 9237 9238
)

DRY_RUN=false

usage() {
  cat <<'EOF'
Usage: ./down.sh [--dry-run]

Stops all local development processes started by up.sh and removes the
Docker Compose containers and network. Named volumes and their data are
preserved.

Options:
  --dry-run  Show what would be stopped without changing anything.
  -h, --help Show this help message.
EOF
}

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      usage >&2
      exit 2
      ;;
  esac
done

declare -A PROCESS_COMMANDS=()
declare -A PROCESS_PARENTS=()
declare -A TARGET_PIDS=()

load_processes() {
  local pid ppid command

  while read -r pid ppid command; do
    [[ -n "${pid:-}" ]] || continue
    PROCESS_PARENTS["$pid"]="$ppid"
    PROCESS_COMMANDS["$pid"]="$command"
  done < <(ps -eo pid=,ppid=,args=)
}

process_belongs_to_project() {
  local pid="$1"
  local command="${PROCESS_COMMANDS[$pid]:-}"
  local cwd=""

  if [[ -e "/proc/$pid/cwd" ]]; then
    cwd="$(readlink "/proc/$pid/cwd" 2>/dev/null || true)"
  fi

  [[ "$cwd" == "$PROJECT_ROOT" || "$cwd" == "$PROJECT_ROOT/"* || "$command" == *"$PROJECT_ROOT/"* ]]
}

is_development_process() {
  local command="$1"

  [[ "$command" =~ (^|[[:space:]/])yarn([.]js)?[[:space:]]+(run[[:space:]]+)?dev(:[[:alnum:]_-]+)?([[:space:]]|$) ]] ||
    [[ "$command" == *"node_modules/.bin/concurrently"* ]] ||
    [[ "$command" =~ tsx.*[[:space:]]watch([[:space:]]|$) ]] ||
    [[ "$command" =~ next.*[[:space:]]dev([[:space:]]|$) ]] ||
    [[ "$command" == *"apps/api-gateway/src/infrastructure/http/server.ts"* ]] ||
    [[ "$command" == *"apps/cart-service/src/infrastructure/http/server.ts"* ]] ||
    [[ "$command" == *"apps/products-service/src/infrastructure/http/server.ts"* ]] ||
    [[ "$command" == *"apps/notifications-service/src/infrastructure/http/server.ts"* ]] ||
    [[ "$command" == *"apps/bff/src/infrastructure/http/server.ts"* ]] ||
    [[ "$command" == *"OTEL_SERVICE_NAME=cart-projection"* ]] ||
    [[ "$command" == *"OTEL_SERVICE_NAME=products-projection"* ]] ||
    [[ "$command" == *"OTEL_SERVICE_NAME=cart-products-projection"* ]] ||
    [[ "$command" == *"OTEL_SERVICE_NAME=notifications-service-consumer"* ]]
}

add_process_descendants() {
  local changed=true
  local pid ppid

  while [[ "$changed" == true ]]; do
    changed=false
    for pid in "${!PROCESS_PARENTS[@]}"; do
      ppid="${PROCESS_PARENTS[$pid]}"
      if [[ -n "${TARGET_PIDS[$ppid]+present}" && -z "${TARGET_PIDS[$pid]+present}" ]]; then
        TARGET_PIDS["$pid"]=1
        changed=true
      fi
    done
  done
}

listener_pids() {
  local port="$1"

  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -t -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true
    return
  fi

  if command -v ss >/dev/null 2>&1; then
    ss -H -ltnp "sport = :$port" 2>/dev/null |
      grep -oE 'pid=[0-9]+' |
      cut -d= -f2 |
      sort -u || true
  fi
}

collect_targets() {
  local pid port

  load_processes

  for pid in "${!PROCESS_COMMANDS[@]}"; do
    if [[ "$pid" != "$$" ]] && process_belongs_to_project "$pid" && is_development_process "${PROCESS_COMMANDS[$pid]}"; then
      TARGET_PIDS["$pid"]=1
    fi
  done

  add_process_descendants

  for port in "${MANAGED_PORTS[@]}"; do
    while read -r pid; do
      [[ -n "$pid" ]] || continue
      if process_belongs_to_project "$pid"; then
        TARGET_PIDS["$pid"]=1
      else
        echo "    Warning: port $port is used by PID $pid outside this workspace; leaving it untouched." >&2
      fi
    done < <(listener_pids "$port")
  done

  add_process_descendants
}

sorted_target_pids() {
  if ((${#TARGET_PIDS[@]} > 0)); then
    printf '%s\n' "${!TARGET_PIDS[@]}" | sort -n
  fi
}

describe_targets() {
  local pid

  while read -r pid; do
    [[ -n "$pid" ]] || continue
    printf '    PID %-7s %s\n' "$pid" "${PROCESS_COMMANDS[$pid]:-unknown command}"
  done < <(sorted_target_pids)
}

still_managed_process() {
  local pid="$1"

  kill -0 "$pid" 2>/dev/null || return 1
  process_belongs_to_project "$pid"
}

stop_local_services() {
  local pid deadline
  local -a pids=()
  local -a remaining=()

  mapfile -t pids < <(sorted_target_pids)

  if ((${#pids[@]} == 0)); then
    echo "    No local Zoom Storm development processes found."
    return
  fi

  describe_targets

  if [[ "$DRY_RUN" == true ]]; then
    echo "    Dry run: no local process was stopped."
    return
  fi

  echo "    Sending SIGTERM to ${#pids[@]} process(es)..."
  kill -TERM "${pids[@]}" 2>/dev/null || true

  deadline=$((SECONDS + SHUTDOWN_TIMEOUT_SECONDS))
  while ((SECONDS < deadline)); do
    remaining=()
    for pid in "${pids[@]}"; do
      if still_managed_process "$pid"; then
        remaining+=("$pid")
      fi
    done

    ((${#remaining[@]} == 0)) && break
    sleep 1
  done

  if ((${#remaining[@]} > 0)); then
    echo "    ${#remaining[@]} process(es) did not stop gracefully; sending SIGKILL."
    kill -KILL "${remaining[@]}" 2>/dev/null || true
  fi

  echo "    Local development services stopped."
}

compose_command() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    printf '%s\n' docker compose
    return 0
  fi

  if command -v docker-compose >/dev/null 2>&1; then
    printf '%s\n' docker-compose
    return 0
  fi

  return 1
}

stop_infrastructure() {
  local -a compose=()

  if ! mapfile -t compose < <(compose_command); then
    echo "    Warning: Docker Compose was not found; infrastructure was not stopped." >&2
    return 1
  fi

  if [[ "$DRY_RUN" == true ]]; then
    printf '    Dry run:'
    printf ' %q' "${compose[@]}" --project-directory "$PROJECT_ROOT" -f "$PROJECT_ROOT/docker-compose.yml" down --remove-orphans
    printf '\n'
    return
  fi

  "${compose[@]}" \
    --project-directory "$PROJECT_ROOT" \
    -f "$PROJECT_ROOT/docker-compose.yml" \
    down --remove-orphans

  echo "    Infrastructure stopped. Named volumes and data were preserved."
}

echo "==> Stopping local application and debug processes..."
collect_targets
stop_local_services

echo "==> Stopping Docker Compose infrastructure..."
stop_infrastructure

if [[ "$DRY_RUN" == true ]]; then
  echo "==> Dry run complete. Nothing was changed."
else
  echo "==> Zoom Storm is down."
fi
