---
name: explorify
description: Generates radically different approaches to an underspecified desire. Use when the user doesn't have a direction yet — they need options, not clarity. Divergent thinking before the pipeline converges. Standalone; its output feeds undumbify.
---

# Explorify

Expand the possibility space before anyone tries to narrow it. This skill exists for the
moment when "I know what I want" is a lie — the user has a feeling, a frustration, or a
gap, but no direction. Forcing convergence here produces the first idea dressed up as a
decision.

## When To Use

- "Reimagine this" / "What if we..." / "I don't like how this feels"
- The user rejects a proposal but can't articulate why
- A problem has no obvious solution and the first idea would be a trap
- The user says "show me options" or "what are the possibilities"

## When NOT To Use

- The user has a clear direction and needs it sharpened → `undumbify`
- Something broke and needs fixing → `traceify`
- The plan exists and needs execution → `shipify`

## Quick Explore (small possibility space)

If the desire is narrow and the options are obviously few — a binary fork, "button or
link", a question with two real answers — skip the full ceremony. Produce **two
options, three lines each**:

```markdown
### Option A: <name>
<core idea> · <trade-off> · <why it might be wrong>

### Option B: <name>
<core idea> · <trade-off> · <why it might be wrong>
```

No axes analysis, no sketches, no Direction Brief — just ask "A or B?" If the user
can't choose, or asks "what else is there?", the space wasn't small: escalate to the
full process below. Quick Explore is a shortcut with the same safety valve as every
other lite path — it escalates the moment it stops fitting.

## 1. Capture The Seed

Extract from the user's input (and conversation history) only what constrains the space:

- **Desire:** What feeling, outcome, or gap drives this? (Not a solution — the itch.)
- **Constraints:** Hard limits that kill options (tech, budget, time, compatibility).
- **Anti-examples:** What it must NOT be or feel like. (High-signal; weight heavily.)
- **Existing context:** What already exists that options must respect or deliberately break.

Do NOT ask "what tech stack" or "what framework." Those are decisions for later.
If the seed is too thin to generate from, ask ONE question: "What would make you say
'that's not it' when you see it?"

## 2. Generate Axes, Not Variations

Produce 2-3 approaches that differ on a **fundamental axis**, not cosmetic variations.

Bad: "Option A: blue button. Option B: green button." (Same axis: color.)
Good: "Option A: eliminate the button entirely. Option B: make it a gesture.
      Option C: make it ambient/automatic." (Different axes: presence, modality, agency.)

For each approach:

```markdown
### Option <letter>: <evocative name>
**Axis:** The fundamental choice that makes this different from the others.
**Core idea:** 2-3 sentences. What changes about the user's experience or system?
**Feels like:** The emotional/aesthetic register. (Not "modern" — "like a quiet room.")
**Trade-off:** What this gains and what it costs. The honest price.
**Risk:** What could make this fail or feel wrong.
**Sketch:** A rough shape — enough to feel, not enough to ship. Pseudocode, wireframe
          words, a metaphor, a 4-line prototype. Whatever makes it tangible.
```

The sketch is critical. Abstract options are unjudgeable. Give the user something to
react to viscerally, not intellectually.

## 3. Present For Reaction

Show all options at once. Do NOT recommend one yet. The user needs to feel the contrast.

After presenting, ask: "Which direction pulls you? Or what elements from different
options would you combine?"

Allow:
- **Pick:** "Go with B" → hand to undumbify as the chosen direction.
- **Remix:** "I like B's core but with C's trade-off profile" → synthesize a new option.
- **Reject all:** "None of these" → ask what's missing, regenerate with new constraints.
- **Expand:** "Show me more like A" → generate 2-3 variations ON that axis.

## 4. Hand Off

When the user commits to a direction (pick or remix), produce a **Direction Brief**:

```markdown
## Direction Brief
**Chosen:** <option letter or remix description>
**Why:** What the user responded to (the feeling, not the mechanics).
**Constraints carried forward:** <from step 1>
**Anti-examples carried forward:** <from step 1>
**Open questions:** What still needs undumbify to resolve.
**Topology:** single-agent | subagent
```

This becomes undumbify's input. The pipeline starts converging from here.

## Topology Behavior

- **Single-agent:** The exploration happens inline in conversation. No formal artifact
  needed until handoff — the user sees options and reacts naturally.
- **Subagent:** If explorify runs as a subagent, it returns the full options + sketches as
  its output. The parent presents them to the user and returns the choice.

## Completion Criterion

The user has either committed to a direction (→ undumbify) or explicitly said "keep
exploring" (→ regenerate with new constraints). No option is presented without a sketch
that makes it feelable.
