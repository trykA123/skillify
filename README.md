# skillify

Seven interlocking skills for AI-assisted work. Harness-agnostic — works with Qwen Code,
Claude Code, Cursor, OpenCode, Codex, Windsurf, or any agent that reads markdown.

## What's Inside

- **Seven skills** — three entry points (`orientify`, `explorify`, `traceify`) and the
  four-step build pipeline (`undumbify`, `shapeify`, `shipify`, `reviewify`). Each folder
  holds one `SKILL.md` — the skills ARE the prompts. Catalog below.
- **Docs** — [`docs/index.html`](docs/index.html) — the pipeline as spec-sheet dossiers.

## The Skills
| Skill | Cognitive mode | Trigger |
|-------|---------------|---------|
| `orientify` | Cartographic — map an unknown codebase before acting | "I just landed in this repo" |
| `explorify` | Divergent — generate radically different options | "I don't know what I want yet" |
| `undumbify` | Convergent — extract intent from ambiguity | "I have a direction but it's vague" |
| `shapeify` | Structural — decompose into executable slices | "Plan this" |
| `shipify` | Disciplined — execute with adaptive validation | "Build this" |
| `reviewify` | Critical — judge against intent, not taste | "Review this" |
| `traceify` | Abductive — infer cause from symptoms | "Something broke" |

They chain: `orientify → explorify → undumbify → shapeify → shipify → reviewify`
(map → diverge → converge → plan → build → judge). `traceify` is the debug entry.
Ceremony scales with the work — every skill has a lite path; "just do it" overrides.

## The Families
```
entry/      the entry points — standalone, start anywhere
            orientify · explorify · traceify
pipeline/   the build pipeline
            undumbify · shapeify · shipify · reviewify
```
Start anywhere: an entry skill on its own is a complete session; the pipeline is the
sequence to run when the work is "build this thing".

## Install
### Option 1: `npx skills` (recommended, uses symlinks by default)
```bash
# Global install (all detected agents)
npx skills add trykA123/skillify -g

# Target specific agents
npx skills add trykA123/skillify -g -a claude-code -a cursor

# Copy instead of symlink
npx skills add trykA123/skillify -g --copy
```

### Option 2: Manual symlinks via install script
```bash
git clone git@github.com:trykA123/skillify.git ~/path/to/skillify
cd ~/path/to/skillify

# Auto-detect harnesses, symlink globally
./install.sh

# Target specific harnesses
./install.sh --harness qwen,claude,cursor

# Project-local instead of global
./install.sh --project

# Copy instead of symlink (for systems without symlink support)
./install.sh --copy

# Remove
./install.sh --uninstall
```

`install.sh` supports Qwen Code, Claude Code, Cursor, OpenCode, Codex, Windsurf, and
GitHub Copilot. The `npx skills` CLI supports even more — check `npx skills add --help`.

### Option 3: Reference directly in rules/system prompt
```markdown
<!-- In CLAUDE.md, .cursorrules, AGENTS.md, QWEN.md, etc. -->
When planning implementation, follow: /path/to/skillify/pipeline/shapeify/SKILL.md
When debugging, follow: /path/to/skillify/entry/traceify/SKILL.md
```

## Repo Structure
```
skillify/
├── README.md
├── LICENSE                # MIT
├── install.sh             # symlink skills into AI harnesses
├── docs/                  # the pipeline as spec-sheet dossiers
├── entry/                 # entry points — standalone, start anywhere
│   ├── orientify/  explorify/  traceify/
└── pipeline/              # the build pipeline
    └── undumbify/  shapeify/  shipify/  reviewify/
```

## No Secrets
No credentials — no API keys, tokens, or auth URLs. No personal data, no
private-infrastructure identifiers. The seven skills are the entire content of this
repository.

## Design Principles
- **Constraints over solutions** — extract WHY, not HOW
- **Anti-examples are high-signal** — "NOT like X" eliminates more than "like Y" generates
- **Priority ordering resolves conflicts silently** — no asking when things clash
- **Living documents** — plans amend in place, no full regeneration

## License
MIT
