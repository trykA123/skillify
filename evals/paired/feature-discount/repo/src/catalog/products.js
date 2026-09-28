import { db, nextId } from "../db.js";
export function addProduct({ name, priceCents, taxable = true }) {
  const product = { id: nextId("prod"), name, priceCents, taxable };
  db.products.set(product.id, product);
  return product;
}
export const getProduct = (id) => db.products.get(id) ?? null;
