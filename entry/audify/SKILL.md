---
name: audify
description: Audits a subject that came with no contract — a repo, a discussion, a config, a running system — by fixing the standard before looking, measuring every claim, and grading findings on severity against effort. Ships a single-file HTML report a stranger can act on. Use for "audit this", "what shape is this in", "where are the bodies buried".
---

# Audify

**Interaction gate.** Infer `Weight: Light | Standard | Heavy`,
`Verbosity: Terse | Concise | Detailed`,
`Explanation: Layman | Operational | Expert`, and
`Ownership: Solo | Team | Custom team`. Default to Concise, Operational, and Solo; never
require a control block.

After loading this skill, substantial work stops at a two-to-four-entry choice card before
subject inspection, task tools, dispatch, or mutation. Multiple actions, a durable
artifact, or coordinated work is substantial even when clear. Put the recommended route
first and selectable **Customize** last; end and wait. Only a tiny, reversible request
with one obvious action may show a receipt and proceed. After selection, show one compact
final receipt before task work.

After **Customize**, show one second-stage selector explaining every Weight, Verbosity,
Explanation, and Ownership value, with inferred values preselected; accept only changes.
Team means the smallest useful roles; add an Orchestrator only for substantial
coordination. A delegated handoff carrying a confirmed receipt and exact topology
inherits the choices and must not reopen selection unless a new material decision falls
outside its boundary. Controls never weaken safeguards or grant authority.

**A subject in, a defensible account of its condition out.**

Reviewify judges a diff against a packet that states what was intended. Audify gets a
subject and nothing else. Nobody hands you the requirements, so **establishing the
standard is the first half of the work** — and skipping it is what turns an audit into a
list of whatever you happened to notice on the way past.

The failure mode is the confident inventory: findings phrased with the cadence of
measurement that were never actually counted. It reads as authoritative, and it is the
single way this skill does damage — a wrong finding in a document titled *audit* gets
believed and acted on.

## 1. Fix the subject and the standard — before looking

State the boundary in one line: what's in, what's out, at what point in time. An audit
with a soft edge grows until it's abandoned.

Then write the standard down — **three to six criteria, before you start looking.**
Derive them from the subject's own stated goals (README, CONTEXT, the brief, what the
user said it's for), from the invariants it clearly depends on, and from what breaking
would actually cost. Not from your taste, and not from a generic checklist.

Show the criteria to the user before the deep pass when the audit is large. A standard
you invented silently is one they can't disagree with, and the disagreement is the
cheapest correction available.

If the subject's intent genuinely cannot be reconstructed, that is finding number one,
at the top severity. Everything else is measured against a guess.

## 2. Gather evidence — reproduce it or don't claim it

**Every finding carries a measurement or reproducible observation, plus how it was
produced.** Include the exact command for tool-backed evidence; for discussions,
documents and other non-command subjects, cite the message positions, sections, sample
rule or comparison that another auditor could repeat. An estimate stated as a number is
a fabrication with good posture, and the reader has no way to tell it apart.

Label evidence by provenance when the distinction matters: **observed** (you produced
it), **derived** (reasoning from cited observations), **self-claimed** (the subject says
it), or **unverified** (the required check was unavailable). Findings require observed
or derived support. Self-claimed and unverified material may define a gap, never certify
the subject's condition.

Two rules that carry the whole skill:

- **Never report a claim the subject makes about itself as a finding.** A comment saying
  the cache invalidates, a doc saying the job runs hourly, an endpoint that reports its
  own health — verify it or attribute it. Repeating the subject's self-description back
  in an audit is how an audit certifies a bug.
- **Prefer the observation that could embarrass you.** Run the thing. Stat the files.
  Read the log. The check you're reluctant to run is the one with information in it.

What evidence means depends on the subject:

| Subject | Evidence is | Ask |
|---|---|---|
| Repo / codebase | Counts, greps, `git log`, test runs, dependency and dead-code checks | What does the code do, versus what does it say it does? |
| Discussion / transcript | Message positions, decisions made, claims asserted versus verified | What got decided, what got dropped, where did it loop? |
| Running system | Live probes, real responses, actual state, logs over a window | Does it behave now the way it's documented to? |
| Document / plan | Internal consistency, claims against their cited support | Which load-bearing claim has nothing under it? |

Sample deliberately when the subject is too large to read whole, and **say what you
sampled and how you chose** — coverage is a finding, not a footnote.

## 3. Grade on two axes

An audit has no merge to block, so severity alone doesn't tell anyone what to do Monday.
Grade each finding on **severity** (what it costs if left) and **effort** (what fixing
it costs), and the ordering falls out:

| | Low effort | High effort |
|---|---|---|
| **High severity** | **Do now** — no reason to wait | **Plan it** — the roadmap items |
| **Low severity** | **Sweep** — batch into one pass | **Accept** — name it, decide not to |

**Accept is a real verdict, not a bin for leftovers.** An audit that recommends fixing
everything has ranked nothing.

## 4. Filter hard

Drop anything that restates what a linter, type-checker or CI already enforces; is a
preference with no cost attached; proposes rebuilding something outside the boundary; or
can't be stated with a location, reproducible evidence and a concrete first step.

Cap it at **fifteen findings**. A report that lists everything gets read as noise and
actioned as nothing. If more survive the filter, the boundary was drawn too wide — say
so and split the audit rather than shipping a page nobody finishes.

**Report what's healthy too**, in its own short section. An audit that is only a charge
sheet gets read as an attack and defended against instead of acted on — and knowing
which parts are sound is what makes the rest safe to change.

## 5. The page

One self-contained HTML file: inline CSS and JS, no CDN, no external fonts or images, no
network at runtime. It gets opened from disk, mailed around, and read a year later. After
the evidence and findings are settled, read [the HTML report module](references/html-report.md)
fully before building the page. It owns the required structure, interaction, visual
semantics, responsive behavior, and render check.

Write to `audits/<date>-<subject-slug>.html` unless the user names a path. Return the path
and one-sentence verdict in chat. The page is not complete until you open and inspect the
rendered artifact.

## Sanitize when it travels

An audit of a private repo or a discussion holds paths, names and quotes. That's fine
for the owner. **The moment it's going anywhere else, paraphrase quotes to the point
being made, strip identifiers and credentials, and keep the measurements** — the numbers
are the part that transfers. Never let a secret, token or key reach the page, redacted
or otherwise; report that one exists and where, never its value.

## Skip when

A single file, one decision, or a direct question — answer in chat. A page carries real
cost to produce and to read, and it should be earned by a subject with enough surface
that a stranger would need the navigation.

## Before you ship it

Two questions, and they are the ones that decay first: **which finding could another
auditor not reproduce from what you recorded** — and would the severities look the same
to someone who has to spend their next week on this, or only to someone who had to write
something notable?
