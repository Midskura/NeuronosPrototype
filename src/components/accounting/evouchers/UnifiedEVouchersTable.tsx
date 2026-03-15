import { useState, useMemo } from "react";
import { Search, Filter, Calendar, FileText, Building2, Users, Wallet, DollarSign, Receipt, TrendingUp, Banknote } from "lucide-react";
import { DataTable, ColumnDef } from "../../common/DataTable";
import { CustomDatePicker } from "../../common/CustomDatePicker";
import { CustomDropdown } from "../../bd/CustomDropdown";
import { EVoucherStatusBadge } from "./EVoucherStatusBadge";
import { LiquidationPanel } from "./LiquidationPanel";
import { PhilippinePeso } from "../../icons/PhilippinePeso";
import type { EVoucher, EVoucherStatus, EVoucherTransactionType } from "../../../types/evoucher";

interface UnifiedEVouchersTableProps {
  evouchers: EVoucher[];
  view: "pending" | "my-evouchers" | "all";
  onViewDetail: (evoucher: EVoucher) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function UnifiedEVouchersTable({ 
  evouchers, 
  view, 
  onViewDetail,
  onRefresh,
  isLoading 
}: UnifiedEVouchersTableProps) {
  // -- State --
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [liquidationVoucher, setLiquidationVoucher] = useState<EVoucher | null>(null);

  // -- Helpers --
  const formatCurrency = (amount: number, currency: string = "PHP") => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const getTransactionTypeLabel = (type: EVoucherTransactionType | undefined) => {
    if (!type) return "Expense";
    const labels: Record<EVoucherTransactionType, string> = {
      expense: "Expense",
      budget_request: "Budget Request",
      cash_advance: "Cash Advance",
      collection: "Collection",
      billing: "Billing",
      adjustment: "Adjustment",
      reimbursement: "Reimbursement"
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type: EVoucherTransactionType | undefined) => {
    const iconProps = { size: 14, className: "text-gray-400" };
    switch (type) {
      case "expense": return <Wallet {...iconProps} />;
      case "budget_request": return <DollarSign {...iconProps} />;
      case "cash_advance": return <Banknote {...iconProps} />;
      case "collection": return <TrendingUp {...iconProps} />;
      case "billing": return <Receipt {...iconProps} />;
      case "reimbursement": return <Users {...iconProps} />;
      default: return <FileText {...iconProps} />;
    }
  };

  // -- Filtering Logic --
  const filteredEvouchers = useMemo(() => {
    return evouchers.filter(item => {
      // 1. Search Query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchVoucher = item.voucher_number?.toLowerCase().includes(query);
        const matchRequestor = item.requestor_name?.toLowerCase().includes(query);
        const matchVendor = item.vendor_name?.toLowerCase().includes(query);
        const matchPurpose = item.purpose?.toLowerCase().includes(query);
        if (!matchVoucher && !matchRequestor && !matchVendor && !matchPurpose) return false;
      }

      // 2. Status Filter (Only for My/All views, Pending is already filtered by API)
      if (view !== "pending" && statusFilter && statusFilter !== "all") {
        if (item.status !== statusFilter) return false;
      }

      // 3. Department Filter (Only for Pending/All views)
      if (view !== "my-evouchers" && departmentFilter && departmentFilter !== "all") {
        if (item.requestor_department !== departmentFilter) return false;
      }

      // 4. Date Range (Request Date)
      if (dateFrom) {
        const itemDate = new Date(item.request_date);
        const fromDate = new Date(dateFrom);
        if (itemDate < fromDate) return false;
      }
      if (dateTo) {
        const itemDate = new Date(item.request_date);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (itemDate > toDate) return false;
      }

      return true;
    });
  }, [evouchers, searchQuery, statusFilter, departmentFilter, dateFrom, dateTo, view]);

  // -- Totals --
  const totalAmount = useMemo(() => {
    return filteredEvouchers.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [filteredEvouchers]);

  const getUrgencyColor = (dateString: string) => {
    const submitted = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - submitted.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 3) return "text-red-600";
    if (diffDays >= 2) return "text-amber-600";
    return "text-[#0A1D4D]";
  };

  // -- Columns --
  const columns: ColumnDef<EVoucher>[] = [
    {
      header: "Date",
      width: "120px",
      cell: (item) => {
        const isPending = item.status === 'pending';
        const colorClass = isPending ? getUrgencyColor(item.request_date) : "text-[#0A1D4D]";
        
        return (
            <span className={`text-[12px] font-medium ${colorClass}`}>
            {formatDate(item.request_date)}
            </span>
        )
      }
    },
    {
      header: "Voucher #",
      width: "140px",
      cell: (item) => (
        <div className="flex items-center gap-2">
            {getTypeIcon(item.transaction_type)}
            <span className="text-[12px] font-mono text-[#0F766E] font-medium group-hover:underline decoration-[#0F766E] underline-offset-2">
            {item.voucher_number}
            </span>
        </div>
      )
    },
    {
      header: "Type",
      width: "100px",
      cell: (item) => (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.002em] bg-[#F3F4F6] text-[#374151]">
            {getTransactionTypeLabel(item.transaction_type)}
        </span>
      )
    },
    {
      header: "Requestor",
      cell: (item) => (
        <div>
            <div className="text-[12px] font-medium text-[#101828]">{item.requestor_name}</div>
            {item.requestor_department && (
                <div className="text-[10px] text-[#667085]">{item.requestor_department}</div>
            )}
        </div>
      )
    },
    {
      header: "Vendor / Payee",
      cell: (item) => (
        <span className="text-[12px] text-[#344054] font-medium truncate block max-w-[180px]">
          {item.vendor_name || "—"}
        </span>
      )
    },
    {
      header: "Linked To",
      cell: (item) => (
        <span className="text-[12px] text-[#0F766E] font-medium truncate block max-w-[150px]">
          {item.project_number || item.customer_name || "—"}
        </span>
      )
    },
    {
      header: "Amount",
      width: "120px",
      align: "right",
      cell: (item) => (
        <span className="text-[12px] font-bold text-[#12332B]">
          {formatCurrency(item.amount, item.currency)}
        </span>
      )
    },
    {
      header: "Status",
      width: "120px",
      align: "right",
      cell: (item) => (
        <div className="flex flex-col items-end gap-2">
            <EVoucherStatusBadge status={item.status} size="sm" />
            
            {/* Liquidation Action for Posted Budget Requests & Cash Advances */}
            {view === "my-evouchers" && item.status === "posted" && (item.transaction_type === "budget_request" || item.transaction_type === "cash_advance") && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setLiquidationVoucher(item);
                    }}
                    className="text-[10px] font-semibold text-[#0F766E] hover:text-[#0D6560] bg-[#E8F5F3] hover:bg-[#D0EBE7] px-2 py-1 rounded transition-colors flex items-center gap-1"
                >
                    <FileText size={10} />
                    Liquidate
                </button>
            )}
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col bg-white">
      {/* Control Bar */}
      <div className="flex items-center gap-2 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
          <input
            type="text"
            placeholder="Search voucher #, requestor, vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E] text-[13px] border border-[#E5E9F0] bg-white text-[#101828] placeholder-[#98A2B3]"
          />
        </div>

        {/* Date Range */}
        <div style={{ minWidth: "140px" }}>
           <CustomDatePicker value={dateFrom} onChange={setDateFrom} placeholder="Start Date" minWidth="100%" className="w-full px-4 py-2.5" />
        </div>
        <span className="text-[13px] text-[#6B7280] font-medium">to</span>
        <div style={{ minWidth: "140px" }}>
           <CustomDatePicker value={dateTo} onChange={setDateTo} placeholder="End Date" minWidth="100%" className="w-full px-4 py-2.5" />
        </div>
        
        {/* Status Filter (Hide on Pending view) */}
        {view !== "pending" && (
            <div style={{ minWidth: "140px" }}>
            <CustomDropdown
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                { value: "all", label: "All Status" },
                { value: "draft", label: "Draft" },
                { value: "pending", label: "Pending" },
                { value: "posted", label: "Posted" },
                { value: "rejected", label: "Rejected" },
                { value: "cancelled", label: "Cancelled" }
                ]}
                placeholder="Status"
            />
            </div>
        )}

        {/* Department Filter (Hide on My view) */}
        {view !== "my-evouchers" && (
            <div style={{ minWidth: "160px" }}>
            <CustomDropdown
                value={departmentFilter}
                onChange={setDepartmentFilter}
                options={[
                { value: "all", label: "All Departments" },
                { value: "BD", label: "Business Development" },
                { value: "Operations", label: "Operations" },
                { value: "Accounting", label: "Accounting" },
                { value: "HR", label: "HR" },
                { value: "IT", label: "IT" },
                { value: "Admin", label: "Admin" },
                { value: "Executive", label: "Executive" }
                ]}
                placeholder="Department"
            />
            </div>
        )}
      </div>

      {/* Table */}
      <DataTable
        data={filteredEvouchers}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No E-Vouchers found matching your filters."
        onRowClick={onViewDetail}
        rowClassName={() => "group cursor-pointer hover:bg-gray-50 align-top"}
        icon={FileText}
        footerSummary={[
          { 
             label: "Total Count", 
             value: <span className="text-[#374151]">{filteredEvouchers.length}</span> 
          },
          { 
             label: "Total Amount", 
             value: <span className="text-[#12332B] font-bold">{formatCurrency(totalAmount)}</span>
          }
        ]}
      />

      {/* Liquidation Panel */}
      {liquidationVoucher && (
        <LiquidationPanel
          isOpen={!!liquidationVoucher}
          onClose={() => setLiquidationVoucher(null)}
          originalVoucher={liquidationVoucher}
          onSuccess={() => {
            if (onRefresh) onRefresh();
            setLiquidationVoucher(null);
          }}
        />
      )}
    </div>
  );
}
