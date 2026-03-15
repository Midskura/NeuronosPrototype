# Contract Banner Redesign Blueprint

## Problem

The current contract detection banner in the Quotation Builder feels "added-on" — it uses a distinct visual language (teal background fill, notification-style layout) that doesn't match the structural grammar of the other cards (white backgrounds, consistent borders, section headers). It sits as a standalone card between General Details and Service Forms, interrupting the linear form flow.

### Current Layout Flow
```
General Details Card
↓
[Contract Banner Card]  ← notification-style card, foreign visual language
↓
Brokerage Service Card
↓
Trucking Service Card
↓
Selling Prices
```

## Solution: Option A — Structural Integration

Split the banner into two pieces that each live where they belong:

### 1. Contract Identity → Inside General Details
A read-only "Linked Contract" field row appears inside the General Details card, directly below the Customer field. Styled identically to the other fields — same label weight, same grey background for the value display. Shows the contract reference number, name, and validity period. Includes loading and "no contract found" inline states.

### 2. Rate Actions → Inside Each Service Form Header
Each service card's `<h2>` header row gets a right-aligned inline toolbar showing:
- **Before apply**: muted "Contract rates available" text + small "Apply" ghost button
- **After apply**: teal "✓ Applied · 20ft/40ft · PHP 45,000" with a "View Breakdown" link

### Target Layout Flow
```
General Details Card
  └─ Linked Contract: CQ2602213621 — Contract Development (Feb 21 – Dec 30, 2026)
↓
Brokerage Service ─────────────── [✓ Applied · 20ft/40ft · PHP 45,000 │ View Breakdown]
↓
Trucking Service ──────────────── [Contract rates available │ Apply]
↓
Selling Prices
```

No standalone banner. Perfect linear flow. Information lives where it's actionable.

## Phasing

### Phase 1 — Contract Reference Field in General Details
**Files**: `GeneralDetailsSection.tsx`, `QuotationBuilderV3.tsx`

| Task | Description |
|---|---|
| 1.1 | Add new props to `GeneralDetailsSection`: `contractDetection?: { loading: boolean; contract: ContractSummary \| null; noContractFound: boolean }` |
| 1.2 | Render "Linked Contract" field row below Customer — three states: loading spinner, contract found (teal reference with validity), no contract found (amber subtle text) |
| 1.3 | In `QuotationBuilderV3.tsx`, compute and pass the `contractDetection` prop |

### Phase 2 — ContractRateToolbar Component
**Files**: `components/pricing/quotations/ContractRateToolbar.tsx`

| Task | Description |
|---|---|
| 2.1 | Create `ContractRateToolbar` component with two display modes: "available" (Apply button) and "applied" (status + View Breakdown link) |
| 2.2 | Props: `status: "available" \| "applied"`, `onApply`, `onViewBreakdown`, `loading`, `rateBridgeInfo` (mode, units, total) |
| 2.3 | Style: compact inline bar, fits right-aligned in a flex header row. Uses existing Neuron tokens. |

### Phase 3 — Service Form Header Integration
**Files**: `BrokerageServiceForm.tsx`, `ForwardingServiceForm.tsx`, `TruckingServiceForm.tsx`, `MarineInsuranceServiceForm.tsx`, `OthersServiceForm.tsx`, `QuotationBuilderV3.tsx`

| Task | Description |
|---|---|
| 3.1 | Add `headerToolbar?: React.ReactNode` prop to all 5 service forms |
| 3.2 | Change each form's `<h2>` wrapper to a flex row: `<div flex between><h2>Title</h2>{headerToolbar}</div>` |
| 3.3 | In `QuotationBuilderV3.tsx`, render `<ContractRateToolbar>` via the `headerToolbar` prop for each contract-covered service |

### Phase 4 — Remove Standalone Banner + Cleanup
**Files**: `QuotationBuilderV3.tsx`

| Task | Description |
|---|---|
| 4.1 | Remove the entire standalone contract banner block (the `div` with `#F0FAFA` background, teal border, loading state, per-service rows, Apply All button, no-contract-found amber notice) |
| 4.2 | Remove any orphaned imports or state that were only used by the banner (e.g. `AlertTriangleIcon` if no longer needed, `Link2` if moved) |
| 4.3 | Verify view mode: toolbar should NOT render in view mode (contract reference field should still show) |
| 4.4 | Test edge cases: no customer entered, customer with no contract, customer with contract but no matching services |

## Status

| Phase | Status |
|---|---|
| Phase 1 — Contract Reference Field in General Details | COMPLETE |
| Phase 2 — ContractRateToolbar Component | COMPLETE |
| Phase 3 — Service Form Header Integration | COMPLETE |
| Phase 4 — Remove Standalone Banner + Cleanup | COMPLETE |

## Changelog

- **2026-02-25**: Blueprint created. Full layout analysis complete, all touch points identified.
- **2026-02-25**: All 4 phases implemented in a single pass:
  - Phase 1: Added `ContractDetection` interface and `contractDetection` prop to `GeneralDetailsSection`. Renders "Linked Contract" field row with 4 states: idle (dash), loading (spinner), contract found (teal Link2 + quote number + name + validity), no contract found (amber AlertTriangle). Wired in `QuotationBuilderV3.tsx` — only shown for project quotations (`quotationType !== "contract"`).
  - Phase 2: Created `ContractRateToolbar` component with "available" (Apply ghost button) and "applied" (checkmark + mode/units/total + View Breakdown link) modes. Includes optional `note` prop for edge-case warnings.
  - Phase 3: Added `headerToolbar?: ReactNode` prop to all 5 service forms (`BrokerageServiceForm`, `ForwardingServiceForm`, `TruckingServiceForm`, `MarineInsuranceServiceForm`, `OthersServiceForm`). Changed each `<h2>` to a flex row with right-aligned toolbar slot. Added `renderContractToolbar(service)` helper in `QuotationBuilderV3.tsx` with viewMode + contractMode guards, Brokerage subtype note.
  - Phase 4: Removed entire standalone contract banner block (~230 lines). Cleaned orphaned imports (`Link2`, `AlertTriangleIcon`, `formatContractValidity`).
  - User manually edited `ContractRateToolbar.tsx` after initial creation.