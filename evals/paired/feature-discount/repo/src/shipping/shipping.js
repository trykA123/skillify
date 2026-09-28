export function shippingCents(itemCount, region) {
  if (itemCount === 0) return 0;
  const base = region === "US" ? 500 : 1500;
  return base + Math.max(0, itemCount - 1) * 100;
}
