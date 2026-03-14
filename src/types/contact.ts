export interface Contact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  title?: string | null;       // Job title (backend field name)
  email: string;
  phone: string;
  company: string;
  customer_id?: string;     // Link to Customer.id for proper relationships
  owner_id?: string | null;
  lifecycle_stage?: string;
  lead_status?: string;
  status: "Customer" | "MQL" | "Lead" | "Prospect";
  last_activity: string;
  created_date: string;
  created_at?: string;
  updated_at: string;
  notes?: string;
  quotations?: any[]; // For detail view
}

// PD-specific minimal contact type (names only, no sensitive info)
export interface PDContact {
  id: string;
  name: string;
  company: string;
  customer_id?: string;
}