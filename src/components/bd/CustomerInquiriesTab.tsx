import { useState } from "react";
import { QuotationNew } from "../../types/pricing";
import { Package, Search, FileText, Plus, CheckCircle2, Calendar, Clock } from "lucide-react";
import { CustomDropdown } from "./CustomDropdown";

interface CustomerInquiriesTabProps {
  inquiries: QuotationNew[];
  onViewInquiry?: (inquiryId: string) => void;
  onCreateInquiry?: () => void;
  isLoading?: boolean;
}

export function CustomerInquiriesTab({ inquiries, onViewInquiry, onCreateInquiry, isLoading }: CustomerInquiriesTabProps) {
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
    const statusStyles: Record<string, { bg: string; text: string }> = {
      'Draft': { bg: '#F3F4F6', text: '#6B7280' },
      'Pending Pricing': { bg: '#FEF3C7', text: '#92400E' },
      'Quoted': { bg: '#DBEAFE', text: '#1E40AF' },
      'Sent': { bg: '#E0E7FF', text: '#4338CA' },
      'pending': { bg: '#FEF3C7', text: '#92400E' },
      'draft': { bg: '#F3F4F6', text: '#6B7280' }
    };
    return statusStyles[status] || { bg: '#F3F4F6', text: '#6B7280' };
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-[14px]" style={{ color: "#667085" }}>Loading inquiries...</p>
      </div>
    );
  }

  // Filter inquiries
  const filteredInquiries = inquiries.filter(inquiry => {
    // Search filter
    const matchesSearch = searchQuery === "" || 
      (inquiry.quote_number && inquiry.quote_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inquiry.quotation_name && inquiry.quotation_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inquiry.pol_aol && inquiry.pol_aol.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inquiry.pod_aod && inquiry.pod_aod.toLowerCase().includes(searchQuery.toLowerCase()));

    // Status filter
    const matchesStatus = statusFilter === "all" || inquiry.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--neuron-ink-muted)" }} />
            <input 
              type="text"
              placeholder="Search inquiries..."
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
              { value: "Draft", label: "Draft", icon: <FileText className="w-3.5 h-3.5" style={{ color: "#6B7280" }} /> },
              { value: "Pending Pricing", label: "Pending Pricing", icon: <Clock className="w-3.5 h-3.5" style={{ color: "#92400E" }} /> },
              { value: "Quoted", label: "Quoted", icon: <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#1E40AF" }} /> },
              { value: "Sent", label: "Sent", icon: <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#4338CA" }} /> }
            ]}
          />
        </div>

        {/* Create Button */}
        {onCreateInquiry && (
          <button
            onClick={onCreateInquiry}
            className="flex items-center gap-2 transition-colors"
            style={{
              height: "40px", // Slightly smaller than TasksList (48px) to fit nicely in the tab content area
              padding: "0 16px",
              borderRadius: "12px",
              background: "#0F766E",
              border: "none",
              color: "#FFFFFF",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#0D6560";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#0F766E";
            }}
          >
            <Plus size={16} />
            New Inquiry
          </button>
        )}
      </div>

      {filteredInquiries.length === 0 ? (
        <div className="text-center py-12 rounded-lg border" style={{ borderColor: "var(--neuron-ui-border)", backgroundColor: "#FFFFFF" }}>
          {inquiries.length === 0 ? (
            <>
              <FileText size={48} style={{ color: "#D1D5DB", margin: "0 auto 16px" }} />
              <p className="text-[14px]" style={{ color: "#667085" }}>No Inquiries Yet</p>
              {onCreateInquiry && (
                <button
                  onClick={onCreateInquiry}
                  className="mt-4 px-4 py-2 rounded-lg text-[13px] font-medium text-[#0F766E] hover:bg-[#F0FDF9] transition-colors"
                >
                  Create first inquiry
                </button>
              )}
            </>
          ) : (
            <>
              <p className="text-[14px] font-medium" style={{ color: "#12332B" }}>No matching inquiries found</p>
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
              Inquiry #
            </div>
            <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "#6B7A76" }}>
              Services
            </div>
            <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "#6B7A76" }}>
              Movement
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
            {filteredInquiries.map(inquiry => {
              const statusStyle = getStatusStyle(inquiry.status);

              return (
                <div
                  key={inquiry.id}
                  className="grid grid-cols-[2fr_1.5fr_1fr_1.5fr_0.8fr_0.8fr] gap-4 px-4 py-4 cursor-pointer transition-colors"
                  style={{ borderBottom: "1px solid var(--neuron-ui-divider)" }}
                  onClick={() => onViewInquiry && onViewInquiry(inquiry.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#F9FAFB";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#FFFFFF";
                  }}
                >
                  {/* Inquiry Number */}
                  <div>
                    <div className="text-[13px] font-medium mb-0.5" style={{ color: "#12332B" }}>
                      {inquiry.quotation_name || inquiry.quote_number}
                    </div>
                    <div className="text-[12px]" style={{ color: "#667085" }}>
                      {inquiry.quote_number}
                    </div>
                  </div>

                  {/* Services */}
                  <div className="text-[12px]" style={{ color: "#344054" }}>
                    {inquiry.services.join(", ")}
                  </div>

                  {/* Movement */}
                  <div className="text-[12px]" style={{ color: "#344054" }}>
                    {inquiry.movement}
                  </div>

                  {/* Route */}
                  <div className="text-[12px]" style={{ color: "#344054" }}>
                    {inquiry.pol_aol} → {inquiry.pod_aod}
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
                      {inquiry.status}
                    </span>
                  </div>

                  {/* Created Date */}
                  <div className="text-[12px]" style={{ color: "#667085" }}>
                    {formatDate(inquiry.created_at)}
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
