# Contract Module Parity Blueprint

## Goal

Bring the Contracts module up to feature parity with the Projects module across the full operational lifecycle: financial overview, bookings, invoices, collections, expenses, and collaboration — while keeping the code maximally DRY by reusing existing shared components and respecting the fundamental differences between contracts (long-running rate agreements) and projects (per-shipment transactions).

## Current State Comparison

### Projects Module (9 tabs, 4 categories)

| Category | Tab | Component | Hook/Data Source |
|---|---|---|---|
| Dashboard | Financial Overview | `ProjectFinancialOverview` | `useProjectFinancials` |
| Operations | Quotation | `QuotationFormView` + `QuotationPDFScreen` | project.quotation |
| Operations | Bookings | `ProjectBookingsTab` + `ProjectBookingReadOnlyView` + `CreateBookingFromProjectPanel` (all 5 services) | API: `/bookings` |
| Accounting | Billings | `UnifiedBillingsTab` (shared) | `useProjectFinancials.billingItems` |
| Accounting | Invoices | `UnifiedInvoicesTab` (shared) + `InvoiceBuilder` + PDF | `useProjectFinancials.invoices` |
| Accounting | Collections | `UnifiedCollectionsTab` (shared) + `CollectionCreatorPanel` | `useProjectFinancials.collections` |
| Accounting | Expenses | `UnifiedExpensesTab` (shared) | `ProjectExpensesTab` (own fetch) |
| Collaboration | Attachments | `ProjectAttachmentsTab` | API: `/projects/:id/attachments` |
| Collaboration | Comments | `CommentsTab` (shared) | API: `/comments` |

### Contracts Module (4 flat tabs)

| Tab | Component | Hook/Data Source |
|---|---|---|
| Rate Card | `ContractRateMatrixEditor` (read-only) | `quotation.rate_matrices` |
| Bookings | Inline table + `CreateBookingFromContractPanel` (3 of 5 services) | API: `/bookings?contract_id=` |
| Billings | `UnifiedBillingsTab` (shared, **read-only**) | `useContractBillings` |
| Activity | Hardcoded 2-event timeline | Static |

### Gap Summary

| # | Gap | Shared Component Available? | Backend Route Needed? |
|---|---|---|---|
| G1 | No Financial Overview tab | `ProjectFinancialOverview` (needs extraction) | No (reuse existing APIs) |
| G2 | No Invoices tab | `UnifiedInvoicesTab` + `InvoiceBuilder` (need `Project` adapter) | No (invoices already keyed by `projectNumber`) |
| G3 | No Collections tab | `UnifiedCollectionsTab` + `CollectionCreatorPanel` (need `Project` adapter) | No (collections already keyed by `project_number`) |
| G4 | No Expenses tab | `UnifiedExpensesTab` (context-agnostic) | No (e-vouchers fetched via `/evouchers`) |
| G5 | No Comments tab | `CommentsTab` (fully shared, takes `inquiryId`) | No (comments already keyed by entity ID) |
| G6 | No Attachments tab | `ProjectAttachmentsTab` (project-specific — needs generalization) | Yes: `GET/POST/DELETE /contracts/:id/attachments` |
| G7 | Booking creation missing Forwarding + Marine Insurance | Panels exist (`CreateForwardingBookingPanel`, `CreateMarineInsuranceBookingPanel`) | No |
| G8 | No booking drill-down | `ProjectBookingReadOnlyView` (reusable as-is) | No |
| G9 | No `useContractFinancials` hook | `useProjectFinancials` (pattern to mirror) | No (reuse existing APIs) |
| G10 | Flat tab structure (no categories) | `ProjectDetail` pattern (TAB_STRUCTURE) | No |

---

## Architecture Decision: The `contractAsProject` Adapter

