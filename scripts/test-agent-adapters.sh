#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/skillify-agent-test.XXXXXX")"
trap 'rm -rf -- "$TEST_ROOT"' EXIT

agent_extension() {
  case "$1" in
    codex) printf toml ;;
    copilot) printf agent.md ;;
    *) printf md ;;
  esac
}

for harness in codex claude opencode copilot; do
  target="$TEST_ROOT/$harness"
  node "$REPO_DIR/scripts/render-agents.mjs" \
    --harness "$harness" \
    --dest "$target" >/dev/null
  node "$REPO_DIR/scripts/render-agents.mjs" \
    --harness "$harness" \
    --dest "$target" \
    --check >/dev/null
  extension="$(agent_extension "$harness")"
  [[ -f "$target/teacher.$extension" ]]
  [[ "$(find "$target" -maxdepth 1 -type f ! -name '.skillify-native.json' | wc -l)" -eq 10 ]]
  worker_file="$target/worker.$extension"
  grep -q 'Shared contract: handoff' "$worker_file"
  worker_body="$(sed -n '/^---$/,$p' "$worker_file" | sed '1d')"
  if grep -q 'Shared contract: selection' <<<"$worker_body" || grep -q 'Shared contract: customization' <<<"$worker_body"; then
    echo "agent adapter test: delegated $harness worker contains root interaction contracts" >&2
    exit 1
  fi
  if [[ "$harness" == claude ]]; then
    grep -q '^initialPrompt: |-$' "$worker_file"
    grep -q 'Interactive root contract: selection' "$worker_file"
    grep -q 'Interactive root contract: customization' "$worker_file"
  fi
  if [[ "$harness" == opencode ]]; then
    grep -q 'Shared contract: selection' "$target/questar.md"
    grep -q 'Shared contract: customization' "$target/teacher.md"
  fi
  if [[ "$harness" == copilot ]]; then
    grep -q '^target: vscode$' "$worker_file"
    grep -q '^user-invocable: false$' "$worker_file"
    grep -q '^tools: \["edit","execute","read","search"\]$' "$worker_file"
    grep -q '^tools: \["edit","read","search","web"\]$' "$target/researcher.agent.md"
    orchestrator_file="$target/orchestrator.agent.md"
    grep -q '^user-invocable: true$' "$orchestrator_file"
    grep -q '^disable-model-invocation: true$' "$orchestrator_file"
    grep -q '^agents: \["\*"\]$' "$orchestrator_file"
    grep -q 'Shared contract: selection' "$orchestrator_file"
    grep -q 'Shared contract: customization' "$orchestrator_file"
  fi
  node "$REPO_DIR/scripts/render-agents.mjs" \
    --harness "$harness" \
    --dest "$target" \
    --uninstall >/dev/null
  [[ ! -e "$target/.skillify-native.json" ]]
done

legacy_fleet="$TEST_ROOT/legacy-fleet"
cp -R "$REPO_DIR/agents" "$legacy_fleet"
node -e 'const fs=require("node:fs"); const p=process.argv[1]; const m=JSON.parse(fs.readFileSync(p)); delete m.contractProfiles; fs.writeFileSync(p, JSON.stringify(m, null, 2)+"\n")' "$legacy_fleet/manifest.json"
node "$REPO_DIR/scripts/render-agents.mjs" \
  --harness codex \
  --fleet "$legacy_fleet" \
  --dest "$TEST_ROOT/legacy-codex" >/dev/null
grep -q 'Shared contract: selection' "$TEST_ROOT/legacy-codex/worker.toml"

if node "$REPO_DIR/scripts/render-agents.mjs" \
  --harness codex \
  --dest / \
  --dry-run >/dev/null 2>&1; then
  echo "agent adapter test: unsafe destination was accepted" >&2
  exit 1
fi

printf 'Skillify native agent adapter tests passed.\n'
