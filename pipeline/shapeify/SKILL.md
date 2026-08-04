---
name: shapeify
description: Decomposes intent into executable slices with risk annotations and revision support. Produces a living Worker Packet that can be amended in place when execution reveals wrong assumptions. Use after undumbify or when the user has a clear "what" and needs a "how."
---

# Shapeify

Turn intent into a plan a worker can execute without guessing. The packet is a **living
document** — it can be revised in place when shipify discovers wrong assumptions, without
requiring a full re-shape.

## Reliability Contract

The worker (shipify) may have ONLY this packet — no conversation history, no hidden
reasoning. Every dependency, decision, and success condition must be explicit.

- Stable IDs: `R*`, `I*`, `A*`, `P*`, `S*` — never renamed mid-delivery.
- Distinguish **Fact**, **Assumption**, **Decision**. Never blur them.
- Name concrete files, symbols, commands, observable results. Use a discovery step when
  the exact location is unknown.
- One authoritative instruction per change. Later sections reference by ID.

## 0. Choose Packet Weight

Before building anything, decide which mode fits:

| Mode | Criteria | Output |
|------|----------|--------|
| **Lite** | ≤5 steps, ≤3 files, single slice, no irreversible transitions, no public contract changes | Lite Packet (below) |
| **Full** | >5 steps, >3 files, multi-slice, irreversible transitions, public contracts, or subagent dispatch | Full Worker Packet (step 2) |

When in doubt: lite. You can always escalate mid-execution if a step reveals hidden
complexity (shipify will send a Revision Request).

### Lite Packet

```markdown
## Lite Packet
**Outcome:** <one paragraph — what exists when done>
**Steps:**
1. <step> — `file` → `symbol` — verify: <command/observation>
2. ...
**Done when:** <observable check that proves the outcome>
**Risks:** <one line each, or "none">
**Out of scope:** <tempting adjacent work, one line>
```

That's it. No Risk Register table, no Assumptions section, no Revision Log, no plan
folder. The lite packet IS the plan. Shipify executes it directly.

If a lite packet fails mid-execution (two consecutive failures, wrong assumption),
shipify escalates: either a local fix, or a request to re-shape as Full.

---

## 1. Normalize Input (Full Mode)

Accept an undumbify Intent Brief or a direct request:

```yaml
intent:
constraints:
anti_examples:
priorities:
feeling_of_done:
current_state:
target_state:
assumptions:
risks:
topology:
```

When fields are missing, inspect available evidence. Ask only when the Materiality Gate
fires (two plausible answers → materially different, hard-to-reverse outcomes).

## 2. Build The Worker Packet

```markdown
## Worker Packet

### Outcome
One paragraph: what exists when this is done.

### Scope
- **In:** exact components and behaviors
- **Out:** tempting adjacent work, explicitly excluded

### Requirements
- R1: <one testable behavior>
- R2: ...

### Invariants
- I1: <boundary that must remain true, including on failure paths>

### Constraints & Priorities
- Hard limits: <from intent>
- Priority ordering: <X > Y > Z — resolves conflicts during execution>
- Anti-examples: <what the implementation must NOT produce>

### Evidence — tagged, never blurred
- [FACT] <fact> — <evidence source>
- [ASSUMPTION] <assumption> — consequence if false — how to verify during execution
- [DECISION] <decision> — <why, and what it rules out>

### Risk Register
| Slice | Risk | Likelihood | Impact | Mitigation |
|-------|------|-----------|--------|------------|
| S1 | <what could go wrong> | low/med/high | <what breaks> | <how shipify handles it> |

### Ordered Plan
- P1: <step> [ISOLATE | BATCH] — risk: low/med/high
- P2: <step> [ISOLATE | BATCH] — risk: low/med/high
  - Depends on: P1
  - Location: `path/to/file` → `symbol`
  - Change: <concrete behavior>
  - Do not change: <invariant or boundary>
  - Verify: <exact command or observable check>
  - Failure signal: <what disproves this step>

### Acceptance
- A1: <command/observation> → <expected result> — proves: R1, I1

### Stop Conditions
- <conditions requiring shipify to stop rather than improvise>

### Revision Log
(empty initially — shipify appends here when amending in place)

### Topology
single-agent | subagent
```

