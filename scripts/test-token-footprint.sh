#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/skillify-token-test.XXXXXX")"
trap 'rm -rf -- "$TEST_ROOT"' EXIT

node "$REPO_DIR/scripts/report-token-footprint.mjs" --json > "$TEST_ROOT/first.json"
node "$REPO_DIR/scripts/report-token-footprint.mjs" --json > "$TEST_ROOT/second.json"
cmp "$TEST_ROOT/first.json" "$TEST_ROOT/second.json"

node "$REPO_DIR/scripts/report-token-footprint.mjs" --check >/dev/null

node -e 'const fs=require("node:fs"); const p=process.argv[1]; const b={schemaVersion:1,budgets:{discovery:{maxBytes:0},skillEntrypoint:{defaultMaxBytes:0,exceptions:{}},rootAgent:{defaultMaxBytes:0},delegatedAgent:{defaultMaxBytes:0}}}; fs.writeFileSync(p, JSON.stringify(b)+"\n")' "$TEST_ROOT/failing-budgets.json"
if node "$REPO_DIR/scripts/report-token-footprint.mjs" \
  --check \
  --budgets "$TEST_ROOT/failing-budgets.json" >/dev/null 2>&1; then
  echo "token footprint test: zero budgets incorrectly passed" >&2
  exit 1
fi

printf 'Skillify token footprint tests passed.\n'
