export const db = { orders: new Map(), customers: new Map(), products: new Map(), refunds: [] };
let seq = 1;
export const nextId = (prefix) => `${prefix}_${seq++}`;
export function reset() {
  for (const table of [db.orders, db.customers, db.products]) table.clear();
  db.refunds.length = 0;
  seq = 1;
}
