---
name: mapify
description: Query a saved map of verified codebase pointers before broad discovery, then confirm every pointer against current source. Preserves durable landmarks, flows, decisions, invariants, and traps so a later session need not rediscover them; an exact path, one known symbol, or one obvious edge needs no map. Use when discovery spans several files, hops, or repositories, when current and historical implementations must be told apart, or to propose a deposit after such work.
---

# Mapify

**Interaction gate.** Apply [the shared interaction gate](references/interaction-gate.md)
before task work. Infer Weight, Verbosity, and Ownership; treat Explanation as opt-in.
Show a route card only when routes are genuinely contested after a quick look at the
subject, the work is Heavy, or a step is destructive or irreversible — otherwise proceed
on the inferred route with a one-line receipt.

Mapify is a routing library, never the agent's brain. Its records choose where current
inspection starts; source and runtime evidence decide what is true.

## Classify the discovery cost

Use direct source inspection when the user supplied an exact path, one scoped search
will find a known symbol, or one already-known edge answers the question. Mapify should
earn its lookup cost through at least one of these:

- several files or graph hops must be connected;
- the repository or project location is unknown;
- current and historical implementations must be distinguished;
- the same non-obvious discovery is likely to recur;
- a stale pointer, removal, or replacement needs history.

## Retrieve a bounded neighborhood

For a settled lookup, Mapify owns the method; add another workflow skill only when the
request materially expands beyond retrieval and source confirmation.

1. Run one `find` with the user's most discriminating term unchanged and a small limit.
   Each result explains whether it matched a file, symbol, tag, summary, or edge.
2. Select the few records that can answer the question, normally one current candidate
   plus one genuine alternative. Choose tabular or JSON output, not both.
3. Run `verify` for those IDs. Missing paths or symbols, changed fingerprints, dangling
   edges, and ordinary edges to removed nodes make a record stale.
4. Open targeted current-source slices for the selected records and both endpoints of
   every relationship the answer presents as fact. `edges-linked` proves graph linkage,
   not relationship semantics; without source confirmation, label the edge as a map hint.
5. Stop when the requested fact is source-confirmed or the map has exposed a concrete
   gap requiring scoped rediscovery.

Generated manifests, indexes, source-tree/topic views, raw catalogues, whole-repository
verification, and global scans are maintenance or fallback tools rather than warm-lookup
context. Use them only when the requested outcome requires them.

## Deposit at the natural close

After expensive discovery, run one deposit check before the final handoff:

- Is the finding durable and non-obvious?
- Did establishing it require multiple files, searches, or historical reasoning?
- Would a compact pointer materially narrow a future inspection?

If all three hold, produce at most a few sparse candidates with `propose`; it validates
and prints normalized Markdown without writing `.mapify/`. When persistence was already
authorized, use `capture` and verify the result. Otherwise include one compact **Mapify
deposit candidate** in the handoff without pausing for a choice card or silently writing.

Ground each source claim in the node's own `path`; express cross-file facts as typed
edges. A pathless decision may preserve its decision wording and cited rationale, but
`valid` then proves only record structure and linkage, not current code. Prefer symbols
over disposable line hints. Classify the retained knowledge rather than the file type: a
test protecting behavior is normally an `invariant`. Retain no source copies, secrets,
credentials, personal data, transient debugging state, or unsupported speculation.

## Maintain trust honestly

- `refresh` re-fingerprints an inspected node while preserving unspecified metadata. It
  refuses before writing if the effective outgoing edges are missing or improperly
  removed, so a new timestamp cannot bless a known-invalid neighborhood.
- `verify --tombstone-missing` preserves removal history, last-known revision, and an
  optional replacement. Git remains the source backup.
- `find` exits `0` for a current candidate, `1` for no match, and `2` when every match is
  missing or removed. An unresolved verification failure exits non-zero.

Use `node scripts/mapify.mjs --help` for the deterministic helper. Read
[the record schema](references/schema.md) before manually editing records or changing
their format. Durable Markdown lives under `<repo>/.mapify/`; the disposable global
catalogue defaults to `${MAPIFY_CATALOG:-${XDG_DATA_HOME:-~/.local/share}/mapify/catalog.json}`.
For a human visualization, open or copy
[`assets/graph-viewer.html`](assets/graph-viewer.html); it includes dummy data and can
load a generated catalogue.

## Mutation boundary

`find`, `verify`, and `propose` are read-only. `capture`, `refresh`, tombstoning, and
`rebuild` write only the declared `.mapify/` graph, generated views, and catalogue.
They do not authorize product edits, ignore-file changes, commits, or unscoped scans.
When artifact ownership is unclear, return the proposed record instead of persisting it.

## Done when

A later agent can reach expensive-to-rediscover current evidence with less work, see why
each result matched, and distinguish a verified pointer from a source-confirmed claim.
If the record would not narrow a future multi-file, cross-repository, or historical
inspection, do not deposit it.
