export const DREAMCARZ_ROLES = ["customer", "associate", "fleet_partner", "operations", "support", "manager", "administrator"] as const;
export type DreamCarzRole = typeof DREAMCARZ_ROLES[number];

export function effectiveDreamCarzRoles(legacyRole: "admin" | "user" | undefined, assignedRoles: DreamCarzRole[]) {
  const roles = new Set<DreamCarzRole>(assignedRoles);
  roles.add("customer");
  if (legacyRole === "admin") roles.add("administrator");
  return Array.from(roles);
}

export function hasDreamCarzRole(roles: DreamCarzRole[], allowed: DreamCarzRole[]) {
  return allowed.some(role => roles.includes(role));
}
