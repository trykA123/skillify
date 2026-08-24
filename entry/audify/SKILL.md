---
name: audify
description: Audits a subject that came with no contract — a repo, a discussion, a config, a running system — by fixing the standard before looking, measuring every claim, and grading findings on severity against effort. Ships a single-file HTML report a stranger can act on. Use for "audit this", "what shape is this in", "where are the bodies buried".
---

# Audify

**Controls are optional.** Infer `Weight: Light | Standard | Heavy`,
`Verbosity: Terse | Concise | Detailed`, and
`Explanation: Layman | Operational | Expert`; default to risk-based weight, Concise,
and Operational. Never require a control block. Before substantial work, offer two to
four concrete approaches through the runtime's choice UI or a numbered list; recommend
one and wait for the selection. For a tiny obvious request, show a one-line selection
receipt and proceed. Controls never weaken evidence, safety, or authorization.

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
network at runtime. It gets opened from disk, mailed around, and read a year later.

**Required structure:**

- **The verdict, readable in ten seconds** — the subject, the boundary, the date, one
  sentence on its condition, and the counts by quadrant. Someone who reads only this
  block should know whether to worry.
- **The standard** — the criteria from step 1, stated plainly, so the reader can dispute
  the yardstick rather than only the findings.
- **The action grid** — the severity × effort matrix as the report's navigation. Clicking
  a quadrant filters the findings below it. This is the one interaction worth building.
- **Findings** — each with severity, effort, location, the measurement or observation,
  its provenance, the reproduction method, and a concrete first step. Evidence collapsed
  by default, one click away.
- **What's sound** — the healthy part, short.
- **Coverage** — what you looked at, what you sampled, **and what you did not examine.**
  This is the honesty field. A report without it implies total coverage it doesn't have.

**Making it worth reading.** Boring is the reader bouncing off in the first screen, and
the cure is density and navigability, not decoration. Give the page **one structural
idea** — the grid — and execute it properly, rather than fifteen effects competing.
Findings should be scannable at a glance and deep on demand. A real type scale, a
generous measure, monospace confined to code and commands.

Colour in **OKLCH**, always. Two palettes that must not blur: severity is a status ramp,
categories are a categorical set — a category rendered in the red of "critical" reads as
critical, and that's a chart lying. Both palettes need to survive a greyscale print and
the common colour-vision deficiencies, so never carry meaning in hue alone.

Charts only where a count is genuinely easier to see than to read: a distribution across
time, a composition, findings per area. Hand-write inline SVG from the real numbers —
never a chart library, never a pie chart of more than four things, never a chart of
three values a sentence would carry better. Every chart states its n.

Dark and light both, via `prefers-color-scheme`. Responsive enough for a laptop; tables
and wide blocks scroll inside their own container, never the page.

Write it to `audits/<date>-<subject-slug>.html` unless the user names a path, and tell
them the path plus the one-sentence verdict in chat. **Open it and look at it before you
call it done** — an audit delivered unrendered is a claim you didn't verify, in a
document about not doing that.

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
