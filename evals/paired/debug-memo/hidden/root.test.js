import { expect, test } from "bun:test";

test("price follows the requested currency after a cached call", async () => {
  const { getPrice } = await import(`../src/prices.js?${Math.random()}`);
  expect(getPrice("A100", "USD").amount).toBe(20);
  expect(getPrice("A100", "EUR")).toEqual({ sku: "A100", currency: "EUR", amount: 18.4 });
  expect(getPrice("A100", "USD").amount).toBe(20);
});

test("stock follows the requested warehouse after a cached call", async () => {
  const { getStock } = await import(`../src/stock.js?${Math.random()}`);
  expect(getStock("A100", "berlin")).toBe(12);
  expect(getStock("A100", "paris")).toBe(3);
});

test("product view is correct per country in one process", async () => {
  const { productView } = await import(`../src/api.js?${Math.random()}`);
  expect(productView("B200", "US").body.amount).toBe(45.5);
  expect(productView("B200", "DE").body).toMatchObject({ currency: "EUR", amount: 41.86, inStock: false });
  expect(productView("B200", "FR").body).toMatchObject({ currency: "EUR", inStock: true });
});
