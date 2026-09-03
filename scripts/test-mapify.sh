#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MAPIFY="$REPO_DIR/entry/mapify/scripts/mapify.mjs"
VIEWER="$REPO_DIR/entry/mapify/assets/graph-viewer.html"
TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/skillify-mapify-test.XXXXXX")"
trap 'rm -rf -- "$TEST_ROOT"' EXIT

PROJECT="$TEST_ROOT/TrueHL"
CATALOG="$TEST_ROOT/data/mapify/catalog.json"
SOURCE="apps/cinema/src/components/TitleSheet.tsx"
PLAYBACK="apps/cinema/src/actions/PlaybackActions.tsx"
ROUTE="apps/cinema/src/routes/TitleRoute.tsx"
mkdir -p "$PROJECT/$(dirname "$SOURCE")"
mkdir -p "$PROJECT/$(dirname "$PLAYBACK")" "$PROJECT/$(dirname "$ROUTE")"
printf '%s\n' 'export function TitleSheet() { return "cinema"; }' > "$PROJECT/$SOURCE"
printf '%s\n' 'export function PlaybackActions() { return "play"; }' > "$PROJECT/$PLAYBACK"
printf '%s\n' 'export function TitleRoute() { return "title"; }' > "$PROJECT/$ROUTE"

git -C "$PROJECT" init -q
git -C "$PROJECT" add "$SOURCE" "$PLAYBACK" "$ROUTE"
git -C "$PROJECT" -c user.name=Mapify -c user.email=mapify@example.invalid commit -qm baseline

node "$MAPIFY" propose --repo "$PROJECT" --id cinema.proposed-title-sheet \
  --kind landmark --path "$SOURCE" --symbol TitleSheet \
  --summary 'Proposed without mutating the repository.' --tag cinema > "$TEST_ROOT/proposal.md"
grep -q '^id: "cinema.proposed-title-sheet"$' "$TEST_ROOT/proposal.md"
grep -q '^fingerprint: "sha256:' "$TEST_ROOT/proposal.md"
[[ ! -e "$PROJECT/.mapify" ]]

node "$MAPIFY" capture --repo "$PROJECT" --catalog "$CATALOG" \
  --id cinema.playback-actions --kind landmark --path "$PLAYBACK" --symbol PlaybackActions \
  --summary 'Owns cinema playback actions.' --tag cinema --tag playback >/dev/null
node "$MAPIFY" capture \
  --repo "$PROJECT" \
  --catalog "$CATALOG" \
  --id cinema.title-sheet \
  --kind landmark \
  --path "$SOURCE" \
  --symbol TitleSheet \
  --line 1 \
  --summary 'Displays cinema title metadata and owns playback actions.' \
  --tag cinema \
  --tag sheet \
  --edge calls:cinema.playback-actions >/dev/null
node "$MAPIFY" capture --repo "$PROJECT" --catalog "$CATALOG" \
  --id cinema.title-route --kind landmark --path "$ROUTE" --symbol TitleRoute \
  --summary 'Routes title details to the title sheet.' --tag cinema --tag routing \
  --edge renders:cinema.title-sheet >/dev/null

[[ -f "$PROJECT/.mapify/manifest.md" ]]
[[ -f "$PROJECT/.mapify/nodes/landmarks/cinema.title-sheet.md" ]]
[[ -f "$PROJECT/.mapify/index.md" ]]
[[ -f "$PROJECT/.mapify/views/source-tree.md" ]]
[[ -f "$PROJECT/.mapify/views/topics.md" ]]
[[ -f "$CATALOG" ]]
compgen -G "$TEST_ROOT/data/mapify/repos/*.json" >/dev/null
compgen -G "$TEST_ROOT/data/mapify/topics/*.json" >/dev/null
grep -q 'cinema.title-sheet' "$PROJECT/.mapify/index.md"
grep -q 'TitleSheet.tsx' "$PROJECT/.mapify/views/source-tree.md"
grep -q '## cinema' "$PROJECT/.mapify/views/topics.md"
grep -q '"type":"calls"' "$PROJECT/.mapify/nodes/landmarks/cinema.title-sheet.md"
node "$MAPIFY" verify --repo "$PROJECT" --catalog "$CATALOG" --id cinema.title-sheet | grep -q $'cinema.title-sheet\tvalid'
node "$MAPIFY" verify --repo "$PROJECT" --catalog "$CATALOG" --id cinema.title-sheet | grep -q $'edges-linked$'

