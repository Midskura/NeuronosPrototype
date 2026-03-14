# Multi-Input Fields Blueprint

> **Living Document** — Updated after every implementation phase.
> Last Updated: 2026-02-24
> Current Phase: **ALL PHASES COMPLETE + Section Edit Mode**

---

## Problem Statement

Multi-value operational fields (MBL/MAWB, Container Numbers, Registry Numbers,
Vehicle Reference Numbers) are currently rendered as **single text inputs** where
users type comma-separated values:

```
BEFORE (current — comma-separated workaround):
  mblMawb = "MSCU123456789, COSU987654321"
  containerNumbers = "MSCU5285725, HLXU2008419, TLLU5146210"
  registryNumber = "REG-001, REG-002"
```

### Why This Is Wrong

- **Feels like a workaround**, not an intentional design decision
- **Ambiguous delimiters** — comma? semicolumn? space? newline?
- **Hard to scan** — user can't tell at a glance how many entries exist
- **Error-prone** — missing commas, extra spaces, inconsistent formatting
- **Poor editability** — editing one entry in the middle of a long string is painful

### The Fix: Dynamic Input Lists

Each multi-value field becomes a repeating group of individual input rows:

```
AFTER (intentional — dynamic input list):
  MBL/MAWB:
    [MSCU123456789     ] [x]
    [COSU987654321     ] [x]
    [+ Add MBL/MAWB        ]

  Container Numbers:
    [MSCU5285725       ] [x]
    [HLXU2008419       ] [x]
    [TLLU5146210       ] [x]
    [+ Add Container        ]
```

Each entry is a first-class input. The count is self-evident. Adding/removing is explicit.

---

## Architectural Decisions

### Storage Format: No Change

The `MultiInputField` component is a **pure UI abstraction**:

- Accepts `value: string` (comma-separated) from the parent
- Splits into `string[]` internally for rendering
- Joins back to comma-separated string on every change
- Emits `onChange(joinedString: string)` to the parent

**Why:** Zero backend changes, zero type changes, zero data migration, zero risk.
The `countEntries()` function in `contractQuantityExtractor.ts` already splits
by comma/semicolon/newline — so derived quantities continue to work unchanged.

### Forwarding `containerNumbers` Exception

Forwarding stores `containerNumbers` as `string[]` (array) in the type system.
Both creation panels already do `.split(",").map(c => c.trim()).filter(Boolean)` on submit.
This will continue to work — the MultiInputField emits comma-separated, the submit
handler converts to array. No change needed.

### IMPORT vs EXPORT Field Swaps

All movement-swapped fields (MBL/MAWB, Booking Confirmation No., Booking Reference No.)
get the multi-input treatment regardless of direction. **Flexibility over rigidity** —
even EXPORT booking confirmations or reference numbers may have multiple entries.

| Movement | Brokerage | Forwarding |
|----------|-----------|------------|
| IMPORT | MBL/MAWB (multi) | MBL/MAWB (multi) |
| EXPORT | Booking Confirmation No. (multi) | Booking Reference No. (multi) |

---

## Field Audit

### Fields to Convert

| Service | File Context | Field | Label | Used In |
|---------|-------------|-------|-------|---------|
| Brokerage | Creation Panel | `mblMawb` | MBL/MAWB | IMPORT |
| Brokerage | Creation Panel | `bookingConfirmationNumber` | Booking Confirmation No. | EXPORT |
| Brokerage | Creation Panel | `registryNumber` | Registry Number | Both movements |
| Brokerage | Detail View | `mblMawb` | MBL/MAWB | IMPORT |
| Brokerage | Detail View | `bookingConfirmationNumber` | Booking Confirmation No. | EXPORT |
| Brokerage | Detail View | `registryNumber` | Registry Number | Both movements |
| Brokerage | Detail View | `containerNumbers` | Container Number/s | FCL section |
| Trucking | Creation Panel | `vehicleReferenceNumber` | Vehicle Reference Number | Both movements |
| Trucking | Detail View | `vehicleReferenceNumber` | Vehicle Reference Number | Both movements |
| Forwarding | Creation Panel | `mblMawb` | MBL/MAWB | IMPORT |
| Forwarding | Creation Panel | `bookingReferenceNumber` | Booking Reference No. | EXPORT |
| Forwarding | Creation Panel | `containerNumbers` | Container Number/s | FCL mode |
| Forwarding | Creation Modal | `mblMawb` | MBL/MAWB | IMPORT |
| Forwarding | Creation Modal | `bookingReferenceNumber` | Booking Reference No. | EXPORT |
| Forwarding | Creation Modal | `containerNumbers` | Container Number/s | FCL mode |
| Forwarding | Detail View | `mblMawb` | MBL/MAWB | IMPORT |
| Forwarding | Detail View | `bookingReferenceNumber` | Booking Reference No. | EXPORT |
| Forwarding | Detail View | `containerNumbers` | Container Numbers | FCL section |

