import { reset } from "../src/db.js";
import { addCustomer } from "../src/customers/customers.js";
import { addProduct } from "../src/catalog/products.js";

export function seed() {
  reset();
  const alice = addCustomer({ name: "Alice", email: "a@example.com", region: "US" });
  const mug = addProduct({ name: "Mug", priceCents: 1200 });
  const book = addProduct({ name: "Book", priceCents: 2500, taxable: false });
  return { alice, mug, book };
}
