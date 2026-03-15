# Booking Creation Panels — DRY Migration Blueprint

**Created:** 2026-02-25
**Status:** IN PROGRESS
**Current Phase:** Phase 2 — Brokerage Migration (verify before continuing)

---

## Overview

Migrate all 5 booking creation panels to use the shared `common/SidePanel` component via a new `BookingCreationPanel` wrapper, eliminating ~120 lines of duplicated shell/header/footer boilerplate per panel and consolidating shared logic (customer fetch, contract detection, movement toggle).

**Estimated reduction:** ~600 lines of duplicated code across 5 panels.

---

## Phase 1 — Foundation (Shared Components)

**Status:** DONE (2026-02-25)

### Tasks:
- [x] 1.1 Delete dead `/components/ui/SidePanel.tsx` (0 consumers)
- [x] 1.2 Enhance `/components/common/SidePanel.tsx` — add optional `footer` ReactNode slot (sticky bottom bar, outside scroll area)
- [x] 1.3 Create `/components/operations/shared/BookingCreationPanel.tsx` wrapper:
  - Uses `common/SidePanel` with `width="680px"`, `showCloseButton=false`
  - Renders booking header (icon badge + title + subtitle + close button) via SidePanel `title` prop
  - Renders scrollable `<form>` area for children
  - Renders sticky footer (Cancel + Submit) via SidePanel `footer` prop
  - Props: `isOpen`, `onClose`, `icon`, `title`, `subtitle`, `formId`, `onSubmit`, `isSubmitting`, `isFormValid`, `submitLabel`, `submitIcon`, `children`
- [x] 1.4 Create `/components/operations/shared/useCustomerOptions.ts` — shared hook for customer dropdown fetch (replaces ~15 lines duplicated in each panel)

**Files affected:** 4 (1 deleted, 1 modified, 2 created)

---

## Phase 2 — Migrate Brokerage Panel

**Status:** DONE (2026-02-25)

### Tasks:
- [x] 2.1 Refactor `CreateBrokerageBookingPanel.tsx` to use `BookingCreationPanel`
  - Replaced shell boilerplate (backdrop, panel div, header, footer) with BookingCreationPanel wrapper
  - Replaced customer fetch useEffect with `useCustomerOptions` hook
  - Removed `X` import (no longer needed — wrapper handles close button)
  - Form fields remain as children inside BookingCreationPanel
- [x] 2.2 Verify panel renders correctly with identical visual output

**Files affected:** 1

---

## Phase 3 — Migrate Forwarding Panel

**Status:** PENDING

### Tasks:
- [ ] 3.1 Refactor `CreateForwardingBookingPanel.tsx` to use `BookingCreationPanel`
  - Same shell removal as Phase 2
  - Keep: ProjectAutofillSection, forwarding-specific fields, multi-step state, prefillData/source logic
- [ ] 3.2 Verify panel renders correctly

**Files affected:** 1

---

## Phase 4 — Migrate Trucking, Marine Insurance, Others Panels

**Status:** PENDING

### Tasks:
- [ ] 4.1 Refactor `CreateTruckingBookingPanel.tsx` to use `BookingCreationPanel`
- [ ] 4.2 Refactor `CreateMarineInsuranceBookingPanel.tsx` to use `BookingCreationPanel`
- [ ] 4.3 Refactor `CreateOthersBookingPanel.tsx` to use `BookingCreationPanel`
- [ ] 4.4 Verify all three panels render correctly

**Files affected:** 3

---

## File Map

| Component | Path | Role |
|---|---|---|
| SidePanel (canonical) | `/components/common/SidePanel.tsx` | Generic slide-in panel with Motion animations |
| ~~SidePanel (dead)~~ | ~~`/components/ui/SidePanel.tsx`~~ | Deleted in Phase 1 |
| BookingCreationPanel | `/components/operations/shared/BookingCreationPanel.tsx` | Booking-specific wrapper with shared logic |
| Brokerage | `/components/operations/CreateBrokerageBookingPanel.tsx` | Migrated in Phase 2 |
| Forwarding | `/components/operations/forwarding/CreateForwardingBookingPanel.tsx` | Migrated in Phase 3 |
| Trucking | `/components/operations/CreateTruckingBookingPanel.tsx` | Migrated in Phase 4 |
| Marine Insurance | `/components/operations/CreateMarineInsuranceBookingPanel.tsx` | Migrated in Phase 4 |
| Others | `/components/operations/CreateOthersBookingPanel.tsx` | Migrated in Phase 4 |

---

## Change Log

| Date | Phase | Action | Files Affected |
|---|---|---|---|
| 2026-02-25 | — | Blueprint created | N/A |
| 2026-02-25 | Phase 1 | DONE — deleted dead ui/SidePanel, enhanced common/SidePanel with footer, created BookingCreationPanel wrapper + useCustomerOptions hook | 4 files |
| 2026-02-25 | Phase 2 | DONE — Brokerage panel migrated to BookingCreationPanel + useCustomerOptions | 1 file |