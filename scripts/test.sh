#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT="$(mktemp -d "${TMPDIR:-/tmp}/skillify-test.XXXXXX")"
trap 'rm -rf -- "$ROOT"' EXIT
fail() { echo "test: $*" >&2; exit 1; }
SKILL_COUNT="$(find "$REPO_DIR/skills" -mindepth 1 -maxdepth 1 -type d | wc -l)"
AGENT_COUNT="$(find "$REPO_DIR/agents" -maxdepth 1 -name '*.md' | wc -l)"

T="$ROOT/skills"
mkdir -p "$T"
ln -s "$REPO_DIR/entry/mapify" "$T/mapify"
mkdir "$T/foreign"
"$REPO_DIR/install.sh" --target "$T" --update >/dev/null
[[ ! -e "$T/mapify" && ! -L "$T/mapify" ]] || fail "retired link survived"
[[ -d "$T/foreign" ]] || fail "unmanaged entry removed"
[[ "$(find "$T" -maxdepth 1 -type l | wc -l)" -eq "$SKILL_COUNT" ]] || fail "wrong link count"
[[ -f "$T/shipify/references/tests.md" ]] || fail "shipify references missing"

mkdir -p "$ROOT/c/traceify"
if "$REPO_DIR/install.sh" --target "$ROOT/c" --copy >/dev/null 2>&1; then fail "overwrote unmanaged directory"; fi
rm -rf "$ROOT/c"
"$REPO_DIR/install.sh" --target "$ROOT/c" --copy --skill traceify,teachify >/dev/null
[[ -f "$ROOT/c/teachify/scripts/validate-lesson.mjs" && -f "$ROOT/c/traceify/.skillify-managed" ]] || fail "copy incomplete"
"$REPO_DIR/install.sh" --target "$ROOT/c" --uninstall >/dev/null
[[ -z "$(ls -A "$ROOT/c")" ]] || fail "uninstall left entries"

mkdir -p "$ROOT/project"
(cd "$ROOT/project" && "$REPO_DIR/install.sh" --project --harness vscode --native-agents copilot --copy >/dev/null)
[[ -f "$ROOT/project/.github/skills/orientify/SKILL.md" ]] || fail "project skills missing"
[[ -f "$ROOT/project/.github/agents/worker.agent.md" ]] || fail "project agents missing"

for harness in claude codex opencode copilot; do
  D="$ROOT/agents-$harness"
  mkdir -p "$D"
  printf 'stale\n' > "$D/.keep"
  node "$REPO_DIR/scripts/render-agents.mjs" --harness "$harness" --dest "$D" >/dev/null
  node "$REPO_DIR/scripts/render-agents.mjs" --harness "$harness" --dest "$D" --check >/dev/null
  [[ "$(find "$D" -maxdepth 1 -type f ! -name '.skillify-native.json' ! -name .keep | wc -l)" -eq "$AGENT_COUNT" ]] || fail "$harness agent count"
  printf '\nedited\n' >> "$(find "$D" -maxdepth 1 -name 'scout*' | head -1)"
  if node "$REPO_DIR/scripts/render-agents.mjs" --harness "$harness" --dest "$D" >/dev/null 2>&1; then fail "$harness overwrote an edited agent"; fi
  node "$REPO_DIR/scripts/render-agents.mjs" --harness "$harness" --dest "$D" --uninstall --force >/dev/null
  [[ ! -e "$D/.skillify-native.json" ]] || fail "$harness uninstall"
done

node "$REPO_DIR/scripts/render-agents.mjs" --harness claude --dest "$ROOT/cl" >/dev/null
grep -q '^tools: Bash, Glob, Grep, Read$' "$ROOT/cl/reviewer.md" || fail "claude reviewer tools"
grep -q 'Edit' "$ROOT/cl/worker.md" || fail "claude worker cannot edit"
node "$REPO_DIR/scripts/render-agents.mjs" --harness codex --dest "$ROOT/cx" >/dev/null
grep -q '^sandbox_mode = "read-only"$' "$ROOT/cx/scout.toml" || fail "codex scout sandbox"
! grep -q sandbox_mode "$ROOT/cx/worker.toml" || fail "codex worker sandbox"
node "$REPO_DIR/scripts/render-agents.mjs" --harness opencode --dest "$ROOT/oc" >/dev/null
grep -q '  edit: deny' "$ROOT/oc/reviewer.md" || fail "opencode reviewer permission"
if node "$REPO_DIR/scripts/render-agents.mjs" --harness codex --dest / --dry-run >/dev/null 2>&1; then fail "unsafe destination accepted"; fi

node "$REPO_DIR/scripts/run-evals.mjs" --adapter fixture >/dev/null || fail "eval runner"
node "$REPO_DIR/skills/teachify/scripts/validate-lesson.mjs" "$REPO_DIR/skills/teachify/assets/lesson-template.html" >/dev/null
echo "all tests passed"
