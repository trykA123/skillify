# Skillify

[![License: MIT](https://img.shields.io/badge/License-MIT-0f766e.svg)](LICENSE)

Eleven small engineering skills and four subagents for AI coding assistants. Each skill
holds the few rules a strong engineer follows and a model tends to skip: trace the
flow before planning, state the root cause before fixing, verify each step, and judge
work against its intent. The skills are plain `SKILL.md` folders, so they work in any
assistant that reads Agent Skills.

**[Watch From signal to certainty](https://tryka123.github.io/skillify/reel/player.html)**: a new 2:10 film with original music, eleven skills, and four agents. [Render source and verification](docs/cinematic-reel-v2/README.md).

[![A cloud of particles crystallises from the words "make it better?" into ten columns, one per skill, under the Skillify title.](docs/reel/preview.webp)](docs/reel/skillify-reel.mp4)

**[Watch the full 2:37 film, with sound](docs/reel/skillify-reel.mp4)**: 9,000 particles move from a vague idea to ordered method, one formation per skill, then the agents and the eval results. No flashes; `docs/reel/flashcheck.py` checks every frame.

**[Download the 2:00 motion-graphics showreel](showreel/skillify-showreel.mp4)**: an original visual study of the skills, agents, evals, and feedback loop. [Render source](showreel/render.py) · [Storyboard preview](showreel/preview.jpg).

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
| [promptify](skills/promptify/SKILL.md) | Handing work to another model, or sharpening a prompt | Model and effort, outcome, stop rules, vendor guidance (Claude 5.5 reference) |
| [shipify](skills/shipify/SKILL.md) | Implement, refactor, migrate, or add tests | Every affected place found first, baseline, verified steps, the real result inspected |
| [reviewify](skills/reviewify/SKILL.md) | Review a diff, PR, or plan | Intent before diff, located findings, one verdict |
| [releaseify](skills/releaseify/SKILL.md) | Cut a release | Version from the actual diff, changelog from merged work, rollback before deploy |
| [audify](skills/audify/SKILL.md) | Health check with no spec | Standard first, reproducible evidence, severity × effort, HTML report |
| [teachify](skills/teachify/SKILL.md) | Learn a topic properly | Interactive HTML lesson with graded exercises |

A typical feature runs `undumbify → shapeify → shipify → reviewify` (with `promptify` when shapeify's plan goes to another model), but each skill
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

Generated from existing results by `node scripts/readme-evidence.mjs`; the dashboard uses the same analysis. No new paired runs are needed to refresh this section.

`scripts/run-paired.mjs` runs each task in a throwaway repo with real tools, without skills and with the task's skill loaded. Hidden tests grade coding tasks; a separate model grades open-ended tasks against a rubric.

Haiku with skills scores close to Sonnet without them (0.95 vs 0.97), at ~58% of the cost.

| Model | Score without skills | Score with skills | Cost per run | Cost per score point |
|---|---:|---:|---|---|
| Claude Haiku | 0.78 | 0.95 | $0.079 → $0.090 (+13%) | $0.102 → $0.094 (−8%) |
| Claude Sonnet | 0.97 | 0.99 | $0.156 → $0.219 (+41%) | $0.161 → $0.222 (+38%) |
| DeepSeek Flash | 0.93 | 0.99 | $0.481 → $0.667 (CLI estimate) | not comparable |

- [clarify-invites](evals/paired/clarify-invites/task.json) (undumbify): Claude Haiku 0.13 → 0.87 (+73 pts); Claude Sonnet 0.80 → 0.93 (+13 pts); DeepSeek Flash 0.73 → 1.00 (+27 pts).
- [review-ratelimit](evals/paired/review-ratelimit/task.json) (reviewify): Claude Haiku 0.73 → 1.00 (+27 pts); DeepSeek Flash 0.85 → 0.95 (+10 pts).
- [feature-softdelete](evals/paired/feature-softdelete/task.json) (shipify): Claude Haiku 0.81 → 0.86 (+5 pts).
- Coding and debugging baselines already score 1.00 on 11 model/task comparisons. These fixtures cannot measure further score gains at that ceiling.

The sample is small: 6 fixtures, up to 3 runs per arm. Means are per recorded run. Later rounds replace earlier results for the same model, task and arm. Treat these scores as direction, not proof. CLI cost estimates are not invoices; DeepSeek estimates use Anthropic prices and are excluded from cost comparisons.

`teachify` remains unmeasured: interactive teaching needs a human learner. Grading lesson text alone cannot establish teaching quality. The shipify fast path's cost effect also remains unmeasured.

Raw runs: [evals/results/](evals/results/). The dashboard recomputes its Overview headline and Evals numbers from the same files.

### Field feedback

Every agent ends its report with a `Skill feedback` block: which skills it used, what
helped, what got in the way, what was missing, and a verdict (helped, neutral, or hurt).
The caller logs each block, so real work adds to the evidence alongside the evals:

```bash
node scripts/log-feedback.mjs --agent worker --model sonnet-5.5 --harness claude \
  --task "radio server" --skills shipify --catch "one concrete catch, or none" \
  --helped "…" --hindered "…" --missing "…" --verdict helped
node scripts/log-feedback.mjs --summary   # verdict counts per skill
```

Add `--tokens N --tools N --ms N` when the harness reports them; omit unknown usage.
Catch rate is concrete catches on helped entries divided by all helped entries, with
recorded coverage shown. Tokens per helped run is the median of recorded values.
Missing catches and usage stay unknown; older entries are never filled with guesses.

Entries go to `feedback/field.jsonl`. The dashboard at
**https://tryka123.github.io/skillify/** is a small app in [`dashboard/`](dashboard/)
(React, Bun, Base UI): overview, paired evals per model, every task with exactly how it
is scored (hidden tests or a rubric graded by Codex) and each run's grading, results by
kind of work (coding, debugging, reviewing, clarifying), field runs, Skillify's own
skills and four portable agents, and method.
Every push to `main` that touches the data or the app rebuilds and redeploys it through
`.github/workflows/feedback.yml`. Build it locally with
`cd dashboard && bun install && bun run build` (output in `dashboard/dist`).
The older single-page report is still built as `one-page.html`, and locally by
`log-feedback.mjs` as `feedback/index.html`.

Model coverage includes every recorded field-feedback model, including Codex models,
alongside models with paired results. Field runs can be filtered by model and harness.
Missing paired benchmarks are marked as not recorded; field feedback does not supply
comparison scores. Exact model IDs and versions stay separate.

## Token cost

Only the skill descriptions are always in context: about 2.8 KB for all eleven. A skill
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
