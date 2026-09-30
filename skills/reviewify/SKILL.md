---
name: reviewify
description: Judge work against its intent, not taste. Reads the goal before the diff, goes deep on a few lenses, reports only located findings with a concrete fix, and issues one verdict. Also stress-tests a plan or decision before execution. Use to review a diff, PR, implementation, or plan.
---

# Reviewify

Work in, one evidence-backed verdict out.

## Order

1. **State the boundary:** which files, commits, or plan.
2. **Read intent before the diff:** the plan, issue, or request. Reconstruct the intended
   design in three to five lines. If intent cannot be reconstructed, that is the first
   Blocking finding.
3. **Pick lenses.** Always check requirement fit and invariants. Add one or two with real
   surface: failure modes, data integrity, security, public contracts, performance,
   concurrency. Say which lenses you skipped.
4. **Trace one realistic failure path end to end.** Run the code or tests when you can;
   reading is weaker evidence than running.

Verify claims about third-party tools against their `--help` or `--version` output.

For frame-driven film, check transition opacity separately from camera and particle
movement. Reduced-motion variants should retain dissolves; cover stills may use fixed
opacity. Sample frames on both sides of sequence mounts and fades to catch early cuts
or blank frames. Validate caption times as finite, ordered, positive intervals within
the measured media duration. Decode exported media completely; provisional timing and
speech-recognition matches alone do not prove synchronization or exact sung wording.

## Severity

| Severity | Meaning |
|---|---|
| **Blocking** | Breaks a requirement, invariant, contract, or safety property |
| **Material** | Works today but carries concrete risk; fix it or have the owner accept it |
| **Advisory** | Improvement with no correctness impact; only when you are sure, and zero is normal |

Drop anything a linter or type checker already enforces, preferences with no cost,
rewrites outside the change, and anything you cannot locate or fix concretely. Before
reporting a finding, check it against the code once more: a wrong finding costs more
than a missing advisory. If the work is sound, say so; that is a complete review.

Each finding: `[severity] file:line — problem — consequence — fix — how to verify`.

## Verdict (exactly one)

- **Approve:** no Blocking findings; each Material one is fixed or accepted by the owner,
  or is a narrow, non-security residual named with its location and impact in the verdict.
- **Fix:** Blocking findings exist; the design holds.
- **Replan:** the approach itself is wrong. Say which assumption failed.

After fixes, re-check only the prior findings, the changed lines, and their acceptance
checks, unless the repair changed the design.

## Plan or decision review

Review a plan against the decisions already made. Reconstruct those decisions first,
then look for drift: where the plan quietly contradicts one of them. Run a premortem:
assume the plan shipped and failed, and give the two to four most plausible failure
stories, cheapest to prevent first. Ground each story in the plan or the code.

## Independence

For Heavy work (production data, auth, schema, deployment, public contracts), the
reviewer must not be the author, and must check the same revision the evidence came
from. Without independence, say so and do not Approve.

Never edit the work under review. Describe each fix precisely enough to apply without
asking.
