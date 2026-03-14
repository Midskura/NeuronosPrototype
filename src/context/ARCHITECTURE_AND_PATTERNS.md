# Architecture & Patterns

## Backend Architecture

### Server
- **Location:** `/supabase/functions/server/index.tsx` (~10,400 lines)
- **Framework:** Hono web server on Deno runtime (Supabase Edge Function)
- **Route prefix:** All routes start with `/make-server-c142e950/`
- **Auth header:** `Authorization: Bearer ${publicAnonKey}` (from `/utils/supabase/info.tsx`)
- **CORS:** Open (`origin: "*"`)
- **Imports:** Use `npm:` for packages, `node:` for Node builtins

### Handler Files (split out from index.tsx for modularity)
| File | Purpose |
|---|---|
| `accounting-handlers.tsx` | E-vouchers, billings, expenses, invoices, collections, journal entries |
| `accounting-new-api.ts` | Accounts (COA) and transactions |
| `catalog-handlers.tsx` | Expense & Charge Catalog CRUD |
| `kv_store.tsx` | KV store utility (PROTECTED — never modify) |
| `kv_store_robust.tsx` | Enhanced KV with retry logic |

### Database: KV Store
All data lives in a single Supabase `kv_store_c142e950` table. The KV abstraction provides:
- `get(key)`, `set(key, value)`, `del(key)`
- `mget(keys[])`, `mset(entries[])`, `mdel(keys[])`
- `getByPrefix(prefix)` — the primary query mechanism

**Key prefixes (entity types):**
```
project:{id}              — Projects
quotation:{id}            — Quotations AND Contracts (distinguished by quotation_type)
booking:{prefix}-{id}     — Bookings (FWD-, BRK-, TRK-, MI-, OTH-)
customer:{id}             — Customers
contact:{id}              — Contacts
inquiry:{id}              — Inquiries
evoucher:{id}             — E-Vouchers (expense documents)
billing_item:{id}         — Individual billing line items
billing:{id}              — Invoice documents (have invoice_number)
collection:{id}           — Collection records
journal_entry:{id}        — Journal entries
account:{id}              — Chart of Accounts entries
partner:{id}              — Network partners / vendors
ticket:{id}               — Internal tickets
ticket_type:{id}          — Ticket type definitions
comment:{entity}:{id}     — Comments on entities
catalog_item:{id}         — Catalog items (expense/charge templates)
catalog_category:{id}     — Catalog categories
project_attachment:{pid}:{aid} — Project file attachments
contract_attachment:{cid}:{aid} — Contract file attachments
```

### Frontend → Server Communication Pattern
```tsx
import { projectId, publicAnonKey } from "./utils/supabase/info";
const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-c142e950`;

