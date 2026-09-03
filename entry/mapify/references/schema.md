# Mapify graph schema

Schema version `1` uses Markdown with JSON-compatible YAML-frontmatter values. The
helper owns serialization; manual edits should preserve these fields:

```markdown
---
schemaVersion: 1
id: "cinema.title-sheet"
kind: "landmark"
status: "active"
path: "apps/cinema/src/components/TitleSheet.tsx"
symbol: "TitleSheet"
lineHint: 65
summary: "Displays title metadata and controls the expanded details sheet."
tags: ["cinema", "title", "sheet"]
edges: [{"type":"rendered-by","to":"cinema.title-page"},{"type":"calls","to":"cinema.playback-actions"}]
verifiedRevision: "a1b2c3d"
verifiedAt: "2026-09-03T12:00:00.000Z"
fingerprint: "sha256:..."
---

# cinema.title-sheet

Optional short evidence or rationale. Do not copy the implementation.
```

## Fields

- `id` is stable within a repository: lowercase letters, digits, dots, and hyphens.
- `kind` is `landmark`, `flow`, `decision`, `invariant`, `trap`, `command`, or `external`.
- `status` is `active`, `stale`, or `removed`.
- `path` is repository-relative. It must not escape the repository. Decisions may omit it.
- `symbol` is preferred over `lineHint`; line numbers are disposable hints.
- `summary` is one retrieval-sized sentence.
- `summary` and the optional note ground source claims in this node's `path`.
  Cross-file facts belong in typed edges and require source inspection before use. A
  pathless decision may cite durable rationale, but its valid state proves record
  structure and linkage rather than current source.
- `tags` support cheap lexical lookup. `edges` are typed `{type,to}` links to stable
  node IDs, such as `calls`, `renders`, `part-of`, `tested-by`, `supersedes`, or
  `replaced-by`.
- `verifiedRevision`, `verifiedAt`, and `fingerprint` describe the evidence boundary.

Verification checks the selected node plus its outgoing edges. A missing target or an
ordinary edge to a removed node makes the source node stale; `supersedes` may point to a
removed historical node. This graph check verifies linkage, not the behavior of every
target. The helper reports this limited success as `edges-linked`; inspect both current
endpoints before making a flow-level claim. When those sources have not been opened,
describe the relation only as an unconfirmed map hint.

Choose `kind` for the knowledge being retained, not merely the file type. A test that
protects a durable behavior is normally an `invariant`; a test file is not automatically
a `landmark`.

When a target disappears, move the record to `.mapify/tombstones/`, set `status` to
`removed`, and add `removedAt`, `removedRevision`, and optional `replacement`. Retain
the last path, symbol, and fingerprint. Recover old source from version control rather
than embedding it in the record.

The generated catalogue contains only retrieval fields and absolute repository/record
pointers. It is a cache, not a second durable source of truth.

`find` adds transient `score` and `matches` fields to results. Each match names the
query term, matched field, value, and scoring weight so an edge-target hit cannot be
mistaken for node identity. These retrieval fields are not stored in node Markdown.

Use `refresh --repo <root> --id <id>` after inspecting the current target. It preserves
unspecified summary, tags, edges, and notes while updating revision, time, and
fingerprint. Refresh validates its effective edges before writing and refuses when an
ordinary target is missing or removed. `propose` performs capture validation and emits
normalized Markdown without creating `.mapify/` or changing the catalogue. `find` exit
`2` means it found only missing or removed pointers; callers must not treat that as a
current location.

## Storage and generated views

```text
.mapify/
  manifest.md
  nodes/<kind-plural>/<node-id>.md
  tombstones/<node-id>.md
  index.md
  views/source-tree.md
  views/topics.md
```

Nodes and typed edges are authoritative map artifacts. `index.md`, `views/*`, the global
`catalog.json`, and its sibling `repos/*.json` and `topics/*.json` are generated views.
The source-tree view mirrors only mapped paths; it never copies repository content.
