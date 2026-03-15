import { useState } from "react";
import { Plus, Search, FileText, Calendar, User, Building2 } from "lucide-react";
import { PhilippinePeso } from "../icons/PhilippinePeso";
import type { EVoucher, EVoucherStatus, EVoucherCategory } from "../../types/evoucher";
import { CreateEVoucherModal } from "./CreateEVoucherModal";
import { EVoucherDetailView } from "./EVoucherDetailView";

// Mock data
const mockEVouchers: EVoucher[] = [
  {
    id: "ev001",
    voucher_number: "EVRN-2025-001",
    requestor_id: "user001",
    requestor_name: "Juan Dela Cruz",
    request_date: "2024-12-10",
    expense_category: "Miscellaneous",
    sub_category: "Client Entertainment",
    amount: 25000,
    currency: "PHP",
    purpose: "Holiday client appreciation dinner",
    vendor_name: "Vikings Luxury Buffet",
    status: "Approved",
    customer_id: "C002",
    customer_name: "San Miguel Corporation",
    budget_request_id: "BR-002",
    budget_request_number: "BR-002",
    approvers: [
      { id: "app001", name: "Maria Santos", role: "Manager", approved_at: "2024-12-10" }
    ],
    workflow_history: [
      { id: "wh001", timestamp: "2024-12-10T10:00:00", status: "Draft", user_name: "Juan Dela Cruz", user_role: "Requestor", action: "Created voucher" },
      { id: "wh002", timestamp: "2024-12-10T11:00:00", status: "Submitted", user_name: "Juan Dela Cruz", user_role: "Requestor", action: "Submitted for approval" },
      { id: "wh003", timestamp: "2024-12-10T14:30:00", status: "Approved", user_name: "Maria Santos", user_role: "Manager", action: "Approved voucher" }
    ],
    created_at: "2024-12-10T10:00:00",
    updated_at: "2024-12-10T14:30:00"
  },
  {
    id: "ev002",
    voucher_number: "EVRN-2025-002",
    requestor_id: "user002",
    requestor_name: "Maria Santos",
    request_date: "2024-12-11",
    expense_category: "Brokerage",
    sub_category: "Customs Clearance",
    amount: 75000,
    currency: "PHP",
    purpose: "Customs brokerage for shipment BK-2024-1234",
    project_number: "BK-2024-1234",
    vendor_name: "Philippine Customs Brokers Inc.",
    status: "Processing",
    customer_id: "C001",
    customer_name: "Jollibee Foods Corporation",
    approvers: [
      { id: "app002", name: "Pedro Reyes", role: "CEO", approved_at: "2024-12-11" }
    ],
    disbursement_officer_name: "Treasury Team",
    workflow_history: [
      { id: "wh004", timestamp: "2024-12-11T09:00:00", status: "Draft", user_name: "Maria Santos", user_role: "Requestor", action: "Created voucher" },
      { id: "wh005", timestamp: "2024-12-11T09:30:00", status: "Submitted", user_name: "Maria Santos", user_role: "Requestor", action: "Submitted for approval" },
      { id: "wh006", timestamp: "2024-12-11T15:00:00", status: "Approved", user_name: "Pedro Reyes", user_role: "CEO", action: "Approved voucher" },
      { id: "wh007", timestamp: "2024-12-11T16:00:00", status: "Processing", user_name: "Treasury Team", user_role: "Treasury", action: "Started processing disbursement" }
    ],
    created_at: "2024-12-11T09:00:00",
    updated_at: "2024-12-11T16:00:00"
  },
  {
    id: "ev003",
    voucher_number: "EVRN-2025-003",
    requestor_id: "user003",
    requestor_name: "Pedro Reyes",
    request_date: "2024-12-12",
    expense_category: "Trucking",
    sub_category: "Delivery Services",
    amount: 15000,
    currency: "PHP",
    purpose: "Last mile delivery for Manila-Cebu route",
    project_number: "BK-2024-1235",
    vendor_name: "FastTrack Logistics",
    status: "Under Review",
    approvers: [],
    current_approver_name: "Accounts Payable Team",
    workflow_history: [
      { id: "wh008", timestamp: "2024-12-12T08:00:00", status: "Draft", user_name: "Pedro Reyes", user_role: "Requestor", action: "Created voucher" },
      { id: "wh009", timestamp: "2024-12-12T08:30:00", status: "Submitted", user_name: "Pedro Reyes", user_role: "Requestor", action: "Submitted for approval" },
      { id: "wh010", timestamp: "2024-12-12T09:00:00", status: "Under Review", user_name: "AP Team", user_role: "AP", action: "Under review by AP" }
    ],
    created_at: "2024-12-12T08:00:00",
    updated_at: "2024-12-12T09:00:00"
  },
  {
    id: "ev004",
    voucher_number: "EVRN-2025-004",
    requestor_id: "user001",
    requestor_name: "Juan Dela Cruz",
    request_date: "2024-12-09",
    expense_category: "Forwarding",
    sub_category: "Freight Services",
    amount: 250000,
    currency: "PHP",
    purpose: "International freight forwarding for export shipment",
    project_number: "BK-2024-1230",
    vendor_name: "Global Freight Solutions",
    status: "Disbursed",
    customer_id: "C003",
    customer_name: "Universal Robina Corporation",
    approvers: [
      { id: "app003", name: "Maria Santos", role: "Manager", approved_at: "2024-12-09" }
    ],
    disbursement_officer_name: "Angela Torres",
    disbursement_date: "2024-12-10",
    payment_method: "Bank Transfer",
    liquidation_status: "No",
    workflow_history: [
      { id: "wh011", timestamp: "2024-12-09T10:00:00", status: "Draft", user_name: "Juan Dela Cruz", user_role: "Requestor", action: "Created voucher" },
      { id: "wh012", timestamp: "2024-12-09T11:00:00", status: "Submitted", user_name: "Juan Dela Cruz", user_role: "Requestor", action: "Submitted for approval" },
      { id: "wh013", timestamp: "2024-12-09T14:00:00", status: "Approved", user_name: "Maria Santos", user_role: "Manager", action: "Approved voucher" },
      { id: "wh014", timestamp: "2024-12-10T09:00:00", status: "Processing", user_name: "Angela Torres", user_role: "Treasury", action: "Started processing disbursement" },
      { id: "wh015", timestamp: "2024-12-10T15:00:00", status: "Disbursed", user_name: "Angela Torres", user_role: "Treasury", action: "Disbursed via Bank Transfer" }
    ],
    created_at: "2024-12-09T10:00:00",
    updated_at: "2024-12-10T15:00:00"
  }
];

