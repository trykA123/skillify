#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/skillify-agent-test.XXXXXX")"
trap 'rm -rf -- "$TEST_ROOT"' EXIT

for harness in codex claude opencode; do
  target="$TEST_ROOT/$harness"
  node "$REPO_DIR/scripts/render-agents.mjs" \
    --harness "$harness" \
    --dest "$target" >/dev/null
  node "$REPO_DIR/scripts/render-agents.mjs" \
    --harness "$harness" \
    --dest "$target" \
    --check >/dev/null
  [[ -f "$target/teacher.$([[ "$harness" == codex ]] && printf toml || printf md)" ]]
  [[ "$(find "$target" -maxdepth 1 -type f ! -name '.skillify-native.json' | wc -l)" -eq 10 ]]
  node "$REPO_DIR/scripts/render-agents.mjs" \
    --harness "$harness" \
    --dest "$target" \
    --uninstall >/dev/null
  [[ ! -e "$target/.skillify-native.json" ]]
done

if node "$REPO_DIR/scripts/render-agents.mjs" \
  --harness codex \
  --dest / \
  --dry-run >/dev/null 2>&1; then
  echo "agent adapter test: unsafe destination was accepted" >&2
  exit 1
fi

printf 'Skillify native agent adapter tests passed.\n'
