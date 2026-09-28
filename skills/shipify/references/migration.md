# Migration

Contracts move under living code. Pin where you are, read where you are going, land one
hop at a time.

- **Baseline:** record current versions and lockfile, and confirm build, tests, lint,
  and startup are green. If the baseline is red, stop and report it: a migration on a
  red baseline hides its own regressions.
- **Read upstream notes** for every intermediate major version, not only the target.
  For each note that touches your code, record the symbol, your usage count, and the
  documented replacement. When notes and behavior disagree, trust observed behavior and
  record the difference.
- **One hop at a time:** one major version or one schema change per hop. Isolate hops
  that change public API, stored data, auth, or runtime requirements. Batch the
  mechanical fallout (call sites, codemods, types) inside a hop. Re-run the baseline
  after every hop. Prefer official codemods, and review their output.
- **Stored data is Heavy.** Prove the backup restores before the first transform.
  Expand, then contract: add the new shape, backfill, dual-read or dual-write, switch
  readers, and retire the old shape in a later hop. Never combine an irreversible
  transform with a code-path change. If no reversible route exists, name the point of
  no return and get explicit approval before crossing it.
- **Stop** when the target removes a capability the product needs, or the notes
  invalidate the plan. Return what the notes claimed, what you observed, and an amended
  route.

Done when every hop landed green, the lockfile and migration files are committed, data
transforms have restore evidence, and unverified upstream claims are listed.
