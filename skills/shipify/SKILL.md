---
name: shipify
description: Use for any request to implement, build, or change code, execute a plan, refactor, upgrade or migrate, or add tests. Finds every place a change touches, sets a baseline, verifies each step, classifies deviations, and checks the real result before calling it done.
---

# Shipify

## Weight

For a one-file change with an obvious check: read the target and `git status`, change
it, run that check, report the result. Heavy work still needs the safeguards in Finish.

For two or more files, or an unclear check, follow the full procedure below. Start with
a plan or three lines: outcome, steps with a verify command, and done-when.

## Load the matching reference

- Refactor or dead-code removal: [references/refactor.md](references/refactor.md)
- Dependency, framework, or schema migration: [references/migration.md](references/migration.md)
- Writing or fixing tests: [references/tests.md](references/tests.md)
- Parallel workers or test servers: [references/parallel.md](references/parallel.md)
- Releasing: use the `releaseify` skill

## Find every place the change touches

Before editing, list every place that reads, computes, or displays what you are
changing, not only the obvious one. Search for the field, the function, and any
duplicated logic that recomputes the same value (serializers, exports, reports,
emails, caches, admin views, direct store access). A requirement like "everywhere the
user sees it" is a list you build by searching, not by guessing. Each place on the list
gets a change or a stated reason it needs none.

## Baseline before the first edit

Confirm the branch and that existing uncommitted changes are not yours to absorb. Read
the owning code and its nearest test. Run the cheapest check that exercises current
behavior and record pre-existing failures as out of scope.

## Execute step by step

For each step: make the smallest coherent edit, run its verification, and record what
ran. A step is done when its check passes, not when the edit is made. Never start the
next step while the current one is red; name the cause of a failure before repairing it.

Group low-risk steps that share one check. Verify risky steps (data, auth, public
contracts, irreversible changes) one at a time.

Strong checks assert the property that matters. If order, position, focus, or
persistence is the behavior, assert that directly; a check that only finds the element
cannot see it move.

## Classify every deviation

| Found | Do |
|---|---|
| Typo, moved path, renamed API | Fix it and note it |
| Implementation bug | Repair it; requirements unchanged |
| Wrong plan assumption | Stop; propose the smallest plan amendment |
| Missing decision, conflicting requirements, scope change | Stop and ask |
| Something destructive or irreversible not already approved | Stop before acting and ask |
| Useful adjacent work | Note as a follow-up; do not do it |

## Finish

1. Run every acceptance check plus the project's build, type, lint, and test commands.
   Then exercise the new behavior through each place on your list, not only the one
   you edited first.
2. Look at the result itself: render the page, run the command, read the output. Passing
   checks and a broken artifact coexist easily.
3. Read the full diff for unrelated files, debug leftovers, and secrets.
4. An unavailable check is not a pass. Say which check did not run and why.

Report: what changed (files), how it was verified (commands and results), deviations,
residual risks, and follow-ups. Never report a check that did not run or an edit that
was not made.

Heavy work (production data, auth, schema, deployment, public contracts): use a
dedicated branch, prove the rollback restores before the first mutation, get explicit
approval right before each destructive step, and hand off to an independent `reviewify`
pass. Without independent review, report the work as partial.