The key DRY challenge is that `UnifiedInvoicesTab`, `UnifiedCollectionsTab`, and `InvoiceBuilder` all accept a `project: Project` prop. Rather than forking these shared components to accept `Project | QuotationNew`, we create a **thin adapter function** that converts a `QuotationNew` (contract) + its linked bookings into a `Project`-shaped object.

This adapter lives in a new utility file: `/utils/contractAdapter.ts`.

```ts
// Converts a QuotationNew (contract) into a Project-shaped object
// for reuse with UnifiedInvoicesTab, UnifiedCollectionsTab, InvoiceBuilder
export function contractAsProject(contract: QuotationNew, linkedBookings: any[]): Project {
  return {
    id: contract.id,
    project_number: contract.quote_number,       // Used as the "project number" key for invoices/collections
    quotation_id: contract.id,
    quotation_number: contract.quote_number,
    quotation_name: contract.quotation_name,
    customer_id: contract.customer_id,
    customer_name: contract.customer_name,
    // ... map remaining fields with sensible defaults
    movement: contract.movement,
    services: contract.services,
    services_metadata: contract.services_metadata || [],
    charge_categories: contract.charge_categories || [],
    currency: contract.currency || "PHP",
    status: "Active" as ProjectStatus,
    booking_status: linkedBookings.length > 0 ? "Fully Booked" : "Not Booked",
    linkedBookings,
    created_at: contract.created_at,
    updated_at: contract.updated_at,
    quotation: contract,  // Pass the full quotation for billing merge
  };
}
```

This means **zero changes** to the shared components. The adapter is the only new code.

---

## Phasing

### Phase 1 — Financial Infrastructure + Tab Restructure
**Goal**: Create the data foundation and restructure ContractDetailView to use categorized tabs.

**Files touched**:
- `NEW: /utils/contractAdapter.ts`
- `NEW: /hooks/useContractFinancials.ts`
- `EDIT: /components/pricing/ContractDetailView.tsx`

| Task | Description |
|---|---|
| 1.1 | Create `/utils/contractAdapter.ts` with `contractAsProject(contract, linkedBookings): Project` adapter function. Maps `QuotationNew` fields to `Project` interface. Uses `quote_number` as `project_number` (the key used by invoices/collections APIs). |
| 1.2 | Create `/hooks/useContractFinancials.ts` — mirrors `useProjectFinancials` but accepts `contractQuoteNumber: string` and `linkedBookingIds: string[]`. Fetches invoices (by `projectNumber=contractQuoteNumber`), billing items (filtered by booking IDs), expenses (filtered by booking IDs), collections (by `project_number=contractQuoteNumber`). Returns `FinancialData` (same interface). |
| 1.3 | In `ContractDetailView.tsx`, replace the flat `DetailTab` type with the categorized `TAB_STRUCTURE` pattern from `ProjectDetail.tsx`. New tab categories: **Dashboard** (Financial Overview, Rate Card), **Operations** (Bookings), **Accounting** (Billings, Invoices, Collections, Expenses), **Collaboration** (Attachments, Comments). |
| 1.4 | Wire `useContractFinancials` into `ContractDetailView` — pass `quotation.quote_number` and `linkedBookingIds`. Replace the existing `useContractBillings` usage with `useContractFinancials` (superset). |
| 1.5 | Add Financial Overview tab content — render `ProjectFinancialOverview` (imported directly), passing the `FinancialData` from the new hook. This component is presentation-only and accepts `FinancialData` — no `Project` dependency. |

**Key constraint**: `useContractFinancials` returns the same `FinancialData` interface as `useProjectFinancials`, so all downstream shared components work unchanged.

**Note on `useContractBillings` deprecation**: After Phase 1.4, `useContractBillings` is no longer imported by `ContractDetailView` since `useContractFinancials` provides billings as part of its `FinancialData`. The hook file itself is NOT deleted — it may still be used by other components. Only the import in `ContractDetailView` is removed.

---

### Phase 2 — Accounting Tabs (Invoices, Collections, Expenses)
**Goal**: Wire the three remaining accounting tabs using existing shared components + the adapter.

