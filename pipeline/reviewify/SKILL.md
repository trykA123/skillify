---
name: reviewify
description: Reviews implementation against intent with two modes — solo (findings + fixes only, no ceremony) and full (team handoff with ADRs and glossary). Auto-detects mode from topology. Use after shipify completes a slice, or to review a diff/PR.
---

# Reviewify

Judge the implementation against what was intended. Not against your taste. Not against
how you would have written it. Against the packet's requirements, invariants, and the
user's stated priorities and anti-examples.

## Mode Detection

| Signal | Mode |
|--------|------|
| Topology is single-agent, or findings go to same agent that built it | **Solo** |
| Topology is subagent, or findings go to a different human/agent | **Full** |
| User explicitly says "quick review" or "just tell me what's wrong" | **Solo** |
| User explicitly says "formal review" or "write it up for the team" | **Full** |

**Solo mode:** Findings + fixes. No ADRs. No glossary. No coverage matrix. No "What
Works" section unless something is genuinely surprising. The output is a punch list the
builder acts on immediately.

**Full mode:** Complete review report with ADRs, glossary entries, coverage matrix.
The output is a document a stranger can act on without asking follow-up questions.

## 1. Establish Scope

Determine what's under review:
- Plan folder + evidence report → review against slice's R*, I*, A*
- Worker Packet only → review against packet requirements
- Diff only → review against implied contract + repo conventions

Read the packet/plan BEFORE the diff. Reviewing diff-first anchors you to what was
written instead of what was required.

State the boundary: which files, which commit range, which slice.

## 2. Reconstruct Intended Design

In 3-5 lines: what should this code do, what contracts it honors, what invariants it
preserves, what failures it survives. Derive from packet when available, from surrounding
code when not.

If you can't reconstruct intent from available evidence → that's F1 at Blocking severity.

## 3. Review Through Lenses

Select the 3–4 lenses with real surface in this diff. Go deep on those — not shallow
on all nine. State which lenses you skipped and why (one line).

| Lens | Question |
|------|----------|
| Requirement fit | Satisfies R* IDs and nothing beyond scope? |
| Invariant safety | Each I* still true, including failure paths? |
| Boundaries | Module knows something it shouldn't? Layer skipped? |
| Contracts | Public signatures/schemas/events change compatibly? |
| Failure modes | What happens on timeout, partial write, retry, concurrent call? |
| Data integrity | Can this corrupt, orphan, or silently drop state? |
| Security | Inputs validated at boundary? Secrets out of logs? Auth server-side? |
| Priority alignment | Does the implementation respect the stated priority ordering? |
| Anti-example check | Does it produce anything the user said it must NOT be? |

Selection heuristic: Requirement fit + Invariant safety are always in (they're the
contract). Pick 1–2 more from the rest based on what the diff actually touches. A
one-file internal helper doesn't need Security + Contracts + Data integrity.

Trace at least one realistic failure path end-to-end through the selected lenses.

## 4. Grade Findings

| Severity | Meaning | Effect |
|----------|---------|--------|
| **Blocking** | Violates requirement, invariant, contract, or safety | Merge stops |
| **Material** | Correct today but carries real risk or debt | Fix now or accept explicitly |
| **Advisory** | Improvement with no correctness consequence | Optional |

Filter out findings that:
- Restate what linter/type-checker already enforces
- Are naming/layout preferences with no comprehension cost
- Propose rewriting code the change didn't touch
- Can't be stated with a location and concrete fix

Cap Advisory at 3 in solo mode, 5 in full mode.

## 5. Write Findings

### Solo mode format (lean):

```markdown
### F<n>: <problem> [Blocking | Material | Advisory]
**Where:** `file:lines` → symbol
**Fix:** <concrete change — file, symbol, new behavior>
**Verify:** <command or observation>
```

That's it. No principle, no "if you disagree," no evidence paragraph. The builder was
in the room — they know the context. Give them the fix and the check.

### Full mode format (complete):

```markdown
### F<n>: <one-line problem> [Blocking | Material | Advisory]
**Type:** Defect | Risk | Preference
**Location:** `file:lines` → symbol
**Affects:** R<n>, I<n> | none
**Evidence:** What the code actually does.
**Why it matters:** Concrete consequence — who breaks, when, how.
**Principle:** The one-line rule this violates.
**Fix:** Specific change. Name file, symbol, new behavior.
**Verify:** Command or observation proving the fix.
**If you disagree:** What evidence would make this finding wrong.
```

## 6. Record Durable Decisions (Full Mode Only)

### ADRs
Write only when ALL three hold:
1. Constrains future work beyond this diff
2. A real alternative was rejected for a stated reason
3. Reversing later costs real work

Write to `docs/adr/NNNN-<slug>.md` (or repo's existing location).

### Glossary
Promote a term only when ALL three hold:
1. A competent engineer wouldn't guess the meaning
2. It appears in code/API/schemas (not just prose)
3. Misreading it causes a real mistake

Write to `docs/GLOSSARY.md` (or repo's existing location).

**Solo mode skips this entirely.** If a decision is worth recording, note it as a
follow-up — don't block the review on documentation ceremony.

## 7. Verdict

| Verdict | Condition | Route |
|---------|-----------|-------|
| **Approve** | No Blocking; Materials accepted as risks | Done |
| **Approve with fixes** | Blocking exists but design holds | → shipify |
| **Rework** | Implementation wrong, plan sound | → shipify |
| **Replan** | Plan itself is wrong | → shapeify (Packet Defect) |

## 8. Emit Report

### Solo mode:

```markdown
## Review: <scope>
**Verdict:** <verdict>

### Findings
<findings in lean format>

### Follow-ups
<out-of-boundary observations, or None>

**Skill map signal:** <one evidence entry, or "none">
```

The skill map signal is passive harvesting. One honest phrase about the
input quality: was the intent clear enough to review against? Did the packet's
requirements make the review trivial, or did ambiguity cause findings? Format:
`"P5 positive: scope boundaries were explicit, zero out-of-scope code"` or `"none"`.

### Full mode:

```markdown
## Review Report

### Verdict
<verdict>

### Scope
<commit range / files / slice>

### Intended Design
<3-5 line reconstruction>

### What Works
<decisions worth keeping — specific, not filler>

### Findings
| ID | Severity | Type | Location | Summary |
<then full findings>

### Coverage
| Requirement / Invariant | Verified by | Result |

### ADRs
<path, title, status; or None with reason>

### Glossary
<terms added; or None>

### Follow-ups
<out-of-boundary issues; or None>
```

When a plan folder exists: write to `reviews/S<n>-review.md`, update README status.

## Invocation Brake

Skip for: one-line change with passing test, a revert, generated-file update, direct
question about code. Review is a gate, not a tax.

## Final Gate

- [ ] Mode detected and declared
- [ ] Scope and intended design stated before findings
- [ ] Packet/plan read before diff (when available)
- [ ] Every applicable lens applied; one failure path traced
- [ ] Priority alignment and anti-example lenses checked
- [ ] Findings have location + fix + verify (both modes)
- [ ] Severities honest; preferences not disguised as defects
- [ ] Solo mode: no ADR/glossary ceremony
- [ ] Full mode: ADRs and glossary pass their three-tests-each bar
- [ ] Exactly one verdict, routed correctly
