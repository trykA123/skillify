#!/usr/bin/env bash
set -euo pipefail

# Install Skillify skills into one or more agent skill directories.
# Presets are runtime adapters only; --target supports any compatible harness.

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_BASE="${XDG_CONFIG_HOME:-$HOME/.config}"
CODEX_BASE="${CODEX_HOME:-$HOME/.codex}"
CLAUDE_BASE="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"

SKILLS=(orientify undumbify shapeify shipify reviewify traceify skillify teachify researchify audify)
RETIRED_SKILLS=(promptify explainify recordify librify)

declare -A SKILL_FAMILY=(
  [orientify]=entry
  [traceify]=entry
  [researchify]=entry
  [audify]=entry
  [undumbify]=pipeline
  [shapeify]=pipeline
  [shipify]=pipeline
  [reviewify]=pipeline
  [skillify]=teaching
  [teachify]=teaching
)

declare -A NATIVE_AGENT_GLOBAL_DIR=(
  [codex]="$CODEX_BASE/agents"
  [claude]="$CLAUDE_BASE/agents"
  [opencode]="$CONFIG_BASE/opencode/agents"
)

declare -A NATIVE_AGENT_PROJECT_DIR=(
  [codex]=".codex/agents"
  [claude]=".claude/agents"
  [opencode]=".opencode/agents"
)

# Paths track current public agent conventions. Use --target when a runtime moves or
# when a local installation uses a non-standard configuration root.
declare -A GLOBAL_DIR=(
  [universal]="$HOME/.agents/skills"
  [aider-desk]="$HOME/.aider-desk/skills"
  [amp]="$CONFIG_BASE/agents/skills"
  [augment]="$HOME/.augment/skills"
  [claude]="$CLAUDE_BASE/skills"
  [cline]="$HOME/.agents/skills"
  [codex]="$CODEX_BASE/skills"
  [continue]="$HOME/.continue/skills"
  [crush]="$CONFIG_BASE/crush/skills"
  [cursor]="$HOME/.cursor/skills"
  [droid]="$HOME/.factory/skills"
  [gemini]="$HOME/.gemini/skills"
  [copilot]="$HOME/.copilot/skills"
  [goose]="$CONFIG_BASE/goose/skills"
  [kilo]="$HOME/.kilocode/skills"
  [opencode]="$CONFIG_BASE/opencode/skills"
  [openhands]="$HOME/.openhands/skills"
  [qwen]="$HOME/.qwen/skills"
  [roo]="$HOME/.roo/skills"
  [trae]="$HOME/.trae/skills"
  [windsurf]="$HOME/.codeium/windsurf/skills"
  [zed]="$HOME/.agents/skills"
)

declare -A PROJECT_DIR=(
  [universal]=".agents/skills"
  [aider-desk]=".aider-desk/skills"
  [amp]=".agents/skills"
  [augment]=".augment/skills"
  [claude]=".claude/skills"
  [cline]=".agents/skills"
  [codex]=".codex/skills"
  [continue]=".continue/skills"
  [crush]=".crush/skills"
  [cursor]=".cursor/skills"
  [droid]=".factory/skills"
  [gemini]=".agents/skills"
  [copilot]=".github/copilot/skills"
  [goose]=".goose/skills"
  [kilo]=".kilocode/skills"
  [opencode]=".opencode/skills"
  [openhands]=".openhands/skills"
  [qwen]=".qwen/skills"
  [roo]=".roo/skills"
  [trae]=".trae/skills"
  [windsurf]=".windsurf/skills"
  [zed]=".agents/skills"
)

declare -A DETECT_DIR=(
  [universal]="$HOME/.agents"
  [aider-desk]="$HOME/.aider-desk"
  [amp]="$CONFIG_BASE/amp"
  [augment]="$HOME/.augment"
  [claude]="$CLAUDE_BASE"
  [cline]="$HOME/.cline"
  [codex]="$CODEX_BASE"
  [continue]="$HOME/.continue"
  [crush]="$CONFIG_BASE/crush"
  [cursor]="$HOME/.cursor"
  [droid]="$HOME/.factory"
  [gemini]="$HOME/.gemini"
  [copilot]="$HOME/.copilot"
  [goose]="$CONFIG_BASE/goose"
  [kilo]="$HOME/.kilocode"
  [opencode]="$CONFIG_BASE/opencode"
  [openhands]="$HOME/.openhands"
  [qwen]="$HOME/.qwen"
  [roo]="$HOME/.roo"
  [trae]="$HOME/.trae"
  [windsurf]="$HOME/.codeium/windsurf"
  [zed]="$CONFIG_BASE/zed"
)

