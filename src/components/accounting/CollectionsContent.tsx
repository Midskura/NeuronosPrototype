import { useState } from "react";
import { Plus, DollarSign, Search, Filter, Calendar } from "lucide-react";
import { AddRequestForPaymentPanel } from "./AddRequestForPaymentPanel";

export function CollectionsContent() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);

  // Get current user from localStorage
  const userData = localStorage.getItem("neuron_user");
  const currentUser = userData ? JSON.parse(userData) : null;
  
  // Check if user has collection access (Accounting Staff OR Executive)
  const hasCollectionAccess = 
    currentUser?.department === "Accounting" || 
    currentUser?.department === "Executive";

  const handleCollectionCreated = () => {
    setShowCreateModal(false);
    // Refresh collections list
    // TODO: Implement fetch collections from E-Vouchers API
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#FFFFFF"
      }}
    >
      {/* Header */}
      <div style={{ padding: "32px 48px", borderBottom: "1px solid var(--neuron-ui-border)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px"
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: 600,
                color: "#12332B",
                marginBottom: "4px",
                letterSpacing: "-1.2px"
              }}
            >
              Collections
            </h1>
            <p style={{ fontSize: "14px", color: "#667085" }}>
              Track customer payments and receipt transactions
            </p>
          </div>

          {/* Action Buttons */}
          {hasCollectionAccess && (
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
                fontWeight: 500
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#0D6560";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#0F766E";
              }}
            >
              <Plus size={18} />
              Record Collection
            </button>
          )}
        </div>

        {/* Info Card */}
        <div style={{
          padding: "20px 24px",
          backgroundColor: "#E8F5F3",
          border: "1px solid #99F6E4",
          borderRadius: "12px",
          marginBottom: "24px"
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "#0F766E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontSize: "20px",
              flexShrink: 0
            }}>
              📋
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#12332B", marginBottom: "6px" }}>
                E-Voucher Integration Active
              </h3>
              <p style={{ fontSize: "13px", color: "#667085", lineHeight: "1.5" }}>
                All collection transactions create E-Vouchers with 
                <code style={{ 
                  padding: "2px 6px", 
                  backgroundColor: "#FFFFFF", 
                  borderRadius: "4px",
                  fontSize: "12px",
                  margin: "0 4px",
                  fontFamily: "monospace"
                }}>transaction_type: "collection"</code> 
                and flow through the universal approval workflow before posting to the ledger.
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#667085",
              }}
            />
            <input
              type="text"
              placeholder="Search collections by customer, amount, or reference..."
              style={{
                width: "100%",
                padding: "10px 12px 10px 42px",
                border: "1px solid var(--neuron-ui-border)",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              border: "1px solid var(--neuron-ui-border)",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
              color: "#374151"
            }}
          >
            <Filter size={16} />
            Filters
          </button>
        </div>
      </div>

      {/* Collections List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 48px" }}>
        {/* Empty State */}
        <div style={{ 
          padding: "80px 20px", 
          textAlign: "center",
          border: "2px dashed var(--neuron-ui-border)",
          borderRadius: "16px",
          backgroundColor: "#FAFAFA",
          maxWidth: "600px",
          margin: "0 auto"
        }}>
          <div style={{ 
            width: "80px", 
            height: "80px", 
            borderRadius: "50%", 
            backgroundColor: "#E8F5F3", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: "40px"
          }}>
            💰
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: 600, color: "#12332B", marginBottom: "12px" }}>
            No collections recorded yet
          </h3>
          <p style={{ fontSize: "14px", color: "#667085", marginBottom: "24px", lineHeight: "1.6" }}>
            Start recording customer payments and receipts. Each collection will create an E-Voucher 
            that flows through the accounting approval workflow before posting to the ledger.
          </p>
          {hasCollectionAccess && (
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                backgroundColor: "#0F766E",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 500
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#0D6560";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#0F766E";
              }}
            >
              <Plus size={18} />
              Record First Collection
            </button>
          )}
        </div>
      </div>

      {/* Create Collection Modal */}
      {showCreateModal && (
        <AddRequestForPaymentPanel
          context="collection"
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCollectionCreated}
          defaultRequestor={currentUser?.name || "Current User"}
        />
      )}
    </div>
  );
}