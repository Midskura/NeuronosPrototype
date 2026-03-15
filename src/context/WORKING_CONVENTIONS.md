# Working Conventions & Rules

## Blueprint-Driven Development

This project uses a **blueprint-first** workflow:

1. **Before any feature work:** Read the relevant blueprint in `/docs/blueprints/`
2. **During implementation:** Follow the phased plan exactly
3. **After each phase:** Update the blueprint with completion status and implementation notes
4. **Before writing code:** Get explicit "Go Ahead" from the user

Blueprints are Markdown files with phased implementation plans, file lists, and status tracking.

## Files That Require Re-Reading Before Any Changes

These files have been **manually edited** by the user outside of AI sessions. Always re-read them before making modifications:

| File | Why |
|---|---|
| `QuotationBuilderV3.tsx` | Complex quotation editor, manual edits |
| `EditableBulletList.tsx` | Custom editing behavior |
| `ContractGeneralDetailsSection.tsx` | Manual contract field layout |
| `QuotationRateBreakdownSheet.tsx` | Rate display logic |
| `ContractRateToolbar.tsx` | Toolbar actions |
| `ContractStatusSelector.tsx` | Status flow logic |
| `ContractDetailView.tsx` | Contract detail with smart fallbacks |
| `CustomDropdown.tsx` | Portal-based rendering pattern (critical) |
| `SELECTION_GROUP_BLUEPRINT.md` | Blueprint reference |
| `INQUIRIES_QUOTATIONS_CLEANUP_BLUEPRINT.md` | Blueprint reference |
| `/utils/quotation-helpers.tsx` | Quotation utility functions |
| `/utils/fetchWithRetry.ts` | Retry logic for API calls |
| `/components/accounting/CatalogManagementPage.tsx` | Catalog UI |
| `/components/shared/pricing/CatalogItemCombobox.tsx` | One-click catalog add |
| `/supabase/functions/server/accounting-handlers.tsx` | Accounting API handlers |
| `/supabase/functions/server/catalog-handlers.tsx` | Catalog API handlers |

## Protected Files (NEVER modify)

- `/components/figma/ImageWithFallback.tsx`
- `/supabase/functions/server/kv_store.tsx`
- `/utils/supabase/info.tsx`

## DRY Principles

This project has undergone extensive DRY consolidation. Key rules:

1. **Unified tab components** (`UnifiedBillingsTab`, `UnifiedExpensesTab`, `UnifiedInvoicesTab`, `UnifiedCollectionsTab`) are shared across Projects, Contracts, Bookings, and Aggregate views. Never recreate these — always reuse with props.
2. **Shared pricing components** in `/components/shared/pricing/` are used by both quotation builder and contract rate matrix.
3. **Rate engine utilities** in `/utils/contract*.ts` handle the full pipeline from quotation → contract → booking → billing.
4. **DataTable** (`/components/common/DataTable.tsx`) is the standard table component. Use it instead of building custom tables.
5. **Financial calculations** are centralized in `/utils/financialCalculations.ts`.

## Code Style

- **Component files:** PascalCase `.tsx` (e.g., `AggregateBillingsPage.tsx`)
- **Utility files:** camelCase `.ts` (e.g., `contractRateEngine.ts`)
- **Hook files:** `use` prefix, camelCase `.ts` or `.tsx` (e.g., `useProjectFinancials.ts`)
- **Type files:** camelCase `.ts` in `/types/` directory
- **CSS:** Inline Tailwind classes. Neuron design tokens via CSS custom properties.
- **Colors:** Always use the Neuron palette — `#12332B` (primary text), `#0F766E` (teal actions), `#667085` (muted text), `#E5E9F0` (borders), `#F9FAFB` (subtle backgrounds)
- **Font sizes:** `text-[13px]` body, `text-[14px]` labels, `text-[32px]` page titles
- **Currency formatting:** `Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" })`

## Server Code Rules

- Server code lives ONLY in `/supabase/functions/server/`
- Cannot import files from outside this directory
- External packages: use `npm:` or `jsr:` specifier
- Node builtins: use `node:` specifier (e.g., `import process from "node:process"`)
- All routes prefixed with `/make-server-c142e950`
- CORS: import from `npm:hono/cors` (NOT `npm:hono/middleware`)
- Logger: import from `npm:hono/logger`
- File writes only to `/tmp`
- No DDL/migration files — the KV store is the only database, and it requires no schema changes
- The `SUPABASE_SERVICE_ROLE_KEY` must NEVER leak to the frontend

## Common Gotchas

1. **Quotations vs Contracts:** Same KV prefix (`quotation:{id}`), distinguished by `quotation_type: "spot" | "contract"`. The terms are sometimes used interchangeably in code — "contract" is a quotation with `quotation_type === "contract"`.

2. **Billing Items vs Invoices:** Both stored with `billing` prefix but different:
   - `billing_item:{id}` — individual charge line items (atoms)
   - `billing:{id}` with `invoice_number` — invoice documents

3. **E-Vouchers:** The term "e-voucher" encompasses both expenses and collection vouchers. The `transaction_type` field distinguishes them (`"Expense"`, `"Budget_Request"`, `"Collection"`, etc.).

4. **Project Number vs Booking ID:** Projects have a `project_number` (e.g., `PRJ-001`). Bookings have an ID with a service prefix (e.g., `FWD-001`, `TRK-002`). Both are used as foreign keys in billing/expense records.

5. **Sonner import:** Must use `import { toast } from "sonner@2.0.3"` (version-specific).

6. **react-router:** Use `react-router` package, NOT `react-router-dom`. They are different packages in this environment.

7. **No `react-resizable`:** Use `re-resizable` instead.

8. **Tailwind v4:** No `tailwind.config.js`. Configuration is in `/styles/globals.css` using CSS custom properties and `@import "tailwindcss"`.
