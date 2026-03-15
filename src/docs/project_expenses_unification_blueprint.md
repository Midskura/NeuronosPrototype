# Project Expenses Unification Blueprint

## Objective
Fix the Project Detail view to use the correct `ProjectExpensesTab` component, which contains the new E-Voucher logic. Eliminate the legacy `ProjectExpenses` component to remove confusion and dead code.

## Current State
- `ProjectExpensesTab.tsx` (New): Contains the correct logic for E-Vouchers, filtering, and status badges.
- `ProjectExpenses.tsx` (Old): Deleted.
- `ProjectDetail.tsx`: Updated to use the new `ProjectExpensesTab` component.

## Implementation Plan

### Phase 1: Connect the Correct Component
- [x] **1.1 Update ProjectDetail.tsx**
    - Imported `ProjectExpensesTab` from `../ProjectExpensesTab`.
    - Replaced `<ProjectExpenses financials={financials} />` with `<ProjectExpensesTab project={project} currentUser={currentUser} />`.

### Phase 2: Cleanup Dead Code
- [x] **2.1 Delete Legacy Component**
    - Deleted `/components/projects/tabs/ProjectExpenses.tsx`.

## Status Log
- **[2026-02-12]**: Phase 1 & 2 Complete.
    - Updated `ProjectDetail.tsx` to use the correct `ProjectExpensesTab` component.
    - Deleted the old `ProjectExpenses.tsx` file to avoid confusion.
