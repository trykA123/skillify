# Worker Packet

**Weight:** Heavy

## Outcome

Skillify preserves its natural-request choice experience while using materially fewer
input tokens. Root-facing owners show one required route choice for substantial work;
confirmed controls and topology then pass to delegated agents without reopening the
selector. Native Codex, Claude Code, OpenCode, and VS Code/Copilot agent definitions load only the
contracts needed for their entry context. Automated measurements and natural-flow evals
prevent prompt-size regressions and false-positive selection tests.

## Scope

- **In:** skill and agent instruction loading; selection inheritance; native agent
  rendering; manifest compatibility; behavioral evals; token-footprint reporting;
  documentation; local native-agent regeneration after proof.
- **In:** conservative progressive disclosure for oversized `SKILL.md` entrypoints,
  beginning with Audify's HTML presentation instructions.
- **Out:** new skills or roles, model selection, provider-specific prompt tuning,
  changing the four control axes, changing role authority, or making Team the default.
- **Out:** reducing evidence quality merely to hit a size target.

## Requirements

- **R1:** A substantial natural request must produce two to four selectable routes and
  stop before tools, dispatch, or mutation; `Customize` remains the final selectable
  route.
- **R2:** The tiny-task receipt exception must be narrow and observable. A multi-command
  codebase trace, audit, lesson, plan, or coordinated change is never tiny solely because
  the user gave a clear scope.
- **R3:** A delegated role that receives a confirmed route, controls, and ownership map
  must inherit them and must not show selection or customization again.
- **R4:** Selection may reopen only when a new material decision falls outside the
  confirmed boundary; the agent must name that changed decision.
- **R5:** A delegated runtime prompt/body must omit root-only interaction contracts.
  Direct/root-capable definitions must retain the complete selection and Custom flow;
  direct-only metadata may carry it when the harness conditionally applies that metadata.
- **R6:** Codex, Claude Code, OpenCode, and VS Code/Copilot adapters must preserve role
  availability, mutability, managed-file hashes, install, update, check, and uninstall
  behavior.
- **R7:** A deterministic report must measure UTF-8 bytes and words for discovery text,
  activated skills, root-capable agents, and delegated agents. It must enforce reviewed
  budgets without claiming one vendor-neutral exact token count.
- **R8:** Skill entrypoint compaction must preserve standalone installation and load
  detailed modules only when their branch is used.
- **R9:** Evals must test both card quality and the model's unforced decision to pause.
  The evaluator must not instruct the candidate to return a card in the natural-flow
  case.
- **R10:** The tutorial must explain that selection happens once at the root and that
  child agents inherit the receipt.
- **R11:** The Copilot adapter must use personal `~/.copilot/skills` and
  `~/.copilot/agents`, project `.github/skills` and `.github/agents`, and `.agent.md`
  definitions. Orchestrator is the sole visible interactive Skillify root; the other nine
  roles are hidden, model-invocable children. Inspection maps to `read` + `search`, web
  research to `web`, shell to `execute`, and writes/delegation only to roles declaring
  `edit`/`agent` capabilities.

## Invariants

- **I1:** Selection, Weight, and Ownership never grant mutation or destructive authority.
- **I2:** Worker remains the only product-code mutable role; Reviewer remains independent.
- **I3:** Heavy triggers, recovery evidence, sourcing rules, and skill-specific quality
  bars cannot be removed to save tokens.
- **I4:** Portable skill, role, and contract sources remain vendor- and model-agnostic.
- **I5:** Natural language remains sufficient; users never need to type a control block.
- **I6:** `Heavy + Terse` and every other valid independent-axis combination continue to
  work.
- **I7:** Existing public manifest consumers either continue to work unchanged or receive
  an explicit schema-version migration with compatibility evidence.
- **I8:** Generated files remain reproducible from portable sources; local edits are not
  silently overwritten.

## Constraints and priorities

Correct selection behavior > authority and safety > adapter compatibility > measurable
token reduction > implementation neatness.

Do not equate Markdown modularity with token savings. A module saves input only when the
renderer or runtime omits it from the current context. Do not solve the problem by merely
renaming or moving eagerly concatenated text.

