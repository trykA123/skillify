---
name: releaseify
description: Ship a release safely: pick the right version number from what really changed, write the changelog from merged work, and write the rollback plan before you deploy. Use when cutting a release, tagging versions, or preparing a deployment.
---

# Releaseify

**Interaction gate.** Apply [the shared interaction gate](references/interaction-gate.md)
before task work. Infer Weight, Verbosity, and Ownership; treat Explanation as opt-in.
Show a route card only when routes are genuinely contested after a quick look at the
subject, the work is Heavy, or a step is destructive or irreversible — otherwise proceed
on the inferred route with a one-line receipt.

**A release is a claim about the past, delivered to people who cannot see it.** The
version number claims what kind of change this is. The changelog claims what changed.
The rollback plan claims you can take it back. Make all three true before shipping.
In pipeline use, require Reviewify Approve and cite `P*`/`S*` per
[artifacts](references/artifacts.md). Follow [pipeline mode](references/pipeline-mode.md).

## Version honestly

Read what actually shipped since the last tag — merged commits, changelog fragments,
migration notes — and let that decide the bump:

- **Breaking** — public API, config format, stored data, or documented behavior removed
  or changed → major (or the project's equivalent signal).
- **Additive** — new capability without breaking anything → minor.
- **Fixes only** → patch.

If the request says "bump the minor" and the diff contains a breaking change, stop and
say so. A mislabeled version is a lie that costs downstream users their upgrade path.
Never relabel to fit a cadence.

## Changelog: every line traces to work

Each entry names the user-visible change and cites its commit, pull request, or packet.
Write for the operator who must decide whether to upgrade, not for the team who wrote
it: what changed, what it affects, what they must do about it. Internal refactors get
one line at most. Invented highlights are findings, not filler — if a section has no
evidence behind it, leave it empty.

## Rollback before deploy

For any release that reaches users, write the rollback path first and make it concrete:
previous artifact, revert command or redeploy target, data migration reversal or
accepted irreversibility, and who executes it. A rollback plan that assumes working
memory of the system is not a plan. If no safe rollback exists, name the point of no
return and get explicit approval before crossing it.

Heavy releases add: staged rollout order, health checks observed between stages, and a
named owner for both go and revert decisions.

## Done when

The tag matches the honest version of the diff, every changelog entry cites real merged
work, notes name required user actions explicitly, the rollback path is written and
owned, and the release artifacts are built from exactly the tagged revision.
