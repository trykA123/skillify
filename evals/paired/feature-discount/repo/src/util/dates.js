export const startOfDay = (ms) => { const d = new Date(ms); d.setUTCHours(0, 0, 0, 0); return d.getTime(); };
export const daysAgo = (n, now = Date.now()) => now - n * 86400_000;
