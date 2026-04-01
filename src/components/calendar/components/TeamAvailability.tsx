import { Users } from "lucide-react@0.487.0";
import type { TeamMemberAvailability } from "../../../types/calendar";

interface TeamAvailabilityProps {
  members: TeamMemberAvailability[];
  onToggleMember: (userId: string) => void;
}

export function TeamAvailability({
  members,
  onToggleMember,
}: TeamAvailabilityProps) {
  return (
    <div className="py-4 px-4">
      <div className="flex items-center gap-2 mb-3">
        <Users size={14} style={{ color: "var(--neuron-ink-muted)" }} />
        <h3
          className="text-[12px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--neuron-ink-muted)" }}
        >
          Team Member Availability
        </h3>
      </div>

      {members.length === 0 ? (
        <p
          className="text-[13px] py-6 text-center"
          style={{ color: "var(--neuron-ink-muted)" }}
        >
          No team members
        </p>
      ) : (
        <div className="space-y-0.5">
          {members.map((m) => {
            const statusLabel = getStatusLabel(m);
            const statusColor = getStatusColor(m);

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onToggleMember(m.id)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--neuron-radius-s)] text-left transition-colors duration-150"
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "var(--neuron-state-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div
                    className="rounded-full flex items-center justify-center text-[11px] font-semibold"
                    style={{
                      width: 32,
                      height: 32,
                      backgroundColor: "var(--theme-bg-surface-tint)",
                      color: "var(--neuron-ink-secondary)",
                      border: m.isCalendarVisible
                        ? "2px solid var(--neuron-action-primary)"
                        : "2px solid var(--neuron-ui-border)",
                    }}
                  >
                    {getInitials(m.name)}
                  </div>
                  {/* Online dot */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      width: 8,
                      height: 8,
                      bottom: 0,
                      right: 0,
                      backgroundColor: m.isOnline
                        ? "#22C55E"
                        : "var(--neuron-ui-border)",
                      border: "2px solid var(--neuron-bg-elevated)",
                    }}
                  />
                </div>

                {/* Name + status */}
                <div className="flex-1 min-w-0">
                  <div
                    className="text-[13px] font-medium truncate"
                    style={{ color: "var(--neuron-ink-primary)" }}
                  >
                    {m.name}
                  </div>
                  <div
                    className="text-[12px] truncate"
                    style={{ color: statusColor }}
                  >
                    {statusLabel}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getStatusLabel(m: TeamMemberAvailability): string {
  if (m.isOnline) return "Available";
  if (!m.lastSeenAt) return "Offline";
  const minutesAgo = Math.floor(
    (Date.now() - m.lastSeenAt.getTime()) / 60_000
  );
  if (minutesAgo < 30) return "Away";
  return "Offline";
}

function getStatusColor(m: TeamMemberAvailability): string {
  if (m.isOnline) return "#22C55E";
  return "var(--neuron-ink-muted)";
}
