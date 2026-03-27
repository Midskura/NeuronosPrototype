import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router";
import { useUser } from "../../hooks/useUser";
import { TICKET_ENTITY_TONES } from "./ticketingTheme";

export interface EntityContextCardProps {
  entity_type: string;
  entity_id: string;
  entity_label: string;
}

const ENTITY_CONFIG: Record<string, { label: string }> = {
  quotation: { label: "Quotation" },
  contract: { label: "Contract" },
  booking: { label: "Booking" },
  project: { label: "Project" },
  invoice: { label: "Invoice" },
  collection: { label: "Collection" },
  expense: { label: "Expense" },
  customer: { label: "Customer" },
  contact: { label: "Contact" },
  budget_request: { label: "Budget Request" },
};

/**
 * Routes per entity type per viewer department.
 * Falls back to null (no navigation) if viewer has no access to the route.
 */
const ENTITY_ROUTES: Record<string, Record<string, (id: string) => string>> = {
  quotation: {
    "Business Development": (id) => `/bd/inquiries/${id}`,
    "Pricing":              (id) => `/pricing/quotations/${id}`,
    "Executive":            (id) => `/pricing/quotations/${id}`,
  },
  contract: {
    "Business Development": (id) => `/bd/contracts/${id}`,
    "Pricing":              (id) => `/pricing/contracts/${id}`,
    "Executive":            (id) => `/pricing/contracts/${id}`,
  },
  booking: {
    "Operations": (id) => `/operations/${id}`,
    "Accounting": (id) => `/accounting/bookings/${id}`,
    "Executive":  (id) => `/operations/${id}`,
  },
  project: {
    "Business Development": (id) => `/bd/projects/${id}`,
    "Pricing":              (id) => `/pricing/projects/${id}`,
    "Operations":           (id) => `/operations/${id}`,
    "Accounting":           (id) => `/accounting/projects/${id}`,
    "Executive":            (id) => `/bd/projects/${id}`,
  },
  invoice: {
    "Accounting": (id) => `/accounting/invoices/${id}`,
    "Executive":  (id) => `/accounting/invoices/${id}`,
  },
  collection: {
    "Accounting": (id) => `/accounting/collections/${id}`,
    "Executive":  (id) => `/accounting/collections/${id}`,
  },
  expense: {
    "Accounting": (id) => `/accounting/expenses/${id}`,
    "Executive":  (id) => `/accounting/expenses/${id}`,
  },
  customer: {
    "Business Development": (id) => `/bd/customers/${id}`,
    "Pricing":              (id) => `/pricing/customers/${id}`,
    "Accounting":           (id) => `/accounting/customers/${id}`,
    "Executive":            (id) => `/bd/customers/${id}`,
  },
  contact: {
    "Business Development": (id) => `/bd/contacts/${id}`,
    "Pricing":              (id) => `/pricing/contacts/${id}`,
    "Executive":            (id) => `/bd/contacts/${id}`,
  },
  budget_request: {
    "Business Development": (id) => `/bd/budget-requests/${id}`,
    "Executive":            (id) => `/bd/budget-requests/${id}`,
  },
};

export function EntityContextCard({ entity_type, entity_id, entity_label }: EntityContextCardProps) {
  const navigate = useNavigate();
  const { effectiveDepartment } = useUser();

  const config = ENTITY_CONFIG[entity_type];
  const tone = TICKET_ENTITY_TONES[entity_type] ?? { bg: "#F7FAF8", text: "#5F6E69", border: "#E2E8E5" };
  const label = config?.label ?? entity_type;

  // Pick route based on who is viewing — null means no access
  const routeFn = ENTITY_ROUTES[entity_type]?.[effectiveDepartment ?? ""];
  const route = routeFn ? routeFn(entity_id) : null;

  return (
    <button
      onClick={() => route && navigate(route)}
      title={route ? `View ${label}` : `${label} — view in your module`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "5px 10px",
        borderRadius: 6,
        border: `1px solid ${tone.border}`,
        backgroundColor: tone.bg,
        cursor: route ? "pointer" : "default",
        transition: "background-color 120ms ease, border-color 120ms ease",
        textAlign: "left",
        outline: "none",
      }}
      onMouseEnter={(e) => {
        if (!route) return;
        e.currentTarget.style.backgroundColor = "var(--theme-bg-surface)";
        e.currentTarget.style.borderColor = "var(--neuron-ui-active-border)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = tone.bg;
        e.currentTarget.style.borderColor = tone.border;
      }}
    >
      <span style={{ fontSize: 10, fontWeight: 700, color: tone.text, letterSpacing: "0.2px", flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--theme-text-primary)" }}>
        {entity_label || entity_id}
      </span>
      {route && (
        <ExternalLink size={10} style={{ color: "var(--theme-text-muted)", flexShrink: 0, marginLeft: 2 }} />
      )}
    </button>
  );
}
