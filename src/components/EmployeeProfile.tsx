import { Mail, Phone, MapPin, Briefcase, Calendar, Edit2, Shuffle, Wrench, RotateCcw, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { CustomDropdown } from "./bd/CustomDropdown";
import { useState } from "react";
import { useUser } from "../hooks/useUser";
import { getThemeModePreference, setThemeModePreference } from "../theme/themeMode";
import type { ThemeModePreference } from "../theme/workspaceTheme";

interface EmployeeProfileProps {
  currentUser?: { name: string; email: string; department: string };
  onDepartmentChange?: (department: string) => void;
}

export function EmployeeProfile({ currentUser, onDepartmentChange }: EmployeeProfileProps) {
  const { user, devOverride, setDevOverride, effectiveDepartment, effectiveRole, logout } = useUser();

  const [selectedDepartment, setSelectedDepartment] = useState(currentUser?.department || "Operations");
  const [themeModePreference, setThemeModePreferenceState] = useState<ThemeModePreference>(() => getThemeModePreference());

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
    { value: "staff", label: "Staff" },
    { value: "team_leader", label: "Team Leader" },
    { value: "manager", label: "Manager" },
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

  const handleThemeModeChange = (preference: ThemeModePreference) => {
    setThemeModePreference(preference);
    setThemeModePreferenceState(preference);
  };

  const employeeData = {
    name: user?.name || currentUser?.name || "—",
    email: user?.email || currentUser?.email || "—",
    position: (user as { position?: string | null } | null)?.position || null,
    department: selectedDepartment,
    phone: "+63 917 123 4567",
    location: "Makati City, Metro Manila",
    joinDate: "January 15, 2024",
    employeeId: "EMP-2024-001",
  };

  const isDevMode = import.meta.env.DEV || localStorage.getItem("neuron_dev_tools_enabled") === "true";

  return (
    <div className="h-full overflow-auto" style={{ background: "var(--theme-bg-page)" }}>
      {/* Header */}
      <div
        style={{
          padding: "32px 48px",
          backgroundColor: "var(--theme-bg-surface)",
          borderBottom: "1px solid var(--theme-border-default)",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 600,
                color: "var(--theme-text-primary)",
                marginBottom: "8px",
              }}
            >
              Employee Profile
            </h1>
            <p style={{ fontSize: "14px", color: "var(--theme-text-muted)" }}>
              View and manage your personal information
            </p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors"
            style={{
              border: "1px solid var(--theme-border-default)",
              backgroundColor: "var(--theme-bg-surface)",
              color: "var(--theme-text-primary)",
              fontSize: "13px",
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--theme-state-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--theme-bg-surface)";
            }}
          >
            <Edit2 size={16} />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "32px 48px" }}>
        <div
          style={{
            maxWidth: "960px",
            margin: "0 auto",
          }}
        >
          {/* Profile Card */}
          <div
            style={{
              backgroundColor: "var(--theme-bg-surface)",
              border: "1px solid var(--theme-border-default)",
              borderRadius: "12px",
              padding: "32px",
              marginBottom: "24px",
            }}
          >
            {/* Avatar and Basic Info */}
            <div className="flex items-start gap-6 mb-8">
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: "96px",
                  height: "96px",
                  backgroundColor: "var(--theme-bg-surface-tint)",
                  color: "var(--theme-action-primary-bg)",
                  fontSize: "36px",
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {employeeData.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: 600,
                    color: "var(--theme-text-primary)",
                    marginBottom: "4px",
                  }}
                >
                  {employeeData.name}
                </h2>
                <p
                  style={{
                    fontSize: "15px",
                    color: "var(--theme-action-primary-bg)",
                    fontWeight: 500,
                    marginBottom: "8px",
                  }}
                >
                  {employeeData.position || effectiveRole}
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--theme-text-muted)",
                  }}
                >
                  {employeeData.department} - Employee ID: {employeeData.employeeId}
                </p>
              </div>
            </div>

            {/* Contact Information Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "24px",
              }}
            >
              {/* Email */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Mail size={16} style={{ color: "var(--theme-text-muted)" }} />
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--theme-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Email Address
                  </label>
                </div>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--theme-text-primary)",
                    paddingLeft: "24px",
                  }}
                >
                  {employeeData.email}
                </p>
              </div>

              {/* Phone */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Phone size={16} style={{ color: "var(--theme-text-muted)" }} />
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--theme-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Phone Number
                  </label>
                </div>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--theme-text-primary)",
                    paddingLeft: "24px",
                  }}
                >
                  {employeeData.phone}
                </p>
              </div>

              {/* Location */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={16} style={{ color: "var(--theme-text-muted)" }} />
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--theme-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Location
                  </label>
                </div>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--theme-text-primary)",
                    paddingLeft: "24px",
                  }}
                >
                  {employeeData.location}
                </p>
              </div>

              {/* Join Date */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} style={{ color: "var(--theme-text-muted)" }} />
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--theme-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Join Date
                  </label>
                </div>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--theme-text-primary)",
                    paddingLeft: "24px",
                  }}
                >
                  {employeeData.joinDate}
                </p>
              </div>
            </div>
          </div>

          {/* Additional sections could be added here */}
          <div
            style={{
              backgroundColor: "var(--theme-bg-surface)",
              border: "1px solid var(--theme-border-default)",
              borderRadius: "12px",
              padding: "32px",
              marginBottom: "24px",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--theme-text-primary)",
                marginBottom: "16px",
              }}
            >
              Department Information
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "24px",
              }}
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase size={16} style={{ color: "var(--theme-text-muted)" }} />
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--theme-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Department
                  </label>
                </div>
                <CustomDropdown value={selectedDepartment} onChange={handleDepartmentChange} options={departments} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase size={16} style={{ color: "var(--theme-text-muted)" }} />
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--theme-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Position
                  </label>
                </div>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--theme-text-primary)",
                    paddingLeft: "24px",
                  }}
                >
                  {employeeData.position || "—"}
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "var(--theme-bg-surface)",
              border: "1px solid var(--theme-border-default)",
              borderRadius: "12px",
              padding: "32px",
              marginBottom: "24px",
            }}
          >
            <div className="flex items-start gap-3 mb-5">
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "var(--theme-state-hover)",
                  color: "var(--theme-action-primary-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Monitor size={18} />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "var(--theme-text-primary)",
                    marginBottom: "6px",
                  }}
                >
                  Appearance
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--theme-text-muted)",
                    lineHeight: "20px",
                    margin: 0,
                  }}
                >
                  Choose how this workspace appears for your account on this browser. Screens already using workspace theme tokens update
                  immediately.
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "12px",
              }}
            >
              {[
                {
                  value: "light" as ThemeModePreference,
                  label: "Light",
                  description: "Always use the light interface",
                  icon: Sun,
                },
                {
                  value: "dark" as ThemeModePreference,
                  label: "Dark",
                  description: "Always use the dark interface",
                  icon: Moon,
                },
                {
                  value: "system" as ThemeModePreference,
                  label: "System",
                  description: "Follow your device preference",
                  icon: Monitor,
                },
              ].map(({ value, label, description, icon: Icon }) => {
                const isSelected = themeModePreference === value;

                return (
                  <button
                    key={value}
                    onClick={() => handleThemeModeChange(value)}
                    style={{
                      textAlign: "left",
                      padding: "16px",
                      borderRadius: "12px",
                      border: isSelected ? "1px solid var(--theme-action-primary-border)" : "1px solid var(--theme-border-default)",
                      backgroundColor: isSelected ? "var(--theme-state-selected)" : "var(--theme-bg-surface)",
                      boxShadow: "none",
                      cursor: "pointer",
                      transition: "all 150ms ease",
                    }}
                    onMouseEnter={(event) => {
                      if (!isSelected) {
                        event.currentTarget.style.backgroundColor = "var(--theme-state-hover)";
                      }
                    }}
                    onMouseLeave={(event) => {
                      if (!isSelected) {
                        event.currentTarget.style.backgroundColor = "var(--theme-bg-surface)";
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Icon size={16} style={{ color: isSelected ? "var(--theme-action-primary-bg)" : "var(--theme-text-muted)" }} />
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "var(--theme-text-primary)",
                        }}
                      >
                        {label}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "12px",
                        lineHeight: "18px",
                        color: "var(--theme-text-muted)",
                        margin: 0,
                      }}
                    >
                      {description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Actions */}
          <div
            style={{
              backgroundColor: "var(--theme-bg-surface)",
              border: "1px solid var(--theme-border-default)",
              borderRadius: "12px",
              padding: "32px",
              marginBottom: isDevMode ? "24px" : "0",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--theme-text-primary)",
                marginBottom: "8px",
              }}
            >
              Account Actions
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "var(--theme-text-muted)",
                marginBottom: "20px",
              }}
            >
              Log out of your account
            </p>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors"
              style={{
                border: "1px solid var(--theme-status-danger-border)",
                backgroundColor: "var(--theme-bg-surface)",
                color: "var(--theme-status-danger-fg)",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--theme-status-danger-bg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--theme-bg-surface)";
              }}
            >
              <LogOut size={16} />
              Log Out
            </button>
          </div>

          {/* Dev Tools Section - Only visible in development */}
          {isDevMode && (
            <div
              style={{
                backgroundColor: "var(--theme-status-warning-bg)",
                border: "2px solid var(--theme-status-warning-border)",
                borderRadius: "12px",
                padding: "24px",
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Wrench size={20} style={{ color: "var(--theme-status-warning-fg)" }} />
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "var(--theme-status-warning-fg)",
                    margin: 0,
                  }}
                >
                  Development Tools
                </h3>
                {devOverride?.enabled && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "var(--theme-status-warning-fg)",
                      backgroundColor: "var(--theme-bg-surface)",
                      padding: "4px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    OVERRIDE ACTIVE
                  </span>
                )}
              </div>

              <p
                style={{
                  fontSize: "12px",
                  color: "var(--theme-status-warning-fg)",
                  marginBottom: "20px",
                  lineHeight: "18px",
                }}
              >
                Test different roles and permissions without logging out. Changes apply instantly across all modules.
              </p>

              {/* Current Status */}
              {devOverride?.enabled && (
                <div
                  style={{
                    backgroundColor: "var(--theme-bg-surface)",
                    border: "1px solid var(--theme-status-warning-border)",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    marginBottom: "20px",
                  }}
                >
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--theme-status-warning-fg)", marginBottom: "8px" }}>
                    CURRENT OVERRIDE:
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--theme-text-primary)" }}>
                    <strong>Department:</strong> {devOverride.department} - <strong>Role:</strong> {devOverride.role}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--theme-text-muted)", marginTop: "6px" }}>
                    Actual Role: {user?.department} / {user?.role}
                  </div>
                </div>
              )}

              {/* Override Controls */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--theme-status-warning-fg)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Department
                  </label>
                  <select
                    value={devDepartment}
                    onChange={(e) => setDevDepartment(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid var(--theme-status-warning-border)",
                      borderRadius: "6px",
                      fontSize: "13px",
                      backgroundColor: "var(--theme-bg-surface)",
                      color: "var(--theme-text-primary)",
                      cursor: "pointer",
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
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--theme-status-warning-fg)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Role
                  </label>
                  <select
                    value={devRole}
                    onChange={(e) => setDevRole(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid var(--theme-status-warning-border)",
                      borderRadius: "6px",
                      fontSize: "13px",
                      backgroundColor: "var(--theme-bg-surface)",
                      color: "var(--theme-text-primary)",
                      cursor: "pointer",
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
                    backgroundColor: "var(--theme-action-primary-bg)",
                    border: "1px solid var(--theme-action-primary-border)",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--theme-action-primary-text)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--theme-action-primary-border)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--theme-action-primary-bg)";
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
                    backgroundColor: devOverride?.enabled ? "var(--theme-bg-surface)" : "var(--theme-bg-surface-subtle)",
                    border: "1px solid var(--theme-border-default)",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: devOverride?.enabled ? "var(--theme-text-primary)" : "var(--theme-text-muted)",
                    cursor: devOverride?.enabled ? "pointer" : "not-allowed",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (devOverride?.enabled) {
                      e.currentTarget.style.backgroundColor = "var(--theme-state-hover)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (devOverride?.enabled) {
                      e.currentTarget.style.backgroundColor = "var(--theme-bg-surface)";
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
