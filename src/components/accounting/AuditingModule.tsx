// AuditingModule — Shell with 3 tabs: Charge & Expense Matrix, Summary, Item Catalog
// Styled 1:1 with ContractsList.tsx layout and tokens

import { useState } from "react";
import { Grid3X3, BarChart3, Database } from "lucide-react";
import { CatalogManagementPage } from "./CatalogManagementPage";
import { ChargeExpenseMatrix } from "./ChargeExpenseMatrix";
import { AuditingSummary } from "./AuditingSummary";

type AuditingTab = "matrix" | "summary" | "catalog";

export function AuditingModule() {
  const [activeTab, setActiveTab] = useState<AuditingTab>("matrix");

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "white" }}>
      <div style={{ padding: "32px 48px", display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        {/* Header — matches ContractsList h1 + subtitle */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{
            fontSize: "32px",
            fontWeight: 600,
            color: "#12332B",
            marginBottom: "4px",
            letterSpacing: "-1.2px",
          }}>
            Auditing
          </h1>
          <p style={{
            fontSize: "14px",
            color: "#667085",
          }}>
            Cross-booking financial analysis and catalog item management
          </p>
        </div>

        {/* Tabs — matches ContractsList tab bar */}
        <div style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid #E5E7EB",
          marginBottom: "24px",
          flexShrink: 0,
        }}>
          <TabButton
            active={activeTab === "matrix"}
            onClick={() => setActiveTab("matrix")}
            icon={<Grid3X3 size={18} />}
            label="Charge & Expense Matrix"
            color="#0F766E"
          />
          <TabButton
            active={activeTab === "summary"}
            onClick={() => setActiveTab("summary")}
            icon={<BarChart3 size={18} />}
            label="Summary"
            color="#0F766E"
          />
          <TabButton
            active={activeTab === "catalog"}
            onClick={() => setActiveTab("catalog")}
            icon={<Database size={18} />}
            label="Item Catalog"
            color="#0F766E"
          />
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {activeTab === "matrix" && <ChargeExpenseMatrix />}
          {activeTab === "summary" && <AuditingSummary />}
          {activeTab === "catalog" && <CatalogManagementPage />}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, color }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "12px 20px",
        background: "transparent",
        border: "none",
        borderBottom: active ? `2px solid ${color}` : "2px solid transparent",
        color: active ? color : "#667085",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s ease",
        marginBottom: "-1px",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
