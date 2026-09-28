import { notes } from "./store.js";

export function exportNotes(userId) {
  const rows = [...notes.values()].filter((n) => n.userId === userId);
  return rows.map((n) => `# ${n.title}\n\n${n.body}\n\ntags: ${n.tags.join(", ")}`).join("\n\n---\n\n");
}