declare -A HARNESS_ALIAS=(
  [claude-code]=claude
  [gemini-cli]=gemini
  [github-copilot]=copilot
  [qwen-code]=qwen
  [roo-code]=roo
)

MODE="link"
SCOPE="global"
ACTION="install"
FORCE=0
REPLACE_LINKS=0
WITH_AGENTS=0
AGENTS_ONLY=0
DRY_RUN=0
LIST_TARGETS=0
LIST_SKILLS=0
AGENTS_TARGET=""
HARNESS_REQUESTS=()
CUSTOM_TARGETS=()
SKILL_REQUESTS=()
FAMILY_REQUESTS=()
EXCLUSIONS=()
NATIVE_AGENT_REQUESTS=()

usage() {
  cat <<'EOF'
Usage: ./install.sh [options]

Targets:
  --harness NAME[,NAME]  Install to one or more known harness presets; repeatable
  --target DIR            Install to an arbitrary skill directory; repeatable
  --all                   Install to every known harness preset
  --project               Use project-local preset paths instead of global paths
  --agents-target DIR     Override the portable fleet package destination

Selection:
  --skill NAME[,NAME]     Install only named skills; repeatable
  --family NAME[,NAME]    Install only entry, pipeline, or teaching
  --exclude NAME[,NAME]   Exclude named skills from the selection
  --with-agents           Also install the portable agent fleet package
  --agents-only           Install only the portable agent fleet package
  --native-agents NAMES   Generate native agents for codex, claude, or opencode

Actions and safety:
  --link                  Create symlinks into this checkout (default)
  --copy                  Copy independent skill directories
  --update                Refresh managed copies and safely replace same-name symlinks
  --uninstall             Remove managed Skillify entries
  --status                Inspect selected destinations without changing them
  --dry-run               Print intended mutations without changing anything
  --force                 Replace an unrecognized same-name file or directory

Discovery:
  --list                  List harness presets, aliases, and resolved paths
  --list-skills           List skills and families
  -h, --help              Show this help

Examples:
  ./install.sh --harness claude,opencode
  ./install.sh --harness codex --skill traceify,shipify --update
  ./install.sh --project --family pipeline --exclude reviewify --copy
  ./install.sh --target /path/to/skills --dry-run
  ./install.sh --harness claude,opencode --status
  ./install.sh --harness codex,claude,opencode --native-agents codex,claude,opencode --update
EOF
}

append_csv() {
  local array_name="$1"
  local value="$2"
  local -n destination="$array_name"
  local items=()
  local item
  IFS=',' read -r -a items <<< "$value"
  for item in "${items[@]}"; do
    [[ -n "$item" ]] || continue
    destination+=("$item")
  done
}

canonical_harness() {
  local requested="$1"
  printf '%s\n' "${HARNESS_ALIAS[$requested]:-$requested}"
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

list_targets() {
  local harness
  printf '%-16s %-38s %s\n' "PRESET" "GLOBAL" "PROJECT"
  while IFS= read -r harness; do
    printf '%-16s %-38s %s\n' "$harness" "${GLOBAL_DIR[$harness]}" "${PROJECT_DIR[$harness]}"
  done < <(printf '%s\n' "${!GLOBAL_DIR[@]}" | sort)
  printf '\nAliases:\n'
  while IFS= read -r harness; do
    printf '  %-16s -> %s\n' "$harness" "${HARNESS_ALIAS[$harness]}"
  done < <(printf '%s\n' "${!HARNESS_ALIAS[@]}" | sort)
  printf '\nAny compatible runtime: --target /path/to/skills\n'
}

list_skills() {
  local skill
  printf '%-16s %s\n' "SKILL" "FAMILY"
  for skill in "${SKILLS[@]}"; do
    printf '%-16s %s\n' "$skill" "${SKILL_FAMILY[$skill]}"
  done
}

detect_harnesses() {
  local harness
  while IFS= read -r harness; do
    [[ -d "${DETECT_DIR[$harness]}" ]] && printf '%s\n' "$harness"
  done < <(printf '%s\n' "${!DETECT_DIR[@]}" | sort)
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

  if [[ "$FORCE" -eq 1 ]] || is_managed_destination "$src" "$dst" ||
     [[ "$REPLACE_LINKS" -eq 1 && -L "$dst" ]]; then
    if [[ "$DRY_RUN" -eq 1 ]]; then
      printf '    would remove %s\n' "$dst"
    else
      rm -rf -- "$dst"
    fi
    return 0
  fi

  echo "install: refusing to replace unrecognized destination '$dst'; inspect it, then use --update for a same-name symlink or --force for any entry" >&2
  return 1
}

destination_status() {
  local src="$1"
  local dst="$2"
  if [[ -L "$dst" ]]; then
    if [[ "$(readlink "$dst")" == "$src" ]]; then
      printf 'current link'
    else
      printf 'other link -> %s' "$(readlink "$dst")"
    fi
  elif [[ -d "$dst" && -f "$dst/.skillify-managed" ]]; then
    printf 'managed copy'
  elif [[ -e "$dst" ]]; then
    printf 'unrecognized entry'
  else
    printf 'not installed'
  fi
}

validate_fleet_target() {
  local target="$1"
  while [[ "$target" != "/" && "$target" == */ ]]; do target="${target%/}"; done
  case "$target" in
    ""|"/"|"."|".."|"$HOME"|"$REPO_DIR")
      echo "install: refusing unsafe fleet target '$1'" >&2
      return 1
      ;;
  esac
}

