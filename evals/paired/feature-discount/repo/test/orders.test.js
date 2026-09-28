import { expect, test } from "bun:test";
import { seed } from "./helpers.js";
import { createOrder } from "../src/orders/orders.js";
import { orderTotals } from "../src/orders/totals.js";
import { renderInvoice } from "../src/invoices/invoice.js";

test("totals include tax on taxable lines and shipping", () => {
  const { alice, mug, book } = seed();
  const order = createOrder({ customerId: alice.id, items: [{ productId: mug.id, quantity: 2 }, { productId: book.id, quantity: 1 }] });
  expect(orderTotals(order)).toEqual({ subtotal: 4900, tax: 192, shipping: 700, total: 5792 });
});

test("invoice total matches order total", () => {
  const { alice, mug } = seed();
  const order = createOrder({ customerId: alice.id, items: [{ productId: mug.id, quantity: 1 }] });
  expect(renderInvoice(order)).toContain("$17.96");
});
