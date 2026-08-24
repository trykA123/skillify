# S1 independent review — token efficiency and selection reliability

**Weight:** Heavy  
**Mode:** Full  
**Boundary:** uncommitted candidate relative to `e1f1342100fa153c383611c958450d7306a6810d`  
**Reviewer:** independent read-only Reviewer; no product, test, configuration, or evidence files written  
**Verdict:** **Approve**

## Reconstructed design

Substantial root requests stop at one natural route card before task work. The confirmed
route, controls, boundary, and exact ownership topology then travel through handoffs, so
delegated roles start their bounded assignments without reopening selection.

Portable agent contracts are split into base, interactive, and delegated profiles.
Adapters load the profile that the runtime actually applies: Claude uses direct-only
`initialPrompt` metadata, OpenCode preserves its direct modes, and VS Code/Copilot exposes
only Orchestrator as the interactive fleet root. Prompt budgets measure stable byte and
word proxies, while Audify loads its detailed HTML presentation module only on that
branch.

## What works

- The exact observed Orientify request now pauses naturally. My independent installed
  Codex run passed **3/3**, with a recommended route first, Customize last, and no subject
  tool event before selection.
- Delegated bodies omit selection and customization while retaining the handoff receipt,
  boundary, topology, and reopen condition. Direct-capable modes retain the complete
  interaction flow.
