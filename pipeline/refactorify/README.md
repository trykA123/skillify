# Refactorify

[← All skills](../../README.md#skills) · [Runtime contract](SKILL.md) · [Behavior cases](../../evals/refactorify/cases.json)

> **Pinned behavior in → better structure with nothing observable changed out.**

Refactorify restructures code under two simultaneous proofs: structure improved, and
behavior held still.

## Refactor flow

```mermaid
%%{init: {"themeVariables": {"fontSize": "22px"}, "flowchart": {"nodeSpacing": 35, "rankSpacing": 40}}}%%
flowchart TB
    Pin[Characterization tests pin behavior] --> Seam[Pick a seam]
    Seam --> Move[Move one responsibility]
    Move --> Green{Suite green? Pins untouched?}
    Green -->|yes| Landed[Committable step landed]
    Landed --> More{Goal met?}
    More -->|no| Seam
    Green -->|no| Undo[Undo step - behavior changed]
    Dead[Dead code] --> Proof[Prove non-use on the revision] --> Delete[Delete citing evidence]
```

## Example

```text
This 2,000-line service class is unreadable. Break it up without changing anything the
API consumers can see.
```

> [!IMPORTANT]
> Error messages, log lines, and accidental edge-case handling are observable behavior.
> Changing them on purpose is a feature; changing them mid-refactor is a broken pin.