## 3. Tag Steps With Granularity Hints

Each `P*` step gets a granularity tag:

- **[ISOLATE]** — Execute alone, verify immediately before next step. Use when:
  - Risk is high (touches DB, auth, external API, irreversible state)
  - The step's failure would obscure the next step's diagnosis
  - The step changes a public contract

- **[BATCH]** — Can be grouped with adjacent BATCH steps, verify once after the group.
  Use when:
  - Risk is low (additive change, new file, internal helper)
  - Steps are tightly coupled (edit + its import + its type annotation)
  - Individual verification adds no signal over group verification

Shipify respects these tags but may override with evidence (e.g., a BATCH step that
fails gets promoted to ISOLATE for the retry).

## 4. Slice When Needed

Split into slices (`S1`, `S2`, ...) when:
- More than 8 steps
- More than one deployable unit changes
- More than one irreversible transition
- The diff would be too large to review as one unit
- Work can't reach green/committable in one sitting

Each slice must:
- Deliver one coherent outcome
- Leave the repo green and committable on its own
- Carry its own acceptance checks
- Declare dependencies only on lower-numbered slices
- Have a risk entry in the Risk Register

## 5. Revision Support (Living Document)

When shipify discovers a wrong assumption mid-execution, it sends back a **Revision
Request** (not a full Packet Defect):

```markdown
## Revision Request
**Step:** P<n>
**Discovery:** <what the code/runtime actually shows>
**Affected assumption:** <which assumption is wrong>
**Proposed amendment:** <minimal change to the plan>
**Blast radius:** <which other steps/slices this affects>
```

Shapeify processes this by:
1. Amending the affected step/assumption in place
2. Adding an entry to the Revision Log: `[REV <date>] P<n>: <what changed and why>`
3. Checking if downstream steps need adjustment
4. Returning the amended section to shipify (not regenerating the whole packet)

This is the feedback loop. It's cheap — one round-trip, not a full re-shape.

**When to use Packet Defect instead:** When the revision would change requirements,
invariants, or scope — i.e., when the *intent* was wrong, not just the *plan*. That
routes back to undumbify.

## 6. Plan Folder (When Sliced or Cross-Session)

Write to disk when: plan is sliced, spans sessions, or user asks for a file shipify
reads later.

```
plans/<YYYY-MM-DD>-<slug>/
  README.md          Index, execution order, status
  packet.md          The Worker Packet (this skill's output)
  slices/
    S1-<slug>.md     Self-contained slice (repeat what it needs from packet.md)
  evidence/          shipify writes reports here
  reviews/           reviewify writes reports here
```

Do NOT create a folder for a single-slice inline plan. The inline packet IS the artifact.

## 7. Quality Gate

Before emitting, verify:

- [ ] Every R* and I* maps to at least one P* step and one A* check
- [ ] Every P* step has a location (or a bounded discovery step), a verify, and a failure signal
- [ ] Every step has a granularity tag
- [ ] Risk Register covers every slice
- [ ] Dependencies are acyclic
- [ ] No vague verbs ("update as needed", "handle edge cases", "ensure quality")
- [ ] The packet is self-contained (no "see discussion above")
- [ ] Revision Log section exists (even if empty)
- [ ] Topology declared

## Topology Behavior

- **Single-agent:** The packet is your own working note. Keep it tight — you have the
  context. The value is in making implicit decisions explicit for post-compaction recovery
  and for potential subagent dispatch.
- **Subagent dispatch:** The packet must be fully self-contained. A fresh agent with no
  conversation history must be able to execute it. This is when every field earns its
  weight.

## Final Output

Emit the Worker Packet. If a plan folder was written, end with its path and the first
slice shipify should execute.
