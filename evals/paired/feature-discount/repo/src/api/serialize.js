import { orderTotals } from "../orders/totals.js";

export function serializeOrder(order) {
  const totals = orderTotals(order);
  return { id: order.id, status: order.status, lines: order.lines.map(({ name, quantity, unitCents }) => ({ name, quantity, unitCents })), ...totals };
}
