Great — this is a real-world confirmation of exactly the use case the Consignee plan was designed for. Let me break down how their specific Hiland/Tomoro scenario maps to what we'd build, and lay out a concrete implementation plan.

Understanding the Real Workflow
What the team is describing:

Hiland is the Client (Customer). They have a project, bookings, and a commercial relationship with your company.
Tomoro is the Consignee — the actual receiver/importer of the goods on a specific shipment.
Sometimes the invoice needs to say "Bill To: Tomoro" instead of "Bill To: Hiland" — but the project, the bookings, the financials, the collections — all of that still lives under Hiland's umbrella.
Today, the team handles this by manually changing the name in the billing fields. It's a workaround — fragile, untraceable, and easy to mess up.
What we're solving: Make "Bill To: Tomoro" a first-class, one-click action — while everything stays filed under Hiland's project.

Implementation Plan
Phase 0 — Data Foundation (Backend)
What: Create the Consignee as a stored entity in the KV store.

New KV prefix: consignee:{id} — stores name, address, TIN, contact person, email, phone
Every consignee is linked to a parent Customer (e.g., Tomoro → belongs to Hiland)
4-5 new API routes on the Hono server: list, get, create, update, delete
Zero changes to existing routes, existing bookings, existing invoices
Why this matters for the Hiland/Tomoro case: Tomoro gets saved once with its full details. Next time anyone needs to bill Tomoro, it's already there — no retyping.

Phase 1 — Customer Module: Consignee Directory
What: Add a "Consignees" tab inside the Customer detail view.

Open Hiland's profile → new Consignees tab → see a table of all Hiland's consignees (Tomoro, and any others)
Add / Edit / Delete consignees from here
New useConsignees(customerId) hook fetches them
User experience: The accounting or ops team goes to Hiland's profile, adds "Tomoro" once with address and TIN. Done forever.

Files involved: ~2-3 new files (hook, Consignees tab component), 1 modified (CustomerDetail)

Phase 2 — Booking Creation: Smart Consignee Picker
What: Replace the plain text "Consignee" field in booking creation panels with a combo-box (searchable dropdown + free-text fallback).

When creating a booking under Hiland, the Consignee field shows a dropdown of Hiland's saved consignees
Pick "Tomoro" → auto-fills the name (and internally saves the consignee_id link)
Can still type a new name freely for one-off consignees (backward compatible)
One shared ConsigneePicker component used across all 3 booking creation panels (Brokerage, Forwarding, Trucking)
User experience: Ops team picks Hiland as client, then picks Tomoro from a dropdown instead of typing. Faster, no typos.

Files involved: 1 new shared component, 3 modified booking panels

Phase 3 — Booking Details: Richer Display
What: When viewing a booking that has a linked consignee, show it as a proper entity (not just plain text).

If consignee_id exists → show name with address/TIN available on hover or inline
If only free-text consignee → show as-is (exactly like today)
Old bookings are unaffected
Files involved: 2-3 booking detail components modified

Phase 4 — Invoice Builder: The "Bill To" Switch ⭐
This is the phase that directly solves the Hiland/Tomoro billing scenario.

What: Add a "Bill To" selector in the Invoice Builder.

Default: "Bill To: Hiland" (the customer, like today)
New option: "Bill To: Consignee" → dropdown shows Hiland's consignees → pick "Tomoro"
When Tomoro is selected, the invoice's Bill To name, address, and TIN automatically swap to Tomoro's saved details
The project, the bookings, the financial tracking — all still filed under Hiland. Only the printed invoice header changes.
New fields on the invoice payload: billed_to_type: "customer" | "consignee" and optionally consignee_id
What the Invoice Document looks like:

Before (today):                    After (with consignee billing):
┌─────────────────────┐            ┌─────────────────────┐
│ BILL TO: Hiland     │            │ BILL TO: Tomoro     │
│ Hiland's address    │            │ Tomoro's address    │
│ Hiland's TIN        │            │ Tomoro's TIN        │
│                     │            │                     │
│ CONSIGNEE: Tomoro   │            │ CONSIGNEE: Tomoro   │
│ (shipment detail)   │            │ (shipment detail)   │
└─────────────────────┘            └─────────────────────┘

Project still says: Hiland         Project still says: Hiland
Financials under: Hiland           Financials under: Hiland
Collections from: Hiland           Collections from: Tomoro (or Hiland)
Files involved: InvoiceBuilder.tsx (add selector), possibly InvoiceDocument.tsx (minor, if any)

What Stays the Same (Everything Else)
Area	Impact
Projects	Still organized by Customer (Hiland). No change.
Billings / Expenses / Collections	Still tracked under the project. No change.
Dashboard & Reports	Still aggregated by Customer. No change.
Existing bookings & invoices	Work exactly as today. The new fields are optional.
useBillingMerge, booking grouping	Unrelated — those are about how charges are organized, not who gets billed.
Billings Module restructure (parked)	Independent. Can be done before or after.
Suggested Phasing
Phase	What the team gets	Effort
0 + 1 first	Consignee directory exists, team can start building their consignee lists under each customer	Small
2 next	Booking creation gets the smart picker — immediate daily time savings for ops	Small-Medium
4 next	The "Bill To" switch — solves the exact Hiland/Tomoro billing problem	Medium
3 last	Polish — booking details show richer consignee info	Small
I'd recommend doing Phase 4 (the billing switch) right after Phase 2, since that's the pain point the team explicitly described. Phase 3 is nice-to-have polish that can come last.

This plan is parked and ready. No code written. Just say "Go Ahead" when you want me to start, and tell me which phase to begin with.