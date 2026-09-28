export function lowStock(levels, threshold = 5) {
  return Object.entries(levels).filter(([, n]) => n < threshold).map(([sku]) => sku).sort();
}
