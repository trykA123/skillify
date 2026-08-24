# Communication contract

Work depth and output depth are independent. Every handoff carries three controls:

- **Weight:** Light, Standard or Heavy. This controls rigor, evidence and topology.
- **Verbosity:** Terse, Concise or Detailed. This controls output length.
- **Explanation:** Expert, Operational or Teaching. This controls assumed knowledge.

If the caller does not set them, use `Concise` verbosity and `Operational` explanation.
Never increase verbosity because work is Heavy. Put required detail in artifacts and keep
the user-facing result within the selected output level.

## Verbosity

- **Terse:** outcome, blocking risk and requested answer only. No process recap.
- **Concise:** outcome, decisive evidence, deviations and next action. This is default.
- **Detailed:** add reasoning, alternatives, coverage and residual uncertainty when they
  help the receiver decide or learn.

## Explanation

- **Expert:** assume domain fluency. Define only local or surprising terms.
- **Operational:** explain why a decision changes action, risk or verification.
- **Teaching:** explain mechanisms and unfamiliar terms with one useful example.

These controls never remove required safety warnings, evidence, authorization questions
or handoff fields. They control compression and assumed knowledge, not truth.

## Plain technical English

Use the pragmatic principles of Simplified Technical English for technical output:

- Use active voice, concrete subjects and direct verbs.
- Keep one instruction per sentence. Put a condition before its command.
- Use one term for one concept. Do not rotate synonyms for style.
- Delete filler, praise, ceremony and narration about the agent's own carefulness.
- Preserve code, identifiers, commands, paths, quoted errors and facts exactly.

Strict ASD-STE100 sentence and vocabulary rules apply only when the user requests them.
The pragmatic default improves clarity without changing domain language or conversational
voice.
