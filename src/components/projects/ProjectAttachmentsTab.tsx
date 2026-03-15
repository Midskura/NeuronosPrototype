/**
 * ProjectAttachmentsTab
 *
 * Thin wrapper around the shared EntityAttachmentsTab for backward compatibility.
 * All logic lives in the shared component — this just maps the Project prop.
 *
 * @see /components/shared/EntityAttachmentsTab.tsx
 */

import type { Project } from "../../types/pricing";
import { EntityAttachmentsTab } from "../shared/EntityAttachmentsTab";

interface ProjectAttachmentsTabProps {
  project: Project;
  currentUser?: {
    id: string;
    name: string;
    email: string;
    department: string;
  } | null;
}

export function ProjectAttachmentsTab({ project, currentUser }: ProjectAttachmentsTabProps) {
  return (
    <EntityAttachmentsTab
      entityId={project.id}
      entityType="projects"
      currentUser={currentUser}
    />
  );
}
