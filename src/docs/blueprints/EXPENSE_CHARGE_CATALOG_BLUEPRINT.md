# Expense & Charge Catalog (Item Master) Blueprint

**Created:** 2026-02-28
**Status:** ALL PHASES COMPLETE
**Goal:** Create a centralized catalog of expense and charge line items so every booking references a master record, enabling aggregation, reporting, and data consistency across the system.

---

## Problem

Every line item in every booking is free-text. "Document Fees" in BRK-022 and "Doc Fees" in BRK-045 are invisible to the system as the same thing. You cannot aggregate, report, or enforce consistency. This is the single biggest data architecture gap blocking financial reporting.

---

## Design Summary

1. **Catalog data layer** — master records stored in KV, each with a unique ID, name, type (expense/charge/both), category, and applicable service types
2. **CatalogItemCombobox** — a shared combobox component that replaces the plain text `<input>` for line item descriptions. Shows **names only** (no fluff). Selecting an existing item links the line item to the catalog. Typing a new name offers "Create new" at the bottom.
3. **Catalog Management Page** — an admin page inside the Accounting department sidebar for viewing, editing, deactivating, and organizing catalog items.
4. **Server endpoints** — CRUD + search for catalog items
5. **Line item linkage** — `catalog_item_id` field added to pricing/billing data models to reference the catalog

---

## Data Model

### Catalog Item (KV key: `catalog_item:{id}`)

```json
{
  "id": "ci_arrastre_wharfage_001",
  "name": "Arrastre/Wharfage",
  "type": "expense",              // "expense" | "charge" | "both"
  "category": "Government Fees",  // grouping label
  "service_types": ["Brokerage", "Forwarding"],
  "default_currency": "PHP",
  "default_amount": null,         // optional preset
  "is_taxable": false,
  "is_active": true,
  "created_at": "2026-02-28T...",
  "updated_at": "2026-02-28T..."
}
```

### Category (KV key: `catalog_category:{id}`)

```json
{
  "id": "cc_government_fees",
  "name": "Government Fees",
  "is_active": true
}
```

Categories are also managed via a combobox in the catalog item create/edit form — pick existing or create new.

### Line Item Linkage (added field)

Every pricing/billing line item gains an optional field:

```
catalog_item_id?: string  // references catalog_item:{id}
```

This field is added to:
- `QuotationLineItemNew` (in `/types/pricing.ts`)
- `SellingPriceLineItem` (in `/types/pricing.ts`)
- `BillingItem` (in `UnifiedBillingsTab.tsx`)
- `PricingItemData` (in `UniversalPricingRow.tsx`)

When `catalog_item_id` is set, the system can aggregate: "Total Arrastre/Wharfage across all bookings in Feb 2026."

---

## Affected Files

| File | Change |
|------|--------|
| `/supabase/functions/server/index.tsx` | New catalog CRUD routes |
| `/supabase/functions/server/catalog-handlers.tsx` | **NEW** — catalog item CRUD logic |
| `/components/shared/pricing/CatalogItemCombobox.tsx` | **NEW** — the combobox component |
| `/components/shared/pricing/UniversalPricingRow.tsx` | Replace description `<input>` with `CatalogItemCombobox` |
| `/components/accounting/CatalogManagementPage.tsx` | **NEW** — admin page for catalog CRUD |
| `/components/accounting/Accounting.tsx` | Add `"catalog"` view routing |
| `/components/NeuronSidebar.tsx` | Add `"acct-catalog"` sidebar item |
| `/types/pricing.ts` | Add `catalog_item_id` to line item types |
| `/components/shared/billings/UnifiedBillingsTab.tsx` | Add `catalog_item_id` to `BillingItem` |
| `/App.tsx` | Route `"acct-catalog"` page type |

---

## Combobox UX Spec

### Behavior

- Appears in the "Description" / "Item" column of every pricing row (UniversalPricingRow)
- In **view mode**: renders as a plain read-only text field (no combobox behavior)
- In **edit mode**: renders as a combobox input with dropdown
- Typing filters the catalog by name (fuzzy match)
- Dropdown shows **names only** — no descriptions, no usage counts, no metadata fluff
- Items matching the current booking's service type sort first (grouped under a lightweight header)
- Items from other service types appear below (under "Other" header)
- "+ Add [typed text]" option always appears at the bottom when input doesn't exactly match an existing item
- Selecting an existing item: sets `catalog_item_id`, fills description, pre-fills defaults (currency, taxable)
- **One-click create**: clicking "+ Add" immediately POSTs with type inferred from context (`itemType` prop), category = name, and links the new item — **no inline form**
- `itemType` prop: `"charge"` for billings/selling price surfaces, `"expense"` for expense surfaces, `"both"` as default

### Dropdown Layout

```
┌──────────────────────────────┐
│  Arrastre/Wharfage           │
│  Arrastre Fee (Provincial)   │
│  ─── Other ──────────────    │
│  Arrangement Fee             │
│  ────────────────────────    │
│  + Add "arr..."              │
└──────────────────────────────┘
```

### Portal Rendering

The combobox dropdown uses `createPortal` to `document.body` with `position: fixed`, `zIndex: 9999`, and a scroll listener that repositions (not closes) — matching the existing `CustomDropdown` pattern.

---