- Claude's conditional `initialPrompt` design matches the documented behavior for
  `claude --agent`; the same role body stays compact when delegated. See the official
  [Claude subagent reference](https://code.claude.com/docs/en/sub-agents).
- Copilot uses the documented personal/project skill and agent locations, `.agent.md`
  metadata, invocation controls, and portable tool aliases. Orchestrator is visible and
  root-only; the other nine roles are hidden, model-invocable children. See the official
  [VS Code custom-agent reference](https://code.visualstudio.com/docs/agent-customization/custom-agents)
  and [skill reference](https://code.visualstudio.com/docs/agent-customization/agent-skills).
- `globalContracts` remains intact for old manifest consumers. The additive profiles are
  validated, and the legacy-manifest renderer fixture preserves the previous eager
  behavior.
- Audify keeps its audit method, evidence rules, report requirement, sanitization, and
  render check in the reachable skill package while moving presentation-only detail to
  `entry/audify/references/html-report.md`.
- Measurements are deterministic and accurately described as UTF-8 bytes and
  whitespace-delimited words, not exact model tokens. The candidate reduces ten eager
  skill entrypoints by 368 bytes and each delegated runtime body by 3,627 bytes relative
  to the stated baseline.

## Findings

No Blocking, Material, or Advisory finding remains.

During review, `TUTORIAL.md` incorrectly suggested using `--installed` natural-pause
mode with Claude Code and OpenCode. That contradicted the runner's deliberate Codex-only
event enforcement. The Worker corrected the tutorial, and Delta review confirmed the
text now routes those harnesses to the non-installed phased commands. The direct eval
runner test remains green.

## Requirement coverage

| Contract | Proof owner | Proof type | Observed result |
|---|---|---|---|
| R1 | Eval runner + Reviewer | Live + structural | Installed Orientify natural pause passed 3/3 independently; no pre-selection task event |
| R2 | Skill contracts + fixture | Static + negative fixture | Multiple actions/artifacts are substantial; receipt, late recommendation, and continuation fixtures fail |
| R3 | Handoff contract + fleet eval | Static + live/fixture | Confirmed delegated Scout inherits controls/topology and shows no card in Codex, Claude, or OpenCode evals |
| R4 | Selection/handoff contracts | Static + semantic | Only a named material decision outside the confirmed boundary may return to the parent |
| R5 | Renderer + adapter tests | Static + live | Delegated bodies omit interactive contracts; OpenCode direct modes, Claude `initialPrompt`, and Copilot Orchestrator retain them |
| R6 | Installer/adapter suites | Fixture + managed-state inspection | Codex, Claude, OpenCode, and Copilot render, check, update, and uninstall paths pass; all four local agent sets are fresh |
| R7 | Footprint reporter | Deterministic static + negative fixture | JSON repeats byte-for-byte; reviewed limits pass; zero budgets fail; words/bytes are labeled as proxies |
| R8 | Audify source, eval, installer | Static + fixture | HTML module is reachable, declared for the HTML case, copied/linked with the skill, and eager entrypoint is smaller |
| R9 | Natural-flow runner | Live + structural + semantic | Installed candidate receives only the original request; exact skill-load exemption is narrow; subject events fail the case |
| R10 | Tutorial and agent guide | Documentation inspection | Once-at-root flow, receipt contents, child inheritance, and reopen boundary are taught with transcript and diagram |
| R11 | Copilot renderer/installer/docs | Official-contract inspection + fixture | Correct four paths, `.agent.md`, visibility topology, aliases, and personal/project lifecycle are asserted and pass |

## Invariant coverage

| Invariant | Proof | Observed result |
|---|---|---|
| I1 | Authority cases and selection/customization contracts | Controls and route selection remain separate from mutation and destructive authority |
| I2 | Manifest validator, rendered tools, Reviewer contract | Worker is the only code-mutable role; Reviewer remains artifacts-only and independently constrained |
| I3 | Skill diff, weight modules, Audify module | Heavy, recovery, sourcing, sanitization, and evidence rules remain; only conditional presentation detail moved |
| I4 | `validate-core.mjs` agnosticism checks | Portable skills, roles, and contracts contain no runtime/model-specific syntax; native details stay in adapters |
| I5 | Ten skill gates and tutorial | Natural requests remain sufficient; no control block is required |
| I6 | Explicit axis values and semantic cases | Independent Weight, Verbosity, Explanation, and Ownership combinations remain represented, including Heavy + Terse |
| I7 | Additive manifest plus legacy fixture | Schema remains version 1, `globalContracts` is unchanged, and old-format rendering remains supported |
| I8 | Managed-hash lifecycle tests and live status | Unmanaged/edited files remain protected; generated definitions reproduce; all four installed sets are fresh |

## Failure paths traced

### Natural selection regression

`orientify-login-natural-pause` sends only the original user request through installed
instructions. The runner permits only an exact read of the expected installed
`orientify/SKILL.md`, classifies any command, MCP call, or web search as task work, and
requires 2–4 numbered entries with the recommendation first and Customize last. Receipt,
late-recommendation, and post-card execution fixtures fail. The final installed candidate
passed three independent repetitions.

### Adapter/profile mismatch

The renderer starts from `contractProfiles`, adds role-specific contracts, and chooses a
direct or delegated context per harness. Adapter tests inspect the generated Worker body,
Claude direct-only metadata, OpenCode direct roles, and Copilot Orchestrator/children.
They then exercise managed check and uninstall. A legacy manifest without profiles falls
back to `globalContracts`, preventing a silent compatibility break.

### Managed-install recovery

Installer fixtures cover personal and project Copilot paths, managed status, and
uninstall, while the general installer suite retains collision and unsafe-destination
guards. Live status reports ten fresh agents in all four native destinations. Recovery is
therefore portable source rollback followed by a normal managed update, without `--force`.

## Checks observed

- `node scripts/validate-core.mjs` — pass; 10 skills, 83 cases, 10 roles.
- `bash scripts/test-agent-adapters.sh` — pass; four adapters plus legacy manifest.
- `bash scripts/test-eval-runner.sh` — pass; natural-pause positive and negative paths.
- `bash scripts/test-installer.sh` — pass; including personal/project Copilot lifecycle.
- `bash scripts/test-token-footprint.sh` — pass; deterministic report and failing-budget guard.
- Teachify template validation and browserless interaction test — pass.
- `git diff --check` — pass.
- Installed Codex natural pause, Reviewer execution — pass 3/3.
- Managed native status — fresh for Codex, Claude Code, OpenCode, and Copilot.

## Skipped lenses

- Production-data, authentication implementation, schema migration, and deployment
  recovery were skipped because this change has no such boundary.
- Exact provider tokenization was skipped by design; the contract explicitly requires
  portable byte/word proxies.
- Live VS Code UI execution was unavailable on this machine. Copilot coverage is official
  format review plus renderer, tool-map, path, managed-hash, install, check, and uninstall
  proof. The tutorial names the remaining two-minute UI discovery check.
- Broad code-style and unrelated repository-health review were skipped because they do
  not judge this packet.

## Verdict

**Approve.** No Blocking or unresolved Material finding remains. The implementation fits
R1–R11 and I1–I8, preserves public compatibility and installer safety, closes the natural
selection blind spot, and concentrates measurable savings in repeated delegated calls
without removing required behavior.
