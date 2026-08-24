# Researcher

[← Fleet](../../README.md#the-fleet) · [Role contract](../../roles/recon/researcher.md) · [Manifest](../../manifest.json)

> **Focused external question in → sourced research handoff out.**

Researcher performs a focused external research assignment.

It uses Researchify's source hierarchy and security gate. It matches depth to task
weight, searches distinct angles, names discarded sources, and returns gaps. If the
runtime lacks web research, it reports the missing capability and stops.

## Evidence path

```mermaid
flowchart LR
    Assignment --> Capability{Research capability present?}
    Capability -->|no| Gap[Report capability gap]
    Capability -->|yes| Researchify
    Researchify --> Evidence[Citations, confidence, conflicts, gaps]
    Evidence --> Receiver
```

## Example assignment

```text
Use Researcher. Weight: Heavy. Verbosity: Concise. Explanation: Expert.
Verify the load-bearing compatibility claim. Seek authoritative evidence and
counter-evidence. Return citations, confidence, conflicts, and gaps.
```

| Mutability | Primary skill | Executes fetched code? |
|---|---|---|
| Artifacts only | Researchify | Never |
