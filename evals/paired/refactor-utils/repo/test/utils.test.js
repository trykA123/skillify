import { expect, test } from "bun:test";
import { chunk, formatBytes, parseDuration, slugify } from "../src/utils.js";
import { backup } from "../src/cli.js";

test("parses compound durations", () => expect(parseDuration("1h30m")).toBe(5400000));
test("formats bytes", () => expect(formatBytes(1536)).toBe("1.5 KB"));
test("slugifies", () => expect(slugify("Hello, World!")).toBe("hello-world"));
test("chunks", () => expect(chunk([1, 2, 3], 2)).toEqual([[1, 2], [3]]));
test("backup reports totals", async () => {
  const result = await backup([{ name: "A", size: 2048 }], { upload: async () => {} });
  expect(result).toBe("uploaded 2.0 KB in 1 batches; next run in 1h");
});
