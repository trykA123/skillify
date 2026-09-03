# Standard packet

Use this for normal multi-file or feature work. The packet must stand alone. When the
request includes an Intent Brief, preserve conditional Brief provenance; without one,
use `[STANDALONE]` sources from the request and inspected evidence.

```markdown
## Worker Packet

**schemaVersion:** 1
**Weight:** Standard

### Outcome
One paragraph: what exists when this is done.

### Scope
- **In:** exact components and behaviours
- **Out:** tempting adjacent work, explicitly excluded

### Requirements
- R1: <one testable behaviour>

### Invariants
- I1: <boundary that stays true, including on failure paths>

### Constraints & Priorities
Hard limits, priority ordering `X > Y > Z`, and anti-examples.

### Evidence
- [FACT] <fact> — <source>
- [ASSUMPTION] <assumption> — what breaks if false — how execution checks it
- [DECISION] <decision> — why, and what it rules out

### Risk Register
| Slice | Risk | Likelihood | Impact | Mitigation |

### Ordered Plan
- P1: <step> [ISOLATE | BATCH] — risk: low | medium | high
  - Depends on: <P* or none>
  - Location: `path` → `symbol`
  - Change: <concrete behaviour>
  - Do not change: <invariant or boundary>
  - Verify: <exact command or observable check>
  - Failure signal: <what disproves this step>
  - Trap: <plausible wrong move, when one exists>

### Acceptance
- A1: <command or observation> → <expected> — proof owner: <who or what> — proves: R1, I1

Shapeify defines `A*` and assigns its proof owner. If Testify is selected, it may
implement a `T*` claim for that `A*`; it does not change the acceptance condition.

### Stop Conditions
<what makes Shipify stop rather than improvise>

### Revision Log
(Shipify appends here.)

### Topology
single-agent | delegated-agent
```

## Slicing

Slice when there are more than eight steps, multiple deployable units or irreversible
transitions, a diff too large to review at once, or work that cannot return green in one
sitting. Every slice delivers a coherent, committable outcome with its own acceptance;
it depends only on accepted lower-numbered slices or explicit external prerequisites.

Use a folder only for sliced work, cross-session execution, or an explicit user request:

```text
plans/<YYYY-MM-DD>-<slug>/
  index.md
  packet.md
  slices/S1-<slug>.md
  evidence/
  reviews/
```

`index.md` is the canonical lifecycle owner. Shapeify creates it; the parent or named
integration owner applies later status changes from Shipify and Reviewify artifacts.
Before emitting, test requirement and invariant coverage, proof ownership, dependency
direction, concrete locations and commands, every failure signal, and `schemaVersion`.
