#!/usr/bin/env bash

set -Eeuo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)/lib.sh"

require_e2e_marker

echo "==> Stopping E2E host processes..."
stop_status=0
"$E2E_SCRIPT_DIR/stop-host.sh" || stop_status=$?

echo "==> Removing the isolated E2E Compose stack and its volumes..."
e2e_compose down --volumes --remove-orphans --timeout 15

echo "==> Isolated E2E stack removed."
exit "$stop_status"
