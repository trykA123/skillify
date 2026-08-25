# Agents — harness-neutral roles

[← Repository guide](../README.md) · [Hands-on tutorial](../TUTORIAL.md) · [Manifest](manifest.json) · [Selection contract](contracts/selection.md) · [Fleet evals](../evals/agents/cases.json)

> **Skills own methods. Roles own authority. Adapters own native tools.**

The fleet contains ten portable roles. A role says what an owner may do, which skill
methods it uses, which capabilities it requires, and what its handoff must prove. Model
selection and native syntax stay outside these source contracts.

## Selection before dispatch

For substantial work, the parent presents two to four concrete routes and waits for the
user's choice. The recommendation comes first.

```mermaid
%%{init: {"themeVariables": {"fontSize": "22px"}, "flowchart": {"nodeSpacing": 35, "rankSpacing": 40}}}%%
flowchart TB
    Request --> Choices{2–4 routes}
    Choices --> Solo[One owner]
    Choices --> Recon[Recon → Planner]
    Choices --> Full[Planner → Worker → Reviewer]
    Choices --> Teach[Teacher → HTML lesson]
    Choices --> Custom[Customize four axes]
    Full --> Proof[Verified handoff]
```

The choice card shows plain impact first and compact controls second. It never grants
mutation authority. A tiny reversible task may use a one-line selection receipt and
continue.

Choosing Customize opens Weight, Verbosity, and Ownership, with Explanation available as
an optional extra. `Team` asks the
parent to propose an exact minimal role map; `Custom team` lets the user name roles. The
map shows each role's mutability and its coordinator, then waits for confirmation. A
simple sequential handoff stays parent-coordinated. Team selection alone never adds an
Orchestrator.

Selection happens once at the root. A child receives the confirmed receipt, its bounded
assignment, and the exact topology in the handoff. It starts that assignment without a
new card. Only a new material decision outside the boundary returns to the parent for a
fresh choice.

## Shared customization axes

| Axis | Values | Controls |
|---|---|---|
| Weight | Light · Standard · Heavy | Rigor, recovery, and evidence |
| Verbosity | Terse · Concise · Detailed | User-facing output length |
| Explanation | Layman · Operational · Expert | Assumed subject knowledge |
| Ownership | Solo · Team · Custom team | Bounded role topology |

Heavy work can remain Terse. Layman output can still use Heavy proof. These axes are
independent and carried unchanged through handoffs.

## Active roles

| Group | Role | Purpose | Mutability | Method skills |
|---|---|---|---|---|
| Oversight | [Orchestrator](guides/orchestrator/README.md) | Selects the smallest topology and verifies handoffs | artifacts-only | — |
| Oversight | [Oracle](guides/oracle/README.md) | Checks decision consistency on clean context | read-only | — |
| Session | [Questar](guides/questar/README.md) | Preserves a long exploration until intent settles | artifacts-only | orientify, researchify, undumbify, shapeify, teachify |
| Recon | [Scout](guides/scout/README.md) | Returns fast, exact code locations | artifacts-only | orientify |
| Recon | [Context Builder](guides/context-builder/README.md) | Produces a no-rediscovery context pack | artifacts-only | undumbify, researchify |
| Recon | [Researcher](guides/researcher/README.md) | Returns focused current external evidence | artifacts-only | researchify |
| Pipeline | [Planner](guides/planner/README.md) | Produces an executable worker packet | artifacts-only | undumbify, shapeify |
| Pipeline | [Worker](guides/worker/README.md) | Owns the single product-code writer lane | code | shipify, traceify |
| Pipeline | [Reviewer](guides/reviewer/README.md) | Judges work against intent without rewriting it | artifacts-only | reviewify, audify |
| Teaching | [Teacher](guides/teacher/README.md) | Builds an interactive HTML lesson | artifacts-only | teachify, researchify |

## Authority model

