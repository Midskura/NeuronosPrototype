/**
 * Maps generic role values to Operations-department display labels.
 * These are display-only — the database stores the generic role.
 */
const OPS_DISPLAY_LABELS: Record<string, string> = {
  staff: "Handler",
  team_leader: "Supervisor",
  manager: "Manager",
};

export function getOpsDisplayLabel(role: string): string {
  return OPS_DISPLAY_LABELS[role] ?? role;
}
