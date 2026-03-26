import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { supabase } from "../../utils/supabase/client";

type EntityType =
  | "inquiry" | "quotation" | "contract" | "booking"
  | "project" | "invoice" | "collection" | "expense"
  | "customer" | "contact" | "vendor" | "budget_request";

const ENTITY_TABS: { key: EntityType; label: string }[] = [
  { key: "inquiry", label: "Inquiry" },
  { key: "quotation", label: "Quotation" },
  { key: "contract", label: "Contract" },
  { key: "booking", label: "Booking" },
  { key: "project", label: "Project" },
  { key: "invoice", label: "Invoice" },
  { key: "collection", label: "Collection" },
  { key: "expense", label: "Expense" },
  { key: "customer", label: "Customer" },
  { key: "contact", label: "Contact" },
  { key: "vendor", label: "Vendor" },
  { key: "budget_request", label: "Budget Req." },
];

interface EntityResult {
  id: string;
  label: string;
  sub?: string;
}

async function searchEntities(type: EntityType, query: string): Promise<EntityResult[]> {
  const q = query.trim().toLowerCase();
  try {
    switch (type) {
      case "inquiry": {
        const { data } = await supabase.from("inquiries").select("id, inquiry_name, customer_name").ilike("inquiry_name", `%${q}%`).limit(20);
        return (data || []).map((r) => ({ id: r.id, label: r.inquiry_name || r.id, sub: r.customer_name }));
      }
      case "quotation": {
        const { data } = await supabase.from("quotations").select("id, quotation_name, customer_name").eq("quotation_type", "spot").ilike("quotation_name", `%${q}%`).limit(20);
        return (data || []).map((r) => ({ id: r.id, label: r.quotation_name || r.id, sub: r.customer_name }));
      }
      case "contract": {
        const { data } = await supabase.from("quotations").select("id, quotation_name, customer_name").eq("quotation_type", "contract").ilike("quotation_name", `%${q}%`).limit(20);
        return (data || []).map((r) => ({ id: r.id, label: r.quotation_name || r.id, sub: r.customer_name }));
      }
      case "booking": {
        const { data } = await supabase.from("bookings").select("id, tracking_number, customer_name").ilike("tracking_number", `%${q}%`).limit(20);
        return (data || []).map((r) => ({ id: r.id, label: r.tracking_number || r.id, sub: r.customer_name }));
      }
      case "project": {
        const { data } = await supabase.from("projects").select("id, project_number, customer_name").ilike("project_number", `%${q}%`).limit(20);
        return (data || []).map((r) => ({ id: r.id, label: r.project_number || r.id, sub: r.customer_name }));
      }
      case "invoice": {
        const { data } = await supabase.from("billings").select("id, invoice_number, customer_name").not("invoice_number", "is", null).ilike("invoice_number", `%${q}%`).limit(20);
        return (data || []).map((r) => ({ id: r.id, label: r.invoice_number || r.id, sub: r.customer_name }));
      }
      case "collection": {
        const { data } = await supabase.from("collections").select("id, reference_number, customer_name").ilike("reference_number", `%${q}%`).limit(20);
        return (data || []).map((r) => ({ id: r.id, label: r.reference_number || r.id, sub: r.customer_name }));
      }
      case "expense": {
        const { data } = await supabase.from("expenses").select("id, description, amount").ilike("description", `%${q}%`).limit(20);
        return (data || []).map((r) => ({ id: r.id, label: r.description || r.id, sub: r.amount ? `PHP ${r.amount}` : undefined }));
      }
      case "customer": {
        const { data } = await supabase.from("customers").select("id, name, industry").ilike("name", `%${q}%`).limit(20);
        return (data || []).map((r) => ({ id: r.id, label: r.name, sub: r.industry }));
      }
      case "contact": {
        const { data } = await supabase.from("contacts").select("id, name, company_name").ilike("name", `%${q}%`).limit(20);
        return (data || []).map((r) => ({ id: r.id, label: r.name, sub: r.company_name }));
      }
      case "vendor": {
        const { data } = await supabase.from("vendors").select("id, name, service_type").ilike("name", `%${q}%`).limit(20);
        return (data || []).map((r) => ({ id: r.id, label: r.name, sub: r.service_type }));
      }
      case "budget_request": {
        const { data } = await supabase.from("budget_requests").select("id, title, amount").ilike("title", `%${q}%`).limit(20);
        return (data || []).map((r) => ({ id: r.id, label: r.title || r.id, sub: r.amount ? `PHP ${r.amount}` : undefined }));
      }
      default:
        return [];
    }
  } catch {
    return [];
  }
}

interface EntityPickerProps {
  onSelect: (entity: { entity_type: string; entity_id: string; entity_label: string }) => void;
  onClose: () => void;
}

export function EntityPicker({ onSelect, onClose }: EntityPickerProps) {
  const [activeType, setActiveType] = useState<EntityType>("inquiry");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EntityResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(searchRef.current);
    setIsLoading(true);
    searchRef.current = setTimeout(async () => {
      const res = await searchEntities(activeType, query);
      setResults(res);
      setIsLoading(false);
    }, 250);
    return () => clearTimeout(searchRef.current);
  }, [activeType, query]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(18,51,43,0.15)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        className="flex flex-col"
        style={{
          width: 560,
          maxHeight: "70vh",
          backgroundColor: "#FFFFFF",
          border: "1px solid #E5E9F0",
          borderRadius: 12,
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{ padding: "16px 20px", borderBottom: "1px solid #E5E9F0" }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#12332B" }}>
            Link System Record
          </h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#667085", display: "flex" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Entity type tabs — scrollable row */}
        <div
          style={{
            display: "flex",
            overflowX: "auto",
            borderBottom: "1px solid #E5E9F0",
            padding: "0 4px",
            gap: 0,
            scrollbarWidth: "none",
          }}
        >
          {ENTITY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveType(tab.key); setQuery(""); }}
              style={{
                padding: "8px 12px",
                fontSize: 12,
                fontWeight: activeType === tab.key ? 600 : 400,
                color: activeType === tab.key ? "#0F766E" : "#667085",
                background: "none",
                border: "none",
                borderBottom: activeType === tab.key ? "2px solid #0F766E" : "2px solid transparent",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "color 150ms ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #E5E9F0" }}>
          <div className="flex items-center gap-2" style={{ border: "1px solid #E5E9F0", borderRadius: 8, padding: "8px 12px" }}>
            <Search size={14} style={{ color: "#9CA3AF", flexShrink: 0 }} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${ENTITY_TABS.find((t) => t.key === activeType)?.label}…`}
              style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "#12332B", backgroundColor: "transparent" }}
            />
          </div>
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {isLoading ? (
            <div style={{ padding: 24, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
              Searching…
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
              No {ENTITY_TABS.find((t) => t.key === activeType)?.label.toLowerCase()} records found
            </div>
          ) : (
            results.map((r) => (
              <button
                key={r.id}
                onClick={() =>
                  onSelect({ entity_type: activeType, entity_id: r.id, entity_label: r.label })
                }
                className="w-full text-left transition-colors duration-150 focus:outline-none"
                style={{
                  padding: "10px 16px",
                  background: "none",
                  border: "none",
                  borderBottom: "1px solid #F3F4F6",
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F9FAFB")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <p style={{ fontSize: 13, fontWeight: 500, color: "#12332B" }}>{r.label}</p>
                {r.sub && <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{r.sub}</p>}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
