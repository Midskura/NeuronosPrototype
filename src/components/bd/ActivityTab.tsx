import type { Project } from "../../types/pricing";
import { FileText, User, CheckCircle, Circle, AlertCircle } from "lucide-react";

interface ActivityTabProps {
  project: Project;
  currentUser?: { name: string; email: string; department: string } | null;
}

export function ActivityTab({ project }: ActivityTabProps) {
  const linkedBookings = project.linkedBookings || [];
  const bookingStatus = project.booking_status || "No Bookings Yet";

  const getStatusIcon = () => {
    switch (bookingStatus) {
      case "Fully Booked":
        return <CheckCircle size={20} />;
      case "Partially Booked":
        return <AlertCircle size={20} />;
      default:
        return <Circle size={20} />;
    }
  };

  const getStatusColor = () => {
    switch (bookingStatus) {
      case "Fully Booked":
        return {
          bg: "#ECFDF5",
          border: "#10B981",
          text: "#065F46"
        };
      case "Partially Booked":
        return {
          bg: "#EFF6FF",
          border: "#3B82F6",
          text: "#1E40AF"
        };
      default:
        return {
          bg: "#F9FAFB",
          border: "#D1D5DB",
          text: "#6B7280"
        };
    }
  };

  const statusColor = getStatusColor();

  return (
    <div style={{ 
      flex: 1,
      overflow: "auto"
    }}>
      {/* Main Content Area */}
      <div style={{ 
        padding: "32px 48px",
        maxWidth: "1400px",
        margin: "0 auto"
      }}>
        
        {/* Booking Status Overview */}
        <div style={{
          backgroundColor: statusColor.bg,
          border: `1px solid ${statusColor.border}`,
          borderRadius: "8px",
          padding: "24px",
          marginBottom: "24px"
        }}>
          <h3 style={{
            fontSize: "16px",
            fontWeight: 600,
            color: statusColor.text,
            marginBottom: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            {getStatusIcon()}
            {bookingStatus === "Fully Booked" && "All Services Booked"}
            {bookingStatus === "Partially Booked" && "Partially Booked"}
            {bookingStatus === "No Bookings Yet" && "No Bookings Yet"}
          </h3>
          <p style={{ 
            fontSize: "14px",
            color: statusColor.text,
            margin: 0,
            opacity: 0.9
          }}>
            {bookingStatus === "Fully Booked" && 
              "All services in this project have been booked by Operations."}
            {bookingStatus === "Partially Booked" && 
              `${linkedBookings.length} of ${project.services?.length || 0} services have been booked.`}
            {bookingStatus === "No Bookings Yet" && 
              "Operations has not created any bookings for this project yet."}
          </p>
        </div>

        {/* Linked Bookings */}
        <div style={{
          backgroundColor: "white",
          border: "1px solid var(--neuron-ui-border)",
          borderRadius: "8px",
          padding: "24px",
          marginBottom: "24px"
        }}>
          <h3 style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--neuron-brand-green)",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <FileText size={18} />
            Linked Service Bookings
          </h3>
          
          {linkedBookings.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {linkedBookings.map((booking, idx) => (
                <div 
                  key={idx}
                  style={{
                    padding: "16px",
                    backgroundColor: "#F9FAFB",
                    border: "1px solid var(--neuron-ui-border)",
                    borderRadius: "6px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--neuron-ink-primary)",
                      marginBottom: "4px"
                    }}>
                      {booking.bookingNumber}
                    </div>
                    <div style={{
                      fontSize: "13px",
                      color: "var(--neuron-ink-muted)"
                    }}>
                      {booking.serviceType} • Created {new Date(booking.createdAt).toLocaleDateString()}
                      {booking.createdBy && ` by ${booking.createdBy}`}
                    </div>
                  </div>
                  <div style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--neuron-ink-secondary)",
                    padding: "6px 12px",
                    backgroundColor: "white",
                    border: "1px solid var(--neuron-ui-border)",
                    borderRadius: "4px"
                  }}>
                    {booking.status}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: "center",
              padding: "32px 24px"
            }}>
              <p style={{ 
                fontSize: "14px",
                color: "var(--neuron-ink-muted)",
                marginBottom: "8px"
              }}>
                No bookings have been created from this project yet
              </p>
              <p style={{ 
                fontSize: "13px",
                color: "#9CA3AF",
                margin: 0
              }}>
                Operations will create service bookings and link them to this project
              </p>
            </div>
          )}
        </div>

        {/* Project Team */}
        <div style={{
          backgroundColor: "white",
          border: "1px solid var(--neuron-ui-border)",
          borderRadius: "8px",
          padding: "24px"
        }}>
          <h3 style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--neuron-brand-green)",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <User size={18} />
            Project Team
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <TeamMember 
              role="BD Owner" 
              name={project.bd_owner_user_name} 
              email={project.bd_owner_email} 
            />
            {project.ops_assigned_user_name && (
              <TeamMember 
                role="Operations Assigned" 
                name={project.ops_assigned_user_name} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamMember({ 
  role, 
  name, 
  email 
}: { 
  role: string; 
  name: string; 
  email?: string 
}) {
  return (
    <div style={{
      padding: "16px",
      backgroundColor: "#F9FAFB",
      border: "1px solid var(--neuron-ui-border)",
      borderRadius: "6px"
    }}>
      <div style={{
        fontSize: "13px",
        fontWeight: 500,
        color: "var(--neuron-ink-base)",
        marginBottom: "4px"
      }}>
        {role}
      </div>
      <div style={{
        fontSize: "14px",
        fontWeight: 600,
        color: "var(--neuron-ink-primary)",
        marginBottom: email ? "4px" : "0"
      }}>
        {name}
      </div>
      {email && (
        <div style={{
          fontSize: "13px",
          color: "var(--neuron-ink-muted)"
        }}>
          {email}
        </div>
      )}
    </div>
  );
}
