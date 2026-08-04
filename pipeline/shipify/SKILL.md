---
name: shipify
description: Executes a Worker Packet with adaptive granularity — isolates risky steps, batches safe ones. Subagent-ready (works with only the packet, no conversation history). Returns BLOCKED with structured feedback when assumptions are wrong, enabling cheap in-place revision. Use when the user says "implement this" or hands you a plan.
---

# Shipify

Execute the packet faithfully. The packet owns **what**; this skill owns **how carefully**.

You may be running as a subagent with ONLY this packet — no conversation history, no
access to prior discussion. That's by design. The packet is your entire world. Trust it,
validate it, and when it's wrong, report precisely what's wrong.

## 1. Validate The Packet

**Packet-less mode (the "just do it" override):** if there is no packet — the user
invoked the override, or the task is obviously small — don't block on validation. Build
a **micro-packet** inline and execute against it:

```markdown
**Outcome:** <what exists when done>
**Steps:** <the few things you'll do>
**Done when:** <the observable check you'll run at the end>
```

This is the shipify-side shape of "skip the packet." The discipline below (baseline,
per-step verification, deviation control) still applies — only the artifact is lighter.

**With a packet:** before editing, confirm the packet has:
- Outcome + scope boundaries
- R* requirements and I* invariants
- P* steps with locations, dependencies, verify commands, granularity tags
- A* acceptance checks mapped to requirements
- Stop conditions
- Risk Register

If executing from a plan folder: read README → packet → lowest ready slice. One slice
per run unless told to continue.

**Packet Defect** (routes to shapeify for full re-plan):
- Missing material decision
- Conflicting requirements
- Ungrounded destructive action
- Requires redesign (intent is wrong, not just the plan)

**Revision Request** (routes to shapeify for in-place amendment):
- A step's assumption is wrong but the fix is local to the plan
- A file/symbol doesn't exist where the packet says
- A dependency is missing but the intent is sound

```markdown
## Revision Request
**Step:** P<n>
**Discovery:** <what the code/runtime actually shows>
**Affected assumption:** <which assumption is wrong>
**Proposed amendment:** <minimal plan change>
**Blast radius:** <other steps affected, or "none">
```

## 2. Establish Baseline

Before first edit:
1. Read the location named by the first ready step
2. Read the owning symbol + nearest caller/test/config
3. Run the cheapest existing check that exercises affected behavior
4. Record pre-existing failures (leave them out of scope)

## 3. Execute With Adaptive Granularity

Respect the packet's granularity tags:

### [ISOLATE] steps
- Make the edit
- Run verification immediately
- If red: repair, re-verify. Do not proceed until green.
- One step at a time, no batching.

### [BATCH] steps
- Group consecutive BATCH steps that share a verification boundary
- Make all edits in the group
- Run verification once after the group
- If red: promote the failing step to ISOLATE, bisect within the group

### Override rules
- A BATCH step that fails twice → promote to ISOLATE for retry
- An ISOLATE step that passes trivially → note it, but don't retroactively batch
  (the isolation already paid its cost)
- If you discover mid-batch that a step touches something riskier than tagged →
  stop the batch, isolate the risky step, resume batching after

### Per-step discipline
1. Restate its R*, I*, A* IDs
2. Make the smallest coherent edit for that step's outcome only
3. Run its verification
4. Mark complete only when evidence exists
5. Record: files changed, commands run, results

Do not begin the next step while the current is red. Name the root cause of each failure
before the next repair. If two consecutive failures share the same root cause → stop and
emit a Revision Request (the step's premise is wrong, not its implementation).

## 4. Control Deviations

| Class | Action |
|-------|--------|
| Local correction | Fix typo, stale path, equivalent API. Record it. |
| Local defect | Repair implementation without changing requirements. |
| Plan defect | Stop. Emit Revision Request or Packet Defect. |
| Scope opportunity | Record as follow-up. Keep out of current delivery. |
| Destructive surprise | Stop before mutation. Request approval. |

## 5. Run Final Acceptance

After all P* steps green:
1. Run every A* check as specified
2. Run repo's compile/lint/type/test for touched areas
3. Run broader checks when cross-module or user-facing risk exists
4. Inspect diff for unexplained files, debug artifacts, secrets, out-of-scope changes
5. Verify every I* invariant independently

An unavailable check is NOT a pass. Record why, what substitute evidence exists, and
residual risk.

## 6. Emit Completion Report

### Single-agent mode (lean):

Four lines. The user was in the room — they saw it happen.

```markdown
**Done:** <outcome — Implemented | Partial | Blocked>
**Deviations:** <what changed from the plan, or "none">
**Follow-ups:** <out-of-scope observations, or "none">
**Skill map signal:** <one evidence entry for the user's communication, or "none">
```

The skill map signal is passive harvesting. Note ONE honest observation about the user's input quality — did the
packet work first try because their intent was clear? Did a Revision Request happen
because scope was under-specified? Format: `"P1 positive: intent was one line, first-try
result"` or `"none"`. Never lecture, never block on this — one phrase, move on.

### Subagent / plan-folder mode (full):

```markdown
## Completion Report

### Scope
<packet or plan folder + slice>

### Outcome
Implemented | Partial | Blocked

### Execution
| Step | Granularity | Files | Verification | Result |
|------|------------|-------|-------------|--------|

### Acceptance
| Check | Proves | Result |
|-------|--------|--------|

### Deviations
<classification + evidence, or None>

### Residual Risks
<unverified assumptions, unavailable checks, or None>

### Follow-ups
<out-of-scope opportunities, or None>

### Skill Map Signal
<one evidence entry for the user's communication quality, or "None">
```

Keep it factual. Never claim a check ran when it didn't.

When executing from a plan folder: write to `evidence/S<n>-report.md`, update README
status, name next ready slice.

## Topology Behavior

- **Single-agent:** You have conversation context. Use it for judgment calls, but still
  follow the packet's structure. The packet prevents drift even when you "remember"
  something the user said that contradicts the plan.
- **Subagent:** You have ONLY the packet. No improvisation from "what the user probably
  meant." If the packet is ambiguous, that's a Revision Request, not a guess.

## Final Gate

- [ ] Packet validated before editing
- [ ] Baseline recorded
- [ ] Granularity tags respected (with documented overrides)
- [ ] One step green before next begins (within isolation boundaries)
- [ ] Deviations classified, not improvised
- [ ] All A* and I* accounted for
- [ ] Diff contains only explained changes
- [ ] Report is evidence-based
