Yes, I fully get it. In freight forwarding, the Customer is who you have a commercial relationship with (e.g., "ABC Logistics Corp" — you bill them), but the Consignee is their client — the actual receiver/importer of the goods (e.g., "XYZ Manufacturing"). Sometimes you even bill the consignee directly instead of the customer. It's a one-to-many: one Customer can have many Consignees.

Here's what I found in the codebase and my proposed approach:

Current State Analysis
What exists today:

Layer	How "Consignee" is handled	Location
Booking types	Plain consignee: string text field	types/operations.ts (Brokerage, Forwarding, Trucking)
Booking creation panels	Free-text input, no entity linkage	CreateBrokerageBookingPanel, CreateForwardingBookingPanel, CreateTruckingBookingPanel
Booking detail views	Editable text field via EditableField	BrokerageBookingDetails, TruckingBookingDetails
Invoice Builder	consignee state defaults to project.customer_name	InvoiceBuilder.tsx line 91
Invoice Document	Displays invoice.consignee as a shipment detail under "CONSIGNEE:" label, separate from "BILL TO:" which always shows customer_name	InvoiceDocument.tsx lines 498–503
Customer entity	customer:{id} in KV — has name, industry, address, credit_terms, etc. No concept of sub-customers	types/bd.ts, Customer interface
The gap: Consignee is just a dumb string today. There's no entity, no reusability, no autocomplete, and — critically — no ability to bill a consignee instead of the customer.

Proposed Approach: Consignee as a Lightweight Sub-Entity of Customer
Backend (1 new KV prefix, 3-4 new routes)
New KV prefix: consignee:{id}

{
  id: "CSG-20260305-001",
  customer_id: "customer-1",        // Parent customer (required)
  name: "XYZ Manufacturing Inc.",
  address: "123 Industrial Blvd, Quezon City",
  tin: "123-456-789-000",
  contact_person: "Juan Dela Cruz",
  email: "juan@xyz.com",
  phone: "+63 917 123 4567",
  created_at: "...",
  updated_at: "..."
}
New API routes (in accounting-handlers.tsx or a new consignee-handlers.tsx):

GET /consignees?customer_id=xxx — list consignees, optionally filtered by customer
GET /consignees/:id — get single
POST /consignees — create
PATCH /consignees/:id — update
DELETE /consignees/:id — delete
That's it for backend. Zero changes to existing routes.

Type Changes (minimal)
New type in types/bd.ts:

export interface Consignee {
  id: string;
  customer_id: string;
  name: string;
  address?: string;
  tin?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}
Optional fields added to existing booking types (backward compatible):

// In BrokerageBooking, ForwardingBooking, TruckingBooking:
consignee_id?: string;  // NEW — links to Consignee entity
// consignee: string;   // KEEP — text field stays for backward compat + display
Frontend Changes by Phase
Phase 1 — Customer Module: Consignee Management

Add a "Consignees" section/tab inside the existing Customer detail view (wherever that lives in BD module)
Simple table: Name, Address, TIN, Contact Person + Add/Edit/Delete
Uses a new useConsignees(customerId) hook
Files touched: ~2-3 (new hook, Customer detail component, new inline panel/modal)
Phase 2 — Booking Creation: Consignee Picker

In CreateBrokerageBookingPanel, CreateForwardingBookingPanel, CreateTruckingBookingPanel:
Replace the free-text "Consignee" input with a combo-box (searchable dropdown + free-text fallback)
When a customer is already selected on the booking, fetch that customer's consignees for the dropdown
Selecting a consignee sets both consignee_id and the text consignee field (for backward compat)
Typing free text still works (no consignee_id, just text)
Files touched: 3 booking creation panels (the consignee combo-box can be a shared component — DRY)
Phase 3 — Booking Details: Consignee Display

In BrokerageBookingDetails, TruckingBookingDetails, etc.:
If consignee_id exists, show the consignee as a linked entity (clickable?) with address/TIN
If only text consignee, show as-is (backward compat)
Files touched: 2-3 booking detail components
Phase 4 — Invoice: Bill-To Override

In InvoiceBuilder.tsx:
Add a "Bill To" selector: Customer (default) vs Consignee (dropdown of consignees for this customer)
When "Consignee" is selected, override customer_name, customer_address, customer_tin on the invoice payload with the consignee's data
Add billed_to_type: "customer" | "consignee" and consignee_id to the invoice payload
In InvoiceDocument.tsx:
"BILL TO:" section already shows invoice.customer_name — no change needed if we override at creation time
Files touched: 1-2
Impact Summary
Area	Changes	Risk
Backend	1 new KV prefix, 4 new routes, 0 existing route changes	Very low
Types	1 new interface, 3 optional fields on bookings	Zero breaking
Booking creation	3 panels get a combo-box (extractable as shared component)	Low
Booking details	2-3 components get conditional display	Low
Invoice builder	1 "Bill To" selector added	Low
Customer module	1 new section/tab	Low
Total new files: ~3 (hook, shared ConsigneePicker component, possibly handlers file) Total modified files: ~8-10 Zero existing functionality broken — all changes are additive with optional fields.

What do you think? Want me to adjust the phasing, or do you want to tackle a specific phase first? Just say "Go Ahead" when you're ready for me to start coding.