node "$MAPIFY" find TitleSheet.tsx --catalog "$CATALOG" --json > "$TEST_ROOT/find.json"
node -e 'const fs=require("node:fs"); const r=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); if (r.length !== 1 || r[0].id !== "cinema.title-sheet" || r[0].trust !== "verify-before-use" || r[0].pathExists !== true || !r[0].matches.some(m => m.field === "file-exact")) process.exit(1);' "$TEST_ROOT/find.json"
node "$MAPIFY" find playback --catalog "$CATALOG" --json > "$TEST_ROOT/edge-find.json"
node -e 'const fs=require("node:fs"); const r=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); const n=r.find(x => x.id === "cinema.title-sheet"); if (!n || !n.matches.some(m => m.field === "edge-target" && m.value === "calls:cinema.playback-actions")) process.exit(1);' "$TEST_ROOT/edge-find.json"
node "$MAPIFY" find playback --catalog "$CATALOG" | grep -q $'cinema.title-sheet.*matched-by=.*edge-target:calls:cinema.playback-actions'
printf '%s\n' '{"schemaVersion":1,"nodes":[{"id":123}]}' > "$TEST_ROOT/malformed-catalog.json"
if node "$MAPIFY" find anything --catalog "$TEST_ROOT/malformed-catalog.json" \
  > "$TEST_ROOT/malformed.txt" 2>&1; then
  echo "mapify test: malformed catalogue node was accepted" >&2
  exit 1
fi
grep -q 'mapify: .*invalid Mapify catalogue node' "$TEST_ROOT/malformed.txt"
if grep -q 'TypeError' "$TEST_ROOT/malformed.txt"; then
  echo "mapify test: malformed catalogue escaped bounded validation" >&2
  exit 1
fi

ESCAPED_NODE="$PROJECT/.mapify/nodes/landmarks/escape.manual.md"
printf '%s\n' '---' 'schemaVersion: 1' 'id: "escape.manual"' 'kind: "landmark"' \
  'status: "active"' 'path: "../missing-outside.tsx"' 'symbol: "Missing"' \
  'summary: "Malformed manual pointer."' 'tags: []' 'edges: []' \
  'verifiedRevision: "old"' 'verifiedAt: "2026-01-01T00:00:00.000Z"' \
  'fingerprint: "sha256:missing"' '---' '' '# escape.manual' > "$ESCAPED_NODE"
if node "$MAPIFY" verify --repo "$PROJECT" --catalog "$CATALOG" \
  --id escape.manual --tombstone-missing > "$TEST_ROOT/escaped-missing.txt"; then
  echo "mapify test: escaped missing path was tombstoned" >&2
  exit 1
fi
grep -q $'escape.manual\texternal\t../missing-outside.tsx\tpath-escapes-repository' "$TEST_ROOT/escaped-missing.txt"
[[ -f "$ESCAPED_NODE" ]]
[[ ! -e "$PROJECT/.mapify/tombstones/escape.manual.md" ]]
rm "$ESCAPED_NODE"

printf '%s\n' '// implementation changed' >> "$PROJECT/$SOURCE"
if node "$MAPIFY" verify --repo "$PROJECT" --catalog "$CATALOG" --id cinema.title-sheet > "$TEST_ROOT/stale.txt"; then
  echo "mapify test: changed fingerprint passed verification" >&2
  exit 1
fi
grep -q $'cinema.title-sheet\tstale' "$TEST_ROOT/stale.txt"

node "$MAPIFY" refresh --repo "$PROJECT" --catalog "$CATALOG" --id cinema.title-sheet >/dev/null
rm "$PROJECT/$SOURCE"
node "$MAPIFY" verify --repo "$PROJECT" --catalog "$CATALOG" --id cinema.title-sheet \
  --tombstone-missing --replacement cinema.title-page > "$TEST_ROOT/removed.txt"
[[ ! -e "$PROJECT/.mapify/nodes/landmarks/cinema.title-sheet.md" ]]
[[ -f "$PROJECT/.mapify/tombstones/cinema.title-sheet.md" ]]
grep -q 'replacement: "cinema.title-page"' "$PROJECT/.mapify/tombstones/cinema.title-sheet.md"
[[ "$(grep -c '^# cinema.title-sheet$' "$PROJECT/.mapify/tombstones/cinema.title-sheet.md")" -eq 1 ]]
set +e
node "$MAPIFY" find TitleSheet.tsx --catalog "$CATALOG" --json > "$TEST_ROOT/removed.json"
removed_find_status=$?
set -e
[[ "$removed_find_status" -eq 2 ]]
node -e 'const fs=require("node:fs"); const r=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); if (r[0].status !== "removed" || r[0].trust !== "stale-or-removed") process.exit(1);' "$TEST_ROOT/removed.json"
if node "$MAPIFY" verify --repo "$PROJECT" --catalog "$CATALOG" --id cinema.title-route > "$TEST_ROOT/edge-stale.txt"; then
  echo "mapify test: edge to removed node passed verification" >&2
  exit 1