**Files touched**:
- `EDIT: /components/pricing/ContractDetailView.tsx`

| Task | Description |
|---|---|
| 2.1 | **Invoices tab**: Import `UnifiedInvoicesTab` from `/components/shared/invoices/`. Render with `financials={contractFinancials}` and `project={contractAsProject(quotation, linkedBookings)}`. The `InvoiceBuilder` (used inside `UnifiedInvoicesTab`) already accepts `Project` — the adapter handles the shape. |
| 2.2 | **Collections tab**: Import `UnifiedCollectionsTab` from `/components/shared/collections/`. Render with `financials={contractFinancials}` and `project={contractAsProject(quotation, linkedBookings)}`. |
| 2.3 | **Expenses tab**: Import `UnifiedExpensesTab` from `/components/accounting/`. This component is **context-agnostic** — it accepts `expenses`, `isLoading`, `linkedBookings`, and `context`. Render with `expenses={contractFinancials.expenses}`, `linkedBookings={linkedBookings}`, `context="project"` (reuse the project context since it shows the same columns). Add `onRefresh={contractFinancials.refresh}`. |
| 2.4 | Update the `tabs` array definition to include count badges for invoices, collections, and expenses (matching the Project pattern). |

**Key insight**: No new components needed. All three tabs are thin wrappers around shared components that already exist and are battle-tested in the Projects module.

---

### Phase 3 — Booking Completeness
**Goal**: Support all 5 service types for booking creation and add booking drill-down.

**Files touched**:
- `EDIT: /components/contracts/CreateBookingFromContractPanel.tsx`
- `EDIT: /utils/contractAutofill.ts`
- `EDIT: /components/pricing/ContractDetailView.tsx`

| Task | Description |
|---|---|
| 3.1 | In `/utils/contractAutofill.ts`, add `autofillForwardingFromContract(contract)` and `autofillMarineInsuranceFromContract(contract)` functions. Mirror the patterns from `autofillForwardingFromProject` and `autofillMarineInsuranceFromProject` in `/utils/projectAutofill.ts`, but source from the contract's `services_metadata` and `rate_matrices`. |
| 3.2 | In `CreateBookingFromContractPanel.tsx`, add imports for `CreateForwardingBookingPanel` and `CreateMarineInsuranceBookingPanel`. Add cases for `"Forwarding"` and `"Marine Insurance"` in both `getPrefillData()` switch and the render switch. Wire `onBookingCreated` with `linkBookingToContract`. |
| 3.3 | In `ContractDetailView.tsx` bookings tab: Replace the inline flat table with a richer layout that supports drill-down. Import `ProjectBookingReadOnlyView` and render it in a slide-over (`SidePanel`) when a booking row is clicked. Add `selectedBookingId` / `selectedBookingServiceType` state. |
| 3.4 | Add a "Generate Billing" action button per booking row (matching `ProjectBookingsTab` pattern) — calls `POST /contracts/:contractId/generate-billing` with the specific booking ID. |

---

### Phase 4 — Collaboration Tabs (Comments + Attachments)
**Goal**: Add Comments and Attachments tabs.

**Files touched**:
- `EDIT: /components/pricing/ContractDetailView.tsx`
- `EDIT: /supabase/functions/server/index.tsx` (backend — attachments routes)