## Catalog Management Page UX Spec

### Location

Accounting Department → Admin → Catalog (sidebar item: `acct-catalog`, label: "Item Catalog")

### Layout

- Page title: "Expense & Charge Catalog"
- Subtitle: "Manage standard financial line items used across bookings."
- Top-right: "+ Add Item" button
- Filter bar: Search, Type dropdown (All/Expense/Charge/Both), Category dropdown, Service Type dropdown, Status (Active/Inactive)
- Table columns: Name, Type (pill badge), Category, Service Types (tag badges), Currency, Taxable (checkmark), Status, Actions (Edit/Deactivate)
- Inline editing: clicking Edit on a row opens an inline edit form (not a modal)
- Deactivate: soft-delete — item no longer appears in combobox but existing references preserved

---

## Server Endpoints

All prefixed with `/make-server-c142e950/catalog`.

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/catalog/items` | List all active catalog items (with optional `?service_type=` and `?search=` query params) |
| `GET` | `/catalog/items/:id` | Get single catalog item |
| `POST` | `/catalog/items` | Create new catalog item |
| `PUT` | `/catalog/items/:id` | Update catalog item |
| `DELETE` | `/catalog/items/:id` | Soft-delete (set `is_active: false`) |
| `GET` | `/catalog/categories` | List all catalog categories |
| `POST` | `/catalog/categories` | Create new category |

---

## Phases

### Phase 1: Data Layer + Server Endpoints
- [x] Create `/supabase/functions/server/catalog-handlers.tsx` with CRUD logic using KV store
- [x] Register catalog routes in `/supabase/functions/server/index.tsx`
- [x] Add `catalog_item_id` field to `QuotationLineItemNew`, `SellingPriceLineItem`, `PricingItemData`, and `BillingItem` types
- [x] Seed a handful of common items for Brokerage/Trucking/Forwarding (Document Fees, Arrastre/Wharfage, Local Trucking, Duties & Taxes, Processing Fee, etc.)

### Phase 2: CatalogItemCombobox Component
- [x] Create `/components/shared/pricing/CatalogItemCombobox.tsx`
- [x] Fetch catalog items from server (with caching — items don't change often)
- [x] Fuzzy search by name
- [x] Service-type-aware sorting (current booking's service type first, then "Other")
- [x] Names only in dropdown — no metadata fluff
- [x] "+ Add [text]" option at bottom — one-click create (no inline form)
- [x] `itemType` prop: inferred from context (`"charge"` for billings/selling price, `"expense"` for expenses, `"both"` as default)
- [x] On create: category = item name, type = `itemType` prop, service_types = current service type
- [x] Portal-based dropdown rendering (matching CustomDropdown pattern)
- [x] On select: set `catalog_item_id` + fill description + apply defaults

### Phase 3: Wire Into UniversalPricingRow
- [x] Replace plain `<input>` for description with `CatalogItemCombobox` in edit mode
- [x] Keep plain text display in view mode
- [x] Pass `serviceType` and `itemType` context from parent so combobox can prioritize relevant items and auto-set type on create
- [x] Propagate `catalog_item_id` through `onFieldChange` handler
- [x] Ensure backward compatibility: existing items without `catalog_item_id` still render fine (description as-is)

### Phase 4: Catalog Management Page
- [x] Create `/components/accounting/CatalogManagementPage.tsx`
- [x] Add `"acct-catalog"` to sidebar (`NeuronSidebar.tsx`) under Accounting — positioned as an admin/settings item
- [x] Add `"catalog"` view to `Accounting.tsx` routing
- [x] Add page type to `App.tsx`
- [x] Full CRUD table: search, filter by type/category/service/status
- [x] Inline edit for name, type, category, service types, defaults
- [x] Deactivate/reactivate toggle
- [x] Neuron design system styling

### Phase 5: Polish & Integration
- [x] Ensure combobox works in: Quotation Builder selling price rows, Billing rows, Booking expense/charge rows
- [x] Verify `catalog_item_id` persists through save/load cycles (KV round-trip)
- [x] Handle edge cases: deactivated items still display in existing line items but can't be selected for new ones
- [x] Test with 0, 10, 50, 200+ catalog items

---

## Current Status

**ALL PHASES COMPLETE** — Full Expense & Charge Catalog feature implemented:
- Phase 1: Data layer with CRUD endpoints + seed (29 items, 9 categories)
- Phase 2: CatalogItemCombobox with portal dropdown, caching, inline create
- Phase 3: Wired into UniversalPricingRow replacing plain text input
- Phase 4: Catalog Management Page at /accounting/catalog with full CRUD, filters, inline edit
- Phase 5: serviceType threading through SellingPriceSection, BillingCategorySection, BillingsTable; backward-compatible with existing data; deactivated items excluded from combobox but preserved in existing references

---

## Dependencies

- This is a **prerequisite** for the Billings Module Restructure (parked in `/docs/designs/BILLINGS_MODULE_RESTRUCTURE.md`)
- No dependencies on other unfinished work — can proceed independently

---

## Out of Scope (for now)

- Merge duplicate items (power user feature — later)
- Usage count / analytics (later — requires querying all bookings)
- Auto-suggest common items when creating a new booking (later)
- Backfill existing free-text descriptions into catalog references (later — data migration task)