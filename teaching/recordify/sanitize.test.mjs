// ── recordify · sanitize.test.mjs — adversarial I1 test suite ───────────────
// Run: bun test recordify/sanitize.test.mjs  (or bun test from repo root)
//
// Every fixture below is SYNTHETIC (invented for the test). Real user
// utterances, real work identifiers, and real paths must never appear in this
// public file — the production blocklist of real identifiers is local-only
// (recordify-curation.json) and is exercised by the gate audit, not here.
import { test, expect } from 'bun:test';
import { sanitizeNote, detectLeaks, scanRecord } from './sanitize.mjs';

const CLEAN = (s) => {
  expect(detectLeaks(s), `expected clean: ${s}`).toEqual([]);
};

// ── detectLeaks: the structural gate ─────────────────────────────────────────
test('flags verbatim quoted spans', () => {
  expect(detectLeaks("Round 1: 'the example div is too short' — intent in one")).not.toEqual([]);
  expect(detectLeaks('said "it reads far too loud" about the color')).not.toEqual([]);
});
test('flags single+double quotes after whitespace or open paren', () => {
  expect(detectLeaks("( 'keep the earlier concept, but from zero' )")).not.toEqual([]);
  expect(detectLeaks('Prompt: "no heavy libs, flat markup only"')).not.toEqual([]);
});
test('flags file paths', () => {
  expect(detectLeaks('screenshots at /tmp/clip-12345.png')).not.toEqual([]);
  expect(detectLeaks('artifact file:///data/repo/foo.md')).not.toEqual([]);
  expect(detectLeaks('the notes live under ~/notes/daily.md')).not.toEqual([]);
});
test('flags URLs, emails, IPs, hex tokens', () => {
  expect(detectLeaks('the doc at https://example.com/spec')).not.toEqual([]);
  expect(detectLeaks('reach me at user@example.org today')).not.toEqual([]);
  expect(detectLeaks('the host 192.168.1.50 responded')).not.toEqual([]);
  expect(detectLeaks('token 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08')).not.toEqual([]);
});
test('flags project/class identifiers (synthetic blocklist)', () => {
  // BASE_IDENTIFIERS are committed + synthetic; the real homelab blocklist is
  // local-only and covered by the gate audit, so tests stay portable.
  expect(detectLeaks('the div class my-class inside the layout')).not.toEqual([]);
  expect(detectLeaks('the example-app was rebuilt over the weekend')).not.toEqual([]);
  expect(detectLeaks('load sample-config.json to pin the mapping')).not.toEqual([]);
  expect(detectLeaks('the demo-widget shipped today')).not.toEqual([]);
});

// ── detectLeaks: the verbatim-speech class (HIGH-5) ──────────────────────────
test('flags first-person speech', () => {
  expect(detectLeaks("I don't like these two options — too alike")).not.toEqual([]);
  expect(detectLeaks('the only thing I really want is the rewrite')).not.toEqual([]);
  expect(detectLeaks('what should I understand from this diagram')).not.toEqual([]);
  expect(detectLeaks('the call came from me, not the doc')).not.toEqual([]);
});
test('flags second-person directives and questions', () => {
  expect(detectLeaks('DO NOT EDIT THIS CONFIG, just read it')).not.toEqual([]);
  expect(detectLeaks("you don't need to keep the old layout")).not.toEqual([]);
  expect(detectLeaks('why do you load only one column here?')).not.toEqual([]);
  expect(detectLeaks('please show me again before I log off')).not.toEqual([]);
});
test('flags imperatives, direct questions, chat markers', () => {
  expect(detectLeaks('make sure the header stays pinned')).not.toEqual([]);
  expect(detectLeaks('note that this runs on a small screen')).not.toEqual([]);
  expect(detectLeaks('bump the font and use the grid')).not.toEqual([]);
  expect(detectLeaks('where does the last link go?')).not.toEqual([]);
  expect(detectLeaks('use the darkest theme for the demo :)')).not.toEqual([]);
  expect(detectLeaks('add a panel.. or a list')).not.toEqual([]);
});
test('flags typo tell-tales and gendered/personal descriptors', () => {
  expect(detectLeaks('the size with an echivalent in rem')).not.toEqual([]);
  expect(detectLeaks('add informations for every row')).not.toEqual([]);
  expect(detectLeaks('a safe heaven to fall back on')).not.toEqual([]);
  expect(detectLeaks('the note was saved in her own scratch file')).not.toEqual([]);
  expect(detectLeaks('hand it to him yourself for now')).not.toEqual([]);
  expect(detectLeaks('walked the boss through the plan')).not.toEqual([]);
});
test('passes clean third-person gists (zero leaks, incl. speech)', () => {
  CLEAN('Stated the problem in the opening sentence — intent led the ask');
  CLEAN('Constraint named before the agent started guessing');
  CLEAN('Feedback scored and ordered, critical first — what wins was stated');
  CLEAN('Used the lite path where full ceremony would not have earned its keep');
  CLEAN('Named the referent with a key-line — the metaphor became a mnemonic');
  CLEAN('Challenged the cost figure with the observed number and asked for reconciliation');
  CLEAN('Traced the code path before asking — the gap was answered by reading');
  CLEAN('Asked for a diagram only when chat reached its limit');
  CLEAN('Rejected two concepts with the reason attached — too similar to navigate');
  CLEAN('Re-invoked the teaching loop at the natural checkpoint before signing off');
});
test('does not false-positive on apostrophes inside words', () => {
  CLEAN("Don't re-ask the same question — fold the context in");
  CLEAN("The agent's mental model was wrong by about ten times");
  CLEAN("Won't ship until the render passes — the bar held");
});
test('allowlisted short borderline quote passes', () => {
  CLEAN('the "why" matters more than the what-again');
});

