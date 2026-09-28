const UNITS = { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000 };

export function parseDuration(text) {
  let total = 0;
  const re = /(\d+(?:\.\d+)?)([a-z]+)/g;
  let match;
  let consumed = 0;
  while ((match = re.exec(text))) {
    const [, value, unit] = match;
    if (!(unit in UNITS)) throw new Error(`Unknown unit: ${unit}`);
    total += Number(value) * UNITS[unit];
    consumed += match[0].length;
  }
  if (consumed !== text.replace(/\s+/g, "").length) throw new Error(`Invalid duration: "${text}"`);
  return total;
}

export function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  const parts = [];
  for (const [unit, size] of [["d", 86400000], ["h", 3600000], ["m", 60000], ["s", 1000]]) {
    const n = Math.floor(ms / size);
    if (n) {
      parts.push(`${n}${unit}`);
      ms -= n * size;
    }
  }
  return parts.join(" ");
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes;
  let i = -1;
  do {
    value /= 1024;
    i += 1;
  } while (value >= 1024 && i < units.length - 1);
  return `${value.toFixed(1)} ${units[i]}`;
}

export function slugify(text) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function chunk(items, size) {
  if (!(size > 0)) throw new RangeError("size must be > 0");
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export function unique(items, key = (x) => x) {
  const seen = new Set();
  return items.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export async function retry(fn, { attempts = 3, delayMs = 100, onRetry } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        onRetry?.(error, attempt);
        await new Promise((r) => setTimeout(r, delayMs * 2 ** (attempt - 1)));
      }
    }
  }
  throw lastError;
}

export function env(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === "") {
    if (fallback === undefined) throw new Error(`Missing environment variable ${name}`);
    return fallback;
  }
  return value;
}
