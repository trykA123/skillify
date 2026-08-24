#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const paths = process.argv.slice(2);
if (paths.length === 0) {
  console.error("usage: node validate-lesson.mjs LESSON.html [...]");
  process.exit(64);
}

let failed = false;
for (const path of paths) {
  const html = await readFile(path, "utf8");
  const checks = [
    [/<\!doctype html>/i.test(html), "HTML doctype"],
    [/<style[\s>]/i.test(html) && /<script[\s>]/i.test(html), "inline CSS and JavaScript"],
    [!/<(?:script|link|img|iframe)\b[^>]*(?:src|href)\s*=\s*["']https?:/i.test(html), "no external assets"],
    [(html.match(/class=["'][^"']*\bexercise\b/g) ?? []).length >= 2, "at least two exercises"],
    [/<fieldset\b/i.test(html) && /<legend\b/i.test(html), "semantic exercise fields"],
    [/data-answer=/i.test(html), "deterministic answers"],
    [/aria-live=["']polite["']/i.test(html), "announced feedback"],
    [/\.correct\b[\s\S]*--good|--good[\s\S]*\.correct\b/i.test(html), "green correct state"],
    [/\.incorrect\b[\s\S]*--bad|--bad[\s\S]*\.incorrect\b/i.test(html), "red incorrect state"],
    [/✓\s*Correct/.test(html) && /✕\s*Not yet/.test(html), "text and symbols beyond colour"],
    [/addEventListener\s*\(/.test(html), "interactive answer handling"],
    [/role=["']progressbar["']/i.test(html), "exercise progress"],
  ];
  const missing = checks.filter(([ok]) => !ok).map(([, label]) => label);
  if (missing.length) {
    failed = true;
    console.error(`${path}: invalid lesson\n  missing: ${missing.join(", ")}`);
  } else {
    console.log(`${path}: valid interactive lesson`);
  }
}

process.exit(failed ? 1 : 0);