interface EVouchersListProps {
  onCreateEVoucher?: () => void;
  onViewEVoucher?: (evoucher: EVoucher) => void;
  budgetRequestData?: {
    id: string;
    number: string;
    amount: number;
    purpose: string;
    customer_id?: string;
    customer_name?: string;
  };
}

export function EVouchersList({ budgetRequestData }: EVouchersListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EVoucherStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<EVoucherCategory | "all">("all");
  const [showCreateModal, setShowCreateModal] = useState(!!budgetRequestData);
  const [selectedEVoucher, setSelectedEVoucher] = useState<EVoucher | null>(null);

  const filteredEVouchers = mockEVouchers.filter(voucher => {
    const matchesSearch = 
      voucher.voucher_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voucher.requestor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voucher.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voucher.purpose.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || voucher.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || voucher.expense_category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: EVoucherStatus) => {
    switch (status) {
      case "Approved":
        return { bg: "#E8F5F3", color: "#0F766E" };
      case "Disbursed":
        return { bg: "#D1FAE5", color: "#059669" };
      case "Recorded":
      case "Audited":
        return { bg: "#DBEAFE", color: "#1D4ED8" };
      case "Disapproved":
      case "Cancelled":
        return { bg: "#FFE5E5", color: "#C94F3D" };
      case "Under Review":
      case "Processing":
        return { bg: "#FEF3E7", color: "#C88A2B" };
      case "Submitted":
        return { bg: "#F3F4F6", color: "#6B7A76" };
      default: // Draft
        return { bg: "#F9FAFB", color: "#9CA3AF" };
    }
  };

  const getCategoryColor = (category: EVoucherCategory) => {
    switch (category) {
      case "Brokerage":
        return { bg: "#EDE9FE", color: "#7C3AED" };
      case "Forwarding":
        return { bg: "#DBEAFE", color: "#2563EB" };
      case "Trucking":
        return { bg: "#FEF3C7", color: "#D97706" };
      default: // Miscellaneous
        return { bg: "#F3F4F6", color: "#6B7280" };
    }
  };

  return (
    <div 
      className="h-full flex flex-col"
      style={{
        background: "#FFFFFF",
      }}
    >
      {/* Header Section */}
      <div style={{ padding: "32px 48px", borderBottom: "1px solid var(--neuron-ui-border)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "32px", fontWeight: 600, color: "#12332B", marginBottom: "4px", letterSpacing: "-1.2px" }}>
              E-Vouchers
            </h1>
            <p style={{ fontSize: "14px", color: "#667085" }}>
              Manage expense vouchers and payment approvals
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              backgroundColor: "#0F766E",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#0D6560";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#0F766E";
            }}
          >
            <Plus size={18} />
            New E-Voucher
          </button>
        </div>

        {/* Search and Filters */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
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
              placeholder="Search vouchers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px 10px 40px",
                border: "1px solid var(--neuron-ui-border)",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                color: "var(--neuron-ink-primary)",
                backgroundColor: "#FFFFFF",
              }}
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as EVoucherCategory | "all")}
            style={{
              padding: "10px 16px",
              border: "1px solid var(--neuron-ui-border)",
              borderRadius: "8px",
              fontSize: "14px",
              outline: "none",
              color: "var(--neuron-ink-primary)",
              backgroundColor: "#FFFFFF",
              cursor: "pointer",
            }}
          >
            <option value="all">All Categories</option>
            <option value="Brokerage">Brokerage</option>
            <option value="Forwarding">Forwarding</option>
            <option value="Trucking">Trucking</option>
            <option value="Miscellaneous">Miscellaneous</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EVoucherStatus | "all")}
            style={{
              padding: "10px 16px",
              border: "1px solid var(--neuron-ui-border)",
              borderRadius: "8px",
              fontSize: "14px",
              outline: "none",
              color: "var(--neuron-ink-primary)",
              backgroundColor: "#FFFFFF",
              cursor: "pointer",
            }}
          >
            <option value="all">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Processing">Processing</option>
            <option value="Disbursed">Disbursed</option>
            <option value="Recorded">Recorded</option>
            <option value="Audited">Audited</option>
          </select>
        </div>
      </div>

      {/* E-Vouchers List */}
      <div className="flex-1 overflow-auto" style={{ padding: "24px 48px" }}>
        {filteredEVouchers.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} style={{ color: "#667085", margin: "0 auto 16px" }} />
            <p style={{ fontSize: "16px", color: "#667085", marginBottom: "8px" }}>
              No e-vouchers found
            </p>
            <p style={{ fontSize: "14px", color: "#98A2B3" }}>
              {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                ? "Try adjusting your filters" 
                : "Create your first e-voucher to get started"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredEVouchers.map((voucher) => {
              const statusStyle = getStatusColor(voucher.status);
              const categoryStyle = getCategoryColor(voucher.expense_category);
              
              return (
                <div
                  key={voucher.id}
                  onClick={() => setSelectedEVoucher(voucher)}
                  style={{
                    padding: "20px 24px",
                    border: "1px solid var(--neuron-ui-border)",
                    borderRadius: "12px",
                    backgroundColor: "#FFFFFF",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#0F766E";
                    e.currentTarget.style.backgroundColor = "#FAFAFA";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--neuron-ui-border)";
                    e.currentTarget.style.backgroundColor = "#FFFFFF";
                  }}
                >
                  {/* Header Row */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#12332B" }}>
                          {voucher.voucher_number}
                        </h3>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 500,
                            padding: "4px 10px",
                            borderRadius: "6px",
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.color,
                          }}
                        >
                          {voucher.status}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 500,
                            padding: "4px 10px",
                            borderRadius: "6px",
                            backgroundColor: categoryStyle.bg,
                            color: categoryStyle.color,
                          }}
                        >
                          {voucher.expense_category}
                        </span>
                      </div>
                      <p style={{ fontSize: "13px", color: "#667085", marginBottom: "4px" }}>
                        {voucher.purpose}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "20px", fontWeight: 600, color: "#12332B" }}>
                        ₱{voucher.amount.toLocaleString()}
                      </div>
                      <div style={{ fontSize: "12px", color: "#667085" }}>
                        {voucher.currency}
                      </div>
                    </div>
                  </div>

                  {/* Meta Information */}
                  <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <User size={14} style={{ color: "#667085" }} />
                      <span style={{ fontSize: "13px", color: "#667085" }}>
                        {voucher.requestor_name}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Calendar size={14} style={{ color: "#667085" }} />
                      <span style={{ fontSize: "13px", color: "#667085" }}>
                        {new Date(voucher.request_date).toLocaleDateString('en-PH', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <PhilippinePeso size={14} style={{ color: "#667085" }} />
                      <span style={{ fontSize: "13px", color: "#667085" }}>
                        {voucher.vendor_name}
                      </span>
                    </div>
                    {voucher.customer_name && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Building2 size={14} style={{ color: "#0F766E" }} />
                        <span style={{ fontSize: "13px", color: "#0F766E", fontWeight: 500 }}>
                          {voucher.customer_name}
                        </span>
                      </div>
                    )}
                    {voucher.project_number && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FileText size={14} style={{ color: "#667085" }} />
                        <span style={{ fontSize: "13px", color: "#667085" }}>
                          {voucher.project_number}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateEVoucherModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => {
            console.log("E-Voucher created:", data);
            // In real implementation, this would save to database
            // For now, we'll just close the modal
            setShowCreateModal(false);
          }}
          budgetRequestData={budgetRequestData}
        />
      )}
      {selectedEVoucher && (
        <EVoucherDetailView
          evoucher={selectedEVoucher}
          onClose={() => setSelectedEVoucher(null)}
        />
      )}
    </div>
  );
}