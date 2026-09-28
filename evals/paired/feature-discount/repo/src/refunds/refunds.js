import { db } from "../db.js";
import { orderTotals } from "../orders/totals.js";
import { getOrder } from "../orders/orders.js";

export function refundOrder(orderId) {
  const order = getOrder(orderId);
  const { subtotal } = orderTotals(order);
  db.refunds.push({ orderId, cents: subtotal });
  order.status = "refunded";
  return subtotal;
}
