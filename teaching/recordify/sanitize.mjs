// ── recordify · sanitize.mjs — the I1 privacy gate ─────────────────────────
// Store the PATTERN + a SANITIZED GIST. Never verbatim speech, file paths,
// project names, class/DOM identifiers, URLs, emails, IPs, or hex tokens.
//
// Exports:
//   sanitizeNote(raw)  → last-mile de-identified string (paraphrase is the
//                        agent's/curator's job; this only strips structure).
//                        Quoted spans are REMOVED, never unwrapped-and-kept —
//                        keeping the inner text launders a detectable quote
//                        into an undetectable one.
//   detectLeaks(text)  → string[] of matched leak patterns ([] = clean).
//                        Includes a VERBATIM-SPEECH class: a note that still
//                        reads as the user's own speech (first/second person,
//                        imperatives, direct questions, chat markers, typos,
//                        gendered/personal descriptors) is verbatim.
//   scanRecord(md)     → frontmatter-AWARE gate for a whole record file:
//                        scans only the evidence note VALUES + the body prose,
//                        never the raw YAML syntax (whose quote-wrapped scalars
//                        would false-positive). [] = clean.
//
// The gate: a record is refused when scanRecord(md) — or detectLeaks on any
// single note — is non-empty.
//
// Keep the pattern set in sync with the app audit (07-dashboard/skillmap/
// scripts/audit.ts) — verified at deploy time.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DOUBLE_Q = /(^|[\s(])(")([^"\n]{4,})\2/g;
const SINGLE_Q_OPEN = /(^|[\s(])'/g;
const SINGLE_Q_CLOSE = /'(?![\w'])/g;
const PATH = /(?:file:\/\/[^\s"')>,]+|~\/[^\s"')>,]+|\/tmp\/[^\s"')>,]+|\/mnt\/[^\s"')>,]+|\/home\/[^\s"')>,]+|\/var\/[^\s"')>,]+|\/opt\/[^\s"')>,]+|\/usr\/[^\s"')>,]+|\/etc\/[^\s"')>,]+|(?:^|[\s(])\/(?:[A-Za-z0-9_.-]+\/)+[A-Za-z0-9_.-]+)/g;
const URL = /https?:\/\/[^\s"'<>)]+|www\.[A-Za-z0-9.-]+|(?:^|[^A-Za-z0-9])([A-Za-z0-9-]+\.(?:duckdns|github|gitlab|googleapis|gstatic|example|test)\.(?:org|com|net|io|dev|app|local))/g;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const IP = /\b\d{1,3}(?:\.\d{1,3}){3}\b/g;
const HEX = /\b[0-9a-fA-F]{16,}\b|\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g;

// Identifiers that must never appear. The committed base list is SYNTHETIC
// (public-safe examples); the real homelab blocklist is LOCAL-ONLY and loaded
// from recordify-curation.json when present — it never ships with the public
// skill. Add a new real identifier to that local file (with a test), not here.
const BASE_IDENTIFIERS = ['example-app', 'my-class', 'sample-config.json', 'demo-widget'];
const LEARNING_ROOT = process.env.SKILLIFY_LEARNING_ROOT || path.join(os.homedir(), '.skillify', 'learnings');
const CURATION_FILE = path.join(LEARNING_ROOT, 'recordify-curation.json');
let LOCAL_IDENTIFIERS = [];
try {
  LOCAL_IDENTIFIERS = JSON.parse(fs.readFileSync(CURATION_FILE, 'utf8')).identifiers ?? [];
} catch (e) {
  if (fs.existsSync(CURATION_FILE)) {
    // Fail CLOSED: the local blocklist exists but is unreadable/corrupt — a
    // privacy gate must never silently run without its blocklist (2026-08-03).
    console.error(`sanitize: FAIL-CLOSED — ${CURATION_FILE} unreadable/corrupt (${e.message})`);
    process.exit(1);
  }
  // Missing file = known state (fresh install / CI) → synthetic base list only.
}
const IDENTIFIERS = [...BASE_IDENTIFIERS, ...LOCAL_IDENTIFIERS];

const IDENTIFIER_RE = new RegExp(
  '\\b(' +
    [...IDENTIFIERS]
      .sort((a, b) => b.length - a.length)
      .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|') +
    ')\\b',
  'gi'
);

// camelCase / PascalCase code symbols (e.g. navContainer, RenderLoop) — replaced
// by a generic role word; too noisy for the hard gate, so detectLeaks relies on
// the curated list + structural patterns.
const CAMEL = /\b[a-z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*\b/g;

// ── the verbatim-speech class (I1: never store raw conversation) ────────────
// A sanitized gist is third-person and descriptive ("Named the referent…").
// Anything that still reads as the user's OWN voice is verbatim and must be
// paraphrased. Each regex is a speech tell; a match flags the note.
const SPEECH_RES = [
  // first-person subject: "I don't buy", "I really want", "what should I understand"
  /\bI\s+(?:don'?t|do\s+not|really|want|know|used|am\b|will|might|can\b|see\b|got|think|meant|only|have|insisted|understand|would)/i,
  // first-person object: "came from me", "rate me", "understand me"
  /\b(?:from|rate|show|tell|ask(?:ed)?)\s+me\b/i,
  /\bmy\s+rating\b/i,
  // second person: "you don't need", "your big brother", "yourself"
  /\b(?:you|your|yours|yourself|you're)\b/i,
  // first-person plural: "we will handle", "our rules", "make sure that we"
  /\b(?:we|our|us)\b/i,
  // polite imperative: "please check the ratios"
  /\bplease\s+\w+/i,
  // directive markers: "make sure", "note that", "DO NOT"
  /\bmake\s+sure\b/i,
  /\bnote\s+that\b/i,
  /\bDO\s+NOT\b/i,
  /\bdon'?t\s+(?:forget|touch|show|need|buy|change|use)\b/i,
  /\b(?:update|bump)\s+(?:my|the)\b/i,
  // a direct question is almost always the user's own sentence
  /\?/,
  // chat markers: ":)", "ok?", trailing/elliptical dots, interjections
  /:\)|:\(|\bok\?\b/i,
  /\.{2,}|…/,
  /\bWait,\s/,
  /\bNo\.{1,2}\s/i,
  // apology / filler tells that survive only in raw speech
  /\bsorry\b/i,
  // preserved-typo tell-tales (raw speech, never a curated gist)
  /\b(?:echivalent|informations|feasable)\b/i,
  /\bsafe\s+heaven\b/i,
  /\b1\.250\s+ration\b/i,
  // "it's great / easier / downloaded", "feels way too powerful"
  /\bit'?s\s+(?:great|easier|downloaded|way\s+too)\b/i,
  /\bfeels\s+\w+/i,
  // gendered / personal descriptors — genericize to a role
  /\b(?:her|his|him|herself|himself|she|the\s+boss)\b/i
];

function matchSpans(re, text) {
  re.lastIndex = 0;
  const out = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    out.push({ start: m.index, end: re.lastIndex, len: m[0].length });
    if (m[0].length === 0) re.lastIndex++;
  }
  return out;
}

/** Return every leak pattern matched in `text` (empty array = clean). */
export function detectLeaks(text) {
  if (typeof text !== 'string' || text.length === 0) return [];
  const hits = [];
  const collect = (re, label) => {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      hits.push(`${label}: ${m[0].slice(0, 60)}`);
      if (m[0].length === 0) re.lastIndex++;
    }
  };
  // quoted spans: single-quoted spans may contain contractions ('it's …'), so
  // pair openings (quote after start/space/paren) with closings (quote before
  // a boundary).
  const singles = matchSpans(SINGLE_Q_OPEN, text);
  const singleCloses = matchSpans(SINGLE_Q_CLOSE, text);
  let k = 0;
  for (const o of singles) {
    while (k < singleCloses.length && singleCloses[k].start <= o.start) k++;
    if (k >= singleCloses.length) break;
    const c = singleCloses[k++];
    const quoteStart = o.start + (o.len > 1 ? 1 : 0);
    const inner = text.slice(quoteStart + 1, c.start);
    if (inner.length >= 4) {
      hits.push(`verbatim-quote: ${text.slice(quoteStart, c.start + 1).slice(0, 60)}`);
    }
  }
  collect(DOUBLE_Q, 'verbatim-quote');
  collect(PATH, 'path');
  collect(URL, 'url');
  collect(EMAIL, 'email');
  collect(IP, 'ip');
  collect(HEX, 'hex-token');
  collect(IDENTIFIER_RE, 'identifier');
  // verbatim-speech class (first match per tell is enough to flag)
  for (const re of SPEECH_RES) {
    re.lastIndex = 0;
    const m = re.exec(text);
    if (m) hits.push(`verbatim-speech: ${m[0].slice(0, 60)}`);
  }
  return hits;
}

/** REMOVE quoted spans (never keep the inner text — keeping it launders a
 * detectable quote into an undetectable one). Paraphrase is the curator's job;
 * this is the last-mile structural strip. */
function stripQuotedSpans(s) {
  // double quotes first (safe: no apostrophe ambiguity)
  s = s.replace(DOUBLE_Q, (m, pre) => (pre === '(' ? '(' : ' '));
  // single quotes: pair openings/closings, blank spans >= 4 chars
  const singles = matchSpans(SINGLE_Q_OPEN, s).map((o) => ({
    quoteStart: o.start + (o.len > 1 ? 1 : 0),
    prefixChar: o.len > 1 ? s[o.start] : null,
    ...o
  }));
  const closes = matchSpans(SINGLE_Q_CLOSE, s);
  let k = 0;
  const spans = [];
  for (const o of singles) {
    while (k < closes.length && closes[k].start <= o.start) k++;
    if (k >= closes.length) break;
    const c = closes[k++];
    if (c.start - o.quoteStart >= 4) {
      spans.push({ quoteStart: o.quoteStart, closeStart: c.start, prefixChar: o.prefixChar });
    }
  }
  if (spans.length === 0) return s;
  let out = '';
  let pos = 0;
  for (const sp of spans) {
    out += s.slice(pos, sp.quoteStart - (sp.prefixChar ? 1 : 0));
    out += sp.prefixChar ? sp.prefixChar : '';
    out += ' '; // the quoted span is dropped, not preserved
    pos = sp.closeStart + 1;
  }
  return out + s.slice(pos);
}

/** Last-mile de-identification: REMOVE quoted spans, paths, URLs, emails, IPs,
 * hex, and known identifiers. Paraphrasing a note into a clean gist is the
 * agent's/curator's job — sanitizeNote only strips the structural leaks. */
export function sanitizeNote(raw) {
  if (typeof raw !== 'string') return '';
  let s = raw;
  s = stripQuotedSpans(s);
  s = s.replace(PATH, 'a path');
  s = s.replace(URL, 'a link');
  s = s.replace(EMAIL, 'an email');
  s = s.replace(IP, 'an address');
  s = s.replace(HEX, 'a token');
  s = s.replace(IDENTIFIER_RE, '[name]');
  s = s.replace(CAMEL, '[symbol]');
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/\s*[;:,]\s*$/g, '');
  s = s.replace(/:\s*—/g, ' —'); // a quote removed mid-clause leaves "… : —"
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/** Frontmatter-aware gate for a whole record file. Scans ONLY the content that
 * carries free text — every `evidence[].note` value, plus the body prose
 * (title, narrative, what-worked / what-didn't) — and NEVER the raw YAML
 * syntax (id/date/skill/competencies_touched/outcome/artifact/valence and the
 * quote-wrapped scalar delimiters, which would false-positive). Returns [] when
 * the record is clean. */
export function scanRecord(md) {
  if (typeof md !== 'string' || md.length === 0) return [];
  const hits = [];
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const front = m ? m[1] : '';
  const body = m ? md.slice(m[0].length) : md;
  // evidence note values only (yaml() double-quotes and escapes them)
  const noteRe = /^[ \t]*note:[ \t]*"((?:[^"\\]|\\.)*)"[ \t]*$/gm;
  let nm;
  while ((nm = noteRe.exec(front)) !== null) {
    const val = nm[1].replace(/\\([^])/g, '$1');
    hits.push(...detectLeaks(val));
  }
  // body prose: title + narrative + bullets (plain text, no YAML)
  hits.push(...detectLeaks(body));
  return hits;
}

export const PATTERNS = { DOUBLE_Q, PATH, URL, EMAIL, IP, HEX, IDENTIFIERS, SPEECH_RES };

export default { sanitizeNote, detectLeaks, scanRecord, PATTERNS };
