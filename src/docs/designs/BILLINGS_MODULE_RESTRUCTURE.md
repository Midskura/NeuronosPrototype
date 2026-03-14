# Billings Module Restructure — Design Concept (PARKED)

**Created:** 2026-02-28
**Status:** PARKED — pending Expense/Charge Catalog work first
**Context:** Discussed after completing the Contract Billings Grouping feature (3-phase blueprint, all phases complete).

---

## Problem

The current Billings module is a flat list of individual charges — a database dump, not a workflow tool. Accounting staff can't tell which bookings need billing, which are done, or what the full picture is for a given shipment.

---

## Proposed Restructure

### The Billings Module becomes a two-tab workspace:

**Tab 1: Queue (default landing)**
- Shows bookings grouped as cards, not individual line items
- Two sections: "Needs Billing" (pending work) and "Recently Billed" (completed)
- Each card shows: Booking ID, Client, Contract/Project, Service Type, Completion Date, Rate Card item count, Estimated Total
- CTA: "Review & Bill →" opens the Billing Worksheet
- Filterable by client, contract, service type, date range

**Tab 2: All Items**
- The current flat list view, improved with better data (client name, booking ID, invoice linkage)
- For search, audit, and ad-hoc lookups
- Not the daily workflow tool

### The Billing Worksheet (opens from Queue)
- Pre-populated from the contract/project rate card
- Editable: adjust quantities, add surcharges, remove inapplicable items
- Operations notes visible for context
- "Approve & Create Billings" button
- After approval: booking moves to "Recently Billed", contract aggregate updates

### Relationship to Contract Billings Tab
| View | Lives In | Purpose | Data Entry? |
|------|----------|---------|-------------|
| **Billing Queue** | Billings module (Tab 1) | "What needs billing?" | No — launches worksheet |
| **All Items** | Billings module (Tab 2) | "Find a specific charge" | No — search/filter |
| **Billing Worksheet** | Opens from Queue card | "Process this booking" | Yes — edit & approve |
| **Contract Billings** | Contract Detail → Accounting | "How's this contract doing?" | No — read-only aggregate |

### Why a standalone module (not inside Contracts)
- O(1) navigation: one screen shows all pending billing across ALL contracts/projects
- O(n) if inside contracts: accounting has to open each contract to check for unbilled bookings
- For 20+ active contracts with 5-10 bookings each, this is critical

---

## Trigger: Operations → Accounting Handoff
- Operations marks a booking as "Completed" or "Ready for Billing"
- This creates a queue entry in the Billings module
- Deliberate action with confirmation, not just a status dropdown

---

## Dependencies
- **Expense/Charge Item Catalog** (must be built first) — so billing items reference a master catalog, enabling aggregation and reporting
- **Rate Card → Billing auto-population** — contract rate cards seed the billing worksheet

---

## End-to-End Flow
```
Operations completes booking
       │
       ▼
Mark "Ready for Billing"
       │
       ▼
Appears in Billing Queue ──→ Accounting clicks "Review & Bill"
       │                              │
       │                              ▼
       │                     Billing Worksheet (pre-populated from rate card)
       │                              │
       │                              ▼
       │                     Approve → Billing items created
       │                              │
       ▼                              ▼
Recently Billed section      Contract Billings aggregate updates
       │
       ▼
Select items → Create Invoice → Collections tracking
```

---

## Next Steps (when unparked)
1. Build the Expense/Charge Item Catalog (prerequisite)
2. Draft phased blueprint for Queue view
3. Implement Billing Worksheet with rate card auto-population
4. Add "Ready for Billing" handoff trigger to Operations booking flow
