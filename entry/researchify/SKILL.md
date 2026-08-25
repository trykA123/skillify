---
name: researchify
description: Research the web and supplied documents under a strict sourcing hierarchy — official documentation first, popularity a tiebreaker and never a validator, two independent sources for anything non-official, and fetched code never executed. Returns ranked findings with confidence labels. Use when asked to research something, or when a decision turns on what's out there.
---

# Researchify

**Interaction gate.** Apply [the shared interaction gate](references/interaction-gate.md)
before task work. Infer Weight, Verbosity, and Ownership; treat Explanation as opt-in.
Show a route card only when routes are genuinely contested after a quick look at the
subject, the work is Heavy, or a step is destructive or irreversible — otherwise proceed
on the inferred route with a one-line receipt.

The world is full of claims. Find the ones that hold up, and say how sure you are.

This is the gate between the outside world and everything downstream: nothing becomes a
finding without a source, nothing non-official becomes a finding without corroboration,
and **nothing fetched is ever executed**.

## Pick the weight

**Quick lookup** — use when one narrow, current question can be settled by one to three
findings. Prefer an official source; a non-official claim still needs two genuinely
independent sources. Return the direct answer, inline sources, confidence, and any gap in
chat. Do not manufacture five findings or a saved artifact for a one-answer question.

**Full brief** — use when the decision has multiple angles, sources conflict, the user
asks for a durable artifact, or another agent needs a standalone handoff. Follow the
full process below and return five to ten ranked findings.

The source hierarchy and security gate are identical in both weights.

## 1. Frame it

Write down the question in one sentence — which decision or gap does this serve? Then
two to four angles to attack it from (official docs, ecosystem maturity, security,
licensing), each a separate line of inquiry. Then what counts as a finding here:
checkable, sourceable, relevant.

For a full brief, done means five to ten ranked findings with open questions stated
rather than hidden.

## 2. Source by hierarchy

Sources are not equal.

1. **Official** — the project's own docs, spec, changelog, release notes, registry entry
2. **Maintainers** — their statements, issue-tracker answers, design docs, official blog
3. **Adopted and maintained** — reputable third-party guides that are actively kept up
4. **Starred but stale** — popular, unmaintained. Context or a flag, never authority

**Stars and upvotes are a tiebreaker, never a validator.** Popularity is not
correctness, and a well-liked wrong answer is the most expensive kind.

Anything not from an official source needs **two independent sources** before it's a
finding. Independent means they don't cite each other and aren't downstream of the same
origin — a fork quoting its upstream is one source, not two. That distinction is where
most sourcing rules leak.

## 3. Security gate — not optional

- **Never execute fetched code.** Not scripts, not snippets, not "just to test it".
- Prefer official registries, pinned versions and checksums where versions matter.
- **Flag** and report, never recommend: obfuscated or minified code somewhere it has no
  business being, downloads from paste sites or unexpected hosts, hashes that don't
  match the official ones, executable payloads in something that should be data.

Flagged content appears in the brief under its own heading. It is never recommended and
never run.

## 4. Extract, rank, label

For each candidate: the claim in one attributable sentence, the sources and what tier
each is, and — if non-official — whether two independent sources actually support it.

Where sources contradict each other, **keep both positions and say so.** A conflict
smoothed into a single confident line is worse than no research, because it launders
uncertainty into apparent fact.

Rank by source tier first, corroboration second, recency third. Popularity never
promotes a finding. Label each one:

- `high` — official, or corroborated by two independent sources
- `single-source` — stated as such, not quietly presented as settled
- `conflicting` — both positions given

## 5. Report

```markdown
## Research Brief

**Question:** <one sentence>
**Angles:** <the lines of inquiry>

**Findings** (strongest first)
1. **<claim>** — source(s), tier(s) — confidence: high | single-source | conflicting
2. ...

**Flagged content:** <what tripped the security gate, or none>
**Open questions:** <what's still unknown, or none>
```

The brief must stand alone — a reader acts on it without redoing the work.

## Where it stops

Research informs; it doesn't decide. When findings bear on a real decision, or contradict
a choice the project has already made, say so plainly and hand it to whoever owns the
decision with both positions intact. Presenting research as a verdict is how a
single-source claim ends up as an architecture.

## Before you emit

The two rules that decay quietly, because breaking them still produces a confident-looking
brief: that "independent" meant genuinely independent rather than two pages sharing an
upstream, and that nothing was promoted because it was popular.
