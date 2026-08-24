---
name: librify
description: Compiles verified lessons into the library and recalls them on demand — evidence-linked, valenced so failures are shelved as bluntly as wins, sanitized on entry, and recalled as bounded top-k summaries rather than dumps. Use for "check the library", "what did we learn about X", or a post-run compile.
---

# Librify

**Output controls:** Inherit `Verbosity: Terse | Concise | Detailed` and
`Explanation: Expert | Operational | Teaching`; default to Concise and Operational.
These control presentation, never evidence or safety. Use plain technical English:
active voice, stable terms, conditions before commands, and no filler or process theatre.

Agents forget. Every run rediscovers what a previous run learned, or repeats a mistake
that already cost a repair loop. The library is the fix — and it is a **reference shelf,
not a brain**.

The librarian writes; agents never self-publish. Recall is a bounded lookup, never an
ambient dump.

The library lives in the configured knowledge-library root. The location is runtime
configuration; the method below is the same everywhere.

## Compile only from verified sources

Every entry comes from a **verified artifact** — a session record, field report, commit
or research brief — or from the owner's explicit "keep this" / "never again".

**No citation, no entry.** An entry that can't point at something is an opinion, and
opinions shelved next to evidence are how a library becomes a rumour mill.

## Valence, stated bluntly

Every entry is **positive** (a pattern that worked) or **negative** (a post-mortem: we
tried this, it failed, don't repeat).

Negatives get the same plain treatment as positives — the failure mode, what happened,
why, the guardrail, the evidence. No sugar-coating and no self-flagellation. Most memory
systems only keep wins, which is precisely why they keep re-teaching the same mistake.

## Sanitize on entry

Paraphrase first, strip identifiers, paths and verbatim speech, then run the privacy
audit over the draft. **Gate must be clean** before an entry moves from `seed` to
`accepted`. A tripped entry stays a seed or is rejected — never accepted raw.

## Bound the recall

Return **at most five** summaries, never full entries. Each carries id, valence,
category, status, a one-line summary, its evidence link and a confidence.

Superseded entries surface only their superseding pointer. Results are flagged as
library-derived — a reference, not an instruction. **A broad query does not widen k, it
sharpens the terms.** Widening is how a shelf becomes a context dump.

```markdown
## Library Recall — "<query>"
**k:** <≤5> · flagged: library-derived (reference only)
1. **<id>** [<valence> · <category> · <status>] — <summary> — confidence: <high|med|low> — evidence: <link>
**Superseded surfaced:** <id → superseded_by, or none>
**Open gaps:** <what the library doesn't know yet, or none>
```

A post-run compile reports instead: what was shelved with its valence, what stayed a
seed because the gate wasn't clean, and the audit result.

## Tend it

Entries live `seed → accepted → superseded`. Promote a seed when the audit is clean.
Demote to superseded when the failure mode is moot — the guardrail became structural or
CI-enforced — or the principle was replaced. Record `superseded_by`.

## Status

**Experimental, explicit-use only.** The current shelf was hand-seeded and does not yet
show enough organic run volume to justify an autonomous librarian role. Keep the skill
installed so a user or parent agent can recall or compile deliberately; do not schedule
it, invoke it ambiently, or give it a fleet slot until real usage earns one.
