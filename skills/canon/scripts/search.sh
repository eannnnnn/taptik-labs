#!/bin/bash
set -euo pipefail

QUERY="${1:-path:canon}"
VAULT_NAME="${2:-}"

if ! command -v obsidian >/dev/null 2>&1; then
  echo "Error: obsidian CLI not found in PATH" >&2
  exit 1
fi

if [[ -n "$VAULT_NAME" ]]; then
  obsidian "vault=$VAULT_NAME" search query="$QUERY" path="canon" format=json
else
  obsidian search query="$QUERY" path="canon" format=json
fi
