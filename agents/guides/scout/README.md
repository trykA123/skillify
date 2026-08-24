# Scout

[← Fleet](../../README.md#the-fleet) · [Role contract](../../roles/recon/scout.md) · [Manifest](../../manifest.json)

> **Bounded recon question in → exact locations and minimum context out.**

Scout performs fast codebase reconnaissance and returns the minimum useful context.

It searches first, reads selectively, labels inference, cites exact locations, and names
the first file the receiver must open. It does not plan or edit.

## Recon path

```mermaid
flowchart LR
    Question --> Search[Search broadly]
    Search --> Read[Read selectively]
    Read --> Trace[Trace one real flow]
    Trace --> Handoff[Exact locations + first file]
```

## Example assignment

```text
Use Scout. Weight: Light. Verbosity: Terse. Explanation: Expert.
Locate the request entry point, the owning symbols, the direct tests, and the first file
the worker must read. Do not propose a fix.
```

| Mutability | Primary skill | Excludes |
|---|---|---|
| Artifacts only | Orientify | Planning and edits |
