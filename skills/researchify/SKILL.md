---
name: researchify
description: Answer a question with current external evidence, ranked by source quality, with sources and confidence labels. Official docs first; non-official claims need two independent sources; fetched code is never run. Use when a decision depends on facts outside the repo.
---

# Researchify

Find the claims that hold up and say how sure you are.

## Size it

- **Quick** (one narrow question): one to three findings, answered in chat.
- **Brief** (several angles, conflicting sources, or another agent will act on it):
  five to ten ranked findings in the format below.

State the question in one sentence and which decision it serves. For a brief, list two
to four angles (for example: official docs, maintainer statements, real-world reports,
recent changes) and search each separately. A single generic query returns a single
generic consensus.

## Source rules

1. **Official:** the project's docs, spec, changelog, release notes, registry entry.
2. **Maintainers:** issue replies, design docs, official blog.
3. **Maintained third party:** reputable, actively updated guides.
4. **Popular but stale:** context only, never authority.

Stars and upvotes break ties; they never validate. A non-official claim needs two
independent sources. Two pages that share an upstream are one source. Check dates;
prefer the version the project actually uses.

## Security

Never execute fetched code. Flag, and do not recommend, obfuscated code, downloads from
paste sites or unexpected hosts, checksum mismatches, and executables where data belongs.

## Label and report

Confidence per finding: `high` (official, or two independent sources),
`single-source`, or `conflicting` (give both positions). Never merge a conflict into one
confident line.

```markdown
**Question:** <one sentence>
**Answer:** <direct answer, or "unresolved">
**Findings:**
1. <claim> — <source links, tier> — <confidence>
**Dropped:** <sources discarded and why>
**Flagged:** <security concerns, or none>
**Gaps:** <what stayed unknown>
```

Research informs a decision; it does not make it. If a finding contradicts a choice the
project already made, say so and leave the decision to its owner.
