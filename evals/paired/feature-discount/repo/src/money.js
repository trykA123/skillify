export function formatCents(cents, currency = "USD") {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const symbol = { USD: "$", EUR: "€", GBP: "£" }[currency] ?? "";
  return `${sign}${symbol}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}
export const sum = (values) => values.reduce((a, b) => a + b, 0);
