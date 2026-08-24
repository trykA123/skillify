#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/skillify-installer-test.XXXXXX")"
trap 'rm -rf -- "$TEST_ROOT"' EXIT

SKILL_TARGET="$TEST_ROOT/skills"
FLEET_TARGET="$TEST_ROOT/fleet"

"$REPO_DIR/install.sh" \
  --target "$SKILL_TARGET" \
  --family teaching \
  --exclude recordify \
  --copy >/dev/null

for skill in promptify explainify skillify; do
  [[ -f "$SKILL_TARGET/$skill/SKILL.md" ]]
  [[ -f "$SKILL_TARGET/$skill/.skillify-managed" ]]
done
[[ ! -e "$SKILL_TARGET/recordify" ]]

status_output="$(
  "$REPO_DIR/install.sh" \
    --target "$SKILL_TARGET" \
    --family teaching \
    --exclude recordify \
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
  --exclude recordify \
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

printf 'Skillify installer tests passed.\n'
