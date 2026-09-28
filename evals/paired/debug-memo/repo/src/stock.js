import { memoize } from "./memo.js";

const levels = {
  berlin: { A100: 12, B200: 0, C300: 40 },
  paris: { A100: 3, B200: 7, C300: 0 },
};

export const getStock = memoize((sku, warehouse) => levels[warehouse]?.[sku] ?? 0);
