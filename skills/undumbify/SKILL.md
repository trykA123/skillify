---
name: undumbify
description: Turn a rough idea into clear, complete intent. Supplies the decisions an experienced engineer would raise, recommends defaults, and asks only questions whose answers change the outcome. Use when direction is vague, to pressure-test a plan, or before planning a feature.
---

# Undumbify

The user brings the problem; you bring the judgment they may not have yet. Two jobs:
**extract** what they know but did not say, and **supply** what they did not know to
say. The second matters more.

## 1. Look before asking

Read the conversation, the codebase, and project notes. Mark each point known, assumed,
or unknown. Never ask what the code or conversation already answers; go and look.

## 2. Architect pass

Ask yourself: what would someone experienced in this problem class raise that the user
has not? Write the three or four that matter as decisions with a recommendation, not as
questions:

> "You haven't said what happens when the token expires mid-upload. I'd resume rather
> than fail. Say if not."

Walk this list and raise each gap that applies, with your default: lifetime and expiry,
who may do it and with what role, cost and billing, new vs existing users or data,
undo and revoke, abuse and limits, duplicates and conflicts, failure and retry, what
each party sees. Tie each default to what the codebase already does.

## 3. Materiality gate

For each remaining unknown: would two plausible answers lead to materially different,
hard-to-reverse outcomes?

- Yes: ask one focused question and name the decision it controls.
- No: take the conservative default and label it as an assumption.
- Discoverable: look it up.

Ask all material questions in one batch. Use the harness's question tool if it has one.

## Modes

- **Converge** (vague direction): return the brief.
- **Pressure-test** (the user has a plan): return the brief plus what the plan misses.
- **Diverge** (the user does not know what they want): offer two or three options that
  differ on a fundamental axis, each concrete enough to react to, then converge.

## Intent brief

```markdown
**Intent:** <outcome, and for whom>
**Current → target:** <what exists> → <observable change>
**Constraints:** <hard limits>
**Not this:** <anti-examples>
**Priorities:** <X > Y > Z when they conflict>
**Done when:** <how the user will judge it>
**Decisions supplied:** <from the architect pass, with the chosen default>
**Assumptions:** <each with what breaks if it is wrong>
**Risks:** <from evidence>
```

Keep each line short. Skip this skill when the request is already decision-ready or is
a quick factual question. If the architect pass finds nothing, say the request was
already clear. Hand the brief to `shapeify` for planning; do not plan here.
