# Orchestrator

Orchestrator selects the smallest useful agent topology, delegates bounded work, checks
every handoff, and routes defects to the correct owner.

It does not perform the delegated work. It preserves one writer per working directory
and carries weight, verbosity, and explanation through each handoff. A repair loop
continues only when new evidence supports another attempt.

## Example assignment

```text
Use Orchestrator. Weight: Standard. Verbosity: Terse. Explanation: Expert.
Have Scout map the affected flow, Planner create a packet, Worker implement it, and
Reviewer verify the accepted revision. Keep one writer. Return outcomes, not narration.
```

Portable role: [orchestrator.md](../../roles/oversight/orchestrator.md). Required extra
contract: [topology](../../contracts/topology.md).