Use byte and word counts as stable cross-model proxies. If an approximate token range is
shown, label it as an estimate and state the character-per-token assumption. Do not add a
provider tokenizer to portable validation.

## Evidence

- **[FACT]** At `e1f1342`, the ten `SKILL.md` files contain 8,750 words and 56,062 bytes;
  at `ccd4c32` they contain 7,995 words and 50,740 bytes. The average increase is about
  75 words and 532 bytes per activated skill. — measured with `wc -w -c` and `git show`.
- **[FACT]** Current global agent contracts contain 1,195 words and 7,992 bytes; their
  corresponding pre-Custom set contains 719 words and 4,922 bytes. — measured from
  `agents/contracts/*.md` at the two revisions.
- **[FACT]** `scripts/render-agents.mjs` currently concatenates every entry in
  `manifest.globalContracts` into every generated role. — `compose()` and the render loop.
- **[FACT]** Codex responded to a substantial Orientify request with a route receipt and
  immediately ran repository commands instead of presenting choices and waiting.
- **[FACT]** The installed Orientify `SKILL.md` and repository source have the same SHA-256
  (`a1740773789cd0e9746858a70ed06499c69262da553a692f6e94c79b552f4fd5`).
- **[FACT]** Orientify already declares that the unfamiliar-flow and choice-card cases
  require a card. — `evals/orientify/cases.json`.
- **[FACT]** For required-card cases, `scripts/run-evals.mjs` adds the instruction
  `Return only the first route card shown before substantial work.` The current real-model
  eval therefore grades card content after forcing the phase; it does not prove that the
  model chooses to pause naturally.
- **[FACT]** Audify is the largest skill entrypoint at 1,702 words and 10,235 bytes; much
  of its page-design detail is needed only when producing the HTML artifact.
- **[ASSUMPTION]** Root-versus-delegated context can be represented without weakening
  direct OpenCode Questar/Teacher use. If adapter inspection disproves this, stop P3 and
  amend the profile design before changing the manifest.
- **[ASSUMPTION]** A reduction in eagerly rendered bytes will reduce input tokens across
  supported models. Exact savings vary by tokenizer; proof uses bytes, words, and actual
  harness usage where exposed.
- **[DECISION]** Selection and customization are root interaction concerns. Delegated
  agents receive the confirmed receipt plus the handoff contract.
- **[DECISION]** Add a natural-flow eval path instead of replacing phased evals: phased
  cases continue to test card quality, while natural cases test whether the gate opens.
- **[DECISION]** Prefer an additive, backward-compatible manifest profile. Increment the
  schema only if an old consumer cannot interpret the resulting manifest safely.

## Risk register

| Slice | Risk | Likelihood | Impact | Mitigation |
|---|---|---:|---:|---|
| Selection gate | Models still treat clear substantial work as tiny | Medium | High | Natural-flow cases across skills and real harness repetition |
| Contract profiles | A direct-capable agent loses its selection flow | Medium | High | Explicit root/delegated fixtures for all four adapters |
| Inheritance | Child silently accepts stale or partial controls | Medium | High | Require confirmed receipt, boundary, topology, and source owner |
| Manifest | Public consumers break on changed fields | Low | High | Additive schema first; fixture an old-format manifest |
| Compaction | Conditional detail is never loaded | Medium | High | Branch-specific eval declares required references and behavior |
| Budgets | Teams optimize to counts and remove useful safeguards | Medium | Medium | Reviewed exceptions and semantic evals remain authoritative |
| Installation | Regeneration overwrites user-edited native agents | Low | High | Preserve managed-hash conflict checks; inspect before `--force` |

## Ordered plan

### P1: Add an unforced selection regression [ISOLATE] — risk: high

- **Depends on:** none
- **Location:** `evals/schema.json`, `evals/orientify/cases.json`,
  `scripts/run-evals.mjs` → case execution and `evaluationPrompt()`,
  `scripts/test-eval-runner.sh`
