export const users = new Map();
export const workspaces = new Map();
export const memberships = [];

export function addMember(workspaceId, userId, role = "member") {
  memberships.push({ workspaceId, userId, role, joinedAt: Date.now() });
}

export function seatsUsed(workspaceId) {
  return memberships.filter((m) => m.workspaceId === workspaceId).length;
}
