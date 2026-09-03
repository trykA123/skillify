# Scout

[← Fleet](../../README.md#the-fleet) · [Hands-on tutorial](../../../TUTORIAL.md#6-know-when-agents-help) · [Role contract](../../roles/recon/scout.md) · [Manifest](../../manifest.json)

> **Bounded recon question in → exact locations and minimum context out.**

Scout performs fast codebase reconnaissance and returns the minimum useful context.

It checks a compact Mapify catalogue when available, then searches current source,
reads selectively, labels inference, cites exact locations, and names the first file the
receiver must open. It does not plan, edit, or trust a remembered pointer without verification.

## Recon path

```mermaid
%%{init: {"themeVariables": {"fontSize": "22px"}, "flowchart": {"nodeSpacing": 35, "rankSpacing": 40}}}%%
flowchart TB
    Question --> Map[Query optional Mapify catalogue]
    Map --> Search[Verify pointer or search broadly]
    Search --> Read[Read selectively]
    Read --> Trace[Trace one real flow]
    Trace --> Handoff[Exact locations + first file]
```

## Example assignment

```text
Locate the request entry point, the owning symbols, the direct tests, and the first file
the worker must read. Do not propose a fix.
```

| Mutability | Primary skill | Excludes |
|---|---|---|
| Artifacts only | Mapify · Orientify | Planning, edits, and memory writes |
