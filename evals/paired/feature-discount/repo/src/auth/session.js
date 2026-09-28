const sessions = new Map();
export function startSession(userId) {
  const token = Math.random().toString(36).slice(2);
  sessions.set(token, { userId, expiresAt: Date.now() + 3600_000 });
  return token;
}
export function userFor(token) {
  const s = sessions.get(token);
  return s && s.expiresAt > Date.now() ? s.userId : null;
}