### Fields NOT Converted (Stay Single)

| Field | Reason |
|-------|--------|
| `hblHawb` | Typically one HBL per booking |
| `consignee` | Single entity per booking |
| `carrier` | Single entity per booking |
| `forwarder` | Single entity per booking |
| `shipper` | Single entity per booking |

---

## Phased Implementation Plan

### Phase 1: Create `<MultiInputField />` Component
**Status:** COMPLETE
**Effort:** Small | **Impact:** HIGH (foundation for everything)

**Tasks:**
- [x] 1.1 Create `components/shared/MultiInputField.tsx`
      — Reusable component that renders a dynamic list of text inputs
      — Props: `value: string`, `onChange: (value: string) => void`, `label: string`,
        `placeholder?: string`, `addButtonText?: string`, `minRows?: number`
      — Splits `value` by comma into internal `string[]` state
      — Each row: text input + remove button (x)
      — First row never removable (always at least 1 input visible)
      — `+ Add` button appends new empty row
      — On any input change or row add/remove: joins back to comma-separated, calls onChange
      — Neuron styling: `#12332B` labels, `var(--neuron-ui-border)` borders,
        `#0F766E` focus rings, clean white backgrounds
      — Compact layout: small gap between rows, subtle remove button

**Files Created:**
- `components/shared/MultiInputField.tsx`

**Design Notes:**
```
┌─ MBL/MAWB ──────────────────────────┐
│ [ MSCU123456789              ] [ × ] │
│ [ COSU987654321              ] [ × ] │
│ [+ Add MBL/MAWB                   ] │
└──────────────────────────────────────┘
```

- Remove button: small, subtle, only on hover or always visible (tight × icon)
- Add button: text button with Plus icon, Neuron teal color
- Input styling: matches existing form inputs in creation panels
- No outer card wrapper — the component sits inside existing grid layouts

---

### Phase 2: Convert Creation Panels
**Status:** COMPLETE
**Effort:** Medium | **Impact:** HIGH (user-facing improvement)

**Tasks:**
- [x] 2.1 `CreateBrokerageBookingPanel.tsx`:
      - Replace `mblMawb` single input with `<MultiInputField />` (IMPORT)
      - Replace `bookingConfirmationNumber` single input with `<MultiInputField />` (EXPORT)
      - Both share the same grid slot — swap based on `movement`
      - Replace `registryNumber` single input with `<MultiInputField />`
      - No submission format change needed (already stores as string)
- [x] 2.2 `CreateTruckingBookingPanel.tsx`:
      - Replace `vehicleReferenceNumber` single input with `<MultiInputField />`
      - No submission format change needed
- [x] 2.3 `CreateForwardingBookingPanel.tsx`:
      - Replace `mblMawb` single input with `<MultiInputField />` (IMPORT)
      - Replace `bookingReferenceNumber` single input with `<MultiInputField />` (EXPORT)
      - Replace `containerNumbers` single input with `<MultiInputField />`
      - Submit handler already does `.split(",").map().filter()` for containerNumbers
- [x] 2.4 `CreateForwardingBookingModal.tsx`:
      - Same changes as 2.3 (mirror of the panel)

**Files Modified:**
- `components/operations/CreateBrokerageBookingPanel.tsx`
- `components/operations/CreateTruckingBookingPanel.tsx`
- `components/operations/forwarding/CreateForwardingBookingPanel.tsx`
- `components/operations/forwarding/CreateForwardingBookingModal.tsx`

---

### Phase 3: Convert Detail Views
**Status:** COMPLETE
**Effort:** Medium-Large | **Impact:** HIGH (consistent UX across create + view)

Detail views use an inline `EditableField` component pattern. We need to either:
- (A) Create an `<EditableMultiInputField />` variant, OR
- (B) Integrate multi-input mode into the existing `EditableField` via a prop

