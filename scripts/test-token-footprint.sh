#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/skillify-token-test.XXXXXX")"
trap 'rm -rf -- "$TEST_ROOT"' EXIT

node "$REPO_DIR/scripts/report-token-footprint.mjs" --json > "$TEST_ROOT/first.json"
node "$REPO_DIR/scripts/report-token-footprint.mjs" --json > "$TEST_ROOT/second.json"
cmp "$TEST_ROOT/first.json" "$TEST_ROOT/second.json"

node "$REPO_DIR/scripts/report-token-footprint.mjs" --check >/dev/null
node "$REPO_DIR/scripts/report-token-footprint.mjs" --markdown > "$TEST_ROOT/report.md"
grep -q 'aliases of one canonical resolved path are counted once' "$TEST_ROOT/report.md"

node -e 'const fs=require("node:fs"); const p=process.argv[1]; const b={schemaVersion:1,budgets:{discovery:{maxBytes:999999},skillEntrypoint:{defaultMaxBytes:999999,exceptions:{}},rootAgent:{defaultMaxBytes:999999},delegatedAgent:{defaultMaxBytes:999999},pipelineChain:{maxBytes:25000,skills:["undumbify","shapeify","shipify","reviewify"]}}}; fs.writeFileSync(p, JSON.stringify(b)+"\n")' "$TEST_ROOT/failing-budgets.json"
if node "$REPO_DIR/scripts/report-token-footprint.mjs" \
  --check \
  --budgets "$TEST_ROOT/failing-budgets.json" >/dev/null 2>&1; then
  echo "token footprint test: zero budgets incorrectly passed" >&2
  exit 1
fi

node -e 'const fs=require("node:fs"); const r=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); if (!r.pipelineChain.deduplication.startsWith("canonical resolved path")) throw new Error("wrong deduplication identity"); const paths=r.pipelineChain.files.map(x=>x.canonicalPath); for (const wanted of ["shared/interaction-gate.md","shared/artifacts.md","shared/pipeline-mode.md","pipeline/shapeify/references/weights/standard.md","pipeline/shipify/references/weights/standard.md","pipeline/reviewify/references/weights/standard.md"]) if (!paths.includes(wanted)) throw new Error(`missing full-chain input: ${wanted}`); if (r.pipelineChain.bytes <= 25000) throw new Error("chain total did not exceed entrypoint-only boundary");' "$TEST_ROOT/first.json"

printf 'Skillify token footprint tests passed.\n'
