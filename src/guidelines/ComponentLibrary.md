# JJB OS Component Library

Component documentation for the logistics management system.

---

## Badge/Status
**Rule:** Always visible, not affected by filters.

Used to display booking status pills (For Delivery, In Transit, Delivered, Closed) in table rows. Status badges remain visible regardless of active filters - only the ActiveFiltersChips bar reflects applied filters.

**Colors:**
- For Delivery: Navy (#0A1D4D)
- In Transit: Orange (#F25C05)
- Delivered: Green (#10B981)
- Closed: Gray (#6B7280)

---

## Select/Type
**Rule:** Options = All, Import, Export, Domestic.

Dropdown filter for shipment type classification. Displays in the filters toolbar with rounded-full styling and orange border when active.

**Options:**
- All Types (default)
- Import
- Export
- Domestic

---

## Card/KeyFacts
**Rule:** Two-column grid for booking header facts.

Displays key booking information in the detail view header. Uses a 2-column grid layout with label-value pairs for quick reference data (tracking number, client, dates, etc.).

**Layout:**
- Grid: 2 columns
- Spacing: Consistent padding
- Style: Clean label/value pairs

---

## Toolbar/BulkActions
**Rule:** Sticky; appears on row selection.

Navy blue toolbar that appears at the top of the table when one or more bookings are selected. Contains bulk action buttons and displays selection count.

**Actions:**
- Print (primary, orange)
- Export CSV (outline)
- Mark In Transit (outline)
- Clear selection (X)

**Behavior:**
- Sticky positioning
- Slide-in animation
- Auto-hides when selection is cleared

---

## Pagination/Basic
**Rule:** Prev/Next only.

Simple pagination component with Previous and Next buttons. Displays current range of items being shown (e.g., "Showing 1 to 15 of 142 bookings").

**Features:**
- Shows item range: "Showing X to Y of Z bookings"
- Prev button (disabled on first page)
- Next button (disabled on last page)
- 15 items per page limit
- Auto-resets to page 1 on filter changes

---

## Filters/ActiveChips
**Rule:** Shows active filters and Clear link.

Displays currently active filters as removable chips with a "Clear filters" link. Appears between the filters toolbar and the data table.

**Layout:**
- Inline chips with label:value format
- Individual X buttons to remove filters
- "Clear filters" link on the right
- White background with border
- Rounded-full style

**Behavior:**
- Only visible when filters are active
- Each chip shows filter type and selected value
- Clicking X removes individual filter
- "Clear filters" removes all filters at once