```mermaid
%%{init: {"themeVariables": {"fontSize": "22px"}, "flowchart": {"nodeSpacing": 35, "rankSpacing": 40}}}%%
flowchart TB
    User[User / decision owner] --> Parent[Parent session]
    Parent --> Read[Read-only lanes]
    Parent --> Artifacts[Artifact-only lanes]
    Parent --> Worker[One code writer]
    Read -. evidence .-> Parent
    Artifacts -. packet / review / lesson .-> Parent
    Worker -. diff + checks .-> Parent
    Parent -. unresolved decision .-> User
```

- `read-only`: no product or artifact writes.
- `artifacts-only`: only the role's declared report, packet, dossier, review, or lesson.
- `code`: product-file changes inside the approved boundary.

Only Worker has `code` mutability. The validator rejects a broader manifest.

> [!WARNING]
> A role name never creates permission. The runtime must enforce the manifest as tightly
> as it can, and decisions remain with the user or named decision owner.

## Runtime adapter contract

A native adapter must:

1. compose the `base` contract profile;
2. add `interactive` only for a direct/root-capable definition, or `delegated` for a
   child definition;
3. add the role-specific contracts;
4. add the selected role file;
5. make required capabilities available or fail before dispatch;
6. load the role's method skills;
7. enforce mutability;
8. carry selection, weight, verbosity, and ownership through every handoff (explanation
   when set);
9. return unresolved decisions to the parent or user.

`globalContracts` remains the backward-compatible complete list. New adapters should use
`contractProfiles`: `base + delegated` for subagents and
`base + interactive + delegated` for definitions that can receive a user request
directly. Moving a contract into a separate file does not save input tokens unless the
adapter omits that profile from the generated prompt.

Generate supported adapters without choosing models:

```bash
./install.sh --native-agents codex,claude,opencode,copilot --update
```

The generator stores hashes in `.skillify-native.json`, refuses unmanaged collisions,
checks freshness, and removes stale managed definitions.

| Adapter | Direct/root interaction | Delegated behavior |
|---|---|---|
| Codex | Main session discovers skills | Native roles use base + handoff |
| Claude Code | `--agent` receives selection through `initialPrompt` | The same role body omits root-only contracts |
| OpenCode | `interaction: direct` roles render as `mode: all`; the rest are `mode: subagent` | Subagent-mode roles use base + handoff |
| VS Code/Copilot | `interaction: direct` roles are user-invocable team entries | Remaining roles are model-invocable subagents |

The Copilot adapter writes personal `.agent.md` files to `~/.copilot/agents` or project
files to `.github/agents`. Its capability map grants `read` + `search` for inspection,
`web` for external research, `execute` for shell work, `edit` only to declared writers or
artifact owners, and `agent` only to roles that may delegate.

## Writer topology

At most one role writes product code in one working directory. Parallel writers require
isolated working directories and one named integration owner. Read-only lanes may inspect
the same revision.

Stop on a writer collision, ambiguous dirty-state ownership, or evidence belonging to a
different revision.

## Handoff minimum

Every delegated result contains:

- assigned outcome and boundary;
- completed, partial, or blocked status;
- artifacts or exact evidence locations;
- checks actually performed and their observed results;
- disproved assumptions, deviations, and residual risks;
- unresolved decisions and the next valid owner.

Raw internal narration and unsupported success claims are not handoffs.

## Plain language

The communication contract uses pragmatic Simplified Technical English: active voice,
concrete subjects, stable terms, conditions before commands, and no filler or ceremonial
orchestration prose. Strict ASD-STE100 rules apply only when explicitly requested.

## Add or change a role

1. Add the portable role under `roles/<group>/<name>.md`.
2. Add its manifest entry, capabilities, mutability, contracts, and method skills.
3. Add a guide with a meaningful Mermaid diagram.
4. Add selection, authority, boundary, and handoff cases where relevant.
5. Run native adapter generation in an isolated directory and check it.
6. Run `node scripts/validate-core.mjs` from the repository root.

No credentials, model identifiers, vendor commands, or local authentication settings
belong in a portable role.
