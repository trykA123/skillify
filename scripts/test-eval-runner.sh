#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/skillify-eval-test.XXXXXX")"
trap 'rm -rf -- "$TEST_ROOT"' EXIT

node "$REPO_DIR/scripts/run-evals.mjs" \
  --adapter fixture \
  --suite teachify \
  --limit 2 \
  --out "$TEST_ROOT/first.jsonl" >/dev/null

[[ "$(wc -l < "$TEST_ROOT/first.jsonl")" -eq 2 ]]
node "$REPO_DIR/scripts/compare-evals.mjs" \
  "$TEST_ROOT/first.jsonl" \
  "$TEST_ROOT/first.jsonl" >/dev/null

node "$REPO_DIR/scripts/run-evals.mjs" \
  --adapter codex \
  --suite teachify \
  --limit 1 \
  --dry-run >/dev/null

printf 'Skillify evaluation runner tests passed.\n'
