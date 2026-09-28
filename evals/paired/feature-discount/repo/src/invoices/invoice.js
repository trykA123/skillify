import { formatCents, sum } from "../money.js";
import { getCustomer } from "../customers/customers.js";
import { shippingCents } from "../shipping/shipping.js";
import { taxRate } from "../tax/rates.js";

// Invoices are rendered from the order snapshot so they stay stable for accounting.
export function buildInvoice(order) {
  const customer = getCustomer(order.customerId);
  const rows = order.lines.map((l) => ({ label: `${l.quantity} × ${l.name}`, cents: l.unitCents * l.quantity }));
  const subtotal = sum(rows.map((r) => r.cents));
  const taxable = sum(order.lines.filter((l) => l.taxable).map((l) => l.unitCents * l.quantity));
  const tax = Math.round(taxable * taxRate(order.region));
  const shipping = shippingCents(sum(order.lines.map((l) => l.quantity)), order.region);
  rows.push({ label: "Tax", cents: tax }, { label: "Shipping", cents: shipping });
  return { number: `INV-${order.id}`, customer: customer.name, rows, totalCents: subtotal + tax + shipping };
}

export function renderInvoice(order) {
  const invoice = buildInvoice(order);
  const lines = invoice.rows.map((r) => `${r.label.padEnd(24)}${formatCents(r.cents).padStart(12)}`);
  return [`Invoice ${invoice.number} — ${invoice.customer}`, ...lines, `${"Total".padEnd(24)}${formatCents(invoice.totalCents).padStart(12)}`].join("\n");
}
