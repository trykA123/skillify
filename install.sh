#!/usr/bin/env bash
set -euo pipefail

# Install Skillify skills into one or more harness skill directories.
# Known presets are conveniences; --target supports any current or future harness.

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS=(orientify undumbify shapeify shipify reviewify traceify promptify explainify recordify researchify librify audify)

declare -A SKILL_FAMILY=(
  [orientify]=entry
  [traceify]=entry
  [researchify]=entry
  [audify]=entry
  [undumbify]=pipeline
  [shapeify]=pipeline
  [shipify]=pipeline
  [reviewify]=pipeline
  [promptify]=teaching
  [explainify]=teaching
  [recordify]=teaching
  [librify]=memory
)

declare -A GLOBAL_DIR=(
  [universal]="$HOME/.agents/skills"
  [qwen]="$HOME/.qwen/skills"
  [claude]="$HOME/.claude/skills"
  [cursor]="$HOME/.cursor/skills"
  [opencode]="$HOME/.config/opencode/skills"
  [codex]="$HOME/.codex/skills"
  [windsurf]="$HOME/.windsurf/skills"
  [copilot]="$HOME/.copilot/skills"
)

declare -A PROJECT_DIR=(
  [universal]=".agents/skills"
  [qwen]=".qwen/skills"
  [claude]=".claude/skills"
  [cursor]=".cursor/skills"
  [opencode]=".opencode/skills"
  [codex]=".codex/skills"
  [windsurf]=".windsurf/skills"
  [copilot]=".github/copilot/skills"
)

MODE="link"
SCOPE="global"
ACTION="install"
FORCE=0
TARGET_HARNESSES=""
WITH_AGENTS=0
LIST_ONLY=0
CUSTOM_TARGETS=()

usage() {
  cat <<'EOF'
Usage: ./install.sh [options]

Targets:
  --harness NAME[,NAME]  Use one or more known harness presets
  --target DIR            Use an arbitrary skills directory; repeatable
  --all                   Use every known harness preset
  --project               Resolve presets relative to the current project

Actions:
  --copy                  Copy skill directories instead of linking them
  --uninstall             Remove managed Skillify installs from each target
  --with-agents           Also install the portable agent fleet package
  --force                 Replace or remove an unrecognized same-named entry
  --list                  List known presets
  -h, --help              Show this help
EOF
}

skill_src() {
  local skill="$1"
  local family="${SKILL_FAMILY[$skill]:-}"
  if [[ -z "$family" ]]; then
    echo "install: unknown skill '$skill'" >&2
    return 1
  fi
  printf '%s/%s/%s\n' "$REPO_DIR" "$family" "$skill"
}

detect_harnesses() {
  local harness dir parent
  for harness in "${!GLOBAL_DIR[@]}"; do
    dir="${GLOBAL_DIR[$harness]}"
    parent="$(dirname "$dir")"
    if [[ -d "$dir" || -d "$parent" ]]; then
      printf '%s\n' "$harness"
    fi
  done
}

is_managed_destination() {
  local src="$1"
  local dst="$2"
  [[ -L "$dst" && "$(readlink "$dst")" == "$src" ]] ||
    [[ -d "$dst" && -f "$dst/.skillify-managed" ]]
}

