import { Search, Plus, Globe, Award, ChevronDown, ChevronRight, Plane, Ship, Loader2, User, Phone, Mail } from "lucide-react";
import { useState, useMemo } from "react";
import { 
  COUNTRIES, 
  isExpired, 
  expiresSoon,
  getDaysUntilExpiry,
  type NetworkPartner,
} from "../../data/networkPartners";
import { PartnerSheet } from "./partners/PartnerSheet";
import { useNetworkPartners } from "../../hooks/useNetworkPartners";
import React from "react";

type StatusFilter = "all" | "active" | "expiring" | "expired" | "wca";
type Tab = "international" | "co-loader" | "all-in";

// Get service icon component
const getServiceIcon = (service: string) => {
  const serviceLower = service.toLowerCase();
  if (serviceLower.includes("ocean")) {
    return <Ship size={13} color="#6B7280" title={service} />;
  }
  if (serviceLower.includes("air")) {
    return <Plane size={13} color="#6B7280" title={service} />;
  }
  // Fallback to first letter for other services
  return <span style={{ fontSize: "11px", color: "#6B7280", fontWeight: 600 }} title={service}>{service.charAt(0).toUpperCase()}</span>;
};

// Group partners by country
const groupPartnersByCountry = (partners: NetworkPartner[]) => {
  const grouped = partners.reduce((acc, partner) => {
    if (!acc[partner.country]) {
      acc[partner.country] = [];
    }
    acc[partner.country].push(partner);
    return acc;
  }, {} as Record<string, NetworkPartner[]>);

  // Sort countries by partner count (descending)
  return Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);
};

interface NetworkPartnersModuleProps {
  onViewVendor?: (vendorId: string) => void;
  // Optional props to allow parent control (Lifting State Up)
  partners?: NetworkPartner[];
  isLoading?: boolean;
  onSavePartner?: (partner: Partial<NetworkPartner>) => Promise<any>;
}

