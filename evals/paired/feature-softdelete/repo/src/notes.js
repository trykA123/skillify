import { insert, notes } from "./store.js";

export function createNote(userId, { title, body = "", tags = [] }) {
  if (!title?.trim()) throw new Error("title is required");
  return insert({ userId, title: title.trim(), body, tags });
}

export function getNote(id) {
  return notes.get(id) ?? null;
}

function ownedBy(userId) {
  return [...notes.values()].filter((n) => n.userId === userId);
}

export function listNotes(userId) {
  return ownedBy(userId).sort((a, b) => b.createdAt - a.createdAt || b.id - a.id);
}

export function searchNotes(userId, query) {
  const q = query.toLowerCase();
  return listNotes(userId).filter((n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q));
}
