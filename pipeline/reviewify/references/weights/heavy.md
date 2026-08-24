# Heavy review overlay

Read [Standard](standard.md) first. Heavy retains the ordinary severity scale and
verdicts while increasing independence and proof depth.

## Independence and coverage

- The reviewer must not be the implementation writer. If independence is unavailable,
  disclose it and do not issue Approve.
- Map every requirement and invariant to proof owner, proof type and observed result.
  Flag static or mocked proof used to claim a live property.
- Inspect branch/worktree and integration history for unrelated edits, missing slice
  boundaries or evidence from a different revision.

## Proof to execute

Safely trace and, where possible, execute a realistic failure path for every changed
production-data, auth, schema, deployment or public-contract boundary. Verify recovery
from the protected artifact rather than checking only that it exists.

For production mutation, reconcile intended and actual scope without exposing secrets.
For schema changes, check clean install, supported upgrade, repeat detection and failure
atomicity.

## Decisions

A Material risk may be accepted only by a named decision owner with a recorded reason.
The writer and reviewer may recommend acceptance; neither silently becomes its owner.
Missing destructive or safety-sensitive authority is Blocking.