export function NetworkPartnersModule({ 
  onViewVendor, 
  partners: propPartners, 
  isLoading: propIsLoading,
  onSavePartner: propOnSavePartner 
}: NetworkPartnersModuleProps) {
  // Use hook if props are not provided
  const hookData = useNetworkPartners();
  
  // Determine source of truth
  const partners = propPartners || hookData.partners;
  const isLoading = propIsLoading !== undefined ? propIsLoading : hookData.isLoading;
  const savePartner = propOnSavePartner || hookData.savePartner;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [activeTab, setActiveTab] = useState<Tab>("international");
  const [isPartnerSheetOpen, setIsPartnerSheetOpen] = useState(false);
  
  const [collapsedCountries, setCollapsedCountries] = useState<Set<string>>(new Set());

  // Calculate stats dynamically
  const stats = useMemo(() => {
    const expired = partners.filter(p => p.expires && isExpired(p.expires)).length;
    const expiringSoonCount = partners.filter(p => p.expires && expiresSoon(p.expires) && !isExpired(p.expires)).length;
    const wcaConference = partners.filter(p => p.is_wca_conference).length;
    const active = partners.filter(p => !p.expires || (!isExpired(p.expires) && !expiresSoon(p.expires))).length;
    
    return {
      total: partners.length,
      expired,
      expiringSoon: expiringSoonCount,
      wcaConference,
      active
    };
  }, [partners]);

  // Calculate counts for each tab
  const tabCounts = useMemo(() => ({
    international: partners.filter(p => !p.partner_type || p.partner_type === "international").length,
    "co-loader": partners.filter(p => p.partner_type === "co-loader").length,
    "all-in": partners.filter(p => p.partner_type === "all-in").length
  }), [partners]);

  // Toggle country collapse
  const toggleCountry = (country: string) => {
    const newCollapsed = new Set(collapsedCountries);
    if (newCollapsed.has(country)) {
      newCollapsed.delete(country);
    } else {
      newCollapsed.add(country);
    }
    setCollapsedCountries(newCollapsed);
  };

  // Filter partners
  const filteredPartners = useMemo(() => {
    return partners.filter(partner => {
      // 1. Tab Filter (Primary)
      const isInternational = !partner.partner_type || partner.partner_type === "international";
      if (activeTab === "international" && !isInternational) return false;
      if (activeTab === "co-loader" && partner.partner_type !== "co-loader") return false;
      if (activeTab === "all-in" && partner.partner_type !== "all-in") return false;

      // 2. Search Filter
      const matchesSearch = 
        partner.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (partner.contact_person && partner.contact_person.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (partner.wca_id && partner.wca_id.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // 3. Country Filter
      const matchesCountry = countryFilter === "All" || partner.country === countryFilter;

      // 4. Status Filter
      let matchesStatus = true;
      if (statusFilter === "expired" && partner.expires) {
        matchesStatus = isExpired(partner.expires);
      } else if (statusFilter === "expiring" && partner.expires) {
        matchesStatus = expiresSoon(partner.expires) && !isExpired(partner.expires);
      } else if (statusFilter === "active") {
        matchesStatus = !partner.expires || (!isExpired(partner.expires) && !expiresSoon(partner.expires));
      } else if (statusFilter === "wca") {
        matchesStatus = partner.is_wca_conference;
      }

      return matchesSearch && matchesCountry && matchesStatus;
    });
  }, [partners, activeTab, searchQuery, countryFilter, statusFilter]);

  // Group filtered partners by country
  const groupedPartners = useMemo(() => groupPartnersByCountry(filteredPartners), [filteredPartners]);

  const getStatusColor = (partner: NetworkPartner): string => {
    if (!partner.expires) return "#9CA3AF"; // gray
    if (isExpired(partner.expires)) return "#DC2626"; // red
    if (expiresSoon(partner.expires)) return "#D97706"; // amber
    return "#059669"; // green
  };

  const getStatusLabel = (partner: NetworkPartner): string => {
    if (!partner.expires) return "No expiry";
    if (isExpired(partner.expires)) return "EXPIRED";
    if (expiresSoon(partner.expires)) {
      const days = getDaysUntilExpiry(partner.expires);
      return `${days}d left`;
    }
    return "Active";
  };

  // Format date compactly
  const formatCompactDate = (dateStr: string): string => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  };

  const handleSavePartner = async (data: Partial<NetworkPartner>) => {
    console.log("Saving new partner:", data);
    try {
      await savePartner(data);
      setIsPartnerSheetOpen(false);
    } catch (error) {
      console.error("Failed to save partner", error);
      // Ideally show a toast here
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[#0F766E]" />
          <p className="text-sm text-gray-500">Loading partners...</p>
        </div>
      </div>
    );
  }

  // Define column widths for consistency
  const colWidths = (
    <colgroup>
      <col style={{ width: "40px" }} />
      <col style={{ width: "auto" }} />
      <col style={{ width: "140px" }} />
      <col style={{ width: "100px" }} />
      <col style={{ width: "160px" }} />
      <col style={{ width: "100px" }} />
      <col style={{ width: "100px" }} />
    </colgroup>
  );

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        backgroundColor: "white",
        position: "relative",
      }}
    >
      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header Section */}
        <div style={{ flexShrink: 0 }}>
          {/* Title Row */}
          <div
            style={{
              padding: "32px 48px 24px 48px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "32px",
                  fontWeight: 600,
                  color: "#12332B",
                  marginBottom: "4px",
                  letterSpacing: "-1.2px",
                }}
              >
                Network Partners
              </h1>
              <p
                style={{
                  fontSize: "14px",
                  color: "#667085",
                  margin: 0,
                }}
              >
                {stats.total} active agents across {COUNTRIES.length} countries
              </p>
            </div>

            <button
              onClick={() => setIsPartnerSheetOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                height: "48px",
                padding: "0 24px",
                backgroundColor: "#0F766E",
                border: "none",
                borderRadius: "16px",
                fontSize: "14px",
                fontWeight: 600,
                color: "white",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#0F544A";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#0F766E";
              }}
            >
              <Plus size={16} />
              Add Partner
            </button>
          </div>

          {/* Filters Row */}
          <div 
            style={{ 
              padding: "0 48px 24px 48px", 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center" 
            }}
          >
            {/* Stats Pills - Left Side */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setStatusFilter("all")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "16px",
                  fontSize: "12px",
                  fontWeight: 600,
                  backgroundColor: statusFilter === "all" ? "#E8F5F3" : "#F9FAFB",
                  color: statusFilter === "all" ? "#0F766E" : "#6B7280",
                  border: statusFilter === "all" ? "2px solid #0F766E" : "1px solid #E5E7EB",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                All • {stats.total}
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "16px",
                  fontSize: "12px",
                  fontWeight: 600,
                  backgroundColor: statusFilter === "active" ? "#D1FAE5" : "#F9FAFB",
                  color: statusFilter === "active" ? "#047857" : "#6B7280",
                  border: statusFilter === "active" ? "2px solid #047857" : "1px solid #E5E7EB",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                Active • {stats.active}
              </button>
              <button
                onClick={() => setStatusFilter("expiring")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "16px",
                  fontSize: "12px",
                  fontWeight: 600,
                  backgroundColor: statusFilter === "expiring" ? "#FEF3C7" : "#F9FAFB",
                  color: statusFilter === "expiring" ? "#D97706" : "#6B7280",
                  border: statusFilter === "expiring" ? "2px solid #D97706" : "1px solid #E5E7EB",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                Expiring • {stats.expiringSoon}
              </button>
              <button
                onClick={() => setStatusFilter("expired")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "16px",
                  fontSize: "12px",
                  fontWeight: 600,
                  backgroundColor: statusFilter === "expired" ? "#FEE2E2" : "#F9FAFB",
                  color: statusFilter === "expired" ? "#DC2626" : "#6B7280",
                  border: statusFilter === "expired" ? "2px solid #DC2626" : "1px solid #E5E7EB",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                Expired • {stats.expired}
              </button>
              <button
                onClick={() => setStatusFilter("wca")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "16px",
                  fontSize: "12px",
                  fontWeight: 600,
                  backgroundColor: statusFilter === "wca" ? "#EDE9FE" : "#F9FAFB",
                  color: statusFilter === "wca" ? "#7C3AED" : "#6B7280",
                  border: statusFilter === "wca" ? "2px solid #7C3AED" : "1px solid #E5E7EB",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <Award size={12} />
                WCA • {stats.wcaConference}
              </button>
            </div>

            {/* Search and Filters - Right Side */}
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ position: "relative" }}>
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--neuron-ink-muted)",
                  }}
                />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "240px",
                    padding: "8px 10px 8px 34px",
                    border: "1px solid var(--neuron-ui-border)",
                    borderRadius: "8px",
                    fontSize: "13px",
                    outline: "none",
                    transition: "border-color 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#0F766E";
                    e.currentTarget.style.boxShadow = "0 0 0 1px #0F766E";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--neuron-ui-border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                style={{
                  padding: "8px 32px 8px 12px",
                  border: "1px solid var(--neuron-ui-border)",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "var(--neuron-ink-secondary)",
                  backgroundColor: "white",
                  cursor: "pointer",
                  outline: "none",
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                  minWidth: "160px",
                }}
              >
                <option value="All">All Countries</option>
                {COUNTRIES.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabs Row */}
          <div style={{ padding: "0 48px", display: "flex", gap: "32px", borderBottom: "1px solid var(--neuron-ui-border)" }}>
            <button
              onClick={() => setActiveTab("international")}
              style={{
                padding: "0 0 16px 0",
                fontSize: "14px",
                fontWeight: 600,
                color: activeTab === "international" ? "#0F766E" : "#6B7280",
                borderBottom: activeTab === "international" ? "2px solid #0F766E" : "2px solid transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s"
              }}
            >
              International Partners
              <span style={{ 
                backgroundColor: activeTab === "international" ? "#F0FDF9" : "#F3F4F6", 
                color: activeTab === "international" ? "#0F766E" : "#6B7280",
                fontSize: "12px", 
                padding: "2px 8px", 
                borderRadius: "12px" 
              }}>
                {tabCounts.international}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("co-loader")}
              style={{
                padding: "0 0 16px 0",
                fontSize: "14px",
                fontWeight: 600,
                color: activeTab === "co-loader" ? "#0F766E" : "#6B7280",
                borderBottom: activeTab === "co-loader" ? "2px solid #0F766E" : "2px solid transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s"
              }}
            >
              Co-Loader Partners
              <span style={{ 
                backgroundColor: activeTab === "co-loader" ? "#F0FDF9" : "#F3F4F6", 
                color: activeTab === "co-loader" ? "#0F766E" : "#6B7280",
                fontSize: "12px", 
                padding: "2px 8px", 
                borderRadius: "12px" 
              }}>
                {tabCounts["co-loader"]}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("all-in")}
              style={{
                padding: "0 0 16px 0",
                fontSize: "14px",
                fontWeight: 600,
                color: activeTab === "all-in" ? "#0F766E" : "#6B7280",
                borderBottom: activeTab === "all-in" ? "2px solid #0F766E" : "2px solid transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s"
              }}
            >
              All-In Partners
              <span style={{ 
                backgroundColor: activeTab === "all-in" ? "#F0FDF9" : "#F3F4F6", 
                color: activeTab === "all-in" ? "#0F766E" : "#6B7280",
                fontSize: "12px", 
                padding: "2px 8px", 
                borderRadius: "12px" 
              }}>
                {tabCounts["all-in"]}
              </span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflow: "auto", padding: "32px 48px" }}>
          {filteredPartners.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "60px 20px",
                color: "var(--neuron-ink-muted)",
                backgroundColor: "#F9FAFB",
                borderRadius: "12px",
                border: "1px dashed var(--neuron-ui-border)",
              }}
            >
              <Globe size={48} style={{ marginBottom: "16px", opacity: 0.3 }} />
              <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--neuron-ink-primary)", marginBottom: "8px" }}>
                No partners found
              </p>
              <p style={{ fontSize: "13px", marginTop: "0" }}>
                Try adjusting your filters or search query
              </p>
            </div>
          ) : (
            <div
              style={{
                border: "1.5px solid var(--neuron-ui-border)",
                borderRadius: "16px",
                overflow: "hidden",
                backgroundColor: "white",
              }}
            >
              <table className="w-full" style={{ borderCollapse: "collapse" }}>
                {colWidths}
                <thead>
                  <tr style={{ borderBottom: "1.5px solid var(--neuron-ui-border)" }}>
                    <th className="text-left px-4 py-3 text-xs" style={{ color: "var(--neuron-ink-muted)", backgroundColor: "#FAFBFB" }}></th>
                    <th className="text-left px-4 py-3 text-xs" style={{ color: "var(--neuron-ink-muted)", backgroundColor: "#FAFBFB" }}>COMPANY</th>
                    <th className="text-left px-4 py-3 text-xs" style={{ color: "var(--neuron-ink-muted)", backgroundColor: "#FAFBFB" }}>LOCATION</th>
                    <th className="text-left px-4 py-3 text-xs" style={{ color: "var(--neuron-ink-muted)", backgroundColor: "#FAFBFB" }}>WCA ID</th>
                    <th className="text-left px-4 py-3 text-xs" style={{ color: "var(--neuron-ink-muted)", backgroundColor: "#FAFBFB" }}>CONTACT</th>
                    <th className="text-left px-4 py-3 text-xs" style={{ color: "var(--neuron-ink-muted)", backgroundColor: "#FAFBFB" }}>EXPIRES</th>
                    <th className="text-left px-4 py-3 text-xs" style={{ color: "var(--neuron-ink-muted)", backgroundColor: "#FAFBFB" }}>SERVICES</th>
                  </tr>
                </thead>
                {groupedPartners.map(([country, partners]) => {
                  const isCollapsed = collapsedCountries.has(country);
                  
                  return (
                    <tbody key={country}>
                      {/* Country Group Header */}
                      <tr 
                        onClick={() => toggleCountry(country)}
                        className="cursor-pointer hover:bg-[#F3F4F6] transition-colors"
                        style={{ 
                          backgroundColor: "#F9FAFB",
                          borderBottom: "1px solid var(--neuron-ui-border)"
                        }}
                      >
                        <td colSpan={7} className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <ChevronDown 
                              size={16} 
                              className="text-gray-500 transition-transform duration-200"
                              style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                            />
                            <span className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide">
                              {country}
                            </span>
                            <span className="text-xs text-gray-500 font-medium bg-white px-2 py-0.5 rounded-full border border-gray-200">
                              {partners.length}
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Partner Rows Wrapper */}
                      <tr>
                        <td colSpan={7} className="p-0 border-0">
                          <div
                            style={{
                              maxHeight: isCollapsed ? "0px" : "2000px",
                              opacity: isCollapsed ? 0 : 1,
                              overflow: "hidden",
                              transition: "max-height 0.3s ease-in-out, opacity 0.25s ease-in-out",
                            }}
                          >
                            <table className="w-full" style={{ borderCollapse: "collapse" }}>
                              {colWidths}
                              <tbody>
                                {partners.map((partner) => {
                                  const statusColor = getStatusColor(partner);
                                  const statusLabel = getStatusLabel(partner);
                                  
                                  return (
                                    <tr
                                      key={partner.id}
                                      onClick={() => onViewVendor?.(partner.id)}
                                      className="cursor-pointer hover:bg-[#FAFBFB] transition-colors"
                                      style={{ 
                                        borderBottom: "1px solid #EAECF0",
                                        backgroundColor: "white"
                                      }}
                                    >
                                      {/* Status Dot */}
                                      <td className="px-4 py-3 align-middle text-center">
                                        <div 
                                          title={statusLabel}
                                          className="w-2 h-2 rounded-full mx-auto"
                                          style={{ backgroundColor: statusColor }}
                                        />
                                      </td>

                                      {/* Company */}
                                      <td className="px-4 py-3 align-middle">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[13px] font-medium text-[var(--neuron-ink-primary)]">
                                            {partner.company_name}
                                          </span>
                                          {partner.is_wca_conference && (
                                            <Award size={14} className="text-purple-600" title="WCA Conference Member" />
                                          )}
                                        </div>
                                      </td>

                                      {/* Location */}
                                      <td className="px-4 py-3 align-middle">
                                        <div className="flex flex-col">
                                          <span className="text-[13px] text-gray-600">
                                            {partner.territory || partner.country}
                                          </span>
                                        </div>
                                      </td>

                                      {/* WCA ID */}
                                      <td className="px-4 py-3 align-middle">
                                        <span className="text-[13px] text-gray-600 font-mono">
                                          {partner.wca_id || "—"}
                                        </span>
                                      </td>

                                      {/* Contact */}
                                      <td className="px-4 py-3 align-middle">
                                        <span className="text-[13px] text-[var(--neuron-ink-primary)]">
                                          {partner.contact_person || "—"}
                                        </span>
                                      </td>

                                      {/* Expires */}
                                      <td className="px-4 py-3 align-middle">
                                        <span 
                                          className="text-[13px]"
                                          style={{
                                            color: isExpired(partner.expires) ? "#DC2626" : 
                                                   expiresSoon(partner.expires) ? "#D97706" : "#6B7280",
                                            fontWeight: expiresSoon(partner.expires) ? 600 : 400
                                          }}
                                        >
                                          {formatCompactDate(partner.expires)}
                                        </span>
                                      </td>

                                      {/* Services */}
                                      <td className="px-4 py-3 align-middle">
                                        <div className="flex gap-1.5 flex-wrap">
                                          {partner.services && partner.services.slice(0, 3).map(service => (
                                            <div 
                                              key={service}
                                              className="p-1 rounded bg-gray-50 border border-gray-100"
                                              title={service}
                                            >
                                              {getServiceIcon(service)}
                                            </div>
                                          ))}
                                          {partner.services && partner.services.length > 3 && (
                                            <span className="text-[10px] text-gray-500 bg-gray-50 px-1 rounded flex items-center">
                                              +{partner.services.length - 3}
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  );
                })}
              </table>
            </div>
          )}
        </div>

        {/* Partner Sheet */}
        <PartnerSheet
          isOpen={isPartnerSheetOpen}
          onClose={() => setIsPartnerSheetOpen(false)}
          onSave={handleSavePartner}
        />
      </div>
    </div>
  );
}