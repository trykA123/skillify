---
name: librify
description: Compile verified lessons into the library (Shoin) and recall them on demand — evidence-linked, valenced (what worked AND what failed), sanitized entries. Write-only librarian: agents never self-publish; the librarian compiles from verified artifacts + owner feedback. Recall is bounded — top-k (≤5) summaries with confidence, status, and valence, never full dumps. Use when asked to "check the library," "what did we learn about X," after a run (post-run compile), or to capture owner feedback.
---

# Librify

Agents forget. Every run rediscovers what a previous run already learned — or
repeats a mistake that already cost a repair loop. Librify is the fix: a library
(Shoin) of evidence-linked, valenced lessons, compiled by the librarian and shelved
where any agent can look them up. Positive entries are patterns that worked; negative
entries are post-mortems — "we tried this, it failed, don't repeat."

The library is a location, librify is the method — the location is config-relative:
the library lives in `shoin/` of your knowledge repo (or wherever your setup points
the librarian). Point it at your own shelf; the skill below is the same everywhere.

This is the librarian's skill. It runs on demand ("check the library" / "what did we
learn about X"), after each run (post-run compile), and when the owner gives feedback
worth keeping. The librarian is write-only: it compiles from VERIFIED artifacts + the
owner's feedback, never from vibes, and agents never self-publish. Recall is a bounded
lookup — top-k summaries, flagged, never an ambient full-dump. The library is a
reference shelf, not a brain.

## When To Use

- "Check the library" / "What did we learn about X?"
- Post-run compile — after a run lands, harvest its verified lessons
- Owner feedback capture — "that worked" / "never do that again" worth shelving
- Before planning a task that touches ground already worked before
- Compiling a sanitized record into a durable, evidence-linked entry

## When NOT To Use

- Capturing a raw session record — librify compiles records into entries; it doesn't
  replace the records themselves
- Gathering external evidence — the library is internal memory, not the web; research
  belongs in its own step
- Teaching the owner a competency — the library serves the agents' memory, not a
  learning progression
- Dumping the whole library into context → forbidden by §4 (bounded top-k only)
- Publishing an agent's own opinion → forbidden (write-only librarian; agents never
  self-publish)

## 1. Compile From Verified Sources Only

The librarian writes; agents don't. Every entry is compiled from:
- **Verified artifacts** — session records, field reports, commits, research briefs
- **The owner's feedback** — explicit "keep this" / "never again"

**No citation → no entry.** An entry that can't point at a record, report, commit, or
brief is not shelved. Opinions and vibes are rejected at the door.

## 2. Assign Valence Honestly

Every entry is **positive** (a pattern that worked) or **negative** (a post-mortem:
we tried this, it failed, don't repeat). Negatives are evidence-linked failures, never
moods. State negatives as bluntly as positives — no sugar-coating, no self-flagellation.
The failure mode, what happened, why, the guardrail, the evidence. Nothing more.

## 3. Sanitize On Entry (the I1 gate)

Every entry is sanitized before it is accepted: paraphrase-first, strip identifiers,
paths, and verbatim speech. Run the privacy audit over the draft entry —
**gate=0 required** to move `seed → accepted`. A tripped entry stays `seed` or is
rejected; it is never accepted raw.

## 4. Bound the Recall

Recall returns **top-k (≤5)** summaries — never full entries, never an ambient dump.
Each summary carries **id · valence · category · status · one-line summary · evidence
link · confidence**. **Superseded entries surface only their superseding pointer.**
Results are flagged as library-derived (a reference shelf, not instructions). k is
capped at 5; a broad query does not widen k, it sharpens the terms.

## 5. Tend the Garden

Entries live `seed → accepted → superseded`. On the staleness audit: promote a `seed`
to `accepted` when the audit gate is green; demote an `accepted` entry to `superseded`
when its failure mode is moot (the guardrail is now structural/CI-enforced) or its
principle is replaced. Record `superseded_by`.

## 6. Report

```markdown
## Library Recall — "<query>"

**k:** <≤5> · **flagged:** library-derived (reference only)
1. **<id>** [<valence> · <category> · <status>] — <one-line summary> — confidence: <high|medium|low> — evidence: <link>
2. ...
**Superseded surfaced:** <id → superseded_by, or none>
**Open gaps:** <what the library does not yet know, or none>
```
For a post-run compile, report instead: entries shelved (id + valence), entries left
`seed` (gate not green), and the audit result.

## Topology Behavior

- **Single-agent:** librify compiles/recalls inline; the artifact is the recall brief or
  the shelved entries.
- **Subagent:** the librarian returns the bounded recall brief (or the compile report) to
  the parent. The parent decides; the library decides nothing on its own.

## Interaction With Pipeline

- **Harvests** durable, verified artifacts — session records, research briefs, commits —
  never raw chatter.
- **Feeds** planning at run start via the bounded lookup protocol (§4) — never by
  writing into another agent's context.
- The librarian never blocks the build pipeline; recall is advisory, flagged, bounded.

## Final Gate

- [ ] Compiled from verified artifacts / owner feedback only (no vibes)
- [ ] Every entry evidence-linked (≥1 citation)
- [ ] Valence assigned honestly (negatives are post-mortems, stated bluntly)
- [ ] I1 gate green (gate=0) before `accepted`
- [ ] Recall bounded (top-k ≤5), flagged, supersession respected
- [ ] No full dumps; no self-publishing; no writes into other agents' context
