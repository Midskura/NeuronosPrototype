# Inquiries/Quotations Module Cleanup Blueprint

**Created:** 2026-02-28
**Status:** IN PROGRESS
**Current Phase:** Phase 5

---

## Overview

Deep-dive audit of the Inquiries/Quotations module surfaced critical bugs, DRY violations, dead code, and inconsistencies. This blueprint tracks fixes across 6 phases.

---

## Phase 1 — Type System Fix (QuotationStatus)

**Status:** COMPLETE
**Goal:** Update `QuotationStatus` in `/types/pricing.ts` to match the 11 actual statuses used in `statusMapping.ts` and throughout the codebase.

### Problem
The type defines: `Draft | Inquiry | Quoted | Approved | Disapproved | Converted to Project | Converted to Contract | Cancelled`
Actual usage everywhere: `Draft | Pending Pricing | Priced | Sent to Client | Accepted by Client | Rejected by Client | Needs Revision | Converted to Project | Converted to Contract | Disapproved | Cancelled`
TypeScript cannot catch any status string mismatches.

### Changes
- [x] Update `QuotationStatus` type in `/types/pricing.ts` (remove `Inquiry`, `Quoted`, `Approved`; add `Pending Pricing`, `Priced`, `Sent to Client`, `Accepted by Client`, `Rejected by Client`, `Needs Revision`)
- [x] Scan for any code still referencing the old status values and update — all references to stale values (`"Inquiry"`, `"Quoted"`, `"Accepted"`) are in dead code files (`Quotations.tsx`, `QuotationsList.tsx`) slated for deletion in Phase 5

### Files
- `/types/pricing.ts`
- Any files referencing old status strings (to be identified via search)

---

## Phase 2 — Shared Utilities (DRY extraction)

**Status:** COMPLETE
**Goal:** Extract `getServiceIcon()`, `getStatusColor()`/`getStatusBgColor()`, and `formatShortDate()` into a single shared file to eliminate 4x/3x/6x duplications.

### Problem
- `getServiceIcon()` duplicated in: `InquiriesModule.tsx`, `QuotationsListWithFilters.tsx`, `QuotationsList.tsx`, `ContractDetailView.tsx`
- `getStatusColor()` duplicated in 3 files with **divergent** implementations (different color mappings)
- `formatDate()` duplicated ~6x inline in table row components

### Changes
- [x] Create `/utils/quotation-helpers.tsx` with shared functions
- [x] Update `QuotationsListWithFilters.tsx` to import from shared file (removed local `getStatusColor`, `getStatusBgColor`, replaced with `getQuotationStatusColor`/`getQuotationStatusBgColor`; replaced inline `formatDate` with `formatShortDate`)
- [x] Update `ContractDetailView.tsx` to import from shared file (`getServiceIcon` via `getServiceIconShared` with `{ size: 15, color: "#0F766E" }`, `formatShortDate` aliased as `formatDate`; kept contract-specific `getStatusColor` which returns `{text, bg}` object)
- [x] Dead files (`InquiriesModule.tsx`, `QuotationsList.tsx`) will be deleted in Phase 5 — no need to update them now

### Files
- `/utils/quotation-helpers.tsx` (NEW - created)
- `/components/pricing/QuotationsListWithFilters.tsx` (updated)
- `/components/pricing/ContractDetailView.tsx` (updated)

---

## Phase 3 — Fix Status Filter Dropdown

**Status:** COMPLETE
**Goal:** Fix the broken status filter in `QuotationsListWithFilters.tsx` so that selecting a status actually filters results correctly.

### Problem
Status filter options use display names (`"Quotation"`, `"Approved"`) but filter logic does `item.status === statusFilter` against internal names (`"Priced"`, `"Accepted by Client"`). Selecting "Quotation" or "Approved" always returns zero results.

