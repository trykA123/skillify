# Standard review

Map every requirement and invariant to observed proof, review the selected additional
lenses deeply, and execute or inspect at least one realistic failure path.

Solo output contains located findings, fixes, verification, follow-ups and one verdict.
Full output additionally contains scope, reconstructed design,
what works, a findings table, and a coverage table mapping each requirement and
invariant to proof.

With a plan folder, write `reviews/S<n>-review.md` and state the lifecycle transition
(`done`, `changes-requested`, or `blocked`) in that review. The parent or named
integration owner updates the canonical `index.md`; Reviewify must not mutate it because
the reviewer is artifacts-only. Do not create an ADR or glossary entry merely to
complete the format.
