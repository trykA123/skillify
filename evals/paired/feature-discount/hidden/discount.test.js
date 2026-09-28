import { expect, test } from "bun:test";
import { seed } from "../test/helpers.js";
import { createOrder, markPaid } from "../src/orders/orders.js";
import { orderTotals } from "../src/orders/totals.js";
import { buildInvoice, renderInvoice } from "../src/invoices/invoice.js";
import { receiptEmail } from "../src/email/receipt.js";
import { revenueCents } from "../src/reports/revenue.js";
import { routes } from "../src/api/routes.js";

function discounted() {
  const { alice, mug, book } = seed();
  const order = createOrder({ customerId: alice.id, items: [{ productId: mug.id, quantity: 2 }, { productId: book.id, quantity: 1 }], discountCents: 900 });
  return order;
}

test("order totals subtract the discount", () => {
  const t = orderTotals(discounted());
  expect(t.total).toBe(5792 - 900);
});

test("no discount keeps totals unchanged", () => {
  const { alice, mug, book } = seed();
  const order = createOrder({ customerId: alice.id, items: [{ productId: mug.id, quantity: 2 }, { productId: book.id, quantity: 1 }] });
  expect(orderTotals(order).total).toBe(5792);
});

test("invoice total matches the discounted order total", () => {
  const order = discounted();
  expect(buildInvoice(order).totalCents).toBe(orderTotals(order).total);
});

test("rendered invoice and receipt show the discounted total", () => {
  const order = discounted();
  expect(renderInvoice(order)).toContain("$48.92");
  expect(receiptEmail(order).text).toContain("$48.92");
});

test("API returns the discounted total", () => {
  const { alice, mug, book } = seed();
  const res = routes["POST /orders"]({ customerId: alice.id, items: [{ productId: mug.id, quantity: 2 }, { productId: book.id, quantity: 1 }], discountCents: 900 });
  expect(res.body.total).toBe(4892);
});

test("revenue reflects the discount", () => {
  const order = discounted();
  markPaid(order.id);
  expect(revenueCents()).toBe(4900 - 900);
});