- **Change:** Add an interaction mode such as `naturalPause: required` for cases that
  must decide to show a choice without evaluator coaching. Use the exact observed request:
  `I do not know this codebase. Show me how a login request travels through it, name the dangerous assumptions, and do not change anything.` In this mode, give the candidate the
  contract and user request but no `PHASE: SELECTION` or “return only” directive. Grade
  that the first response contains 2–4 selectable routes, ends with Customize, waits,
  and performs no task work.
- **Do not change:** Keep phased selection/customization/topology tests; they still test
  the quality of each card after the branch is entered.
- **Verify:** Run the new case against `e1f1342` with a real Codex adapter and record the
  expected failure before changing instructions. Then verify the fixture runner can fail
  when its natural response contains a receipt or simulated execution.
- **Failure signal:** The baseline passes because the evaluator still implies that a card
  is required, or the grader cannot distinguish a receipt from a selectable card.
- **Trap:** Rephrasing “Return only a card” as a grading rubric inside the candidate prompt
  still coaches the behavior and preserves the blind spot.

### P2: Make the selection gate and inheritance rule unambiguous [BATCH] — risk: medium

- **Depends on:** P1
- **Location:** control paragraph in all ten `SKILL.md` files;
  `agents/contracts/selection.md`; `agents/contracts/customization.md`;
  `agents/contracts/handoff.md`; related skill and fleet eval cases
- **Change:** State the gate operationally: substantial work must stop after the card;
  clarity of scope does not make multi-command work tiny. Add one inheritance rule:
  a child with a confirmed receipt and exact ownership map must not reopen selection.
  Define the only reopen condition as a new material decision outside the confirmed
  boundary.
- **Do not change:** Tiny reversible one-owner tasks may still use a receipt. Selection
  still does not create authority.
- **Verify:** `node scripts/validate-core.mjs`; the P1 natural case passes repeatedly;
  add a delegated-agent case where showing any choice card is forbidden.
- **Failure signal:** A child offers Customize again, or a root begins inspection before
  the user chooses.
- **Trap:** “If already selected, continue” is too vague; require provenance from the
  parent handoff and the exact confirmed topology.

### P3: Introduce explicit contract loading profiles [ISOLATE] — risk: high

- **Depends on:** P2
- **Location:** `agents/manifest.json`; `scripts/render-agents.mjs` → manifest loading,
  contract selection, `render()`; `scripts/validate-core.mjs` → manifest checks;
  `agents/README.md`
- **Change:** Represent at least three portable scopes: always/base (`core`,
  `communication`), interactive root (`selection`, `customization`), and delegated
  (`handoff`). Role-specific `topology` and `independence` remain additive. Have each
  adapter render the profile appropriate to the generated role's actual entry mode.
  Preserve direct/root-capable OpenCode modes or generate an explicit direct variant if
  one file cannot safely serve both contexts.
- **Do not change:** Capability and mutability maps, role descriptions, skill mappings,
  aliases, or provider-independent source language.
- **Verify:** Add validator failures for unknown, duplicated, and impossible profile
  combinations. Render all four harnesses into temporary directories and inspect one
  root-capable and one delegated definition per harness. Confirm delegated output omits
  the selection and customization bodies but includes handoff inheritance.
- **Failure signal:** One generated role loses a required base contract, a direct role
  cannot present choices, or an old manifest is silently misread.
- **Trap:** Keeping `selection` and `customization` in `globalContracts` while also adding
  profile metadata produces modular-looking files with no token reduction.

### P4: Add token-footprint reporting and budgets [BATCH] — risk: low

- **Depends on:** P3
- **Location:** new `scripts/report-token-footprint.mjs`; new reviewed budget data under
  `evals/`; `.github/workflows/ci.yml`; `scripts/validate-core.mjs` only if shared schema
  validation belongs there
- **Change:** Report discovery/frontmatter text, each activated `SKILL.md`, conditional
  references separately, each root agent, and each delegated agent. Support readable and
  JSON output plus `--check`. Store intentional upper bounds with a reason and optional
  exception per artifact.
- **Do not change:** Do not call counts exact model tokens. Do not fail because Markdown
  punctuation tokenizes differently on one provider.
- **Verify:** Run the report twice and byte-compare JSON after excluding timestamps. Add a
  fixture that exceeds one budget and must fail. CI runs `--check`.