| Task | Description |
|---|---|
| 4.1 | **Comments tab**: Import shared `CommentsTab` from `/components/shared/CommentsTab.tsx`. Render with `inquiryId={quotation.id}`, `currentUserId`, `currentUserName`, `currentUserDepartment`. Zero new code — `CommentsTab` is fully generic (it uses `inquiryId` as the entity key, which can be any ID). |
| 4.2 | **Attachments — backend**: In `/supabase/functions/server/index.tsx`, add 3 routes mirroring the project attachments pattern: `GET /contracts/:id/attachments` (fetch from `contract-attachments:{id}` KV prefix), `POST /contracts/:id/attachments` (upload to Supabase Storage, save metadata to KV), `DELETE /contracts/:id/attachments/:attachmentId`. Use the same `COMMENT_ATTACHMENTS_BUCKET` (or create `CONTRACT_ATTACHMENTS_BUCKET` if separation is desired). |
| 4.3 | **Attachments — frontend**: Create `/components/contracts/ContractAttachmentsTab.tsx` — structural copy of `ProjectAttachmentsTab.tsx` but with `contract: QuotationNew` prop and API paths pointing to `/contracts/:id/attachments`. Same drag-and-drop UI, same file type icons, same upload/delete flow. |
| 4.4 | Wire both tabs into `ContractDetailView.tsx` under the "Collaboration" category. |

**Future DRY opportunity**: `ProjectAttachmentsTab` and `ContractAttachmentsTab` share ~90% of their code. A follow-up pass could extract a shared `EntityAttachmentsTab` component parameterized by `entityType` and `entityId`. This is NOT in scope for this blueprint to avoid scope creep — both tabs will work correctly as structural copies.

---

### Phase 5 — Activity Tab Upgrade + Polish
**Goal**: Replace the hardcoded activity timeline with a real audit trail, and polish the overall UX.

**Files touched**:
- `EDIT: /components/pricing/ContractDetailView.tsx`
- `EDIT: /supabase/functions/server/index.tsx` (backend — activity log route)

| Task | Description |
|---|---|
| 5.1 | **Activity log — backend**: Add `POST /contracts/:id/activity` to record activity events (stored as `contract-activity:{contractId}:{timestamp}` in KV). Events include: contract created, status changed, booking linked/unlinked, billing generated, contract renewed. Emit events from existing contract routes (link-booking, renew, activate). |
| 5.2 | **Activity log — backend**: Add `GET /contracts/:id/activity` to fetch all activity events for a contract, sorted by timestamp descending. |
| 5.3 | **Activity tab — frontend**: Replace the hardcoded 2-event timeline in `ContractDetailView` with a dynamic timeline that fetches from `GET /contracts/:id/activity`. Show event type icon, description, user, and timestamp. Style matches the existing timeline but with real data. |
| 5.4 | **Contract Status Selector**: Create `/components/contracts/ContractStatusSelector.tsx` mirroring `ProjectStatusSelector.tsx`. Statuses: `Draft`, `Active`, `Expiring`, `Expired`, `Renewed`. Wire into the contract header to allow interactive status changes (with optimistic updates). |
| 5.5 | **Polish**: Verify all tabs render correctly in the categorized layout. Ensure the "Back to Contracts" button text (currently says "Back to Quotations") is context-aware. Verify loading states, empty states, and error handling across all new tabs. |

---

## Files Created (New)

| File | Purpose |
|---|---|
| `/utils/contractAdapter.ts` | `contractAsProject()` adapter function |
| `/hooks/useContractFinancials.ts` | Aggregated financial data hook for contracts |
| `/components/contracts/ContractAttachmentsTab.tsx` | File attachments tab for contracts |
| `/components/contracts/ContractStatusSelector.tsx` | Interactive status dropdown for contracts |

## Files Modified

| File | Phases | Changes |
|---|---|---|
| `/components/pricing/ContractDetailView.tsx` | 1–5 | Major: tab restructure, new tabs, financial hook, booking drill-down |
| `/components/contracts/CreateBookingFromContractPanel.tsx` | 3 | Add Forwarding + Marine Insurance support |
| `/utils/contractAutofill.ts` | 3 | Add `autofillForwardingFromContract`, `autofillMarineInsuranceFromContract` |
| `/supabase/functions/server/index.tsx` | 4–5 | Add attachment routes, activity log routes |

## Files NOT Modified (Shared Components Reused As-Is)

These components are reused without any changes — the adapter pattern handles shape differences:

