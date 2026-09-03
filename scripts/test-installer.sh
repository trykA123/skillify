#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/skillify-installer-test.XXXXXX")"
trap 'rm -rf -- "$TEST_ROOT"' EXIT

SKILL_TARGET="$TEST_ROOT/skills"
FLEET_TARGET="$TEST_ROOT/fleet"

mkdir -p "$TEST_ROOT/copilot-project"
(
  cd "$TEST_ROOT/copilot-project"
  "$REPO_DIR/install.sh" \
    --project \
    --harness vscode \
    --skill orientify \
    --native-agents copilot \
    --copy >/dev/null
)
[[ -f "$TEST_ROOT/copilot-project/.github/skills/orientify/SKILL.md" ]]
[[ -f "$TEST_ROOT/copilot-project/.github/agents/orchestrator.agent.md" ]]
[[ -f "$TEST_ROOT/copilot-project/.github/agents/.skillify-native.json" ]]
copilot_project_status="$(
  cd "$TEST_ROOT/copilot-project"
  "$REPO_DIR/install.sh" \
    --project \
    --harness vscode \
    --skill orientify \
    --native-agents copilot \
    --status
)"
grep -q 'fresh: 11 copilot agents' <<<"$copilot_project_status"
(
  cd "$TEST_ROOT/copilot-project"
  "$REPO_DIR/install.sh" \
    --project \
    --harness vscode \
    --skill orientify \
    --native-agents copilot \
    --uninstall >/dev/null
)
[[ ! -e "$TEST_ROOT/copilot-project/.github/skills/orientify" ]]
[[ ! -e "$TEST_ROOT/copilot-project/.github/agents/.skillify-native.json" ]]

mkdir -p "$TEST_ROOT/copilot-home"
HOME="$TEST_ROOT/copilot-home" "$REPO_DIR/install.sh" \
  --harness vscode \
  --skill orientify \
  --native-agents copilot \
  --update >/dev/null
[[ -f "$TEST_ROOT/copilot-home/.copilot/skills/orientify/SKILL.md" ]]
[[ -f "$TEST_ROOT/copilot-home/.copilot/agents/orchestrator.agent.md" ]]
copilot_status="$(HOME="$TEST_ROOT/copilot-home" "$REPO_DIR/install.sh" \
  --harness vscode \
  --skill orientify \
  --native-agents copilot \
  --status)"
grep -q 'fresh: 11 copilot agents' <<<"$copilot_status"
HOME="$TEST_ROOT/copilot-home" "$REPO_DIR/install.sh" \
  --harness vscode \
  --skill orientify \
  --native-agents copilot \
  --uninstall >/dev/null
[[ ! -e "$TEST_ROOT/copilot-home/.copilot/skills/orientify" ]]
[[ ! -e "$TEST_ROOT/copilot-home/.copilot/agents/.skillify-native.json" ]]

# Gemini receives the portable Mapify skill, including its deterministic helper.
mkdir -p "$TEST_ROOT/gemini-home"
HOME="$TEST_ROOT/gemini-home" "$REPO_DIR/install.sh" \
  --harness gemini \
  --skill mapify \
  --copy >/dev/null
[[ -f "$TEST_ROOT/gemini-home/.gemini/skills/mapify/SKILL.md" ]]
[[ -f "$TEST_ROOT/gemini-home/.gemini/skills/mapify/scripts/mapify.mjs" ]]
[[ -f "$TEST_ROOT/gemini-home/.gemini/skills/mapify/assets/graph-viewer.html" ]]
[[ -f "$TEST_ROOT/gemini-home/.gemini/skills/mapify/references/interaction-gate.md" ]]
[[ ! -L "$TEST_ROOT/gemini-home/.gemini/skills/mapify/references/interaction-gate.md" ]]

"$REPO_DIR/install.sh" \
  --target "$SKILL_TARGET" \
  --family teaching \
  --copy >/dev/null

for skill in skillify teachify; do
  [[ -f "$SKILL_TARGET/$skill/SKILL.md" ]]
  [[ -f "$SKILL_TARGET/$skill/.skillify-managed" ]]
done

status_output="$(
  "$REPO_DIR/install.sh" \
    --target "$SKILL_TARGET" \
    --family teaching \
    --status
)"
[[ "$status_output" == *"managed copy"* ]]

"$REPO_DIR/install.sh" \
  --target "$TEST_ROOT/dry-run" \
  --skill skillify \
  --dry-run >/dev/null
[[ ! -e "$TEST_ROOT/dry-run" ]]

