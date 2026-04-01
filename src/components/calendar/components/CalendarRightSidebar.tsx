import type { UpcomingDeadline, TeamMemberAvailability } from "../../../types/calendar";
import { UpcomingDeadlines } from "./UpcomingDeadlines";
import { TeamAvailability } from "./TeamAvailability";

interface CalendarRightSidebarProps {
  deadlines: UpcomingDeadline[];
  teamMembers: TeamMemberAvailability[];
  onToggleTeamMember: (userId: string) => void;
}

export function CalendarRightSidebar({
  deadlines,
  teamMembers,
  onToggleTeamMember,
}: CalendarRightSidebarProps) {
  return (
    <div
      className="flex flex-col overflow-y-auto"
      style={{
        width: 280,
        flexShrink: 0,
        borderLeft: "1px solid var(--neuron-ui-border)",
        backgroundColor: "var(--neuron-bg-elevated)",
      }}
    >
      <UpcomingDeadlines deadlines={deadlines} />

      <div
        style={{
          height: 1,
          backgroundColor: "var(--neuron-ui-divider)",
          margin: "0 16px",
        }}
      />

      <TeamAvailability
        members={teamMembers}
        onToggleMember={onToggleTeamMember}
      />
    </div>
  );
}
