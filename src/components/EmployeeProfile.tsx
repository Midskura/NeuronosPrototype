import { Mail, Phone, MapPin, Briefcase, Calendar, Edit2, Shuffle, Wrench, RotateCcw, LogOut, Building2 } from "lucide-react";
import { CustomDropdown } from "./bd/CustomDropdown";
import { useState } from "react";
import { useUser } from "../hooks/useUser";

interface EmployeeProfileProps {
  currentUser?: { name: string; email: string; department: string };
  onDepartmentChange?: (department: string) => void;
}

export function EmployeeProfile({ currentUser, onDepartmentChange }: EmployeeProfileProps) {
  const { user, devOverride, setDevOverride, effectiveDepartment, effectiveRole, logout } = useUser();
  
  const [selectedDepartment, setSelectedDepartment] = useState(currentUser?.department || "Operations");
  
  // Dev Tools state
  const [devDepartment, setDevDepartment] = useState(devOverride?.department || effectiveDepartment);
  const [devRole, setDevRole] = useState(devOverride?.role || effectiveRole);

  const departments = [
    { value: "Executive", label: "Executive" },
    { value: "Business Development", label: "Business Development" },
    { value: "Pricing", label: "Pricing" },
    { value: "Operations", label: "Operations" },
    { value: "Accounting", label: "Accounting" },
    { value: "HR", label: "HR" },
  ];
  
  const roleOptions = [
    { value: "rep", label: "Staff" },
    { value: "manager", label: "Manager" },
    { value: "director", label: "Director" },
  ];

  const handleDepartmentChange = (dept: string) => {
    setSelectedDepartment(dept);
    if (onDepartmentChange) {
      onDepartmentChange(dept);
    }
  };
  
  const handleApplyDevOverride = () => {
    setDevOverride({
      department: devDepartment,
      role: devRole,
      enabled: true,
      timestamp: new Date().toISOString(),
    });
  };
  
  const handleResetDevOverride = () => {
    setDevOverride(null);
    if (user) {
      setDevDepartment(user.department);
      setDevRole(user.role);
    }
  };

  // Mock employee data - in real app would fetch from backend
  const employeeData = {
    name: currentUser?.name || "Marcus",
    email: currentUser?.email || "Marcus@neuron.com",
    role: selectedDepartment === "Executive" ? "Chief Executive Officer" : 
          selectedDepartment === "Business Development" ? "BD Manager" :
          selectedDepartment === "Pricing" ? "Pricing Analyst" :
          selectedDepartment === "Operations" ? "Operations Manager" :
          selectedDepartment === "Accounting" ? "Accounting Manager" :
          "HR Manager",
    department: selectedDepartment,
    phone: "+63 917 123 4567",
    location: "Makati City, Metro Manila",
    joinDate: "January 15, 2024",
    employeeId: "EMP-2024-001",
  };
  
  const isDevMode = process.env.NODE_ENV === 'development' || localStorage.getItem('neuron_dev_tools_enabled') === 'true';

  return (
    <div className="h-full overflow-auto" style={{ background: "var(--neuron-bg-page)" }}>
      {/* Header */}
      <div style={{ 
        padding: "32px 48px",
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid var(--neuron-ui-border)"
      }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 style={{ 
              fontSize: "28px", 
              fontWeight: 600, 
              color: "#12332B",
              marginBottom: "8px"
            }}>
              Employee Profile
            </h1>
            <p style={{ fontSize: "14px", color: "#667085" }}>
              View and manage your personal information
            </p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors"
            style={{
              border: "1px solid var(--neuron-ui-border)",
              backgroundColor: "#FFFFFF",
              color: "#12332B",
              fontSize: "13px",
              fontWeight: 500
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--neuron-state-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#FFFFFF";
            }}
          >
            <Edit2 size={16} />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "32px 48px" }}>
        <div style={{
          maxWidth: "960px",
          margin: "0 auto"
        }}>
          {/* Profile Card */}
          <div style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--neuron-ui-border)",
            borderRadius: "12px",
            padding: "32px",
            marginBottom: "24px"
          }}>
            {/* Avatar and Basic Info */}
            <div className="flex items-start gap-6 mb-8">
              <div 
                className="flex items-center justify-center rounded-full"
                style={{
                  width: "96px",
                  height: "96px",
                  backgroundColor: "var(--neuron-brand-green-100)",
                  color: "var(--neuron-brand-green)",
                  fontSize: "36px",
                  fontWeight: 600,
                  flexShrink: 0
                }}
              >
                {employeeData.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 style={{ 
                  fontSize: "24px", 
                  fontWeight: 600, 
                  color: "#12332B",
                  marginBottom: "4px"
                }}>
                  {employeeData.name}
                </h2>
                <p style={{ 
                  fontSize: "15px", 
                  color: "#0F766E",
                  fontWeight: 500,
                  marginBottom: "8px"
                }}>
                  {employeeData.role}
                </p>
                <p style={{ 
                  fontSize: "13px", 
                  color: "#667085"
                }}>
                  {employeeData.department} • Employee ID: {employeeData.employeeId}
                </p>
              </div>
            </div>

            {/* Contact Information Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "24px"
            }}>
              {/* Email */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Mail size={16} style={{ color: "#667085" }} />
                  <label style={{ 
                    fontSize: "11px", 
                    fontWeight: 600,
                    color: "#667085",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Email Address
                  </label>
                </div>
                <p style={{ 
                  fontSize: "14px", 
                  color: "#12332B",
                  paddingLeft: "24px"
                }}>
                  {employeeData.email}
                </p>
              </div>

              {/* Phone */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Phone size={16} style={{ color: "#667085" }} />
                  <label style={{ 
                    fontSize: "11px", 
                    fontWeight: 600,
                    color: "#667085",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Phone Number
                  </label>
                </div>
                <p style={{ 
                  fontSize: "14px", 
                  color: "#12332B",
                  paddingLeft: "24px"
                }}>
                  {employeeData.phone}
                </p>
              </div>

              {/* Location */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={16} style={{ color: "#667085" }} />
                  <label style={{ 
                    fontSize: "11px", 
                    fontWeight: 600,
                    color: "#667085",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Location
                  </label>
                </div>
                <p style={{ 
                  fontSize: "14px", 
                  color: "#12332B",
                  paddingLeft: "24px"
                }}>
                  {employeeData.location}
                </p>
              </div>

              {/* Join Date */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} style={{ color: "#667085" }} />
                  <label style={{ 
                    fontSize: "11px", 
                    fontWeight: 600,
                    color: "#667085",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Join Date
                  </label>
                </div>
                <p style={{ 
                  fontSize: "14px", 
                  color: "#12332B",
                  paddingLeft: "24px"
                }}>
                  {employeeData.joinDate}
                </p>
              </div>
            </div>
          </div>

          {/* Additional sections could be added here */}
          <div style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--neuron-ui-border)",
            borderRadius: "12px",
            padding: "32px",
            marginBottom: "24px"
          }}>
            <h3 style={{ 
              fontSize: "16px", 
              fontWeight: 600, 
              color: "#12332B",
              marginBottom: "16px"
            }}>
              Department Information
            </h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "24px"
            }}>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase size={16} style={{ color: "#667085" }} />
                  <label style={{ 
                    fontSize: "11px", 
                    fontWeight: 600,
                    color: "#667085",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Department
                  </label>
                </div>
                <CustomDropdown
                  value={selectedDepartment}
                  onChange={handleDepartmentChange}
                  options={departments}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase size={16} style={{ color: "#667085" }} />
                  <label style={{ 
                    fontSize: "11px", 
                    fontWeight: 600,
                    color: "#667085",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Position
                  </label>
                </div>
                <p style={{ 
                  fontSize: "14px", 
                  color: "#12332B",
                  paddingLeft: "24px"
                }}>
                  {employeeData.role}
                </p>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--neuron-ui-border)",
            borderRadius: "12px",
            padding: "32px",
            marginBottom: isDevMode ? "24px" : "0"
          }}>
            <h3 style={{ 
              fontSize: "16px", 
              fontWeight: 600, 
              color: "#12332B",
              marginBottom: "8px"
            }}>
              Account Actions
            </h3>
            <p style={{ 
              fontSize: "13px", 
              color: "#667085",
              marginBottom: "20px"
            }}>
              Log out of your account
            </p>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors"
              style={{
                border: "1px solid #DC2626",
                backgroundColor: "#FFFFFF",
                color: "#DC2626",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#FEF2F2";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#FFFFFF";
              }}
            >
              <LogOut size={16} />
              Log Out
            </button>
          </div>
          
          {/* Dev Tools Section - Only visible in development */}
          {isDevMode && (
            <div style={{
              backgroundColor: "#FFFBEB",
              border: "2px solid #F59E0B",
              borderRadius: "12px",
              padding: "24px"
            }}>
              <div className="flex items-center gap-3 mb-4">
                <Wrench size={20} style={{ color: "#F59E0B" }} />
                <h3 style={{ 
                  fontSize: "16px", 
                  fontWeight: 600, 
                  color: "#92400E",
                  margin: 0
                }}>
                  Development Tools
                </h3>
                {devOverride?.enabled && (
                  <span style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "#F59E0B",
                    backgroundColor: "#FEF3C7",
                    padding: "4px 8px",
                    borderRadius: "4px"
                  }}>
                    OVERRIDE ACTIVE
                  </span>
                )}
              </div>
              
              <p style={{
                fontSize: "12px",
                color: "#78350F",
                marginBottom: "20px",
                lineHeight: "18px"
              }}>
                Test different roles and permissions without logging out. Changes apply instantly across all modules.
              </p>
              
              {/* Current Status */}
              {devOverride?.enabled && (
                <div style={{
                  backgroundColor: "#FEF3C7",
                  border: "1px solid #FCD34D",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  marginBottom: "20px"
                }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "#78350F", marginBottom: "8px" }}>
                    CURRENT OVERRIDE:
                  </div>
                  <div style={{ fontSize: "13px", color: "#92400E" }}>
                    <strong>Department:</strong> {devOverride.department} • <strong>Role:</strong> {devOverride.role}
                  </div>
                  <div style={{ fontSize: "11px", color: "#A16207", marginTop: "6px" }}>
                    Actual Role: {user?.department} / {user?.role}
                  </div>
                </div>
              )}
              
              {/* Override Controls */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "16px"
              }}>
                <div>
                  <label style={{ 
                    fontSize: "11px", 
                    fontWeight: 600,
                    color: "#78350F",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "block",
                    marginBottom: "6px"
                  }}>
                    Department
                  </label>
                  <select
                    value={devDepartment}
                    onChange={(e) => setDevDepartment(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #F59E0B",
                      borderRadius: "6px",
                      fontSize: "13px",
                      backgroundColor: "white",
                      color: "#12332B",
                      cursor: "pointer"
                    }}
                  >
                    {departments.map((dept) => (
                      <option key={dept.value} value={dept.value}>
                        {dept.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label style={{ 
                    fontSize: "11px", 
                    fontWeight: 600,
                    color: "#78350F",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "block",
                    marginBottom: "6px"
                  }}>
                    Role
                  </label>
                  <select
                    value={devRole}
                    onChange={(e) => setDevRole(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #F59E0B",
                      borderRadius: "6px",
                      fontSize: "13px",
                      backgroundColor: "white",
                      color: "#12332B",
                      cursor: "pointer"
                    }}
                  >
                    {roleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={handleApplyDevOverride}
                  className="flex items-center gap-2"
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    backgroundColor: "#F59E0B",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "white",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#D97706";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#F59E0B";
                  }}
                >
                  <Shuffle size={16} />
                  Apply Override
                </button>
                
                <button
                  onClick={handleResetDevOverride}
                  disabled={!devOverride?.enabled}
                  className="flex items-center gap-2"
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    backgroundColor: devOverride?.enabled ? "white" : "#F3F4F6",
                    border: "1px solid var(--neuron-ui-border)",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: devOverride?.enabled ? "#12332B" : "#9CA3AF",
                    cursor: devOverride?.enabled ? "pointer" : "not-allowed",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (devOverride?.enabled) {
                      e.currentTarget.style.backgroundColor = "var(--neuron-state-hover)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (devOverride?.enabled) {
                      e.currentTarget.style.backgroundColor = "white";
                    }
                  }}
                >
                  <RotateCcw size={16} />
                  Reset to Actual Role
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}