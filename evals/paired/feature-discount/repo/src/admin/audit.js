const events = [];
export function audit(actor, action, subject) {
  events.push({ at: new Date().toISOString(), actor, action, subject });
}
export const auditLog = () => [...events];
