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

node "$REPO_DIR/scripts/run-evals.mjs" \
  --adapter fixture \
  --suite skillify \
  --out "$TEST_ROOT/custom.jsonl" >/dev/null

[[ "$(wc -l < "$TEST_ROOT/custom.jsonl")" -eq 7 ]]
grep -q 'I choose Customize' "$TEST_ROOT/custom.jsonl"
grep -q 'W1 Light' "$TEST_ROOT/custom.jsonl"
grep -q 'Coordinator: parent session; Orchestrator not needed' "$TEST_ROOT/custom.jsonl"
grep -q 'I confirm this exact ownership map' "$TEST_ROOT/custom.jsonl"

node "$REPO_DIR/scripts/run-evals.mjs" \
  --adapter fixture \
  --suite fleet \
  --out "$TEST_ROOT/custom-team.jsonl" >/dev/null

grep -q 'Roles: scout, worker, reviewer' "$TEST_ROOT/custom-team.jsonl"
grep -q 'Selected: Heavy · Terse · Expert · Custom team' "$TEST_ROOT/custom-team.jsonl"

node "$REPO_DIR/scripts/run-evals.mjs" \
  --adapter fixture \
  --suite fleet \
  --case agent-custom-role-map \
  --out "$TEST_ROOT/one-case.jsonl" >/dev/null

[[ "$(wc -l < "$TEST_ROOT/one-case.jsonl")" -eq 1 ]]

node "$REPO_DIR/scripts/run-evals.mjs" \
  --adapter fixture \
  --installed \
  --suite orientify \
  --case orientify-login-natural-pause \
  --out "$TEST_ROOT/natural-pause.jsonl" >/dev/null

grep -q '"passed":true' "$TEST_ROOT/natural-pause.jsonl"
grep -q 'Customize' "$TEST_ROOT/natural-pause.jsonl"

if SKILLIFY_FIXTURE_NATURAL_RESPONSE=receipt node "$REPO_DIR/scripts/run-evals.mjs" \
  --adapter fixture \
  --installed \
  --suite orientify \
  --case orientify-login-natural-pause \
  --out "$TEST_ROOT/natural-receipt.jsonl" >/dev/null 2>&1; then
  echo "eval runner test: natural-flow receipt incorrectly passed" >&2
  exit 1
fi

for invalid_response in recommendation-late continues; do
  if SKILLIFY_FIXTURE_NATURAL_RESPONSE="$invalid_response" node "$REPO_DIR/scripts/run-evals.mjs" \
    --adapter fixture \
    --installed \
    --suite orientify \
    --case orientify-login-natural-pause \
    --out "$TEST_ROOT/natural-$invalid_response.jsonl" >/dev/null 2>&1; then
    echo "eval runner test: invalid natural flow '$invalid_response' incorrectly passed" >&2
    exit 1
  fi
done

if node "$REPO_DIR/scripts/run-evals.mjs" \
  --adapter claude \
  --installed \
  --suite orientify \
  --case orientify-login-natural-pause \
  --dry-run >/dev/null 2>&1; then
  echo "eval runner test: unsupported installed adapter was accepted" >&2
  exit 1
fi

printf 'Skillify evaluation runner tests passed.\n'
