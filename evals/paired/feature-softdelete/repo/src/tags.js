import { notes } from "./store.js";

export function countByTag(userId) {
  const counts = {};
  for (const note of notes.values()) {
    if (note.userId !== userId) continue;
    for (const tag of note.tags) counts[tag] = (counts[tag] ?? 0) + 1;
  }
  return counts;
}
