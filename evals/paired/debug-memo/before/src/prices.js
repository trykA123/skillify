const base = { A100: 20, B200: 45.5, C300: 9.99 };
const rates = { USD: 1, EUR: 0.92, GBP: 0.79 };

function convert(amount, currency) {
  const rate = rates[currency];
  if (rate === undefined) throw new Error(`Unsupported currency: ${currency}`);
  return Math.round(amount * rate * 100) / 100;
}

export function getPrice(sku, currency) {
  const amount = base[sku];
  if (amount === undefined) return null;
  return { sku, currency, amount: convert(amount, currency) };
}