- **Failure signal:** Conditional references are counted as eager input, or generated
  agent profiles cannot be measured independently.
- **Trap:** A single repository-wide total hides the cost actually paid per activation.

### P5: Compact high-cost skill entrypoints through progressive disclosure [BATCH] — risk: medium

- **Depends on:** P1, P4
- **Location:** `entry/audify/SKILL.md`; new focused references under
  `entry/audify/references/`; then only other skill entrypoints identified by P4;
  relevant eval `references` fields
- **Change:** Keep Audify's audit method, evidence rules, severity/effort grading, output
  contract, and safety rules in the entrypoint. Move detailed HTML visual-system guidance
  to a reference loaded only when producing the page. Consider other files only when a
  coherent branch can be extracted; do not chase a uniform line count.
- **Do not change:** The self-contained offline HTML requirement, evidence provenance,
  coverage honesty, sanitization, or visual verification.
- **Verify:** Audify semantic evals pass with the reference declared for HTML-output
  cases. P4 shows a smaller eager entrypoint and preserves the full branch footprint.
- **Failure signal:** A normal audit no longer knows its required artifact, or an HTML
  audit omits interaction/accessibility/sanitization behavior because the reference was
  not loaded.
- **Trap:** Moving essential activation or routing instructions behind a reference makes
  the model less likely to load the reference at the moment it is needed.

### P6: Prove behavior and quantify the result [ISOLATE] — risk: high

- **Depends on:** P3, P4, P5
- **Location:** generated temporary fixtures; `evals/results/` only if the repository's
  evidence policy retains run artifacts
- **Change:** Run all static checks, adapter tests, fixture evals, and selected real-model
  natural-flow cases. Compare `e1f1342` to the candidate using the same harness and model.
  Report both behavior and footprint; do not accept a smaller prompt with a failed gate.
- **Do not change:** Do not use a different model for the baseline and candidate.
- **Verify:** Run:
  - `node scripts/validate-core.mjs`
  - `bash scripts/test-agent-adapters.sh`
  - `bash scripts/test-eval-runner.sh`
  - `bash scripts/test-installer.sh`
  - `node teaching/teachify/scripts/validate-lesson.mjs teaching/teachify/assets/lesson-template.html`
  - `node scripts/test-teachify-interaction.mjs`
  - `git diff --check`
  - the P1 Codex natural-flow case at least three times on baseline and candidate
  - one inherited-child case for Codex, Claude Code, and OpenCode when available
  - static render/install/check/update/uninstall proof for the Copilot adapter
- **Failure signal:** Any semantic regression, any adapter includes the wrong profile, or
  the natural gate is unreliable across repeated runs.
- **Trap:** One successful stochastic run is not evidence that the gate is dependable.

### P7: Document, regenerate, install, and release [BATCH] — risk: medium

