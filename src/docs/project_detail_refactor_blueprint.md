# Project Detail Page Refactor - Live Blueprint

## Objective
Restructure the Project Detail page into a comprehensive "Project Financial Hub" inspired by QuickBooks but tailored for Neuron OS (Freight Forwarding).

## Status Legend
- [ ] Pending
- [x] Completed
- [~] In Progress

## Phase 1: Structural Foundation & Hero Section
- [x] **Layout Skeleton**: Convert to a Dashboard + Tabs layout (Header, Hero, Tabs, Content).
- [x] **Header**: Implement Project Context (Name, ID, Status) and Primary Actions (Add Income, Add Expense).
- [x] **Hero Section**: Build the "Profit Equation" component (Income - Cost = Profit) and Margin Progress Bar.
- [x] **Tab Navigation**: specific tabs: Overview, Transactions, Invoices, Bills.

## Phase 2: The Overview Tab (Dashboard)
- [x] **Data Aggregation**: Implement logic to group financial data by Category (Charge Codes for Income, Expense Types for Cost).
- [x] **Split Ledger View**: Create the side-by-side comparison grid (Income Breakdown vs. Cost Breakdown).
- [x] **KPI Cards**: Update KPI cards to align with the new design (Open Invoices, Overdue, etc.).

## Phase 3: The Transaction Lists (Invoices & Bills)
- [x] **Invoices Tab**: Dedicated table for Receivables with Payment Status (Open, Paid, Overdue).
- [x] **Bills Tab**: Dedicated table for Payables with Approval and Payment Status.
- [x] **Transactions Tab**: Unified audit trail (all events chronological).

## Phase 4: Data Integration & Polish
- [x] **Filtering**: Status filtering (All, Paid, Open, Overdue) implemented for all lists.
- [x] **Empty States**: specialized empty states for each tab.
- [x] **Responsive Check**: Grid layouts optimized for mobile/tablet with `md:grid-cols-2` and table overflow protection.

## Phase 5: Visual Alignment (Customer Ledger Style)
- [x] **Header Redesign**: Adopted `CustomerLedgerDetail` style (80px Icon Box, Metadata Grid, Back Button color).
- [x] **Tab Redesign**: Switched to "Pill" style tabs with icons and count badges.
- [x] **Typography**: Standardized font sizes (13px body, 11px headers) and colors (`#0F766E` accents).
- [x] **Layout**: Moved "Profit Equation" inside Overview tab to clean up the header.

## Final Review
- The Project Detail Page is now visually consistent with the Customer Ledger.
- It acts as a "Financial Hub" with deep drill-down capabilities.
