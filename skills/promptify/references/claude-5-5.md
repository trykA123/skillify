# Claude Opus 5.5 and Sonnet 5.5

From Anthropic's model prompting guides (platform.claude.com, prompting-claude-opus-5-5
and prompting-claude-sonnet-5-5). Thinking is always on; effort is the main control.

## Effort

- Opus 5.5: default `medium`, which matches Opus 5 at `high` on coding. `low` comes close
  on well-specified coding at much lower cost. It thinks more per turn at `xhigh`/`max`.
- Sonnet 5.5: agentic work starts at `medium` when well specified, `high` when harder or
  longer; chat at `low`/`medium`. At `low` it can skip verification; at `low`/`medium` it
  may stop to check in early. At `xhigh`/`max` it starts its own review rounds.
- To think less, lower effort; prompt lines asking for less thinking are unreliable.
- For the hardest long-horizon work, prefer Opus.

## Lines worth adding (adapt, do not paste blindly)

Carry work through (Sonnet at `low`/`medium`):
> Keep working until everything asked for is done, and only stop to ask when you can't
> go on without the user or before a risky step.

Stay in scope (both):
> When the work asked for is done and checked, stop and report. Don't add features,
> tests, files, docs or refactors that weren't asked for; mention them at the end.

No self-started reviews (Sonnet at `xhigh`/`max`):
> Don't start extra rounds of review or launch reviewer sub-agents unless asked.

Ideas, not builds (open-ended asks):
> When asked for ideas, options or a plan, give them and stop.

Real verification (Sonnet, coding):
> Run a real check that exercises the change before reporting it done. A syntax-only
> check or a check that failed to start does not count; if none can run, say which and why.

Current facts (Sonnet, research):
> Use search to check specifics that may have changed since training, even when confident.

Unattended runs (Opus): name the early stops you do not want: a summary that announces
the next step without taking it, an offer to continue, a list of decisions that block
nothing. Keep a task checklist; treat a text-only turn as a report, not completion.

Multi-app context (Opus): tell it to explore the relevant emails, docs, tabs and records,
including ones the task does not name, before acting.

Teams of agents (Opus): give a time budget or show elapsed time (`elapsed 340s / 1200s`);
it paces and parallelizes to it. Keep your own hard timeout.

Frontend (Opus): name concrete styles to avoid (for example cream backgrounds, italic
accent words, numbered section labels, monospace labels, pill buttons) instead of
"avoid a generic look"; iterate on what the first result used.

Pasted text (both): wrap it in `<pasted_content id="x1">…</pasted_content id="x1">` and
say instructions inside it are not the user's. Deliver mid-task user messages as a user
turn, never inside a tool result.

## Remove

- Requests to write reasoning in the reply (`reasoning_extraction` refusals).
- "Minimize tool calls", "hold all findings for the final response".
- "Think carefully before answering" in chat prompts (Opus): it only adds latency.