Decision: **(A) Create a new component** — cleaner separation, no risk of breaking
existing single-value EditableField usage.

**Tasks:**
- [x] 3.1 Create `components/shared/EditableMultiInputField.tsx`
      — Same multi-input UI as `MultiInputField`
      — Adds inline edit mode: shows values as chips/tags when not editing,
        switches to input list on click
      — Props: `fieldName`, `label`, `value: string`, `status`, `placeholder`,
        `onSave: (value: string) => void`, `addButtonText`
      — Saves on blur or explicit save action
- [x] 3.2 `BrokerageBookingDetails.tsx`:
      - Replace `mblMawb` EditableField with `<EditableMultiInputField />` (IMPORT)
      - Replace `bookingConfirmationNumber` EditableField with `<EditableMultiInputField />` (EXPORT)
      - Replace `registryNumber` EditableField with `<EditableMultiInputField />`
      - Replace `containerNumbers` EditableField with `<EditableMultiInputField />`
- [x] 3.3 `TruckingBookingDetails.tsx`:
      - Replace `vehicleReferenceNumber` EditableField with `<EditableMultiInputField />`
- [x] 3.4 `ForwardingBookingDetails.tsx`:
      - Replace `mblMawb` EditableField with `<EditableMultiInputField />` (IMPORT)
      - Replace `bookingReferenceNumber` EditableField with `<EditableMultiInputField />` (EXPORT)
      - Replace `containerNumbers` EditableField with `<EditableMultiInputField />`
        (note: Forwarding stores containerNumbers as `string[]` — join for display,
         split on save, same as current behavior)

**Files Created:**
- `components/shared/EditableMultiInputField.tsx`

**Files Modified:**
- `components/operations/BrokerageBookingDetails.tsx`
- `components/operations/TruckingBookingDetails.tsx`
- `components/operations/forwarding/ForwardingBookingDetails.tsx`

---

### Phase 4: Blueprint Updates & Cleanup
**Status:** COMPLETE
**Effort:** Small | **Impact:** LOW (housekeeping)

**Tasks:**
- [x] 4.1 Update `DERIVED_QUANTITIES_BLUEPRINT.md` with note about multi-input UI
      (clarify that `countEntries()` continues to work — no parsing changes needed)
- [x] 4.2 Update this blueprint to mark ALL COMPLETE
- [x] 4.3 Verify `countEntries()` in `contractQuantityExtractor.ts` handles both formats
      (it already does — `string` split by comma, `string[]` by array length)

**Files Modified:**
- `docs/blueprints/DERIVED_QUANTITIES_BLUEPRINT.md`
- `docs/blueprints/MULTI_INPUT_FIELDS_BLUEPRINT.md`

---

### Phase 5: Section-Level Edit Mode
**Status:** COMPLETE
**Effort:** Medium | **Impact:** HIGH (enhanced user experience)

**Tasks:**
- [x] 5.1 Create `components/shared/EditableSectionCard.tsx`
      — Card component with Edit/Save/Cancel toggle
      — Props: `title`, `status`, `onChange: (value: any) => void`, `onSave: (value: any) => void`, `onCancel: () => void`
      — Uses `useSectionEdit` hook to manage edit mode and changes
- [x] 5.2 Update `EditableField.tsx` to support controlled usage
      — Add `mode` and `onChange` props
      — Use `mode` to determine if field is editable
      — Use `onChange` to propagate changes
- [x] 5.3 Update `EditableMultiInputField.tsx` to support controlled usage
      — Add `mode` and `onChange` props
      — Use `mode` to determine if field is editable
      — Use `onChange` to propagate changes
- [x] 5.4 Refactor `ForwardingBookingDetails.tsx`
      — Each section (General Info, Shipment, Container, Warehouse) now has an Edit/Save/Cancel toggle
      — Fields are read-only by default, editable only when section is in edit mode
      — Changes are batched per section and diffed against original on Save
      — Other booking detail views (Brokerage, Trucking, etc.) can follow the same pattern

**Files Created:**
- `components/shared/EditableSectionCard.tsx`

**Files Modified:**
- `components/shared/EditableField.tsx`
- `components/shared/EditableMultiInputField.tsx`
- `components/operations/forwarding/ForwardingBookingDetails.tsx`

---

## Dependency Graph

