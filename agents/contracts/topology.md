# Writer topology contract

At most one role writes product code in a working directory. Parallel lanes are
read-only or use isolated working directories with a named integration owner.

Team selection does not automatically create an Orchestrator. The parent session
coordinates a simple sequential handoff. Add an Orchestrator only when coordination is a
substantial bounded responsibility: parallel lanes, branching handoffs, several roles,
integration ownership, or an iterative repair and review loop.

Before dispatch, name each lane's subject, mutability and output. Before integration,
confirm revision ownership and ensure evidence belongs to the revision being combined.
Stop on a writer collision, ambiguous dirty-state ownership or an integration path that
cannot preserve an invariant.

## Explicit topology requests

An explicit topology is a binding constraint, not a suggestion. A topology request may
declare:

```yaml
topology:
  exact_count: 4
  allowed_roles: [worker]
  forbidden_roles: [planner, reviewer, context-builder]
```

`exact_count` is the total number of dispatched roles. `allowed_roles` is a closed set:
every dispatched role must be in it. `forbidden_roles` is a hard prohibition: the
orchestrator may not add any listed role, stage or reviewer. If the request names exact
roles, that list is closed in the same way. Do not silently add stages, reviewers or
helpers to fill a preferred template.

If the binding topology cannot preserve a stated safety or capability invariant — for
example Heavy work explicitly requires independent review but `reviewer` is forbidden —
stop before dispatch, explain the smallest required topology change, and ask the parent
or user to approve it. Do not add the role while waiting. Multiple workers still require
separate worktrees and one named integration owner; `exact_count` never permits two
writers in one working directory.

Verify the facts an assignment hands down against the revision the lane starts from; a
wrong fact costs more than a missing one, because the receiver builds on it. Constraints
transfer better as named past failures than as principles.
