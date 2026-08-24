# S1 execution report

**Scope:** P1–P7 from the Heavy token-efficiency and selection-reliability packet  
**Baseline:** `e1f1342100fa153c383611c958450d7306a6810d`  
**Outcome:** implementation and proof complete; independent Heavy review approved

## Step evidence

| Step | Granularity | Main locations | Verification | Result |
|---|---|---|---|---|
| P1 natural gate | Isolate | `evals/orientify/cases.json`, `scripts/run-evals.mjs` | Installed Codex JSON event reproduction and structural negative fixture | Green after candidate; baseline failure recorded separately |
| P2 inheritance | Batch | ten `SKILL.md` files, selection and handoff contracts, fleet case | Static validation; Codex, Claude Code, OpenCode real eval | 3/3 live eval adapters green |
| P3 profiles | Isolate | `agents/manifest.json`, renderer, validator, adapter test | Four-harness render/check/uninstall fixtures, direct/delegated assertions, legacy manifest | Green |
| P4 budgets | Batch | footprint reporter, budget config, CI and negative fixture | Deterministic JSON comparison and zero-budget failure | Green |
| P5 progressive disclosure | Batch | Audify entrypoint and HTML report reference | Audify reference validation and footprint gate | Green |
| P6 proof | Isolate | full repository | Contract, installer, adapter, eval, footprint, lesson, interaction, whitespace checks | Green locally |
| P7 delivery | Batch | README, tutorial, agent/eval guides, plugin metadata, local installs | Four-harness managed status plus generated-profile inspection | Green |

## Behavioral evidence

The installed baseline failed the exact Orientify request in this order: skill load,
inferred-route receipt, then workspace commands. See [P1 baseline](P1-baseline.md).

After the final gate rewrite, the installed Codex case ran three times. All three responses:

- offered three selectable routes;
- put the recommended Standard route first;
- used Customize as the final route;
- stopped for user selection; and
- emitted no workspace task event before selection.

The delegated inheritance case then passed once in each supported harness: Codex, Claude
Code, and OpenCode. Each acknowledged the inherited controls, exact topology, and bounded
Scout assignment without showing another card.

Claude Code `2.1.241` also ran the generated Worker as the main session with `--agent`.
Its conditional `initialPrompt` produced a native four-option route question with the
recommended route first and Customize last, proving that direct invocation retains the
interactive flow while the delegated role body omits it.

## Footprint evidence

Counts are UTF-8 bytes and whitespace-delimited words, not exact model tokens.

| Surface | Baseline `e1f1342` | Candidate | Change |
|---|---:|---:|---:|
| Ten eager skill entrypoints | 56,062 bytes / 8,750 words | 55,694 bytes / 8,626 words | −368 bytes / −124 words |
| Audify eager entrypoint | 10,235 bytes / 1,702 words | 8,330 bytes / 1,374 words | −1,905 bytes / −328 words |
| Each delegated runtime body vs baseline eager rendering | role-dependent | role-dependent | −3,627 bytes |

Current delegated runtime bodies range from 5,664 to 8,533 bytes in the footprint report.
Root-capable bodies retain the interactive profile and range from 10,367 to 13,236 bytes.
Claude stores the root contracts in direct-only `initialPrompt` metadata, so its physical
file is larger than its delegated runtime body. The reduction is intentionally
concentrated in repeated child invocations; reliable standalone skill activation and root
selection keep the complete behavior contract.

## Acceptance evidence

| Check | Proof type | Observed result | Covers |
|---|---|---|---|
| Installed Orientify natural pause ×3 | Live harness | 3/3 pass | R1, R2, R9 |
| Delegated inheritance across three eval adapters | Live harness | 3/3 pass | R3–R5 |
| Direct generated Claude Worker | Live harness | Native four-option question, recommended first, Customize last | R1, R5 |
| `node scripts/validate-core.mjs` | Static | 10 skills, 83 cases, 10 roles valid | R6, R8, I1–I7 |
| `bash scripts/test-installer.sh` | Fixture | Pass, including personal and project Copilot paths | R6, R11, I8 |
| `bash scripts/test-agent-adapters.sh` | Fixture | Four adapters pass, including legacy manifest | R5, R6, R11, I7, I8 |
| `bash scripts/test-eval-runner.sh` | Fixture | Pass, including receipt, late-recommendation, and post-card-execution negatives | R9 |
| `bash scripts/test-token-footprint.sh` | Static/fixture | Deterministic report and budget failure guard pass | R7 |
| Teachify template and interaction checks | Fixture | Both pass | I3, I6 |
| Managed installation status | Live local | 10 current skills and 10 fresh agents in Codex, Claude Code, OpenCode, and Copilot | R6, R11 |

## Deviations

1. **Plan assumption corrected:** pasting the contract into a “natural” candidate prompt
   made the baseline pass. P1 was amended to use installed/native instructions and Codex
   JSON events. This is a plan correction; intent and scope did not change.
2. **Eval defect corrected:** the first delegated case disabled tools but demanded real
   repository evidence, rewarding simulated searches. It now grades the inherited
   pre-work acknowledgement only. This is a local test defect; the inheritance contract
   did not change.
3. **Local runtime difference:** verification ran on Node `v26.7.0`; GitHub Actions remains
   pinned to Node 22 and is pending the push.
4. **Scope addition:** the owner added VS Code/GitHub Copilot. The installer now uses the
   official personal/project paths; Orchestrator is visible but cannot be model-invoked,
   while nine hidden delegated roles remain model-invocable with mapped least-privilege
   tools. This expands R6 with R11 without changing portable contracts.

## Recovery evidence

No production data or destructive state changed. The protected baseline remains
`e1f1342`. Native definitions are managed by hashes and were updated without `--force`.
Reverting portable source and rerunning the managed installer restores the prior
definitions, while edited/unmanaged files remain protected by collision checks. All four
native destinations report fresh after regeneration.

## Residual risks and follow-ups

- Exact token counts vary by model tokenizer; CI intentionally enforces stable byte/word
  proxies instead.
- Root-capable prompts keep the full interaction cost. This is deliberate because those
  definitions can receive unconfirmed user requests directly.
- Natural installed event inspection is deepest for Codex. Claude Code and OpenCode are
  covered by portable phased behavior and the cross-harness delegated case, but their
  native CLIs do not currently expose the same event classification in this runner.
- The local machine does not have the VS Code or GitHub Copilot CLI, so Copilot proof is
  official-format, renderer, personal/project installer, managed-hash, tool-map, and
  lifecycle validation rather than a live UI session. The tutorial provides a two-minute
  `/skills` and `/agents` discovery check for the work machine.
- Remote Node 22 CI and GitHub push status remain pending until release.
