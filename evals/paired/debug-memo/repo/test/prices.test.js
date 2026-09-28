import { expect, test } from "bun:test";
import { getPrice } from "../src/prices.js";

test("prices a known sku in USD", () => {
  expect(getPrice("A100", "USD")).toEqual({ sku: "A100", currency: "USD", amount: 20 });
});

test("unknown sku returns null", () => {
  expect(getPrice("ZZZ", "USD")).toBeNull();
});
