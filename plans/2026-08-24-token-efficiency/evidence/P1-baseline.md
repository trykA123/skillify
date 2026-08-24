# P1 baseline — installed Orientify selection

**Revision:** `e1f1342100fa153c383611c958450d7306a6810d`

**Request:** `I do not know this codebase. Show me how a login request travels through it, name the dangerous assumptions, and do not change anything.`

## Observed event order

1. Codex announced Orientify.
2. Codex read the installed `/home/claud/.codex/skills/orientify/SKILL.md`.
3. Codex emitted an inferred-route receipt instead of selectable choices.
4. Codex ran workspace discovery commands and continued the orientation.

Representative pre-work response:

```text
Inferred route: Standard weight, concise operational brief, solo ownership. I’ll inspect
the documented architecture, identify the login entry point, trace one request through
every touched module, check history/tests/dependencies, and leave the tree untouched.
```

The first workspace command combined `pwd`, file discovery, `git status`, and `git log`.
This is a failure of R1/R2: the request is substantial, no 2–4-entry card appeared, and
task work began without a user selection.

## Evaluation correction

The first natural-flow prototype pasted the complete contract into the candidate's user
prompt and passed. That result was rejected because it did not reproduce installed skill
activation. The accepted regression path sends only the user request through the native
installed instructions and inspects JSON events. Loading `SKILL.md` itself is allowed;
workspace commands before selection are not.
