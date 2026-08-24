# Standard execution

Use the full Worker Packet and execute one ready slice at a time.

For each step, preserve its requirement and invariant mapping, granularity tag,
location, verification and failure signal. Write execution evidence beside the packet
when it has a plan folder. A slice is complete only when all acceptance checks pass and
the repository is green and committable at its boundary.

For a plan folder, write `evidence/S<n>-report.md`, update the index status, and name the
next ready slice. Include scope, outcome, a step table (granularity, files, verification,
result), an acceptance table (check, proof, result), deviations, residual risks and
follow-ups.

Hand the accepted implementation to Reviewify. The user may decline only after the
remaining risk is stated.
