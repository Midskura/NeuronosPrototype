import { useState, ReactNode } from "react";
import { Plus, Search, Briefcase, UserCheck, FileEdit, Clock, CheckCircle, LucideIcon } from "lucide-react";

interface ServiceModuleLayoutProps {
  title: string;
  subtitle: string;
  searchPlaceholder?: string;
  onCreateNew: () => void;
  createButtonLabel?: string;
  
  // Search & Filters
  searchTerm: string;
  onSearchChange: (value: string) => void;
  
  timePeriodFilter: string;
  onTimePeriodChange: (value: string) => void;
  
  statusFilter: string;
  onStatusChange: (value: string) => void;
  statusOptions: string[];
  
  ownerFilter: string;
  onOwnerChange: (value: string) => void;
  ownerOptions: string[];
  
  // Service-specific filter
  serviceFilter?: string;
  onServiceFilterChange?: (value: string) => void;
  serviceFilterLabel?: string;
  serviceFilterOptions?: string[];
  
  // Tabs
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Array<{
    id: string;
    icon: LucideIcon;
    label: string;
    count: number;
    color: string;
  }>;
  
  // Table content
  children: ReactNode;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function ServiceModuleLayout({
  title,
  subtitle,
  searchPlaceholder = "Search...",
  onCreateNew,
  createButtonLabel = "New Booking",
  searchTerm,
  onSearchChange,
  timePeriodFilter,
  onTimePeriodChange,
  statusFilter,
  onStatusChange,
  statusOptions,
  ownerFilter,
  onOwnerChange,
  ownerOptions,
  serviceFilter,
  onServiceFilterChange,
  serviceFilterLabel,
  serviceFilterOptions,
  activeTab,
  onTabChange,
  tabs,
  children,
  isLoading,
  emptyMessage = "No bookings found"
}: ServiceModuleLayoutProps) {
  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF" }}>
      {/* Header */}
      <div style={{ padding: "32px 48px 24px 48px" }}>
        <div style={{ 
          display: "flex", 
          alignItems: "start", 
          justifyContent: "space-between", 
          marginBottom: "24px" 
        }}>
          <div>
            <h1 style={{ 
              fontSize: "32px", 
              fontWeight: 600, 
              color: "#12332B", 
              marginBottom: "4px",
              letterSpacing: "-1.2px"
            }}>
              {title}
            </h1>
            <p style={{ 
              fontSize: "14px", 
              color: "#667085"
            }}>
              {subtitle}
            </p>
          </div>
          
          {/* Action Button */}
          <button
            onClick={onCreateNew}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 600,
              border: "none",
              borderRadius: "8px",
              background: "#0F766E",
              color: "white",
              cursor: "pointer",
            }}
          >
            <Plus size={16} />
            {createButtonLabel}
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ position: "relative", marginBottom: "24px" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#667085",
            }}
          />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px 10px 40px",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              fontSize: "14px",
              outline: "none",
              color: "#12332B",
              backgroundColor: "#FFFFFF",
            }}
          />
        </div>

        {/* Filter Row */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
          gap: "12px",
          marginBottom: "24px"
        }}>
          {/* Time Period Filter */}
          <select
            value={timePeriodFilter}
            onChange={(e) => onTimePeriodChange(e.target.value)}
            style={{
              padding: "10px 12px",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              fontSize: "14px",
              color: "#12332B",
              backgroundColor: "#FFFFFF",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">All Time</option>
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            style={{
              padding: "10px 12px",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              fontSize: "14px",
              color: "#12332B",
              backgroundColor: "#FFFFFF",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">All Statuses</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {/* Account Owner Filter */}
          <select
            value={ownerFilter}
            onChange={(e) => onOwnerChange(e.target.value)}
            style={{
              padding: "10px 12px",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              fontSize: "14px",
              color: "#12332B",
              backgroundColor: "#FFFFFF",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">All Owners</option>
            {ownerOptions.map(owner => (
              <option key={owner} value={owner}>{owner}</option>
            ))}
          </select>

          {/* Service-Specific Filter */}
          {serviceFilter !== undefined && onServiceFilterChange && serviceFilterOptions && (
            <select
              value={serviceFilter}
              onChange={(e) => onServiceFilterChange(e.target.value)}
              style={{
                padding: "10px 12px",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                fontSize: "14px",
                color: "#12332B",
                backgroundColor: "#FFFFFF",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="all">{serviceFilterLabel || "All"}</option>
              {serviceFilterOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          )}
        </div>

        {/* Tabs */}
        <div style={{ 
          display: "flex", 
          gap: "8px", 
          borderBottom: "1px solid #E5E7EB",
          marginBottom: "24px"
        }}>
          {tabs.map(tab => (
            <TabButton
              key={tab.id}
              icon={<tab.icon size={18} />}
              label={tab.label}
              count={tab.count}
              isActive={activeTab === tab.id}
              color={tab.color}
              onClick={() => onTabChange(tab.id)}
            />
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div style={{ padding: "0 48px 48px 48px" }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-[#12332B]/60">Loading...</div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

interface TabButtonProps {
  icon: ReactNode;
  label: string;
  count: number;
  isActive: boolean;
  color: string;
  onClick: () => void;
}

function TabButton({ icon, label, count, isActive, color, onClick }: TabButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "12px 20px",
        background: "transparent",
        border: "none",
        borderBottom: isActive ? `2px solid ${color}` : "2px solid transparent",
        color: isActive ? color : (isHovered ? "#12332B" : "#667085"),
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s ease",
        marginBottom: "-1px"
      }}
    >
      {icon}
      {label}
      <span
        style={{
          padding: "2px 8px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: 700,
          background: isActive ? color : `${color}15`,
          color: isActive ? "#FFFFFF" : color,
          minWidth: "20px",
          textAlign: "center"
        }}
      >
        {count}
      </span>
    </button>
  );
}
