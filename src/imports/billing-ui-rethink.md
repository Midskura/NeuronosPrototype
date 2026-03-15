Good pushback. Let me rethink.

On Point 1: Keeping 0-item bookings visible
You're right — in freight forwarding workflow, a booking showing ₱0.00 with 0 items is actually a signal, not noise. It tells the billing clerk "this booking exists but nobody has started costing it yet." That's actionable information. Hiding it would create a blind spot. I retract that recommendation.

The fix isn't hiding them — it's making them visually distinct from bookings that have been worked on. A subtler card treatment (maybe a dashed border instead of solid, or a very light "No billing items yet" label) would let the eye quickly categorize without removing them from the flow.

On Point 2: No summary card
Agreed. Summary cards work in dashboards but in a billing worktable they're a distraction. The user is already inside the project — they know the context. Adding a summary bar is just one more thing to look past before getting to the actual work.

On Point 3: Nested table — honestly, yes, I think it works here
My earlier instinct to avoid nested tables was based on the SAP/Oracle pattern where you get 3-4 levels of nesting and lose all spatial orientation. But this is specifically one level of nesting — bookings → billing items — and there's a strong argument for it:

Why a nested table works for this case:

The data IS tabular. Billing items have consistent columns: Category, Description, Qty, Unit Price, Total, Status. That's textbook table data. The current card-accordion approach is actually fighting the natural shape of the data
Density. A table row is ~36-40px. A pricing row card with padding is ~50-60px. At 5 items per booking × 15 bookings, that difference adds up to hundreds of pixels of wasted vertical space
Scannability. Aligned columns let the eye scan vertically — "let me check all the amounts" becomes a single column scan instead of hunting through individual cards
Familiar mental model. Your users are freight forwarders. They live in Excel. A table-within-a-table is exactly how they already think about this data — one sheet per booking, rows per line item
What makes it NOT the SAP trap:

Only 1 level of nesting (booking → items), not 3-4
The parent row (booking) is visually distinct from child rows (billing items) — different background, bold styling, acts as a collapsible header
The inner table shares column alignment with other booking groups, so the whole page reads as one coherent grid
How I'd structure it:

The booking header row spans the full width as a collapsible bar (similar to what you have now). When expanded, the child rows render as real table rows underneath — same column grid, slightly indented or with a left-border accent. No card styling on individual items, just clean rows. This essentially turns the whole billings section into a single grouped table rather than a stack of independent accordions.

The key detail: all booking groups should share the same column widths. Right now each accordion is its own isolated world. If they shared a unified column grid, the user could scan vertically across bookings — comparing amounts, spotting status patterns — without expanding/collapsing.

Want me to go ahead with this? The change would essentially be: replace the accordion-of-cards pattern with a single grouped table where booking headers act as collapsible row dividers.