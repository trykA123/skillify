#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT="$(mktemp -d "${TMPDIR:-/tmp}/skillify-test.XXXXXX")"
trap 'rm -rf -- "$ROOT"' EXIT
fail() { echo "test: $*" >&2; exit 1; }
SKILL_COUNT="$(find "$REPO_DIR/skills" -mindepth 1 -maxdepth 1 -type d | wc -l)"
AGENT_COUNT="$(find "$REPO_DIR/agents" -maxdepth 1 -name '*.md' | wc -l)"

T="$ROOT/skills"
mkdir -p "$T"
ln -s "$REPO_DIR/entry/mapify" "$T/mapify"
mkdir "$T/foreign"
"$REPO_DIR/install.sh" --target "$T" --update >/dev/null
[[ ! -e "$T/mapify" && ! -L "$T/mapify" ]] || fail "retired link survived"
[[ -d "$T/foreign" ]] || fail "unmanaged entry removed"
[[ "$(find "$T" -maxdepth 1 -type l | wc -l)" -eq "$SKILL_COUNT" ]] || fail "wrong link count"
[[ -f "$T/shipify/references/tests.md" ]] || fail "shipify references missing"

mkdir -p "$ROOT/c/traceify"
if "$REPO_DIR/install.sh" --target "$ROOT/c" --copy >/dev/null 2>&1; then fail "overwrote unmanaged directory"; fi
rm -rf "$ROOT/c"
"$REPO_DIR/install.sh" --target "$ROOT/c" --copy --skill traceify,teachify >/dev/null
[[ -f "$ROOT/c/teachify/scripts/validate-lesson.mjs" && -f "$ROOT/c/traceify/.skillify-managed" ]] || fail "copy incomplete"
"$REPO_DIR/install.sh" --target "$ROOT/c" --uninstall >/dev/null
[[ -z "$(ls -A "$ROOT/c")" ]] || fail "uninstall left entries"

mkdir -p "$ROOT/project"
(cd "$ROOT/project" && "$REPO_DIR/install.sh" --project --harness vscode --native-agents copilot --copy >/dev/null)
[[ -f "$ROOT/project/.github/skills/orientify/SKILL.md" ]] || fail "project skills missing"
[[ -f "$ROOT/project/.github/agents/worker.agent.md" ]] || fail "project agents missing"

for harness in claude codex opencode copilot; do
  D="$ROOT/agents-$harness"
  mkdir -p "$D"
  printf 'stale\n' > "$D/.keep"
  node "$REPO_DIR/scripts/render-agents.mjs" --harness "$harness" --dest "$D" >/dev/null
  node "$REPO_DIR/scripts/render-agents.mjs" --harness "$harness" --dest "$D" --check >/dev/null
  [[ "$(find "$D" -maxdepth 1 -type f ! -name '.skillify-native.json' ! -name .keep | wc -l)" -eq "$AGENT_COUNT" ]] || fail "$harness agent count"
  printf '\nedited\n' >> "$(find "$D" -maxdepth 1 -name 'scout*' | head -1)"
  if node "$REPO_DIR/scripts/render-agents.mjs" --harness "$harness" --dest "$D" >/dev/null 2>&1; then fail "$harness overwrote an edited agent"; fi
  node "$REPO_DIR/scripts/render-agents.mjs" --harness "$harness" --dest "$D" --uninstall --force >/dev/null
  [[ ! -e "$D/.skillify-native.json" ]] || fail "$harness uninstall"
done

node "$REPO_DIR/scripts/render-agents.mjs" --harness claude --dest "$ROOT/cl" >/dev/null
grep -q '^tools: Bash, Glob, Grep, Read$' "$ROOT/cl/reviewer.md" || fail "claude reviewer tools"
grep -q 'Edit' "$ROOT/cl/worker.md" || fail "claude worker cannot edit"
node "$REPO_DIR/scripts/render-agents.mjs" --harness codex --dest "$ROOT/cx" >/dev/null
grep -q '^sandbox_mode = "read-only"$' "$ROOT/cx/scout.toml" || fail "codex scout sandbox"
! grep -q sandbox_mode "$ROOT/cx/worker.toml" || fail "codex worker sandbox"
node "$REPO_DIR/scripts/render-agents.mjs" --harness opencode --dest "$ROOT/oc" >/dev/null
grep -q '  edit: deny' "$ROOT/oc/reviewer.md" || fail "opencode reviewer permission"
if node "$REPO_DIR/scripts/render-agents.mjs" --harness codex --dest / --dry-run >/dev/null 2>&1; then fail "unsafe destination accepted"; fi

