import { sum } from "../money.js";
import { shippingCents } from "../shipping/shipping.js";
import { taxRate } from "../tax/rates.js";

export function orderTotals(order) {
  const subtotal = sum(order.lines.map((l) => l.unitCents * l.quantity));
  const taxable = sum(order.lines.filter((l) => l.taxable).map((l) => l.unitCents * l.quantity));
  const tax = Math.round(taxable * taxRate(order.region));
  const shipping = shippingCents(sum(order.lines.map((l) => l.quantity)), order.region);
  return { subtotal, tax, shipping, total: subtotal + tax + shipping };
}