### Changes
- [x] Replace broken dropdown option values with actual internal status values matching `item.status`: `Draft`, `Pending Pricing`, `Priced`, `Sent to Client`, `Needs Revision`, `Accepted by Client`, `Rejected by Client`, `Disapproved`, `Converted to Project`, `Cancelled`
- [x] Icon colors now match the shared `getQuotationStatusColor()` values from `quotation-helpers.tsx`
- [x] Existing filter logic `item.status === statusFilter` works correctly without changes because dropdown values now match internal statuses
- [x] Restored missing lucide-react import that was lost in Phase 2 edits
- [x] Cleaned up unused `getDisplayStatus`/`getDisplayStatusColor` imports

### Design Decision
Used internal status values (not display statuses) because:
1. The workflow tabs (Inquiries/Quotations/Completed) already group by internal status
2. Internal statuses provide more granular filtering within each tab
3. No changes needed to the existing filter comparison logic

### Files
- `/components/pricing/QuotationsListWithFilters.tsx`

---

## Phase 4 — Wire Up `onRefresh`

**Status:** COMPLETE
**Goal:** Ensure list page refreshes after status changes.

### Changes
- [x] Add `onRefresh?: () => void` to `QuotationsListWithFiltersProps` and destructure it in the component signature
- [x] `Pricing.tsx` already passed `onRefresh={fetchQuotations}` — now the prop is properly accepted
- [x] `BusinessDevelopment.tsx` now also passes `onRefresh={fetchQuotations}` for parity

### Note
Both parents already call `fetchQuotations()` inside their `handleUpdateQuotation` after successful PUT requests, so the quotations array re-flows as a prop. The `onRefresh` prop is now available for any future in-list refresh triggers (e.g., a manual refresh button).

### Files
- `/components/pricing/QuotationsListWithFilters.tsx` (interface + destructuring)
- `/components/BusinessDevelopment.tsx` (added `onRefresh` prop)

---

## Phase 5 — Delete Dead Code

**Status:** NOT STARTED
**Goal:** Remove confirmed dead files that have 0 live imports.

### Dead files (confirmed via `file_search`)
- [ ] `/components/pricing/InquiryDetail.tsx` — never imported, uses non-existent type, stale status values
- [ ] `/components/pricing/Quotations.tsx` — never imported, superseded by `Pricing.tsx` / `BusinessDevelopment.tsx`
- [ ] `/components/pricing/QuotationsList.tsx` — only imported by dead `Quotations.tsx`
- [ ] `/components/bd/InquiriesModule.tsx` — never imported, superseded by `QuotationsListWithFilters`

### Files
- 4 files to delete

---

## Phase 6 — Consolidate Date Fields (Optional)

**Status:** NOT STARTED
**Goal:** Standardize on one date field (`created_at` or `created_date`) across the QuotationNew type and all consumers.

### Problem
`QuotationNew` has both `created_date` (line 201) and `created_at` (line 295). Different components use different fields. If the backend only populates one, the other silently fails.

### Changes
- [ ] Audit backend serializer to see which field is actually populated
- [ ] Standardize all frontend consumers to use whichever field the backend provides
- [ ] Optionally deprecate the unused field in the type

### Files
- `/types/pricing.ts`
- `/components/pricing/QuotationsListWithFilters.tsx`
- Backend handlers (to audit)

---

## Changelog

| Date | Phase | Action |
|------|-------|--------|
| 2026-02-28 | — | Blueprint created with all 6 phases |
| 2026-03-01 | Phase 1 | Type System Fix (QuotationStatus) completed |
| 2026-03-02 | Phase 2 | Shared Utilities (DRY extraction) completed |
| 2026-03-02 | Phase 3 | Status Filter Dropdown fixed — replaced broken display-name values with internal status values, restored lost lucide imports |
| 2026-03-03 | Phase 4 | Wire Up `onRefresh` completed — added `onRefresh` prop to `QuotationsListWithFiltersProps` and passed from `Pricing.tsx` and `BusinessDevelopment.tsx` |