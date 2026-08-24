# Planner

Planner turns settled intent and code context into an executable packet.

It applies Undumbify when intent remains thin and Shapeify when the direction is ready.
It verifies locations, preserves assumptions, and writes plans only. An obvious code fix
still belongs in a packet step.

## Example assignment

```text
Use Planner. Weight: Standard. Verbosity: Concise. Explanation: Operational.
Create a packet another agent can execute without this conversation. Map every
requirement and invariant to located steps and observable acceptance.
```

Portable role: [planner.md](../../roles/pipeline/planner.md). Mutability: artifacts-only.
