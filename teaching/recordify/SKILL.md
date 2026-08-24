---
name: recordify
description: Writes a sanitized session record — the pattern practiced plus a de-identified gist, never verbatim quotes, paths, project names or identifiers — and refuses to write if the automated privacy gate finds anything. Called by tracked Promptify or Explainify sessions, or on an explicit "record this session".
---

# Recordify

**Output controls:** Inherit `Verbosity: Terse | Concise | Detailed` and
`Explanation: Expert | Operational | Teaching`; default to Concise and Operational.
These control presentation, never evidence or safety. Use plain technical English:
active voice, stable terms, conditions before commands, and no filler or process theatre.

Capture what a session practiced, with the privacy gate enforced rather than promised.

This is a subroutine more than a mode of work: tracked Promptify and Explainify sessions
call it when they finish. It fires at commit or push when the session's artifacts land,
or on an explicit "record this". Ephemeral teaching never records. **Never write a
record from memory of a session you didn't read, or from a transcript you haven't
opened.**

## The record

One markdown file per session, written to `RECORDS_DIR`, named `<id>.md`.

```markdown
---
id: sess-2026-08-02-name-the-referent
date: 2026-08-02
skill: promptify                # promptify | explainify | pipeline
competencies_touched: [P6, U2, W2]
outcome: completed              # completed | partial | abandoned (optional)
artifact: null                  # sanitized relative path, or null (optional)
evidence:
  - competency: P6
    note: "Under-specified ask cost a guessing round — the lesson was named in one line"
    valence: negative
  - competency: U2
    note: "Read the actual configuration before asking — the answer was in the file"
    valence: positive
---
# <Title — the pattern, not the project>

## What happened
<sanitized prose: the pattern, the cost, the fix>

## What worked
## What didn't
```

Competency ids are the skill map's vocabulary: `P1`–`P7` prompting, `U1`–`U4`
understanding, `W1`–`W3` pipeline. `evidence[].competency` must be one of them.

**Negative evidence is growth, not a stain.** A record with only wins in it is a record
that will teach nobody anything.

## The privacy gate — non-negotiable

Store the pattern and a sanitized gist. Never store:

1. **Verbatim quotes** — paraphrase to the lesson. A remark about how a theme feels
   becomes *"the felt effect was named first, then the fix."*
2. **Paths and URLs** → "a screenshot was attached", "the local config".
3. **Project, repo or product names** → their generic category ("a web app").
4. **Code or DOM identifiers** → their role ("a row container", "the rating function").
5. **Personal identifiers** — names, emails, handles, IPs, hex tokens, UUIDs.

**You paraphrase; the sanitizer only de-identifies.** Every evidence `note` is rewritten
by hand into a third-person gist with the meaning intact. `sanitizeNote` is a last-mile
pass — a note that still needs it is a note you haven't finished writing.

The gate is automated. `sanitize.mjs`, colocated beside this file, exports `scanRecord(md)`, which
is frontmatter-aware: it scans the free text that carries meaning — every
`evidence[].note`, the title, the body — and never the raw YAML, whose quoted scalars
would false-positive.

`<skill-dir>` below is the directory holding this SKILL.md — resolve it with
`dirname "$(readlink -f <path-to-this-skill>/SKILL.md)"`, since the install is a symlink
back into the repo and the flat harness layout has no `teaching/` parent.

```bash
bun -e "
import { scanRecord } from '<skill-dir>/sanitize.mjs';
import fs from 'node:fs';
let bad = 0;
for (const f of process.argv.slice(1)) {
  const leaks = scanRecord(fs.readFileSync(f, 'utf8'));
  if (leaks.length) { console.error('LEAKS in ' + f + ':\n' + leaks.join('\n')); bad++; }
  else console.log('clean: ' + f);
}
process.exit(bad ? 1 : 0);
" <records-dir>/*.md
```

**If it returns anything, the record is refused.** Paraphrase and re-gate; do not ship
it. `bun test <skill-dir>/sanitize.test.mjs` is the contract. `detectLeaks` covers
quoted spans, paths, URLs, emails, IPs, hex tokens, known identifiers and verbatim speech.
When a new identifier family shows up in real sessions, add it to the blocklist **with a
test case** — an unenforced rule here is worse than none, because the promise stays.

## Then

Write the file, and tell the user one line: which competency gained evidence, or which
gap was exposed. If the skill map app is running it picks the record up on its next
compile.
