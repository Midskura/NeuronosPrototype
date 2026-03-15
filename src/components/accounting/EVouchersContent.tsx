import { useState, useEffect } from "react";
import { Plus, Clock, FileText, Building2, Users } from "lucide-react";
import { CreateEVoucherForm } from "./evouchers/CreateEVoucherForm";
import { BudgetRequestDetailPanel } from "../bd/BudgetRequestDetailPanel";
import { UnifiedEVouchersTable } from "./evouchers/UnifiedEVouchersTable";
import { useEVouchers } from "../../hooks/useEVouchers";
import { NeuronRefreshButton } from "../shared/NeuronRefreshButton";

type EVoucherView = "pending" | "my-evouchers" | "all";

export function EVouchersContent() {
  const [activeView, setActiveView] = useState<EVoucherView>("my-evouchers");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvoucher, setSelectedEvoucher] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Get current user from localStorage
  const userData = localStorage.getItem("neuron_user");
  const currentUser = userData ? JSON.parse(userData) : null;
  
  // Check if user has approval access (Accounting Staff OR Executive OR Finance Manager)
  const hasApprovalAccess = 
    currentUser?.department === "Accounting" || 
    currentUser?.department === "Executive" ||
    currentUser?.role === "Finance Manager";

  // Auto-select "Pending Approvals" if user has approval access
  useEffect(() => {
    if (hasApprovalAccess && activeView === "my-evouchers") {
      setActiveView("pending");
    }
  }, [hasApprovalAccess]);

  // Use Hook for Data
  const { evouchers, isLoading, refresh } = useEVouchers(activeView, currentUser?.id);

  // Listen for manual refresh triggers
  useEffect(() => {
    if (refreshTrigger > 0) {
      refresh();
    }
  }, [refreshTrigger, refresh]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header Container */}
      <div className="px-12 pt-8 pb-0">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-[32px] font-semibold text-[#12332B] mb-1 tracking-tight">
              E-Vouchers
            </h1>
            <p className="text-[14px] text-[#667085]">
              {hasApprovalAccess
                ? "Universal transaction approval system for all financial activities"
                : "Create and track your expense vouchers"}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Refresh Button */}
             <NeuronRefreshButton 
               onRefresh={async () => { refresh(); }}
               label="Refresh e-vouchers"
             />
             <button
               onClick={() => setShowCreateModal(true)}
               className="flex items-center gap-2 px-4 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0D6559] transition-colors font-medium text-[14px]"
             >
               <Plus size={16} />
               New E-Voucher
             </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-8 border-b border-[#E5E9F0]">
          {hasApprovalAccess && (
            <button
              onClick={() => setActiveView("pending")}
              className={`flex items-center gap-2 py-4 relative group ${activeView === "pending" ? "text-[#0F766E]" : "text-[#6B7280]"}`}
            >
              <Clock size={18} strokeWidth={activeView === "pending" ? 2.5 : 2} />
              <span className={`text-[14px] ${activeView === "pending" ? "font-semibold" : "font-medium"}`}>
                Pending Approvals
              </span>
              {activeView === "pending" && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0F766E] rounded-t-[2px]" />
              )}
            </button>
          )}
          
          <button
            onClick={() => setActiveView("my-evouchers")}
            className={`flex items-center gap-2 py-4 relative group ${activeView === "my-evouchers" ? "text-[#0F766E]" : "text-[#6B7280]"}`}
          >
            <FileText size={18} strokeWidth={activeView === "my-evouchers" ? 2.5 : 2} />
            <span className={`text-[14px] ${activeView === "my-evouchers" ? "font-semibold" : "font-medium"}`}>
              My E-Vouchers
            </span>
            {activeView === "my-evouchers" && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0F766E] rounded-t-[2px]" />
            )}
          </button>

          {hasApprovalAccess && (
            <button
              onClick={() => setActiveView("all")}
              className={`flex items-center gap-2 py-4 relative group ${activeView === "all" ? "text-[#0F766E]" : "text-[#6B7280]"}`}
            >
              <Building2 size={18} strokeWidth={activeView === "all" ? 2.5 : 2} />
              <span className={`text-[14px] ${activeView === "all" ? "font-semibold" : "font-medium"}`}>
                All E-Vouchers
              </span>
              {activeView === "all" && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0F766E] rounded-t-[2px]" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-12 overflow-auto bg-white">
        {!currentUser ? (
          <div className="py-12 text-center text-[#6B7280]">
            <Users size={48} className="mx-auto mb-4 text-[#D1D5DB]" />
            <h3 className="text-[16px] font-semibold text-[#374151] mb-2">Please Log In</h3>
            <p className="text-[14px]">You need to be logged in to view E-Vouchers</p>
          </div>
        ) : (
          <UnifiedEVouchersTable 
             evouchers={evouchers}
             view={activeView}
             onViewDetail={setSelectedEvoucher}
             onRefresh={refresh}
             isLoading={isLoading}
          />
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateEVoucherForm
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          context={hasApprovalAccess ? "accounting" : "bd"}
          defaultRequestor={currentUser?.name}
          onSuccess={() => {
            setShowCreateModal(false);
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}

      {selectedEvoucher && (
        <BudgetRequestDetailPanel
          request={selectedEvoucher}
          isOpen={!!selectedEvoucher}
          onClose={() => setSelectedEvoucher(null)}
          currentUser={currentUser}
          onStatusChange={() => {
            setSelectedEvoucher(null);
            setRefreshTrigger(prev => prev + 1);
          }}
          showAccountingControls={hasApprovalAccess}
        />
      )}
    </div>
  );
}