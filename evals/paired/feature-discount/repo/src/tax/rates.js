const RATES = { US: 0.08, EU: 0.2, UK: 0.2 };
export const taxRate = (region) => RATES[region] ?? 0;
