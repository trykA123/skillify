# Adaptive teaching method

This method takes inspiration from WIRED's five-level explanation format: the subject
stays stable while the language, abstractions, examples, and questions change with the
learner. Do not imitate a video's script or assume that age determines ability.

## Select the learner level

| Level | Assume | Teaching move | Avoid |
|---|---|---|---|
| Layman | No specialist vocabulary | Everyday anchor → plain mechanism → practical consequence | Childish tone or false simplicity |
| Beginner | Basic vocabulary is new | Define terms, show one canonical example, then check recognition | Unexplained acronyms |
| Practitioner | The learner can use the system | Trace cause and effect, show an applied pattern, test prediction | Survey-style coverage |
| Advanced | The learner can compare designs | Trade-offs, failure modes, constraints, and counterexamples | Repeating beginner definitions |
| Expert | The learner knows the field | Precise model, edge conditions, contested assumptions, current evidence | Performing expertise with jargon |

`Layman` is the correct spelling. It describes assumed subject knowledge, not intelligence.

## The lesson spine

Every lesson has four connected moves:

1. **Anchor:** a concrete situation the learner can already reason about.
2. **Mechanism:** what changes, what causes it, and how the parts interact.
3. **Boundary:** where the model stops working, or the most likely misconception.
4. **Application:** a situation where the learner must use the model rather than repeat it.

An analogy is scaffolding. State where it breaks before the learner mistakes it for the
mechanism.

## Exercise design

Each exercise maps to one stated objective and tests a decision:

- **Recognition:** choose the example that satisfies a definition.
- **Prediction:** choose what happens next in a concrete flow.
- **Ordering:** place stages or causes in the correct sequence.
- **Diagnosis:** identify which assumption or boundary failed.
- **Transfer:** choose how the same mechanism applies in a new scenario.

Do not ask trivia that the lesson did not teach. Wrong-answer feedback should name the
specific misconception, not merely reveal the correct option. If more than one response
could reasonably be correct, rewrite the question or make it non-graded.

## Calibrate without interrogation

Infer the starting level from the learner's words and prior questions. When uncertain,
offer choices such as:

1. **Practical (recommended)** — enough mechanism to use it correctly.
2. **Layman** — no specialist knowledge assumed.
3. **Deep** — formal details, trade-offs, and edge cases.

Do not ask the learner to configure Weight, Verbosity, or Explanation directly unless
they explicitly want those controls.
