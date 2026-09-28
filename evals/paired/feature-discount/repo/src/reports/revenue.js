import { db } from "../db.js";
import { sum } from "../money.js";

// Revenue excludes tax and shipping; refunds are subtracted.
export function revenueCents({ since = 0 } = {}) {
  const paid = [...db.orders.values()].filter((o) => o.status === "paid" && o.createdAt >= since);
  const gross = sum(paid.flatMap((o) => o.lines.map((l) => l.unitCents * l.quantity)));
  const refunded = sum(db.refunds.map((r) => r.cents));
  return gross - refunded;
}
