# Heavy packet overlay

Read [Standard](standard.md) first and keep its packet intact. Use this overlay only
when Shapeify selects Heavy.

## Required additions

- Name the **decision owner** for destructive actions, production mutations, security
  posture and accepted Material risk. A worker cannot inherit approval by implication.
- For each acceptance check, name the **proof owner** and whether proof is static,
  fixture-based, live or owner-observed. Never let static proof stand in for a live
  property without saying so.
- Add **rollback and recovery**: protected state, backup or restore mechanism, rollback
  trigger, exact recovery check and the point after which rollback changes.
- Add **execution topology**: dedicated branch/worktree boundaries, the single writer,
  read-only parallel lanes, integration owner and allowed handoff order.
- Give every slice a committable boundary and name the evidence required before the
  next slice begins.

## Heavy stop conditions

Stop for missing mutation authority, an unverified backup, unexplained data or contract
drift, a failed recovery drill, a writer collision, or evidence that the topology cannot
satisfy an invariant. These are decision failures, not invitations to improvise.
