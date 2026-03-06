#!/bin/bash
set -euo pipefail

PROJECT_NAME=""
VAULT_NAME=""
STATUS="valid"
POSITIONAL=()
PROJECT_EXPLICIT="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project)
      PROJECT_NAME="${2:-}"
      PROJECT_EXPLICIT="true"
      shift 2
      ;;
    --vault)
      VAULT_NAME="${2:-}"
      shift 2
      ;;
    --status)
      STATUS="${2:-}"
      shift 2
      ;;
    *)
      POSITIONAL+=("$1")
      shift
      ;;
  esac
done

if [[ -z "$PROJECT_NAME" && ${#POSITIONAL[@]} -gt 0 ]]; then
  PROJECT_NAME="${POSITIONAL[0]}"
  PROJECT_EXPLICIT="true"
fi

if [[ -z "$PROJECT_NAME" ]]; then
  if [[ -n "${OPENCODE_PROJECT_DIR:-}" ]]; then
    PROJECT_NAME="$(basename "${OPENCODE_PROJECT_DIR}")"
  elif GIT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"; then
    PROJECT_NAME="$(basename "$GIT_ROOT")"
  else
    PROJECT_NAME="$(basename "$(pwd)")"
  fi
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

run_search() {
  local query="$1"
  if [[ -n "$VAULT_NAME" ]]; then
    bash "$SCRIPT_DIR/search.sh" "$query" "$VAULT_NAME"
  else
    bash "$SCRIPT_DIR/search.sh" "$query"
  fi
}

has_memory_paths() {
  local payload="$1"
  [[ $payload =~ \"memories/[^\"]+\" ]]
}

extract_memory_paths() {
  local payload="$1"
  local remaining="$payload"

  while [[ $remaining =~ \"(memories/[^\"]+)\" ]]; do
    printf '%s\n' "${BASH_REMATCH[1]}"
    remaining="${remaining#*"${BASH_REMATCH[0]}"}"
  done
}

contains_path() {
  local needle="$1"
  shift

  local item
  for item in "$@"; do
    if [[ "$item" == "$needle" ]]; then
      return 0
    fi
  done

  return 1
}

json_escape() {
  local value="$1"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  value="${value//$'\n'/\\n}"
  value="${value//$'\r'/\\r}"
  value="${value//$'\t'/\\t}"
  printf '%s' "$value"
}

emit_json_array() {
  local first="true"
  local item

  printf '['
  for item in "$@"; do
    if [[ "$first" == "false" ]]; then
      printf ','
    fi
    printf '"%s"' "$(json_escape "$item")"
    first="false"
  done
  printf ']'
}

PROJECT_QUERY="[project:${PROJECT_NAME}] [status:${STATUS}] tag:#memories"
GLOBAL_QUERY="[project:global] [status:${STATUS}] tag:#memories"

PROJECT_RAW="$(run_search "$PROJECT_QUERY")"
GLOBAL_RAW="$(run_search "$GLOBAL_QUERY")"

if ! has_memory_paths "$PROJECT_RAW"; then
  PROJECT_QUERY="[project:${PROJECT_NAME}] tag:#memories"
  PROJECT_RAW="$(run_search "$PROJECT_QUERY")"
fi

if ! has_memory_paths "$GLOBAL_RAW"; then
  GLOBAL_QUERY="[project:global] tag:#memories"
  GLOBAL_RAW="$(run_search "$GLOBAL_QUERY")"
fi

PROJECT_PATHS=()
GLOBAL_PATHS=()
ORDERED_PATHS=()

while IFS= read -r path; do
  [[ -z "$path" ]] && continue
  PROJECT_PATHS+=("$path")
done < <(extract_memory_paths "$PROJECT_RAW")

while IFS= read -r path; do
  [[ -z "$path" ]] && continue
  GLOBAL_PATHS+=("$path")
done < <(extract_memory_paths "$GLOBAL_RAW")

for path in "${PROJECT_PATHS[@]+"${PROJECT_PATHS[@]}"}" "${GLOBAL_PATHS[@]+"${GLOBAL_PATHS[@]}"}"; do
  [[ -z "$path" ]] && continue
  if ! contains_path "$path" "${ORDERED_PATHS[@]+"${ORDERED_PATHS[@]}"}"; then
    ORDERED_PATHS+=("$path")
  fi
done

printf '{'
printf '"project":"%s",' "$(json_escape "$PROJECT_NAME")"
printf '"status":"%s",' "$(json_escape "$STATUS")"
printf '"vault":"%s",' "$(json_escape "$VAULT_NAME")"
printf '"project_explicit":%s,' "$PROJECT_EXPLICIT"
printf '"project_paths":'
emit_json_array "${PROJECT_PATHS[@]+"${PROJECT_PATHS[@]}"}"
printf ','
printf '"global_paths":'
emit_json_array "${GLOBAL_PATHS[@]+"${GLOBAL_PATHS[@]}"}"
printf ','
printf '"ordered_paths":'
emit_json_array "${ORDERED_PATHS[@]+"${ORDERED_PATHS[@]}"}"
printf '}\n'
