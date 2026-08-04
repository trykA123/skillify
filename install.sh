#!/usr/bin/env bash
set -euo pipefail

# install.sh — Symlink skillify skills into AI coding harnesses
#
# Usage:
#   ./install.sh              # auto-detect harnesses, symlink globally
#   ./install.sh --copy       # copy instead of symlink
#   ./install.sh --harness qwen,claude  # target specific harnesses
#   ./install.sh --project    # install to current project (not global)
#   ./install.sh --uninstall  # remove symlinks/copies
#
# The repo is the single source of truth. Symlinks mean `git pull` updates
# all harnesses at once.
#
# Skills live in family folders (entry/ pipeline/) — the SKILL_FAMILY map
# resolves name → family. Harness destinations stay FLAT by skill name
# (<harness-dir>/<skill-name>/SKILL.md); the family nesting never leaks out
# of the repo. An unknown skill name fails loudly instead of silent-skipping.

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS=(orientify explorify undumbify shapeify shipify reviewify traceify)

# name → family (mirrors the repo tree and the docs-site taxonomy)
declare -A SKILL_FAMILY=(
  [orientify]=entry
  [explorify]=entry
  [traceify]=entry
  [undumbify]=pipeline
  [shapeify]=pipeline
  [shipify]=pipeline
  [reviewify]=pipeline
)

# Resolve a skill name to its in-repo dir; fail loudly on an unknown name.
skill_src() {
  local skill="$1"
  local family="${SKILL_FAMILY[$skill]:-}"
  if [[ -z "$family" ]]; then
    echo "  [error] $skill — unknown skill name (missing from SKILL_FAMILY)" >&2
    exit 1
  fi
  echo "$REPO_DIR/$family/$skill"
}

MODE="link"
SCOPE="global"
ACTION="install"
TARGET_HARNESSES=""

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --copy) MODE="copy"; shift ;;
    --project) SCOPE="project"; shift ;;
    --uninstall) ACTION="uninstall"; shift ;;
    --harness) TARGET_HARNESSES="$2"; shift 2 ;;
    -h|--help)
      head -12 "$0" | tail -10
      exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Harness definitions: name | global_dir | project_dir | type (dir|file)
# type=dir means the harness expects <dir>/<skill-name>/SKILL.md
# type=file means the harness expects <dir>/<skill-name>.md (single file)
declare -A HARNESS_GLOBAL_DIR=(
  [qwen]="$HOME/.qwen/skills"
  [claude]="$HOME/.claude/skills"
  [cursor]="$HOME/.cursor/skills"
  [opencode]="$HOME/.config/opencode/skills"
  [codex]="$HOME/.codex/skills"
  [windsurf]="$HOME/.windsurf/skills"
  [copilot]="$HOME/.copilot/skills"
)

declare -A HARNESS_PROJECT_DIR=(
  [qwen]=".qwen/skills"
  [claude]=".claude/skills"
  [cursor]=".cursor/skills"
  [opencode]=".opencode/skills"
  [codex]=".codex/skills"
  [windsurf]=".windsurf/skills"
  [copilot]=".github/copilot/skills"
)

# All harnesses use dir type (skill-name/SKILL.md)
HARNESS_TYPE="dir"

# Detect installed harnesses
detect_harnesses() {
  local detected=()
  for h in "${!HARNESS_GLOBAL_DIR[@]}"; do
    local dir="${HARNESS_GLOBAL_DIR[$h]}"
    local parent="$(dirname "$dir")"
    if [[ -d "$parent" ]] || [[ -d "$dir" ]]; then
      detected+=("$h")
    fi
  done
  echo "${detected[@]}"
}

# Resolve target harnesses
if [[ -n "$TARGET_HARNESSES" ]]; then
  IFS=',' read -ra HARNESSES <<< "$TARGET_HARNESSES"
else
  read -ra HARNESSES <<< "$(detect_harnesses)"
fi

if [[ ${#HARNESSES[@]} -eq 0 ]]; then
  echo "No harnesses detected. Use --harness to specify manually."
  echo "Supported: ${!HARNESS_GLOBAL_DIR[*]}"
  exit 1
fi

echo "Skillify installer"
echo "  Repo:    $REPO_DIR"
echo "  Mode:    $MODE"
echo "  Scope:   $SCOPE"
echo "  Action:  $ACTION"
echo "  Targets: ${HARNESSES[*]}"
echo ""

for h in "${HARNESSES[@]}"; do
  if [[ "$SCOPE" == "global" ]]; then
    target_dir="${HARNESS_GLOBAL_DIR[$h]:-}"
  else
    target_dir="${HARNESS_PROJECT_DIR[$h]:-}"
  fi

  if [[ -z "$target_dir" ]]; then
    echo "  [skip] $h — unknown harness"
    continue
  fi

  if [[ "$ACTION" == "uninstall" ]]; then
    for skill in "${SKILLS[@]}"; do
      local_path="$target_dir/$skill"
      if [[ -L "$local_path" ]] || [[ -d "$local_path" ]] || [[ -f "$local_path" ]]; then
        rm -rf "$local_path"
        echo "  [removed] $h/$skill"
      fi
    done
    continue
  fi

  # Create target dir if needed
  mkdir -p "$target_dir"

  for skill in "${SKILLS[@]}"; do
    src="$(skill_src "$skill")"
    dst="$target_dir/$skill"

    if [[ ! -d "$src" ]]; then
      echo "  [skip] $skill — not found in repo"
      continue
    fi

    # Remove existing
    if [[ -L "$dst" ]] || [[ -d "$dst" ]] || [[ -f "$dst" ]]; then
      rm -rf "$dst"
    fi

    if [[ "$MODE" == "link" ]]; then
      ln -s "$src" "$dst"
      echo "  [linked] $h/$skill → $src"
    else
      cp -r "$src" "$dst"
      echo "  [copied] $h/$skill"
    fi
  done
done

echo ""
echo "Done. Skills: ${SKILLS[*]}"
if [[ "$MODE" == "link" ]]; then
  echo "Symlinked — git pull in $REPO_DIR updates all harnesses."
else
  echo "Copied — re-run ./install.sh --copy after git pull to update."
fi
