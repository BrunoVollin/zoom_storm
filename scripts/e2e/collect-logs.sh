#!/usr/bin/env bash

set -Eeuo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)/lib.sh"

prepare_state_directories

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
destination="${ZOOM_STORM_E2E_ARTIFACT_DIR:-$E2E_ARTIFACT_DIR/$timestamp}"
mkdir -p "$destination/host"

if compgen -G "$E2E_LOG_DIR/*.log" >/dev/null; then
  cp "$E2E_LOG_DIR"/*.log "$destination/host/"
fi

e2e_compose ps --all >"$destination/compose-ps.txt" 2>&1 || true
e2e_compose logs --no-color --timestamps >"$destination/compose.log" 2>&1 || true

if [[ -d "$E2E_PROJECT_ROOT/apps/web/cypress/screenshots" ]]; then
  cp -R "$E2E_PROJECT_ROOT/apps/web/cypress/screenshots" "$destination/screenshots"
fi
if [[ -d "$E2E_PROJECT_ROOT/apps/web/cypress/videos" ]]; then
  cp -R "$E2E_PROJECT_ROOT/apps/web/cypress/videos" "$destination/videos"
fi

echo "$destination"
