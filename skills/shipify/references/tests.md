# Tests

A test is a bet that a behavior matters and can break. Write the bets you can defend.

- **Rank targets by risk.** Core promises (what the code exists to do) each get a proof
  that fails when the promise breaks. Expensive edges (money, auth, data loss,
  concurrency, public contracts) earn the awkward tests. Cover everything else through
  those proofs, not through trivial dedicated tests.
- **Coverage is an observation, not a goal.** If asked for a number, deliver the
  risk-ranked suite and report coverage alongside it.
- **One claim per test**, stated in its name: "X does Y when Z". A test you cannot
  phrase as a claim is a candidate for deletion.
- **Mock only what you cannot run.** Never mock the thing the test claims to verify.
  One honest integration test beats ten mock rehearsals.
- **Bug fix: failing test first.** Reproduce the bug as a test, watch it fail, then fix.
  If the bug cannot be expressed as a test, say so and record why.
- **Flaky tests:** quarantine with the symptom recorded, instrument timing, ordering,
  and shared state, then fix the test, fix the race, or delete it with written reasons.
  Never skip or delete one quietly.

Done when each core promise has a failing-when-broken proof, each test names its claim,
and the suite is green at the baseline.
