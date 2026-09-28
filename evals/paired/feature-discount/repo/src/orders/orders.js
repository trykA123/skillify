import { db, nextId } from "../db.js";
import { getProduct } from "../catalog/products.js";
import { getCustomer } from "../customers/customers.js";

export function createOrder({ customerId, items }) {
  const customer = getCustomer(customerId);
  if (!customer) throw new Error("unknown customer");
  const lines = items.map(({ productId, quantity }) => {
    const product = getProduct(productId);
    if (!product) throw new Error(`unknown product ${productId}`);
    return { productId, name: product.name, quantity, unitCents: product.priceCents, taxable: product.taxable };
  });
  const order = { id: nextId("ord"), customerId, region: customer.region, lines, status: "open", createdAt: Date.now() };
  db.orders.set(order.id, order);
  return order;
}

export const getOrder = (id) => db.orders.get(id) ?? null;

export function markPaid(id) {
  const order = getOrder(id);
  order.status = "paid";
  return order;
}
