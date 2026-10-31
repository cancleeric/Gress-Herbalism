#!/bin/bash
# Explicit approved release only. No auto-commit, source deploy or raw SQL.
set -euo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
if [[ "${1:-}" == "--local-docker" ]]; then
    shift
    exec node "$ROOT_DIR/scripts/deploy-local-docker.cjs" "$@"
fi
exec node "$ROOT_DIR/scripts/deploy-with-migrations.cjs" "$@"
