#!/usr/bin/env bash

set -Eeuo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)/lib.sh"

prepare_state_directories

mapfile -t pid_files < <(find "$E2E_PID_DIR" -maxdepth 1 -type f -name '*.pid' -print | sort)

if ((${#pid_files[@]} == 0)); then
  echo "    no E2E host processes recorded"
  exit 0
fi

declare -a running_pids=()
declare -a removable_pid_files=()
unsafe_process_found=false
for pid_file in "${pid_files[@]}"; do
  process_name="$(basename "$pid_file" .pid)"
  pid="$(<"$pid_file")"
  if [[ "$pid" =~ ^[0-9]+$ ]] && kill -0 "$pid" 2>/dev/null; then
    if [[ -r "/proc/$pid/environ" ]] && \
      tr '\0' '\n' <"/proc/$pid/environ" | grep -Fxq "ZOOM_STORM_E2E_PROCESS=$process_name"; then
      running_pids+=("$pid")
      removable_pid_files+=("$pid_file")
    else
      echo "    refusing to stop PID $pid: missing E2E process marker" >&2
      unsafe_process_found=true
    fi
  else
    removable_pid_files+=("$pid_file")
  fi
done

if ((${#running_pids[@]} > 0)); then
  for pid in "${running_pids[@]}"; do
    kill -TERM -- "-$pid" 2>/dev/null || true
  done
  deadline=$((SECONDS + 15))
  while ((SECONDS < deadline)); do
    remaining=()
    for pid in "${running_pids[@]}"; do
      if kill -0 "$pid" 2>/dev/null; then
        remaining+=("$pid")
      fi
    done
    ((${#remaining[@]} == 0)) && break
    running_pids=("${remaining[@]}")
    sleep 1
  done

  if ((${#running_pids[@]} > 0)); then
    for pid in "${running_pids[@]}"; do
      kill -KILL -- "-$pid" 2>/dev/null || true
    done
  fi
fi

if ((${#removable_pid_files[@]} > 0)); then
  rm -f "${removable_pid_files[@]}"
fi
echo "    E2E host processes stopped"

if [[ "$unsafe_process_found" == true ]]; then
  exit 1
fi