clear_destination() {
  local src="$1"
  local dst="$2"
  [[ -L "$dst" || -d "$dst" || -f "$dst" ]] || return 0

  if [[ "$FORCE" -eq 1 ]] || is_managed_destination "$src" "$dst"; then
    rm -rf "$dst"
    return 0
  fi

  echo "install: refusing to replace unrecognized destination '$dst'; inspect it, then rerun with --force" >&2
  return 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --copy) MODE="copy"; shift ;;
    --project) SCOPE="project"; shift ;;
    --uninstall) ACTION="uninstall"; shift ;;
    --force) FORCE=1; shift ;;
    --with-agents) WITH_AGENTS=1; shift ;;
    --all) TARGET_HARNESSES="all"; shift ;;
    --list) LIST_ONLY=1; shift ;;
    --harness)
      [[ $# -ge 2 ]] || { echo "install: --harness needs a comma-separated value" >&2; exit 2; }
      TARGET_HARNESSES="$2"
      shift 2
      ;;
    --target)
      [[ $# -ge 2 ]] || { echo "install: --target needs a directory" >&2; exit 2; }
      CUSTOM_TARGETS+=("$2")
      shift 2
      ;;
    -h|--help) usage; exit 0 ;;
    *) echo "install: unknown option '$1'" >&2; usage >&2; exit 2 ;;
  esac
done

if [[ "$LIST_ONLY" -eq 1 ]]; then
  printf 'Known harness presets:\n'
  printf '  %s\n' "$(printf '%s\n' "${!GLOBAL_DIR[@]}" | sort | paste -sd ' ' -)"
  printf 'Arbitrary harness: --target /path/to/its/skills-directory\n'
  exit 0
fi

HARNESSES=()
if [[ "$TARGET_HARNESSES" == "all" ]]; then
  while IFS= read -r harness; do HARNESSES+=("$harness"); done < <(printf '%s\n' "${!GLOBAL_DIR[@]}" | sort)
elif [[ -n "$TARGET_HARNESSES" ]]; then
  IFS=',' read -r -a HARNESSES <<< "$TARGET_HARNESSES"
elif [[ ${#CUSTOM_TARGETS[@]} -eq 0 ]]; then
  while IFS= read -r harness; do HARNESSES+=("$harness"); done < <(detect_harnesses | sort)
fi

declare -A TARGET_DIRS=()
for harness in "${HARNESSES[@]}"; do
  [[ -n "$harness" ]] || continue
  if [[ "$SCOPE" == "global" ]]; then
    target="${GLOBAL_DIR[$harness]:-}"
  else
    target="${PROJECT_DIR[$harness]:-}"
  fi
  if [[ -z "$target" ]]; then
    echo "install: unknown harness preset '$harness'; use --list or --target" >&2
    exit 2
  fi
  TARGET_DIRS["$target"]="$harness"
done

custom_index=0
for target in "${CUSTOM_TARGETS[@]}"; do
  [[ -n "$target" ]] || { echo "install: custom target cannot be empty" >&2; exit 2; }
  custom_index=$((custom_index + 1))
  TARGET_DIRS["$target"]="custom:$custom_index"
done

if [[ ${#TARGET_DIRS[@]} -eq 0 ]]; then
  echo "install: no harness detected; use --harness, --all, or --target" >&2
  exit 1
fi

printf 'Skillify installer\n'
printf '  mode: %s · scope: %s · action: %s\n' "$MODE" "$SCOPE" "$ACTION"

while IFS= read -r target_dir; do
  label="${TARGET_DIRS[$target_dir]}"
  printf '  target: %s (%s)\n' "$target_dir" "$label"
  mkdir -p "$target_dir"

  for skill in "${SKILLS[@]}"; do
    src="$(skill_src "$skill")"
    dst="$target_dir/$skill"
    [[ -d "$src" ]] || { echo "install: source missing for '$skill'" >&2; exit 1; }

    if [[ "$ACTION" == "uninstall" ]]; then
      if [[ -L "$dst" || -d "$dst" || -f "$dst" ]]; then
        clear_destination "$src" "$dst"
        printf '    removed %s\n' "$skill"
      fi
      continue
    fi

    clear_destination "$src" "$dst"
    if [[ "$MODE" == "link" ]]; then
      ln -s "$src" "$dst"
      printf '    linked %s\n' "$skill"
    else
      cp -r "$src" "$dst"
      printf 'managed-by=skillify\nskill=%s\n' "$skill" > "$dst/.skillify-managed"
      printf '    copied %s\n' "$skill"
    fi
  done
done < <(printf '%s\n' "${!TARGET_DIRS[@]}" | sort)

if [[ "$WITH_AGENTS" -eq 1 ]]; then
  if [[ "$SCOPE" == "project" ]]; then
    fleet_root=".agents/fleets"
  else
    fleet_root="$HOME/.agents/fleets"
  fi
  fleet_dst="$fleet_root/skillify"
  mkdir -p "$fleet_root"
  clear_destination "$REPO_DIR/agents" "$fleet_dst"
  if [[ "$ACTION" == "uninstall" ]]; then
    printf '  removed portable fleet package\n'
  elif [[ "$MODE" == "link" ]]; then
    ln -s "$REPO_DIR/agents" "$fleet_dst"
    printf '  linked portable fleet package: %s\n' "$fleet_dst"
  else
    cp -r "$REPO_DIR/agents" "$fleet_dst"
    printf 'managed-by=skillify\npackage=agents\n' > "$fleet_dst/.skillify-managed"
    printf '  copied portable fleet package: %s\n' "$fleet_dst"
  fi
fi

printf 'Done.\n'
