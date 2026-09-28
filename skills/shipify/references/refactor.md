# Refactor

Structure changes; observable behavior does not. Both must be proven.

- **Pin behavior first.** Run the existing tests for the region. Where coverage is thin,
  add characterization tests that pin current outputs, including ugly ones. Error
  messages, log lines, API shapes, and accidental edge cases are behavior.
- **Small landable steps.** Prepare the seam, move one responsibility, run the pins.
  Every commit is green and could ship. Do not accumulate half-finished moves.
- **Never edit a pin to make a move pass.** A pin that fails means the move changed
  behavior: undo it and diagnose. An intended behavior change is a separate, explicit
  decision, not part of the refactor.
- **Delete with proof.** Dead code needs a search over source, config, templates, and
  entry points; record the command. Removing an exported or public surface is a
  breaking change, not cleanup.
- **Contested structure** (how to split a module, which abstraction to introduce):
  offer the candidate seams to the user before moving code.

Done when the pins pass at every step, structure moved toward the stated goal, and each
deletion cites its evidence.
