# Project Detail: QuickBooks-Style Transformation

## Analysis of Screenshot
The provided screenshot (QuickBooks Online Project View) features a highly efficient layout that we can adapt. It uses horizontal density rather than vertical stacking.

## 1. The "Profit Hero" Section (New Design)
Currently, we have a math equation `Income - Cost = Profit`. The screenshot uses a compact **Comparison Chart**.

**Proposed Structure:**
- **Container:** Single white row, consistent height (approx 100px).
- **Left Column (Margin):** 
  - Large Percentage Text (e.g., "100%").
  - Label "PROFIT MARGIN".
- **Middle Column (Visual Bars):**
  - **Income Row:** Label "Income" -> Green Bar -> Amount ($150.00).
  - **Costs Row:** Label "Costs" -> Gray/Red Bar -> Amount ($0.00).
  - *Note:* This visualizes the gap immediately without needing mental math.
- **Right Column (Cash Flow):**
  - Separated by a vertical divider.
  - "Open" Invoices amount.
  - "Overdue" Invoices amount.

## 2. Transactions Tab Refinement
The screenshot shows a very clean table with specific columns that enhance utility.

**Proposed Updates:**
- **Header:** Add a pill-shaped "Filter" button + "Last 365 Days" text label.
- **Columns to Standardize:**
  1.  **DATE**: Standard date.
  2.  **TYPE**: "Invoice", "Bill", "Expense".
  3.  **NO.**: Voucher # or Ref #.
  4.  **DUE DATE**: Critical for cash flow planning.
  5.  **BALANCE**: (New) How much is still owed on this specific transaction.
  6.  **TOTAL**: Original amount.
  7.  **STATUS**: "Open", "Paid", "Overdue".
  8.  **ACTION**: "Receive payment" (for invoices) or "Mark paid" (for bills).

## 3. General "Look & Feel"
- **Backgrounds:** Strictly White (#FFFFFF).
- **Borders:** Subtle Gray (#E5E9F0).
- **Shadows:** None.
- **Tabs:** Keep the "Customer Ledger" pill style (as per your previous instruction), but ensure the content *inside* follows the screenshot's density.

## Implementation Status
- [x] **Profit Hero Section**: Replaced equation with QBO-style bar chart comparison + margin KPI.
- [x] **Transactions Table**: Added columns (Due Date, Balance, Action), updated styling to be cleaner/denser, added "Last 365 days" label.
