---
name: audify
description: Audit the health of a repo, config, or running system that has no stated spec. Agrees the standard first, backs every finding with a reproducible measurement, grades severity against effort, and delivers one self-contained HTML report. Use for "audit this" or "what shape is this in".
---

# Audify

A subject in, a defensible account of its condition out. Nobody hands you requirements,
so setting the standard is half the work. The main risk is a confident list of findings
that were never measured: a wrong finding in a document called an audit gets believed.

## 1. Boundary and standard, before looking

State the boundary in one line: what is in, what is out, as of when. Then write three to
six criteria, derived from the subject's own stated goals (README, docs, what the user
said it is for) and what failure would cost, not from a generic checklist. For a large
audit, show the criteria to the user before the deep pass. If the subject's intent
cannot be reconstructed, that is the first finding.

## 2. Evidence: reproduce it or do not claim it

Every finding carries a measurement or observation plus how to reproduce it (the exact
command, or the section and sample rule). An estimate written as a number is a
fabrication.

- Never report the subject's claim about itself as a finding. A comment saying the
  cache invalidates, or a health endpoint saying OK, must be verified or attributed.
- Run the check you are reluctant to run.
- Label provenance when it matters: observed, derived, self-claimed, or unverified.
  Only observed and derived evidence can support a finding.
- For large subjects, sample deliberately and state how. Coverage is part of the result.

## 3. Grade on two axes

| | Low effort | High effort |
|---|---|---|
| **High severity** | Do now | Plan it |
| **Low severity** | Sweep in one batch | Accept, deliberately |

Drop what CI or linters already enforce, cost-free preferences, and anything without a
location and a first step. Cap the report at fifteen findings; if more survive, the
boundary was too wide, so split the audit. Include a short "what is sound" section.

## 4. The report

After the findings are settled, read [references/html-report.md](references/html-report.md)
and build one self-contained HTML file at `audits/<date>-<slug>.html` unless the user
names a path. Open it and check it renders before delivery. Return the path and a
one-sentence verdict.

Never put a secret, token, or key in the report; state that one exists and where. If
the report will leave the owner's hands, strip names and paraphrase quotes but keep the
measurements.

Skip the page for a single file or a direct question: answer in chat.
