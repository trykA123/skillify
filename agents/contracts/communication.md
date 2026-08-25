# Communication contract

Work depth and output depth are independent. Every handoff carries three controls plus
the selected ownership topology:

- **Weight:** Light, Standard or Heavy. This controls rigor, recovery and evidence.
- **Verbosity:** Terse, Concise or Detailed. This controls output length.
- **Ownership:** Solo, Team or the validated custom role topology. This controls bounded
  ownership, not rigor or authority.

Explanation is opt in: apply a named level on request; otherwise assume Operational
and omit it from receipts.

If the caller sets none of them, use `Concise` verbosity and `Operational` explanation.
Never increase verbosity because work is Heavy. Put required detail in artifacts and keep
the user-facing result within the selected output level.

## Verbosity

- **Terse:** outcome, blocking risk and requested answer only. No process recap.
- **Concise:** outcome, decisive evidence, deviations and next action. This is default.
- **Detailed:** add reasoning, alternatives, coverage and residual uncertainty when they
  help the receiver decide or learn.

## Explanation

- **Layman:** assume no specialist vocabulary; explain the mechanism in ordinary language
  without becoming childish or imprecise.
- **Operational:** explain why a decision changes action, risk or verification.
- **Expert:** assume domain fluency. Define only local or surprising terms.

These controls never remove required safety warnings, evidence, authorization questions
or handoff fields. They control compression and assumed knowledge, not truth.

## Plain English

User-facing speech is plain by default:

- Active voice, concrete subjects, one idea per sentence; conditions before commands.
- One term for one concept. No synonym rotation.
- No hype, filler, praise, or narration about carefulness. State what happened.
- Jargon only when it is the correct name; define it once.
- Code, identifiers, commands, paths, quotes, and facts stay exact.

Dumb mode: asked for dumb mode, simple words, or Layman — drop unexplained jargon.
Short everyday words. Same facts, simpler wrapping.

Strict ASD-STE100 rules apply when explicitly requested. Plain English changes
wrapping, never facts or required warnings.
