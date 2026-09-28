import { expect, test } from "bun:test";
import { readdirSync } from "node:fs";
import * as utils from "../src/utils.js";

test("public surface of src/utils.js is unchanged", () => {
  expect(Object.keys(utils).sort()).toEqual(["chunk", "env", "formatBytes", "formatDuration", "parseDuration", "retry", "slugify", "unique"]);
});

test("empty duration is zero", () => expect(utils.parseDuration("")).toBe(0));
test("spaces inside durations are allowed", () => expect(utils.parseDuration("1h 30m")).toBe(5400000));
test("fractional durations", () => expect(utils.parseDuration("1.5s")).toBe(1500));
test("unknown unit message", () => expect(() => utils.parseDuration("5x")).toThrow("Unknown unit: x"));
test("invalid duration message", () => expect(() => utils.parseDuration("abc")).toThrow('Invalid duration: "abc"'));
test("sub-second format", () => expect(utils.formatDuration(250)).toBe("250ms"));
test("zero-part skipping", () => expect(utils.formatDuration(3600000 + 5000)).toBe("1h 5s"));
test("bytes boundary", () => {
  expect(utils.formatBytes(1023)).toBe("1023 B");
  expect(utils.formatBytes(1024)).toBe("1.0 KB");
  expect(utils.formatBytes(1024 ** 5)).toBe("1024.0 TB");
});
test("slug strips diacritics and edges", () => expect(utils.slugify("  Ça va?  ")).toBe("ca-va"));
test("chunk rejects zero and NaN", () => {
  expect(() => utils.chunk([1], 0)).toThrow(new RangeError("size must be > 0"));
  expect(() => utils.chunk([1], NaN)).toThrow(RangeError);
});
test("unique keeps first by key", () => expect(utils.unique([{ k: 1, v: "a" }, { k: 1, v: "b" }], (x) => x.k)).toEqual([{ k: 1, v: "a" }]));
test("env falls back on empty string", () => {
  process.env.PIN_EMPTY = "";
  expect(utils.env("PIN_EMPTY", "d")).toBe("d");
  expect(() => utils.env("PIN_MISSING_XYZ")).toThrow("Missing environment variable PIN_MISSING_XYZ");
});
test("retry backs off and reports attempts", async () => {
  const seen = [];
  const out = await utils.retry(async (n) => { if (n < 3) throw new Error(`e${n}`); return n; }, { delayMs: 1, onRetry: (e, n) => seen.push([e.message, n]) });
  expect(out).toBe(3);
  expect(seen).toEqual([["e1", 1], ["e2", 2]]);
});
test("code was actually split into focused modules", () => {
  const files = readdirSync(new URL("../src/utils/", import.meta.url)).filter((f) => f.endsWith(".js"));
  expect(files.length).toBeGreaterThanOrEqual(3);
});
