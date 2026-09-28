let nextId = 1;
export const notes = new Map();

export function insert(note) {
  const id = nextId++;
  const row = { id, createdAt: Date.now(), ...note };
  notes.set(id, row);
  return row;
}

export function reset() {
  notes.clear();
  nextId = 1;
}