```
Phase 1 (MultiInputField component)
  |
  +---> Phase 2 (Creation Panels)           --> [4 files]
  |
  +---> Phase 3 (Detail Views)              --> [1 new + 3 files]
  |
  +---> Phase 4 (Cleanup & Blueprint Sync)  --> [Documentation]
  |
  +---> Phase 5 (Section Edit Mode)         --> [3 new + 4 files]
```

Phase 1 is prerequisite for Phase 2 and Phase 3.
Phases 2 and 3 are independent of each other.
Phase 4 comes last.

---

## File Map (Quick Reference)

| Purpose | File |
|---------|------|
| Blueprint (this file) | `docs/blueprints/MULTI_INPUT_FIELDS_BLUEPRINT.md` |
| MultiInputField (Phase 1) | `components/shared/MultiInputField.tsx` |
| EditableMultiInputField (Phase 3) | `components/shared/EditableMultiInputField.tsx` |
| EditableSectionCard (Phase 5) | `components/shared/EditableSectionCard.tsx` |
| EditableField (Phase 5) | `components/shared/EditableField.tsx` |
| Brokerage Creation (Phase 2) | `components/operations/CreateBrokerageBookingPanel.tsx` |
| Trucking Creation (Phase 2) | `components/operations/CreateTruckingBookingPanel.tsx` |
| Forwarding Creation Panel (Phase 2) | `components/operations/forwarding/CreateForwardingBookingPanel.tsx` |
| Forwarding Creation Modal (Phase 2) | `components/operations/forwarding/CreateForwardingBookingModal.tsx` |
| Brokerage Details (Phase 3) | `components/operations/BrokerageBookingDetails.tsx` |
| Trucking Details (Phase 3) | `components/operations/TruckingBookingDetails.tsx` |
| Forwarding Details (Phase 3) | `components/operations/forwarding/ForwardingBookingDetails.tsx` |
| Quantity Extractor (no change) | `utils/contractQuantityExtractor.ts` |
| Derived Quantities Blueprint (Phase 4) | `docs/blueprints/DERIVED_QUANTITIES_BLUEPRINT.md` |

---

## Progress Log

| Date | Phase | Action | Notes |
|------|-------|--------|-------|
| 2026-02-23 | Phase 0 | Blueprint created | Full field audit complete. 4-phase plan. Pure UI refactor — no storage/backend/type changes. |
| 2026-02-23 | Phase 0 | Blueprint updated | EXPORT fields (Booking Confirmation No., Booking Reference No.) added to multi-input scope. Flexibility over rigidity. |
| 2026-02-23 | Phase 1 | COMPLETE | Created `MultiInputField.tsx`. Supports comma-separated string I/O, dynamic add/remove rows, Enter to add, Backspace on empty to remove, auto-focus on new rows, Neuron styling. |
| 2026-02-23 | Phase 2 | COMPLETE | Converted all 4 creation panels: Brokerage (mblMawb/bookingConfirmationNumber + registryNumber), Trucking (vehicleReferenceNumber), Forwarding Panel (mblMawb/bookingReferenceNumber + containerNumbers), Forwarding Modal (mblMawb + containerNumbers). |
| 2026-02-23 | Phase 3 | COMPLETE | Created `EditableMultiInputField.tsx` with view/edit modes (view shows green pills, edit shows dynamic input rows with Save/Cancel). Wired into all 3 detail views: Brokerage (mblMawb/bookingConfirmationNumber + registryNumber + containerNumbers), Trucking (vehicleReferenceNumber), Forwarding (mblMawb/bookingReferenceNumber + containerNumbers). |
| 2026-02-23 | Phase 4 | COMPLETE | Updated `DERIVED_QUANTITIES_BLUEPRINT.md` with multi-input note. Verified `countEntries()` handles both formats. This blueprint marked ALL COMPLETE. |
| 2026-02-24 | Phase 5 | COMPLETE | Section-level edit mode for booking detail views. Created shared `EditableSectionCard` + `useSectionEdit` hook + shared `EditableField`. Added `mode` and `onChange` props to `EditableMultiInputField` for controlled usage. Refactored `ForwardingBookingDetails` — each section (General Info, Shipment, Container, Warehouse) now has an Edit/Save/Cancel toggle. Fields are read-only by default, editable only when section is in edit mode. Changes are batched per section and diffed against original on Save. Other booking detail views (Brokerage, Trucking, etc.) can follow the same pattern. |