- **Depends on:** P6
- **Location:** `README.md`, `TUTORIAL.md`, `agents/README.md`, relevant skill/agent guides,
  `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, installed Codex/Claude
  Code/OpenCode/Copilot destinations resolved by `install.sh`
- **Change:** Teach the once-at-root flow with a readable diagram and one transcript:
  root card → confirmed receipt → child inheritance → result. Document footprint reports
  and the distinction between file modularity and conditional loading. Bump release
  metadata if public manifest or generated output changes. Regenerate and update local
  managed installations only after inspecting hash conflicts.
- **Do not change:** Do not use `--force` against edited/unmanaged agent files without the
  repository owner's explicit approval.
- **Verify:** Installer dry run, update, native `--check` for all installed harnesses,
  link inspection, full CI, then a clean `git status --short`.
- **Failure signal:** Documentation describes a selector that the real harness skips, or
  installed hashes do not match generated sources.
- **Trap:** Updating the repository but not the managed local installations reproduces a
  stale-runtime false diagnosis.

## Acceptance

- **A1:** The exact Orientify regression request returns a 2–4 entry card and waits in at
  least three repeated Codex natural-flow runs. — **proof owner:** eval runner + Reviewer;
  **proof:** live harness — proves R1, R2, R9.
- **A2:** A confirmed parent handoff causes Scout, Worker, and Reviewer fixtures to begin
  their bounded assignment without another selector. — **proof owner:** adapter tests;
  **proof:** fixture-based — proves R3, R4, R5.
- **A3:** Delegated runtime bodies exclude root-only contract text and reduce eager bytes
  by a reviewed target established in P4; root-capable execution retains the full flow,
  including harness-conditional direct metadata where required. — **proof owner:**
  footprint reporter; **proof:** static — proves R5, R7.
- **A4:** All four native adapter suites pass install, check, update, and uninstall tests
  without weakening hash-conflict protection. — **proof owner:** CI;
  **proof:** fixture-based — proves R6, R11, I8.
- **A5:** Every static validation and semantic eval is green, including authority,
  single-writer, Custom Team, and Teachify interaction cases. — **proof owner:** CI +
  Reviewer; **proof:** static and fixture-based — proves R6, R8 and I1–I6.
- **A6:** The tutorial contains a dumb-proof once-at-root example, and a fresh reader can
  identify when a child may reopen selection. — **proof owner:** repository owner;
  **proof:** owner-observed — proves R10.
- **A7:** Baseline/candidate evidence states input-size deltas without presenting byte
  estimates as exact tokens. — **proof owner:** footprint reporter + Reviewer;
  **proof:** static — proves R7.

## Rollback and recovery

- **Protected state:** portable source contracts, public manifest compatibility, managed
  native-agent installations, and the current passing revision `e1f1342`.
- **Rollback mechanism:** keep each major step in a separate commit. Revert the first
  failing slice rather than editing generated files manually. Generated native agents can
  be restored by checking out the last accepted portable sources and rerunning the
  managed installer update.
- **Rollback trigger:** a direct role loses selection; a child loses required handoff
  context; any authority invariant fails; an old manifest cannot be handled explicitly;
  or real harness reliability is worse than baseline.
- **Recovery check:** full CI passes; all four native `--check` operations report fresh;
  the exact Orientify request waits at the card; a confirmed child does not reopen it.
- **Point of changed rollback:** after publishing a schema or release, do not silently
  revert its meaning. Ship a compatibility patch or a documented schema increment.

## Execution topology

- **Decision owner:** repository owner; approves public schema incompatibility, accepted
  Material risk, release, and any forced overwrite of local managed files.
- **Single writer/integration owner:** one Worker in one dedicated branch or worktree.
- **Read-only parallel lanes:** optional Reviewer for packet/diff judgment and optional
  real-harness evaluator. They must not modify product files.
- **Handoff order:** Worker implements P1–P5 → tests P6 → independent Reviewer checks
  behavior and footprint → Worker performs approved P7 integration and installations.
- **No Orchestrator by default:** the sequence is linear and parent-coordinated. Add one
  only if implementation is split into genuinely parallel adapter lanes.

## Stop conditions

Stop rather than improvise if a compatible root/delegated profile cannot be represented;
if direct-role semantics differ materially across harnesses; if the natural-flow grader
must coach the behavior it measures; if prompt reduction requires removing an authority
or evidence invariant; if local native files have unmanaged edits; or if the public
manifest needs a breaking schema change that the repository owner has not approved.

## Revision log

- 2026-08-24: Initial Heavy packet created from token measurements and the observed Codex
  Orientify selection regression.
- [REV 2026-08-24] P1: A contract-in-user-prompt natural case passed at the baseline
  because embedding the complete contract made selection artificially salient. The eval
  now needs an installed/native mode that sends only the user request and inspects Codex
  JSON events. Reading the activated `SKILL.md` is allowed setup; any subject command
  before selection is a failure. Intent, scope, and downstream steps are unchanged.
- [REV 2026-08-24] P3/P7: The owner added VS Code/GitHub Copilot support. The adapter uses
  the official personal/project skill and agent paths, a visible interactive Orchestrator,
  hidden delegated roles, and least-privilege native tool aliases. Claude direct-session
  selection moved to `initialPrompt`, which Claude applies only when `--agent` runs as the
  main session; the shared delegated body remains compact.

## Topology

Single Worker with an independent read-only Reviewer before release.