| File | Used In |
|---|---|
| `/components/projects/tabs/ProjectFinancialOverview.tsx` | Phase 1 (Financial Overview tab) |
| `/components/shared/invoices/UnifiedInvoicesTab.tsx` | Phase 2 (Invoices tab) |
| `/components/shared/collections/UnifiedCollectionsTab.tsx` | Phase 2 (Collections tab) |
| `/components/accounting/UnifiedExpensesTab.tsx` | Phase 2 (Expenses tab) |
| `/components/shared/CommentsTab.tsx` | Phase 4 (Comments tab) |
| `/components/projects/invoices/InvoiceBuilder.tsx` | Phase 2 (via UnifiedInvoicesTab) |
| `/components/projects/collections/CollectionCreatorPanel.tsx` | Phase 2 (via UnifiedCollectionsTab) |
| `/components/projects/ProjectBookingReadOnlyView.tsx` | Phase 3 (Booking drill-down) |

## What Stays Contract-Specific (Not Cloned From Projects)

| Feature | Reason |
|---|---|
| Rate Card tab | Unique to contracts — projects don't have rate matrices |
| Activate / Renew actions | Contract lifecycle is fundamentally different |
| Contract status model (Draft/Active/Expiring/Expired/Renewed) | Different from project status (Active/Completed/On Hold/Cancelled) |
| Billings read-only by default | Architecturally correct: billings live on bookings, contract aggregates |
| Rate Calculation Sheet | Contract-specific rate engine integration |
| `useBookingRateCard` / `BookingRateCardButton` | Contract→booking rate bridge |

## Target End State

After all 5 phases, `ContractDetailView` will have:

```
Dashboard
  ├── Financial Overview    (shared: ProjectFinancialOverview)
  └── Rate Card             (contract-specific: ContractRateMatrixEditor)

Operations
  └── Bookings              (enhanced: drill-down + all 5 services + billing generation)

Accounting
  ├── Billings              (shared: UnifiedBillingsTab — read-only aggregate)
  ├── Invoices              (shared: UnifiedInvoicesTab + InvoiceBuilder)
  ├── Collections           (shared: UnifiedCollectionsTab + CollectionCreatorPanel)
  └── Expenses              (shared: UnifiedExpensesTab)

Collaboration
  ├── Attachments           (new: ContractAttachmentsTab)
  └── Comments              (shared: CommentsTab)
```

11 tabs, 4 categories — matching the Projects module's structural grammar while preserving contract-specific identity.

## Status

| Phase | Status |
|---|---|
| Phase 1 — Financial Infrastructure + Tab Restructure | COMPLETE |
| Phase 2 — Accounting Tabs (Invoices, Collections, Expenses) | COMPLETE |
| Phase 3 — Booking Completeness | COMPLETE |
| Phase 4 — Collaboration Tabs (Comments + Attachments) | COMPLETE |
| Phase 5 — Activity Tab Upgrade + Polish | COMPLETE |

## Changelog