if "$REPO_DIR/install.sh" --agents-only --agents-target / --dry-run >/dev/null 2>&1; then
  echo "installer test: unsafe fleet target was accepted" >&2
  exit 1
fi

"$REPO_DIR/install.sh" \
  --target "$SKILL_TARGET" \
  --family teaching \
  --uninstall >/dev/null

ln -s /tmp "$SKILL_TARGET/skillify"
if "$REPO_DIR/install.sh" --target "$SKILL_TARGET" --skill skillify >/dev/null 2>&1; then
  echo "installer test: unrecognized symlink was replaced without --update" >&2
  exit 1
fi

"$REPO_DIR/install.sh" \
  --target "$SKILL_TARGET" \
  --skill skillify \
  --update >/dev/null
[[ "$(readlink "$SKILL_TARGET/skillify")" == "$REPO_DIR/teaching/skillify" ]]

ln -s "$REPO_DIR/teaching/promptify" "$SKILL_TARGET/promptify"
"$REPO_DIR/install.sh" \
  --target "$SKILL_TARGET" \
  --skill teachify \
  --update >/dev/null
[[ ! -L "$SKILL_TARGET/promptify" ]]

"$REPO_DIR/install.sh" \
  --agents-only \
  --agents-target "$FLEET_TARGET" \
  --copy >/dev/null
[[ -f "$FLEET_TARGET/manifest.json" ]]
[[ -f "$FLEET_TARGET/.skillify-managed" ]]

"$REPO_DIR/install.sh" \
  --agents-only \
  --agents-target "$FLEET_TARGET" \
  --uninstall >/dev/null
[[ ! -e "$FLEET_TARGET" ]]

# Ordinary single-skill installs remain standalone and do not invoke pipeline ceremony.
PIPELINE_TARGET="$TEST_ROOT/pipeline"
partial_warning="$("$REPO_DIR/install.sh" --target "$PIPELINE_TARGET" --skill shipify --dry-run 2>&1)"
if grep -qi 'pipeline.*warning\|warning.*pipeline\|needs --with-agents' <<<"$partial_warning"; then
  echo "installer test: standalone shipify emitted a pipeline warning" >&2
  exit 1
fi

# The explicit profile owns completeness and defaults to exactly the four core stages.
profile_output="$("$REPO_DIR/install.sh" --target "$PIPELINE_TARGET" --profile pipeline --dry-run 2>&1)"
grep -q 'profile: pipeline' <<<"$profile_output"
grep -q 'skills: undumbify,shapeify,shipify,reviewify' <<<"$profile_output"
grep -q 'pipeline profile has no portable agent package' <<<"$profile_output"
if "$REPO_DIR/install.sh" --target "$PIPELINE_TARGET" --profile pipeline --exclude reviewify --dry-run >/dev/null 2>&1; then
  echo "installer test: pipeline profile accepted an excluded core stage" >&2
  exit 1
fi

# Pipeline copy dereferences shared symlinks into real files.
"$REPO_DIR/install.sh" \
  --target "$PIPELINE_TARGET" \
  --profile pipeline \
  --copy >/dev/null
for skill in undumbify shapeify shipify reviewify; do
  [[ -f "$PIPELINE_TARGET/$skill/SKILL.md" ]]
done
[[ -f "$PIPELINE_TARGET/shipify/references/artifacts.md" ]]
[[ ! -L "$PIPELINE_TARGET/shipify/references/artifacts.md" ]]
[[ -f "$PIPELINE_TARGET/shipify/references/pipeline-mode.md" ]]
grep -q 'Pipeline artifacts' "$PIPELINE_TARGET/shipify/references/artifacts.md"

# Copy mode refuses any source symlink outside the allowlisted shared contracts.
UNSAFE_REPO="$TEST_ROOT/unsafe-repo"
mkdir -p "$UNSAFE_REPO/pipeline"
cp "$REPO_DIR/install.sh" "$UNSAFE_REPO/install.sh"
cp -a "$REPO_DIR/pipeline/shipify" "$UNSAFE_REPO/pipeline/shipify"
cp -a "$REPO_DIR/shared" "$UNSAFE_REPO/shared"
ln -s /etc/passwd "$UNSAFE_REPO/pipeline/shipify/references/unknown.md"
if "$UNSAFE_REPO/install.sh" --target "$TEST_ROOT/unsafe-target" --skill shipify --copy >/dev/null 2>&1; then
  echo "installer test: unsafe external source symlink was accepted" >&2
  exit 1
fi
[[ ! -e "$TEST_ROOT/unsafe-target/shipify/references/unknown.md" ]]

printf 'Skillify installer tests passed.\n'
