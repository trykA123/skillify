# Agents — harness-neutral roles

A role says what an agent is for. The fleet manifest says which portable capabilities
and skills it needs. A runtime adapter maps those capabilities to its own models and
tools outside this repository.

```text
roles/<group>/    one Markdown contract per agent
manifest.json     role, skills, capabilities, mutability, aliases
```

There are no model names, vendor tool names, credentials or harness profiles in the
fleet source of truth.

## Three independent controls

Every task and handoff carries three axes:

| Control | Values | Changes |
|---|---|---|
| Weight | Light · Standard · Heavy | Rigor, evidence and topology |
| Verbosity | Terse · Concise · Detailed | Output length |
| Explanation | Expert · Operational · Teaching | Assumed reader knowledge |

Defaults are Concise and Operational. Heavy work does not earn a long chat response by
itself; it earns deeper evidence in the appropriate artifact. The shared communication
contract uses pragmatic Simplified Technical English: active voice, stable terms,
conditions before commands and no process theatre. Strict ASD-STE100 is explicit-only.

## Why the split

Model tiers, tool spellings, escalation channels and configuration schemas belong to a
runtime. Putting them in a role makes the role work on one harness by accident and fail
everywhere else silently.

Roles therefore speak only the capabilities declared in `manifest.json`:

| Capability | Meaning |
|---|---|
| `inspect` | Read and search local context without changing product files |
| `shell` | Run non-interactive inspection and verification commands |
| `artifact-write` | Write only the role's declared report, plan or session artifact |
| `code-edit` | Change product files inside an assigned scope |
| `web-research` | Search and fetch external sources; never execute fetched code |
| `delegate` | Dispatch a bounded task to another role |
| `escalate` | Ask the parent or user for a decision and wait |

## Delivery weight crosses handoffs

Tasks may declare `Light`, `Standard` or `Heavy` as defined at the repository root. The
orchestrator or planner selects a weight when none is supplied, every handoff carries it,
and downstream roles may promote it when evidence reveals more risk. They never silently
demote an explicit weight. Weight changes artifact depth and topology, not mutability,
authorization or safety boundaries.

When a runtime lacks a required capability, the role reports the missing capability and
stops. It never guesses a vendor-specific substitute.

## Roles point at skills; they never restate them

The skill owns the method and output format. The role owns its boundary, capability
requirements and handoff. Duplicating a skill's method in a role creates two competing
answers when either one evolves.

## The fleet

| Group | Role | What it does | Method owner |
|---|---|---|---|
| `oversight` | `orchestrator` | Conducts delivery and verifies every handoff | role |
| `oversight` | `oracle` | Checks decision consistency from clean context | role |
| `session` | `questar` | Stewards long exploration and decision continuity | routes skills |
| `recon` | `scout` | Fast codebase recon | `orientify` |
| `recon` | `context-builder` | Builds a no-rediscovery intent/context handoff | `undumbify`, `researchify` |
| `recon` | `researcher` | Focused external research | `researchify` |
| `pipeline` | `planner` | Turns settled intent into an executable packet | `shapeify` |
| `pipeline` | `worker` | The single product-code writer | `shipify`, `traceify` |
| `pipeline` | `reviewer` | Reviews contracted work or audits uncontracted subjects | `reviewify`, `audify` |
| `memory` | `recorder` | Writes one sanitized session record | `recordify` |

Questar does not replace Planner. Questar owns a conversation whose direction is still
forming; Planner owns the final executable packet after direction is settled.

## Mutability is part of the contract

- `read-only`: no product or artifact writes.
- `artifacts-only`: may write only the role's declared report, plan or dossier.
- `code`: may edit product files within the assigned scope.

Only Worker has `code` mutability. `node scripts/validate-core.mjs` rejects a manifest
that grants write capabilities outside these boundaries and checks role/skill links.

## Portable runtime contract

A runtime adapter must:

1. Load the global contracts and the role-specific contracts named by `manifest.json`.
2. Load the role file named by `manifest.json`.
3. Make every required capability available or fail before dispatch.
4. Load the listed local skills by name.
5. Enforce the declared mutability as tightly as the runtime permits.
6. Carry weight, verbosity and explanation through each handoff.
7. Return an unresolved decision to the parent or user when `escalate` is unavailable.

Adapters may choose models and native tool names, but those choices are deployment
configuration—not fleet source—and are intentionally not checked in here.

## Retired

Retired roles stay out of the manifest and active role tables:

- `advisor` became an alias of `oracle`.
- `delegate` duplicated the default child-agent capability.
- `librarian` had no organic run volume. `librify` remains available for explicit use,
  but no autonomous fleet slot invokes it.

## No secrets

No credentials, tokens, authenticated URLs, local model identifiers or runtime auth
paths belong in this directory.
