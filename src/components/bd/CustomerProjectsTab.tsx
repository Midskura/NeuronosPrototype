import { useState } from "react";
import { Project } from "../../types/pricing";
import { Package, Search, CheckCircle2, Calendar, Flag } from "lucide-react";
import { CustomDropdown } from "./CustomDropdown";

interface CustomerProjectsTabProps {
  projects: Project[];
  onViewProject?: (project: Project) => void;
  isLoading?: boolean;
}

export function CustomerProjectsTab({ projects, onViewProject, isLoading }: CustomerProjectsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'short', 
      year: 'numeric'
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Active": return { bg: "#FEF3C7", text: "#92400E" }; // Amber
      case "Completed": return { bg: "#D1FAE5", text: "#065F46" }; // Emerald
      case "On Hold": return { bg: "#F3F4F6", text: "#374151" }; // Gray
      case "Cancelled": return { bg: "#FEE2E2", text: "#991B1B" }; // Red
      default: return { bg: "#F3F4F6", text: "#374151" };
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case "Fully Booked": return "#059669";
      case "Partially Booked": return "#D97706";
      case "No Bookings Yet": return "#6B7280";
      default: return "#6B7280";
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-[14px]" style={{ color: "#667085" }}>Loading projects...</p>
      </div>
    );
  }

  // Filter projects
  const filteredProjects = projects.filter(project => {
    // Search filter
    const matchesSearch = searchQuery === "" || 
      (project.project_number && project.project_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (project.quotation_name && project.quotation_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (project.quotation?.pol_aol && project.quotation.pol_aol.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (project.quotation?.pod_aod && project.quotation.pod_aod.toLowerCase().includes(searchQuery.toLowerCase()));

    // Status filter
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--neuron-ink-muted)" }} />
          <input 
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] text-[13px] w-[240px] transition-colors"
            style={{
              border: "1px solid var(--neuron-ui-border)",
              backgroundColor: "#FFFFFF",
              color: "var(--neuron-ink-primary)"
            }}
          />
        </div>

        {/* Status Filter */}
        <CustomDropdown
          label=""
          value={statusFilter}
          onChange={(value) => setStatusFilter(value)}
          options={[
            { value: "all", label: "All Statuses" },
            { value: "Active", label: "Active", icon: <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#237F66" }} /> },
            { value: "Completed", label: "Completed", icon: <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#2B8A6E" }} /> },
            { value: "On Hold", label: "On Hold", icon: <Calendar className="w-3.5 h-3.5" style={{ color: "#6B7A76" }} /> },
            { value: "Cancelled", label: "Cancelled", icon: <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#C94F3D" }} /> }
          ]}
        />
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 rounded-lg border" style={{ borderColor: "var(--neuron-ui-border)", backgroundColor: "#FFFFFF" }}>
          {projects.length === 0 ? (
            <>
              <Package size={48} style={{ color: "#D1D5DB", margin: "0 auto 16px" }} />
              <p className="text-[14px]" style={{ color: "#667085" }}>No Projects Yet</p>
              <p className="text-[12px] mt-2" style={{ color: "#9CA3AF" }}>
                Approved quotations will appear here as projects
              </p>
            </>
          ) : (
            <>
              <p className="text-[14px] font-medium" style={{ color: "#12332B" }}>No matching projects found</p>
              <p className="text-[12px] mt-1" style={{ color: "#667085" }}>Try adjusting your search or filters</p>
            </>
          )}
        </div>
      ) : (
        <div 
          className="rounded-lg overflow-hidden"
          style={{ 
            border: "1px solid var(--neuron-ui-border)",
            backgroundColor: "#FFFFFF"
          }}
        >
          {/* Table Header */}
          <div 
            className="grid grid-cols-[2fr_1.5fr_1fr_1.5fr_0.8fr_0.8fr] gap-4 px-4 py-3"
            style={{ 
              backgroundColor: "#F9FAFB",
              borderBottom: "1px solid var(--neuron-ui-divider)"
            }}
          >
            <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "#6B7A76" }}>
              Project #
            </div>
            <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "#6B7A76" }}>
              Services
            </div>
            <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "#6B7A76" }}>
              Booking Status
            </div>
            <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "#6B7A76" }}>
              Route
            </div>
            <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "#6B7A76" }}>
              Status
            </div>
            <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "#6B7A76" }}>
              Created
            </div>
          </div>

          {/* Table Rows */}
          <div>
            {filteredProjects.map(project => {
              const statusStyle = getStatusStyle(project.status);
              const bookingStatusColor = getBookingStatusColor(project.booking_status || "No Bookings Yet");

              // Extract route info safely
              const origin = project.quotation?.pol_aol || "—";
              const destination = project.quotation?.pod_aod || "—";
              const route = `${origin} → ${destination}`;

              return (
                <div
                  key={project.id}
                  className="grid grid-cols-[2fr_1.5fr_1fr_1.5fr_0.8fr_0.8fr] gap-4 px-4 py-4 cursor-pointer transition-colors"
                  style={{ borderBottom: "1px solid var(--neuron-ui-divider)" }}
                  onClick={() => onViewProject && onViewProject(project)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#F9FAFB";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#FFFFFF";
                  }}
                >
                  {/* Project Number */}
                  <div>
                    <div className="text-[13px] font-medium mb-0.5" style={{ color: "#12332B" }}>
                      {project.quotation_name || project.project_number}
                    </div>
                    <div className="text-[12px]" style={{ color: "#667085" }}>
                      {project.project_number}
                    </div>
                  </div>

                  {/* Services */}
                  <div className="text-[12px]" style={{ color: "#344054" }}>
                    {project.services?.join(", ") || "—"}
                  </div>

                  {/* Booking Status */}
                  <div className="text-[12px]" style={{ color: bookingStatusColor, fontWeight: 500 }}>
                    {project.booking_status || "No Bookings Yet"}
                  </div>

                  {/* Route */}
                  <div className="text-[12px]" style={{ color: "#344054" }}>
                    {route}
                  </div>

                  {/* Status */}
                  <div>
                    <span 
                      className="inline-block px-2 py-0.5 rounded text-[11px] font-medium"
                      style={{
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.text
                      }}
                    >
                      {project.status}
                    </span>
                  </div>

                  {/* Created Date */}
                  <div className="text-[12px]" style={{ color: "#667085" }}>
                    {formatDate(project.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
