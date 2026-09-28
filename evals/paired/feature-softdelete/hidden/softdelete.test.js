import { beforeEach, expect, test } from "bun:test";
import { reset } from "../src/store.js";
import * as api from "../src/notes.js";
import { countByTag } from "../src/tags.js";
import { exportNotes } from "../src/export.js";

beforeEach(reset);

function setup() {
  const keep = api.createNote(1, { title: "keep me", body: "alpha", tags: ["t"] });
  const gone = api.createNote(1, { title: "delete me", body: "alpha", tags: ["t", "old"] });
  api.deleteNote(gone.id);
  return { keep, gone };
}

test("deleted note is hidden from the list", () => {
  const { keep } = setup();
  expect(api.listNotes(1).map((n) => n.id)).toEqual([keep.id]);
});

test("deleted note is hidden from search", () => {
  setup();
  expect(api.searchNotes(1, "alpha").map((n) => n.title)).toEqual(["keep me"]);
});

test("deleted note is not counted in tags", () => {
  setup();
  expect(countByTag(1)).toEqual({ t: 1 });
});

test("deleted note is not exported", () => {
  setup();
  expect(exportNotes(1)).not.toContain("delete me");
  expect(exportNotes(1)).toContain("keep me");
});

test("getNote does not return a deleted note", () => {
  const { gone } = setup();
  expect(api.getNote(gone.id)).toBeNull();
});

test("restore brings the note back everywhere", () => {
  const { gone } = setup();
  api.restoreNote(gone.id);
  expect(api.listNotes(1)).toHaveLength(2);
  expect(countByTag(1)).toEqual({ t: 2, old: 1 });
  expect(exportNotes(1)).toContain("delete me");
  expect(api.getNote(gone.id)?.title).toBe("delete me");
});

test("soft delete keeps the data", async () => {
  const { gone } = setup();
  expect([...(await import("../src/store.js")).notes.values()].some((n) => n.id === gone.id)).toBe(true);
});