cleanup_retired_skills() {
  local target_dir="$1"
  local retired dst link
  for retired in "${RETIRED_SKILLS[@]}"; do
    dst="$target_dir/$retired"
    if [[ -L "$dst" ]]; then
      link="$(readlink "$dst")"
      if [[ "$link" == "$REPO_DIR/"* ]]; then
        if [[ "$DRY_RUN" -eq 1 ]]; then printf '    would remove retired %s\n' "$retired"; else rm -- "$dst"; fi
      fi
    elif [[ -d "$dst" && -f "$dst/.skillify-managed" ]]; then
      if [[ "$DRY_RUN" -eq 1 ]]; then printf '    would remove retired %s\n' "$retired"; else rm -rf -- "$dst"; fi
    fi
  done
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --link) MODE="link"; shift ;;
    --copy) MODE="copy"; shift ;;
    --project) SCOPE="project"; shift ;;
    --uninstall) ACTION="uninstall"; shift ;;
    --status) ACTION="status"; shift ;;
    --update) REPLACE_LINKS=1; shift ;;
    --force) FORCE=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    --with-agents) WITH_AGENTS=1; shift ;;
    --agents-only) AGENTS_ONLY=1; WITH_AGENTS=1; shift ;;
    --native-agents)
      [[ $# -ge 2 ]] || { echo "install: --native-agents needs a comma-separated value" >&2; exit 2; }
      append_csv NATIVE_AGENT_REQUESTS "$2"
      shift 2
      ;;
    --all) HARNESS_REQUESTS=(all); shift ;;
    --list) LIST_TARGETS=1; shift ;;
    --list-skills) LIST_SKILLS=1; shift ;;
    --harness)
      [[ $# -ge 2 ]] || { echo "install: --harness needs a comma-separated value" >&2; exit 2; }
      append_csv HARNESS_REQUESTS "$2"
      shift 2
      ;;
    --target)
      [[ $# -ge 2 ]] || { echo "install: --target needs a directory" >&2; exit 2; }
      CUSTOM_TARGETS+=("$2")
      shift 2
      ;;
    --agents-target)
      [[ $# -ge 2 ]] || { echo "install: --agents-target needs a directory" >&2; exit 2; }
      AGENTS_TARGET="$2"
      shift 2
      ;;
    --skill)
      [[ $# -ge 2 ]] || { echo "install: --skill needs a comma-separated value" >&2; exit 2; }
      append_csv SKILL_REQUESTS "$2"
      shift 2
      ;;
    --family)
      [[ $# -ge 2 ]] || { echo "install: --family needs a comma-separated value" >&2; exit 2; }
      append_csv FAMILY_REQUESTS "$2"
      shift 2
      ;;
    --exclude)
      [[ $# -ge 2 ]] || { echo "install: --exclude needs a comma-separated value" >&2; exit 2; }
      append_csv EXCLUSIONS "$2"
      shift 2
      ;;
    -h|--help) usage; exit 0 ;;
    *) echo "install: unknown option '$1'" >&2; usage >&2; exit 2 ;;
  esac
done

if [[ "$LIST_TARGETS" -eq 1 ]]; then
  list_targets
fi
if [[ "$LIST_SKILLS" -eq 1 ]]; then
  [[ "$LIST_TARGETS" -eq 0 ]] || printf '\n'
  list_skills
fi
if [[ "$LIST_TARGETS" -eq 1 || "$LIST_SKILLS" -eq 1 ]]; then
  exit 0
fi

declare -A REQUESTED_SKILLS=()
declare -A EXCLUDED_SKILLS=()
skill=""
family=""

for skill in "${EXCLUSIONS[@]}"; do
  [[ -n "${SKILL_FAMILY[$skill]:-}" ]] || { echo "install: unknown excluded skill '$skill'" >&2; exit 2; }
  EXCLUDED_SKILLS["$skill"]=1
done

if [[ ${#SKILL_REQUESTS[@]} -eq 0 && ${#FAMILY_REQUESTS[@]} -eq 0 ]]; then
  for skill in "${SKILLS[@]}"; do REQUESTED_SKILLS["$skill"]=1; done
else
  for skill in "${SKILL_REQUESTS[@]}"; do
    [[ -n "${SKILL_FAMILY[$skill]:-}" ]] || { echo "install: unknown skill '$skill'" >&2; exit 2; }
    REQUESTED_SKILLS["$skill"]=1
  done
  for family in "${FAMILY_REQUESTS[@]}"; do
    [[ "$family" =~ ^(entry|pipeline|teaching)$ ]] || { echo "install: unknown family '$family'" >&2; exit 2; }
    for skill in "${SKILLS[@]}"; do
      [[ "${SKILL_FAMILY[$skill]}" == "$family" ]] && REQUESTED_SKILLS["$skill"]=1
    done
  done
fi

ACTIVE_SKILLS=()
for skill in "${SKILLS[@]}"; do
  if [[ -n "${REQUESTED_SKILLS[$skill]:-}" && -z "${EXCLUDED_SKILLS[$skill]:-}" ]]; then
    ACTIVE_SKILLS+=("$skill")
  fi
done
if [[ "$AGENTS_ONLY" -eq 0 && ${#ACTIVE_SKILLS[@]} -eq 0 ]]; then
  echo "install: skill selection is empty" >&2
  exit 2
fi

if [[ ${#HARNESS_REQUESTS[@]} -eq 0 && ${#CUSTOM_TARGETS[@]} -eq 0 && "$AGENTS_ONLY" -eq 0 ]]; then
  while IFS= read -r harness; do HARNESS_REQUESTS+=("$harness"); done < <(detect_harnesses)
fi

if [[ ${#HARNESS_REQUESTS[@]} -eq 1 && "${HARNESS_REQUESTS[0]}" == "all" ]]; then
  HARNESS_REQUESTS=()
  while IFS= read -r harness; do HARNESS_REQUESTS+=("$harness"); done < <(printf '%s\n' "${!GLOBAL_DIR[@]}" | sort)
fi

declare -A TARGET_DIRS=()
for requested in "${HARNESS_REQUESTS[@]}"; do
  harness="$(canonical_harness "$requested")"
  if [[ "$SCOPE" == "global" ]]; then
    target="${GLOBAL_DIR[$harness]:-}"
  else
    target="${PROJECT_DIR[$harness]:-}"
  fi
  if [[ -z "$target" ]]; then
    echo "install: unknown harness preset '$requested'; use --list or --target" >&2
    exit 2
  fi
  if [[ -n "${TARGET_DIRS[$target]:-}" && ",${TARGET_DIRS[$target]}," != *",$harness,"* ]]; then
    TARGET_DIRS["$target"]="${TARGET_DIRS[$target]},$harness"
  else
    TARGET_DIRS["$target"]="$harness"
  fi
done

custom_index=0
for target in "${CUSTOM_TARGETS[@]}"; do
  [[ -n "$target" ]] || { echo "install: custom target cannot be empty" >&2; exit 2; }
  custom_index=$((custom_index + 1))
  if [[ -n "${TARGET_DIRS[$target]:-}" ]]; then
    TARGET_DIRS["$target"]="${TARGET_DIRS[$target]},custom:$custom_index"
  else
    TARGET_DIRS["$target"]="custom:$custom_index"
  fi
done

if [[ ${#TARGET_DIRS[@]} -eq 0 && "$AGENTS_ONLY" -eq 0 ]]; then
  echo "install: no harness detected; use --harness, --all, or --target" >&2
  exit 1
fi

printf 'Skillify installer\n'
printf '  mode: %s · scope: %s · action: %s' "$MODE" "$SCOPE" "$ACTION"
[[ "$DRY_RUN" -eq 0 ]] || printf ' · dry-run'
printf '\n'
if [[ "$AGENTS_ONLY" -eq 0 ]]; then
  printf '  skills: %s\n' "$(IFS=,; printf '%s' "${ACTIVE_SKILLS[*]}")"
fi

if [[ "$AGENTS_ONLY" -eq 0 ]]; then
  while IFS= read -r target_dir; do
    label="${TARGET_DIRS[$target_dir]}"
    printf '  target: %s (%s)\n' "$target_dir" "$label"

    if [[ "$ACTION" == "install" && "$DRY_RUN" -eq 0 ]]; then
      mkdir -p "$target_dir"
    fi
    if [[ "$ACTION" == "install" ]]; then cleanup_retired_skills "$target_dir"; fi

    for skill in "${ACTIVE_SKILLS[@]}"; do
      src="$(skill_src "$skill")"
      dst="$target_dir/$skill"
      [[ -d "$src" ]] || { echo "install: source missing for '$skill'" >&2; exit 1; }

      if [[ "$ACTION" == "status" ]]; then
        printf '    %-16s %s\n' "$skill" "$(destination_status "$src" "$dst")"
        continue
      fi

      if [[ "$ACTION" == "uninstall" ]]; then
        if [[ -L "$dst" || -d "$dst" || -f "$dst" ]]; then
          clear_destination "$src" "$dst"
          [[ "$DRY_RUN" -eq 1 ]] || printf '    removed %s\n' "$skill"
        fi
        continue
      fi

      clear_destination "$src" "$dst"
      if [[ "$DRY_RUN" -eq 1 ]]; then
        printf '    would %s %s\n' "$MODE" "$skill"
      elif [[ "$MODE" == "link" ]]; then
        ln -s "$src" "$dst"
        printf '    linked %s\n' "$skill"
      else
        cp -R "$src" "$dst"
        printf 'managed-by=skillify\nskill=%s\nsource=%s\n' "$skill" "$src" > "$dst/.skillify-managed"
        printf '    copied %s\n' "$skill"
      fi
    done
  done < <(printf '%s\n' "${!TARGET_DIRS[@]}" | sort)
fi

if [[ "$WITH_AGENTS" -eq 1 ]]; then
  if [[ -n "$AGENTS_TARGET" ]]; then
    fleet_dst="$AGENTS_TARGET"
  elif [[ "$SCOPE" == "project" ]]; then
    fleet_dst=".agents/fleets/skillify"
  else
    fleet_dst="$HOME/.agents/fleets/skillify"
  fi
  validate_fleet_target "$fleet_dst"
  fleet_root="$(dirname "$fleet_dst")"

  printf '  fleet: %s\n' "$fleet_dst"
  if [[ "$ACTION" == "status" ]]; then
    printf '    %s\n' "$(destination_status "$REPO_DIR/agents" "$fleet_dst")"
  elif [[ "$ACTION" == "uninstall" ]]; then
    if [[ -L "$fleet_dst" || -d "$fleet_dst" || -f "$fleet_dst" ]]; then
      clear_destination "$REPO_DIR/agents" "$fleet_dst"
      [[ "$DRY_RUN" -eq 1 ]] || printf '    removed portable fleet package\n'
    fi
  else
    if [[ "$DRY_RUN" -eq 0 ]]; then mkdir -p "$fleet_root"; fi
    clear_destination "$REPO_DIR/agents" "$fleet_dst"
    if [[ "$DRY_RUN" -eq 1 ]]; then
      printf '    would %s portable fleet package\n' "$MODE"
    elif [[ "$MODE" == "link" ]]; then
      ln -s "$REPO_DIR/agents" "$fleet_dst"
      printf '    linked portable fleet package\n'
    else
      cp -R "$REPO_DIR/agents" "$fleet_dst"
      printf 'managed-by=skillify\npackage=agents\nsource=%s\n' "$REPO_DIR/agents" > "$fleet_dst/.skillify-managed"
      printf '    copied portable fleet package\n'
    fi
  fi
fi

for native_harness in "${NATIVE_AGENT_REQUESTS[@]}"; do
  native_harness="$(canonical_harness "$native_harness")"
  if [[ "$SCOPE" == "global" ]]; then
    native_target="${NATIVE_AGENT_GLOBAL_DIR[$native_harness]:-}"
  else
    native_target="${NATIVE_AGENT_PROJECT_DIR[$native_harness]:-}"
  fi
  [[ -n "$native_target" ]] || { echo "install: native agents are supported for codex, claude, and opencode; got '$native_harness'" >&2; exit 2; }
  native_args=(--harness "$native_harness" --dest "$native_target")
  [[ "$DRY_RUN" -eq 0 ]] || native_args+=(--dry-run)
  [[ "$FORCE" -eq 0 ]] || native_args+=(--force)
  case "$ACTION" in
    install) ;;
    status) native_args+=(--check) ;;
    uninstall) native_args+=(--uninstall) ;;
  esac
  node "$REPO_DIR/scripts/render-agents.mjs" "${native_args[@]}"
done

printf 'Done.\n'
