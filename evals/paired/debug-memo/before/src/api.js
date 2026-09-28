import { getPrice } from "./prices.js";
import { getStock } from "./stock.js";

const warehouseFor = { DE: "berlin", FR: "paris", US: "berlin" };
const currencyFor = { DE: "EUR", FR: "EUR", US: "USD", GB: "GBP" };

export function productView(sku, country) {
  const price = getPrice(sku, currencyFor[country] ?? "USD");
  if (!price) return { status: 404 };
  return { status: 200, body: { ...price, inStock: getStock(sku, warehouseFor[country] ?? "berlin") > 0 } };
}