// ── sanitizeNote: the last-mile transform (HIGH-4) ───────────────────────────
test('REMOVES quoted spans — inner text never survives', () => {
  const out = sanitizeNote("Round 1: 'the example div inside this container is too short' — intent in sentence one");
  // the quoted span is dropped, not unwrapped-and-kept
  expect(out).not.toMatch(/example div|too short|container/);
  expect(out).toMatch(/intent in sentence one/);
  expect(detectLeaks(out)).toEqual([]);
});
test('removes paths, urls, emails', () => {
  const out = sanitizeNote('screenshots at /tmp/clip-x.png, doc at https://example.com/x, mail a@b.co');
  expect(detectLeaks(out)).toEqual([]);
  expect(out).not.toMatch(/\/tmp|example\.com|a@b/);
});
test('removes identifiers and camelCase symbols', () => {
  const out = sanitizeNote('read sample-config.json and check the service output; demoWidget layout');
  expect(detectLeaks(out)).toEqual([]);
  expect(out).not.toMatch(/sample-config|demoWidget/);
});
test('normalizes whitespace and trims trailing punctuation', () => {
  expect(sanitizeNote('  a   gist   ; ')).toBe('a gist');
});
test('empty/null input yields empty output', () => {
  expect(sanitizeNote(null)).toBe('');
  expect(sanitizeNote('')).toBe('');
});

// ── scanRecord: the whole-file, frontmatter-aware gate (MED-6 / BLOCKER-3) ───
const CLEAN_RECORD = `---
id: sess-2026-08-02-sample
date: 2026-08-02
skill: promptify
competencies_touched: [P1, P6]
outcome: completed
artifact: null
evidence:
  - competency: P1
    note: "Stated the problem in the opening sentence — intent led the ask"
    valence: positive
  - competency: P6
    note: "Folded the context into the question — ask once, with the why stated"
    valence: positive
---
# Sample — a clean session

## What happened
A clean, third-person narrative about the pattern practiced.

## What worked
- Stated the problem in the opening sentence — intent led the ask

## What didn't
- none recorded
`;

test('scanRecord passes a clean record file (the documented gate)', () => {
  expect(scanRecord(CLEAN_RECORD)).toEqual([]);
});
test('scanRecord does NOT false-positive on YAML quote wrappers', () => {
  // the old whole-file detectLeaks flagged every note: "..." wrapper; the
  // frontmatter-aware scan must not.
  const wrapped = CLEAN_RECORD;
  expect(wrapped).toContain('note: "'); // the YAML serialization is quote-wrapped…
  expect(scanRecord(wrapped)).toEqual([]); // …and still scans clean
});
test('scanRecord flags a dirty note value', () => {
  const dirty = CLEAN_RECORD.replace(
    'Stated the problem in the opening sentence — intent led the ask',
    'DO NOT EDIT THIS CONFIG, just read it'
  );
  expect(scanRecord(dirty)).not.toEqual([]);
});
test('scanRecord flags a dirty body line', () => {
  const dirty = CLEAN_RECORD.replace(
    'A clean, third-person narrative about the pattern practiced.',
    'please show me again as I am about to log off'
  );
  expect(scanRecord(dirty)).not.toEqual([]);
});
test('scanRecord flags an escaped-quote injection in a note', () => {
  const dirty = CLEAN_RECORD.replace(
    'Folded the context into the question — ask once, with the why stated',
    'she said \\"just read /tmp/secrets\\" and left'
  );
  expect(scanRecord(dirty)).not.toEqual([]);
});
