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