fi
grep -q 'edges-renders:cinema.title-sheet:removed' "$TEST_ROOT/edge-stale.txt"
cp "$PROJECT/.mapify/nodes/landmarks/cinema.title-route.md" "$TEST_ROOT/title-route-before.md"
cp "$CATALOG" "$TEST_ROOT/catalog-before.json"
cp "$PROJECT/.mapify/index.md" "$TEST_ROOT/index-before.md"
cp "$PROJECT/.mapify/views/source-tree.md" "$TEST_ROOT/source-tree-before.md"
cp "$PROJECT/.mapify/views/topics.md" "$TEST_ROOT/topics-before.md"
if node "$MAPIFY" refresh --repo "$PROJECT" --catalog "$CATALOG" \
  --id cinema.title-route > "$TEST_ROOT/invalid-refresh.txt" 2>&1; then
  echo "mapify test: refresh re-blessed an invalid edge" >&2
  exit 1
fi
grep -q 'refresh refused; repair invalid edges first: renders:cinema.title-sheet:removed' "$TEST_ROOT/invalid-refresh.txt"
cmp "$TEST_ROOT/title-route-before.md" "$PROJECT/.mapify/nodes/landmarks/cinema.title-route.md"
cmp "$TEST_ROOT/catalog-before.json" "$CATALOG"
cmp "$TEST_ROOT/index-before.md" "$PROJECT/.mapify/index.md"
cmp "$TEST_ROOT/source-tree-before.md" "$PROJECT/.mapify/views/source-tree.md"
cmp "$TEST_ROOT/topics-before.md" "$PROJECT/.mapify/views/topics.md"
node "$MAPIFY" refresh --repo "$PROJECT" --catalog "$CATALOG" \
  --id cinema.title-route --edge renders:cinema.playback-actions >/dev/null
node "$MAPIFY" verify --repo "$PROJECT" --catalog "$CATALOG" \
  --id cinema.title-route | grep -q $'cinema.title-route\tvalid.*edges-linked'
node "$MAPIFY" capture --repo "$PROJECT" --catalog "$CATALOG" \
  --id cinema.title-sheet-v2 --kind decision \
  --summary 'The removed title sheet was superseded by the new title surface.' \
  --edge supersedes:cinema.title-sheet >/dev/null
node "$MAPIFY" verify --repo "$PROJECT" --catalog "$CATALOG" \
  --id cinema.title-sheet-v2 | grep -q $'cinema.title-sheet-v2\tvalid.*edges-linked'

printf '%s\n' 'outside' > "$TEST_ROOT/outside.tsx"
if node "$MAPIFY" capture --repo "$PROJECT" --catalog "$CATALOG" \
  --id escape.pointer --kind landmark --path ../outside.tsx --summary 'Must fail.' >/dev/null 2>&1; then
  echo "mapify test: repository-escaping path was accepted" >&2
  exit 1
fi

mkdir -p "$PROJECT/apps/cinema/src/components"
ln -s "$TEST_ROOT/outside.tsx" "$PROJECT/apps/cinema/src/components/Outside.tsx"
if node "$MAPIFY" capture --repo "$PROJECT" --catalog "$CATALOG" \
  --id escape.symlink --kind landmark --path apps/cinema/src/components/Outside.tsx \
  --summary 'Must also fail.' >/dev/null 2>&1; then
  echo "mapify test: source symlink escaping the repository was accepted" >&2
  exit 1
fi

node "$MAPIFY" rebuild --repo "$PROJECT" --catalog "$CATALOG" >/dev/null
node "$MAPIFY" --help | grep -q 'sparse verified codebase graph'

[[ -f "$VIEWER" ]]
grep -q 'cinema.title-sheet' "$VIEWER"
grep -q '<option value="active">Active</option>' "$VIEWER"
grep -q 'id="fileInput"' "$VIEWER"
grep -q 'prefers-reduced-motion' "$VIEWER"
grep -q 'Interactive graph of Mapify nodes' "$VIEWER"
if grep -Eq '<(script|link)[^>]+(src|href)="https?://' "$VIEWER"; then
  echo "mapify test: graph viewer has an external runtime dependency" >&2
  exit 1
fi

printf 'Skillify Mapify tests passed.\n'
