#!/usr/bin/env bash

set -Eeuo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)/lib.sh"
source "$E2E_SCRIPT_DIR/env.sh"

export ZOOM_STORM_E2E_MARKER="$E2E_REQUIRED_MARKER"

for command_name in docker curl node npx python3 setsid yarn; do
  require_command "$command_name"
done

prepare_state_directories
export ZOOM_STORM_E2E_ARTIFACT_DIR="$E2E_ARTIFACT_DIR/$(date -u +%Y%m%dT%H%M%SZ)-$$"

run_status=0
cleanup() {
  local original_status=$?
  trap - EXIT INT TERM

  if ((original_status != 0)); then
    echo "==> E2E run failed; collecting diagnostics..." >&2
  else
    echo "==> Collecting E2E execution logs..."
  fi
  "$E2E_SCRIPT_DIR/collect-logs.sh" || true

  "$E2E_SCRIPT_DIR/down.sh" || true

  if ((run_status != 0)); then
    exit "$run_status"
  fi
  exit "$original_status"
}
trap cleanup EXIT INT TERM

"$E2E_SCRIPT_DIR/up-infra.sh"
"$E2E_SCRIPT_DIR/prepare-data.sh"
"$E2E_SCRIPT_DIR/start-host.sh"
"$E2E_SCRIPT_DIR/wait-ready.sh"

echo "==> Running Cypress against the integrated E2E stack..."
set +e
yarn --cwd "$E2E_PROJECT_ROOT/apps/web" cy:run:real \
  --config "baseUrl=http://localhost:${E2E_WEB_PORT},screenshotsFolder=${ZOOM_STORM_E2E_ARTIFACT_DIR}/cypress/screenshots,videosFolder=${ZOOM_STORM_E2E_ARTIFACT_DIR}/cypress/videos" \
  --env "keycloakUrl=http://localhost:${E2E_KEYCLOAK_PORT},keycloakRealm=zoom-storm-e2e,testUser=test_e2e,testPassword=test-e2e-123,mockApi=false" \
  "$@"
run_status=$?
set -e

exit "$run_status"