const response = await fetch(`${API_URL}/projects`, {
  headers: { "Authorization": `Bearer ${publicAnonKey}` },
});
const data = await response.json();
// data.success → boolean, data.data → array/object
```

For transient failure handling, use `/utils/fetchWithRetry.ts` which retries on 5xx and network errors.

### API Response Convention
```json
{ "success": true, "data": [...] }
{ "success": false, "error": "Error message" }
```

## Frontend Patterns

### Module Structure
Each department module follows this pattern:
1. **List page** — shows all entities with filters, search, status tabs (e.g., `ProjectsList.tsx`, `ContractsList.tsx`, `QuotationsListWithFilters.tsx`)
2. **Detail view** — full entity view with tabs (e.g., `ProjectDetail.tsx`, `ContractDetailView.tsx`, `QuotationDetail.tsx`)
3. **Create/Edit panels** — slide-in side panels or modals (e.g., `CreateBookingFromContractPanel.tsx`)

### Shared Financial Components (DRY Architecture)
These "Unified" tab components are reused across Projects, Contracts, Bookings, and Aggregate pages:

| Component | Location | Props |
|---|---|---|
| `UnifiedBillingsTab` | `/components/shared/billings/` | `items`, `projectId`, `readOnly`, `title`, `subtitle` |
| `UnifiedExpensesTab` | `/components/accounting/` | `expenses`, `isLoading`, `readOnly`, `title`, `subtitle` |
| `UnifiedInvoicesTab` | `/components/shared/invoices/` | `financials: FinancialData`, `project`, `readOnly`, `title`, `subtitle` |
| `UnifiedCollectionsTab` | `/components/shared/collections/` | `financials: FinancialData`, `project`, `readOnly`, `title`, `subtitle` |

The `FinancialData` type (from `/hooks/useProjectFinancials.ts`):
```ts
interface FinancialData {
  invoices: any[];
  billingItems: any[];
  collections: any[];
  expenses: any[];
  isLoading: boolean;
  refresh: () => void;
  totals: FinancialTotals;
}
```

### Aggregate Pages (Essentials Mode)
**Superseded by `FinancialsModule.tsx`** — The 4 separate aggregate pages have been consolidated into a single tabbed "Financials" super-module with purpose-built aggregate views (ScopeBar, KPIStrip, AgingStrip, GroupingToolbar, GroupedDataTable). Old pages deleted:
- `AggregateBillingsPage.tsx` — DELETED (Phase 6)
- `AggregateExpensesPage.tsx` — DELETED (Phase 6)
- `AggregateCollectionsPage.tsx` — DELETED (Phase 6)
- `AggregateInvoicesPage.tsx` — KEPT (still used by Full Suite mode for standalone invoices view)

New aggregate components live in `/components/accounting/aggregate/`:
- `AggregateFinancialShell.tsx`, `ScopeBar.tsx`, `KPIStrip.tsx`, `AgingStrip.tsx`, `GroupingToolbar.tsx`, `GroupedDataTable.tsx`, `types.ts`

### Quotation/Contract System
Quotations and Contracts share the same data model (`quotation:{id}` in KV). Distinguished by `quotation_type`:
- `"spot"` — one-time quotation
- `"contract"` — recurring rate agreement with validity period

Key files:
- `QuotationBuilderV3.tsx` — main quotation/contract editor (MANUALLY EDITED — always re-read before changes)
- `ContractDetailView.tsx` — contract detail with bookings, billings, financial tabs
- `ContractRateToolbar.tsx` — rate matrix toolbar
- `RateCalculationSheet.tsx` — rate breakdown calculations

### Service Types
Five service types throughout the system:
1. **Forwarding** (prefix: `FWD-`)
2. **Brokerage** (prefix: `BRK-`)
3. **Trucking** (prefix: `TRK-`)
4. **Marine Insurance** (prefix: `MI-`)
5. **Others** (prefix: `OTH-`)

All 5 booking creation endpoints inject a `serviceType` field. `ContractDetailView.tsx` has a smart fallback that infers service type from booking ID prefix for pre-existing bookings. The `contractServices` array filters to only `["Brokerage", "Trucking", "Others"]`.

### Rate Engine Pipeline
```
Quotation (charge_categories) 
  → Contract (rate matrix with destinations/tiers)
    → Booking (applied_rates via contractRateEngine.ts)
      → Billing Items (auto-generated from rate card)
```

Key utils:
- `/utils/contractRateEngine.ts` — calculates billing from contract rates + booking quantities
- `/utils/contractAdapter.ts` — adapts quotation data for contract contexts
- `/utils/rateCardToBilling.ts` — converts rate cards to billing line items
- `/utils/contractQuantityExtractor.ts` — extracts quantities from bookings

### Custom Dropdown Pattern (IMPORTANT)
`/components/bd/CustomDropdown.tsx` uses a specific portal-based rendering approach that must be preserved:
- Renders dropdown menu via `createPortal` to `document.body`
- Uses `position: fixed` with `zIndex: 9999`
- Scroll listener that **repositions** the dropdown rather than closing it
- `width: "max-content"` with `minWidth` matching trigger button width
- This pattern is used to avoid z-index/overflow issues in modals and side panels

### Routing Convention
Routes are defined in `AppContent` inside `/App.tsx`:
```
/dashboard
/bd/{contacts|customers|inquiries|projects|contracts|tasks|activities|budget-requests|reports}
/pricing/{contacts|customers|quotations|projects|contracts|vendors|reports}
/operations/{forwarding|brokerage|trucking|marine-insurance|others|reports}
/accounting/{transactions|evouchers|billings|invoices|collections|expenses|coa|ledger|projects|contracts|customers|reports|catalog}
/projects
/contracts
/hr
/calendar, /inbox, /ticket-queue, /activity-log, /profile, /admin
```

Each route wraps its content in a `RouteWrapper` that provides `<Layout>` with the correct `currentPage` prop for sidebar highlighting.