node "$REPO_DIR/scripts/run-evals.mjs" --adapter fixture >/dev/null || fail "eval runner"
node "$REPO_DIR/skills/teachify/scripts/validate-lesson.mjs" "$REPO_DIR/skills/teachify/assets/lesson-template.html" >/dev/null
mkdir -p "$ROOT/fb"
cat > "$ROOT/fb/f.jsonl" <<'JSON'
{"date":"2026-09-01","agent":"worker","model":"m1","harness":"claude","task":"a <b>","skills":["shipify","reviewify"],"helped":"x","hindered":"y","missing":"a retry budget note","verdict":"helped"}
{"date":"2026-09-10","agent":"worker","model":"m2","harness":"codex","task":"b","skills":[],"helped":"x","hindered":"y","missing":"retry budget guidance","verdict":"hurt"}
{"date":"2026-09-11","agent":"reviewer","model":"m1","harness":"claude","task":"c","skills":["shipify"],"helped":"x","hindered":"y","missing":"nothing","verdict":"neutral"}
JSON
node "$REPO_DIR/scripts/feedback-report.mjs" --input "$ROOT/fb/f.jsonl" --output "$ROOT/fb/index.html" >/dev/null
H="$ROOT/fb/index.html"
grep -q '<b>3</b><span>entries</span>' "$H" || fail "report entry count"
grep -q '67%' "$H" || fail "report skill share"
grep -q '<div class="stat hurt"><b>1</b>' "$H" || fail "report verdict split"
grep -q '<em>1 of 2</em> runs that loaded a skill said it helped' "$H" || fail "report hero"
grep -q '<div class="hlabel" title="(none)">' "$H" || fail "report (none) row"
grep -q '<span>retry budget</span><i>2 of 2</i>' "$H" || fail "report recurring asks"
grep -q 'a &lt;b&gt;' "$H" || fail "report escaping"
! grep -oE 'https?://[^"'"'"' <>)]+' "$H" | grep -vE '^https://(fonts\.googleapis\.com|fonts\.gstatic\.com|github\.com/trykA123/skillify)' | grep -q . || fail "report has external reference"
echo '{"verdict":"bogus"}' > "$ROOT/fb/bad.jsonl"
if node "$REPO_DIR/scripts/feedback-report.mjs" --input "$ROOT/fb/bad.jsonl" --output "$ROOT/fb/bad.html" >/dev/null 2>&1; then fail "report accepted a bad verdict"; fi

mkdir -p "$ROOT/ev/res/day" "$ROOT/ev/paired"
row() { printf '{"task":"%s","arm":"%s","model":"%s","score":%s,"cost":%s,"turns":%s,"seconds":%s}\n' "$@"; }
{
  row t1 base m1 0.5 0.10 10 20; row t1 skill m1 0.5 0.10 10 20
  row t2 base m1 0.5 0.10 10 20; row t2 skill m1 1.0 0.20 10 20
  row t1 base m2 1.0 0.50 10 20; row t1 skill m2 1.0 0.50 10 20
  row t2 base m2 1.0 0.50 10 20; row t2 skill m2 1.0 0.50 10 20
} > "$ROOT/ev/res/day/r1-all.jsonl"
row t1 skill m1 1.0 0.30 20 40 > "$ROOT/ev/res/day/r2-m1-t1.jsonl"
cat > "$ROOT/fb/f2.jsonl" <<'JSON'
{"date":"2026-09-01","agent":"worker","model":"m1","harness":"claude","task":"a","skills":[],"helped":"x","hindered":"y","missing":"z","verdict":"helped","tokens":12000,"tools":30,"ms":90000}
{"date":"2026-09-02","agent":"worker","model":"m1","harness":"claude","task":"b","skills":[],"helped":"x","hindered":"y","missing":"z","verdict":"helped","tokens":20000}
{"date":"2026-09-03","agent":"worker","model":"m1","harness":"claude","task":"c","skills":[],"helped":"x","hindered":"y","missing":"z","verdict":"neutral"}
JSON
node "$REPO_DIR/scripts/feedback-report.mjs" --input "$ROOT/fb/f2.jsonl" --output "$ROOT/ev/index.html" --results "$ROOT/ev/res" --paired "$ROOT/ev/paired" >/dev/null
E="$ROOT/ev/index.html"
grep -q 'data-cpp="m1|base">\$0.200<' "$E" || fail "cost per point base"
grep -q 'data-cpp="m1|skill">\$0.250<' "$E" || fail "cost per point skill (r2 must supersede r1)"
grep -q 'data-cpp="m2|skill">\$0.500<' "$E" || fail "cost per point second model"
grep -q '<span class="tv">0.50 → 1.00</span>' "$E" || fail "superseded per-task score"
grep -q 'm1 with skills matches m2 without them (1.00 vs 1.00), <em>at ~50% of the cost.</em>' "$E" || fail "evidence headline"
grep -q 'Grader type is not recorded' "$E" || fail "method fallback"
grep -q '2 fixtures, up to 1 run per arm' "$E" || fail "method counts"
grep -q 'r1-all.jsonl</a>' "$E" || fail "raw file link"
grep -q 'data-cost="tokens">16k<small>2 of 3</small>' "$E" || fail "field token median"
grep -q 'data-cost="tools">30<small>1 of 3</small>' "$E" || fail "field tool median"
grep -q 'data-cost="ms">1m 30s<small>1 of 3' "$E" || fail "duration median"
grep -q 'cost <span class="norec">not recorded</span>' "$E" || fail "card not recorded"
grep -q 'not recorded' "$H" || fail "old entries not recorded"
! grep -q 'data-cost="tokens">0' "$H" || fail "unrecorded shown as 0"
if node "$REPO_DIR/scripts/log-feedback.mjs" --agent a --task t --verdict helped --tokens -5 >/dev/null 2>&1; then fail "negative tokens accepted"; fi
if node "$REPO_DIR/scripts/log-feedback.mjs" --agent a --task t --verdict helped --ms 1.5 >/dev/null 2>&1; then fail "fractional ms accepted"; fi
echo '{"verdict":"helped","tools":-1}' > "$ROOT/fb/badc.jsonl"
if node "$REPO_DIR/scripts/feedback-report.mjs" --input "$ROOT/fb/badc.jsonl" --output "$ROOT/fb/badc.html" >/dev/null 2>&1; then fail "report accepted negative tools"; fi

echo "all tests passed"
