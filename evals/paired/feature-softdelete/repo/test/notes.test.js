import { beforeEach, expect, test } from "bun:test";
import { reset } from "../src/store.js";
import { createNote, getNote, listNotes, searchNotes } from "../src/notes.js";
import { countByTag } from "../src/tags.js";

beforeEach(reset);

test("creates and lists notes newest first", () => {
  createNote(1, { title: "first" });
  createNote(1, { title: "second" });
  expect(listNotes(1).map((n) => n.title)).toEqual(["second", "first"]);
});

test("search matches title or body", () => {
  createNote(1, { title: "Groceries", body: "milk" });
  createNote(1, { title: "Work", body: "buy milk for office" });
  expect(searchNotes(1, "MILK")).toHaveLength(2);
});

test("counts tags per user", () => {
  createNote(1, { title: "a", tags: ["x", "y"] });
  createNote(2, { title: "b", tags: ["x"] });
  expect(countByTag(1)).toEqual({ x: 1, y: 1 });
});

test("getNote returns null for unknown ids", () => {
  expect(getNote(99)).toBeNull();
});