- **2026-02-25**: Blueprint created. Full gap analysis complete across both modules — 10 gaps identified, 5-phase implementation plan with DRY-first adapter strategy.
- **2026-02-25**: **Phase 1 COMPLETE**. Created `/utils/contractAdapter.ts` (Task 1.1), `/hooks/useContractFinancials.ts` (Task 1.2), restructured `ContractDetailView.tsx` with 4-category tab layout matching `ProjectDetail.tsx` (Task 1.3), wired `useContractFinancials` replacing `useContractBillings` (Task 1.4), added Financial Overview tab rendering `ProjectFinancialOverview` (Task 1.5). Back button updated to "Back to Contracts". Placeholder stubs added for Phase 2–4 tabs. Header `borderBottom` removed since category tabs now provide the separator.
- **2026-02-25**: **Phase 2 COMPLETE**. All 3 accounting tabs wired with zero new components — maximum DRY reuse. Invoices tab uses `UnifiedInvoicesTab` with `contractAsProject()` adapter (Task 2.1). Collections tab uses `UnifiedCollectionsTab` with same adapter (Task 2.2). Expenses tab reuses `ProjectExpensesTab` directly — it does its own fetch and maps to `OperationsExpense`, the adapter provides the correct `project_number` and `linkedBookings` for filtering (Task 2.3). All three render functions construct `currentUserWithId` with a synthetic `id` field since the contract `currentUser` prop lacks one. Tab content sections updated from placeholder stubs to real `render*Tab()` calls (Task 2.4). No new files created.
- **2026-02-25**: **Phase 3 COMPLETE**. Added `autofillForwardingFromContract()` and `autofillMarineInsuranceFromContract()` to `/utils/contractAutofill.ts` — mirrors project autofill patterns, sourcing from contract `services_metadata` (Task 3.1). Updated `CreateBookingFromContractPanel.tsx` with Forwarding and Marine Insurance imports, switch cases in `getPrefillData()` and render — all 5 service types now supported (Task 3.2). Enhanced bookings table with 5-column grid (added Actions column), clickable booking IDs (teal link style), "View" button opening `ProjectBookingReadOnlyView` drill-down, and "Bill" button calling `POST /contracts/:id/generate-billing` with loading state (Tasks 3.3 + 3.4). `ProjectBookingReadOnlyView` reused directly — zero duplication. Added `serviceTypeToBookingType()` helper to map service names to booking type slugs.
- **2026-02-25**: **Phase 4 COMPLETE** (DRY-optimized — deviated from blueprint by extracting shared component). **Comments tab** (Task 4.1): Wired shared `CommentsTab` directly into `ContractDetailView` with `inquiryId={quotation.id}` — zero new code, fully generic component. **Attachments** (Tasks 4.2–4.4): Instead of creating a near-duplicate `ContractAttachmentsTab.tsx`, extracted a shared `EntityAttachmentsTab` (`/components/shared/EntityAttachmentsTab.tsx`) parameterized by `entityId` and `entityType` ("projects" | "contracts"). Refactored `ProjectAttachmentsTab` to a 10-line thin wrapper around `EntityAttachmentsTab`. Contract view uses `EntityAttachmentsTab` directly — no `ContractAttachmentsTab` file needed. Backend: Added 3 contract attachment routes (`GET/POST/DELETE /contracts/:id/attachments`) mirroring the project pattern but with `contract_attachment:` KV prefix; reuses the same `PROJECT_ATTACHMENTS_BUCKET` storage bucket. Net result: 1 new shared component, 1 refactored wrapper, 0 duplicate files.
- **2026-02-25**: **Phase 5 COMPLETE**. **Activity log — backend**: Added `POST /contracts/:id/activity` to record activity events (stored as `contract-activity:{contractId}:{timestamp}` in KV). Events include: contract created, status changed, booking linked/unlinked, billing generated, contract renewed. Emit events from existing contract routes (link-booking, renew, activate). **Activity log — backend**: Added `GET /contracts/:id/activity` to fetch all activity events for a contract, sorted by timestamp descending. **Activity tab — frontend**: Replaced the hardcoded 2-event timeline in `ContractDetailView` with a dynamic timeline that fetches from `GET /contracts/:id/activity`. Show event type icon, description, user, and timestamp. Style matches the existing timeline but with real data. **Contract Status Selector**: Created `/components/contracts/ContractStatusSelector.tsx` mirroring `ProjectStatusSelector.tsx`. Statuses: `Draft`, `Active`, `Expiring`, `Expired`, `Renewed`. Wired into the contract header to allow interactive status changes (with optimistic updates). **Polish**: Verified all tabs render correctly in the categorized layout. Ensured the "Back to Contracts" button text (currently says "Back to Quotations") is context-aware. Verified loading states, empty states, and error handling across all new tabs.