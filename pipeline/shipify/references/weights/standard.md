# Standard execution

Use the full Worker Packet and execute one ready slice at a time. The canonical plan
index is `index.md`; a standalone packet may use `[STANDALONE]` provenance when no
Intent Brief was supplied.

For each step, preserve its requirement and invariant mapping, granularity tag,
location, verification and failure signal. Write execution evidence beside the packet
when it has a plan folder. A slice is complete only when all acceptance checks pass and
the repository is green and committable at its boundary.

For a plan folder, write `evidence/S<n>-report.md` and name the requested lifecycle
status and next ready slice in that report. The parent or named integration owner
updates `index.md`; Shipify must not mutate it. Include `schemaVersion: 1`, scope,
outcome, a step table (granularity, files, verification, result), an acceptance table
(check, proof, result), deviations, residual risks and follow-ups.

Hand the accepted implementation to Reviewify. The user may decline only after the
remaining risk is stated.
