---
name: testify
description: Design and write tests. Test the behaviors worth catching, not lines of code. Fixing a bug? Write the failing test first. A flaky test needs evidence before removal. Use when deciding what to test or writing tests.
---

# Testify

**Interaction gate.** Apply [the shared interaction gate](references/interaction-gate.md)
before task work. Infer Weight, Verbosity, and Ownership; treat Explanation as opt-in.
Show a route card only when routes are genuinely contested after a quick look at the
subject, the work is Heavy, or a step is destructive or irreversible — otherwise proceed
on the inferred route with a one-line receipt.

**A test suite is evidence design, not coverage accounting.** Every test is a small bet:
this behavior matters, and it can fail in a way worth catching before release. Write
bets you can defend; delete bets you cannot. In pipeline use, each test is a `T*`
claim mapping to one `A*` or `R*` per [artifacts](references/artifacts.md). Follow
[pipeline mode](references/pipeline-mode.md) for inheritance.

## Derive targets from risk

Before writing any test, list the subject's behaviors and rank them:

- **Core promises** — what the code exists to do. Each needs a proof that fails when
  the promise breaks.
- **Edges that pay** — boundaries where a mistake is expensive: money, auth, data loss,
  concurrency, public contracts. These earn the awkward tests.
- **Everything else** — cover through the core proofs or integration paths, not through
  dedicated trivial tests.

Never chase a coverage percentage. Coverage tells you what is untested; it cannot tell
you what is important. If asked for a number, deliver the risk-ranked suite and report
coverage as an observation, not an achievement.

## Map every test to a claim

Each test states the behavior it pins in its name or assertion message: when this
breaks, the claim "X behaves like Y" is false. A test you cannot phrase as a claim is
a candidate for deletion, not for renaming.

Prefer few strong tests over many weak ones: one honest end-to-end proof beats ten
mock-rehearsal tests of getters. Mock only what you cannot afford to run for real;
every mock is a place the test can pass while production fails.

## Fixing a bug? Regression test first

When the subject is a defect, reproduce it as a failing test before touching the fix.
The test proves you understand the bug and guards against its return. If the bug cannot
be expressed as a test, say so plainly and record why — that is a testing gap, not a
pass.

## Flaky tests: quarantine, never quiet-delete

A flaky test is a signal with noise on top. Delete it only with evidence it tests
nothing real:

1. **Quarantine** — mark it so the suite stays trustworthy, and record the symptom.
2. **Instrument** — capture the conditions envelope: timing, ordering, shared state,
   environment.
3. **Decide with evidence** — fix the test's assumptions, fix the product race it
   found, or delete it with the reasoning written down.

Quietly deleting or skipping a flaky test hides whichever problem it detected.

## Done when

Every core promise has a proof that would fail if broken, each test maps to a stated
claim, no test mocks what it claims to verify, known flakes are quarantined with their
evidence recorded, and the suite runs clean at the current baseline.
