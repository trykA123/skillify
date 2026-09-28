# Skillify

[![License: MIT](https://img.shields.io/badge/License-MIT-0f766e.svg)](LICENSE)

Ten small engineering skills and four subagents for AI coding assistants. Each skill
holds the few rules a strong engineer follows and a model tends to skip: trace the
flow before planning, state the root cause before fixing, verify each step, and judge
work against its intent. The skills are plain `SKILL.md` folders, so they work in any
assistant that reads Agent Skills.

https://github.com/user-attachments/assets/7c1bb755-4cf3-4bac-a9e3-1582ef36f93c

You write a normal
request. The assistant matches it against the skill descriptions and loads one skill;
that skill's rules shape the work. Agents run a bounded part of the job with only the
access they need.

## Skills

| Skill | Use it when | What it enforces |
|---|---|---|
| [orientify](skills/orientify/SKILL.md) | You are new to a codebase | One flow traced end to end; traps named, not fixed |
| [traceify](skills/traceify/SKILL.md) | Something broke and the cause is unknown | Falsifiable hypotheses; root cause stated before the fix |
| [researchify](skills/researchify/SKILL.md) | A decision needs outside facts | Source hierarchy, two independent sources, confidence labels |
| [undumbify](skills/undumbify/SKILL.md) | The idea is still vague | Supplies the missing decisions; asks only material questions |
| [shapeify](skills/shapeify/SKILL.md) | The goal is clear, the approach is not | Steps with file, check, and trap; plan amendments |
| [shipify](skills/shipify/SKILL.md) | Implement, refactor, migrate, or add tests | Every affected place found first, baseline, verified steps, the real result inspected |
| [reviewify](skills/reviewify/SKILL.md) | Review a diff, PR, or plan | Intent before diff, located findings, one verdict |
| [releaseify](skills/releaseify/SKILL.md) | Cut a release | Version from the actual diff, changelog from merged work, rollback before deploy |
| [audify](skills/audify/SKILL.md) | Health check with no spec | Standard first, reproducible evidence, severity × effort, HTML report |
| [teachify](skills/teachify/SKILL.md) | Learn a topic properly | Interactive HTML lesson with graded exercises |

A typical feature runs `undumbify → shapeify → shipify → reviewify`, but each skill
stands alone. Use the one that fits the task in front of you.

## Subagents

The main session delegates bounded jobs and gets short reports back, so the reading an
agent does stays out of your context. Read-only agents can run side by side; only the
worker edits, so there is one writer per working copy.

| Agent | Access | Job |
|---|---|---|
| [scout](agents/scout.md) | read-only | Exact files and line ranges for another agent |
| [worker](agents/worker.md) | edits code | Implements one bounded task with evidence |
| [reviewer](agents/reviewer.md) | read-only (runs checks) | Independent review with one verdict |
| [researcher](agents/researcher.md) | read-only + web | Sourced external brief |

Agent definitions are portable Markdown. `scripts/render-agents.mjs` turns them into
each assistant's native format and enforces access with native tool lists or sandboxes.
Checked live on 2026-09-28: Claude Code (the reviewer had no Edit tool and left the file
unchanged), Codex, and OpenCode (scout ran as a subagent and returned cited locations).
The Copilot output is checked structurally only.

## Install

```bash
git clone https://github.com/trykA123/skillify.git && cd skillify
./install.sh --update                                   # every detected assistant
./install.sh --harness claude,codex --native-agents claude,codex --update
./install.sh --target /path/to/skills                   # any other assistant
./install.sh --list                                     # 22 presets and their paths
```

Links by default; `--copy` for checkout-independent copies, `--project` for
repo-local folders, `--skill a,b` to pick skills, `--uninstall`, `--status`, `--dry-run`.
The installer never overwrites a directory or agent file it did not create, and it
removes skills retired from this repo.

Native subagents: `claude`, `codex`, `opencode`, `copilot` (alias `vscode`).

Claude Code plugin:

```text
/plugin marketplace add trykA123/skillify
/plugin install skillify@skillify
```

## Does it help?

`scripts/run-paired.mjs` runs each task in a real throwaway repo with real tools, once
without skills and once with the task's skill loaded, and scores the result with hidden
tests or, for open-ended tasks, a rubric graded by a different model (Codex). Six tasks,
three runs per arm (2026-09-28):

| Model | Score without skills | Score with skills | Cost per run |
|---|---:|---:|---|
| Claude Haiku | 0.78 | **0.95** | $0.079 → $0.090 (+13%) |
| Claude Sonnet | 0.97 | 0.99 | $0.156 → $0.219 (+41%) |
| DeepSeek-V4.1-Flash | 0.95 | **1.00** | about $0.01 per run (24% more turns) |

- The skills matter most on smaller models. Haiku with the skills scored close to Sonnet
  without them, at about 58% of the cost. DeepSeek-V4.1-Flash with the skills scored 1.00
  on every task at roughly a twentieth of Sonnet's cost.
- The biggest gains were clarifying a vague feature (undumbify: Haiku 0.13 → 0.87,
  Sonnet 0.80 → 0.93) and reviewing a PR against its intent (reviewify: Haiku 0.73 → 1.00).
- On small, well-specified coding tasks Sonnet already scores 1.00 without help; there the
  skills cost more turns and add nothing measurable.
- Evals also changed the skills: a refactor rule that stopped to ask, a review rule that
  invited filler findings, and a missing "find every place the change touches" step were
  all found this way and fixed. Release routing failed inside shipify, so releaseify is a
  separate skill again.

The sample is small (six fixtures, n=3). Treat it as direction, not proof.

## Token cost

Only the skill descriptions are always in context: about 2.6 KB for all ten. A skill
body (2–3 KB) loads when it triggers, and references load only when the task needs
them. Agent prompts are about 1 KB. `node scripts/validate.mjs --report` prints the
current sizes and fails when a budget is exceeded.

## Develop

```bash
node scripts/validate.mjs          # frontmatter, links, budgets, installer and plugin lists
bash scripts/test.sh               # installer safety and all four agent formats
node scripts/run-evals.mjs --adapter claude --skill traceify --out /tmp/claude.jsonl
node scripts/compare-evals.mjs baseline.jsonl candidate.jsonl
node scripts/run-paired.mjs --model haiku --reps 3        # with vs without skills
node scripts/run-paired.mjs --cli my-wrapper --model m     # any Anthropic-compatible provider
node scripts/run-evals.mjs --adapter claude --routes-only --catalog ~/.claude/skills
```

Paired fixtures live in `evals/paired/<task>/` (a repo, optional `before/` history, hidden
tests or a rubric). Route and behavior cases live in `evals/<skill>.json`. A case with `route` checks which skill a model
picks from the descriptions; a case with `behaviors` runs the skill and has the model
grade the answer against them. Real adapters use your installed CLI and may cost usage.

Rules for changes: keep vendor names and tool syntax out of skills and agents, keep
`SKILL.md` under 4.5 KB, move conditional detail into `references/`, and add at least
one route case and one behavior case per skill.

## License

[MIT](LICENSE)
