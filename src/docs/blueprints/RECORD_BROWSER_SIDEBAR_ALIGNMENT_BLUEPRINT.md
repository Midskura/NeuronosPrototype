# RecordBrowser Sidebar Alignment Blueprint

> Status: planning
> Last updated: 2026-03-23

---

## 1. Goal

Redesign `src/components/inbox/RecordBrowser.tsx` so it behaves and reads like a true Neuron sidebar-driven workspace instead of a generic two-pane picker.

The target is not just matching entity order. The target is visual and interaction parity with `src/components/NeuronSidebar.tsx` where that makes sense inside a `SidePanel`.

This blueprint covers UI structure, interaction rules, scope boundaries, and implementation phases.

No code should be written until explicit "Go Ahead".

---

## 2. Why This Needs a Redesign

The current `RecordBrowser` mirrors the sidebar taxonomy, but not the actual sidebar grammar:

- It uses an icon rail on the left instead of stacked module rows
- It uses top pills for child navigation instead of expandable sub-items
- It uses different active states than the sidebar
- It abbreviates labels (`Business Dev`) instead of matching app labels exactly
- It feels like a utility picker rather than a native Neuron workspace

Result: it looks detached from the rest of the app, even though the data model is roughly correct.

---

## 3. Confirmed Product Decisions

These are locked from user direction:

- Use a real sidebar-like left column layout inside the panel
- Widen the panel beyond `sm`
- Show only modules visible to the current user's department
- Hide non-linkable sidebar items entirely
- Use `Essentials` accounting shape for this browser
- Match sidebar labels exactly
- Match sidebar active-row treatment for module and child navigation
- Keep multi-select
- Keep selection feedback in the footer only
- Expand only the default department on open
- Show search at all times
- Use child icons in the left nav
- Keep result-row selection lighter than nav active states
- Let Executive browse records normally across visible sections
- Do not solve HR behavior in this pass

---

## 4. UX Direction

### Layout

Use a two-column panel:

- Left: sidebar-style navigation column
- Right: search + results pane

Recommended panel width:

- Target `720px` custom width
- Wide enough for true sidebar hierarchy
- Narrow enough to avoid overwhelming the compose experience

### Navigation Model

The left column should emulate the real sidebar structure:

- Parent module rows use the same labels, icons, spacing, and chevron affordance as the main sidebar
- Child rows render beneath expanded modules
- Only one child row is active at a time
- Only the default department is expanded when the panel opens
- Non-linkable items are omitted entirely rather than shown disabled

### Content Model

The right pane stays intentionally minimal:

- Always-visible search input at the top
- No extra page-style breadcrumb/header for now
- Simple list rows with checkbox, primary label, muted sublabel, optional status badge
- Footer carries selected count and primary link action

This keeps the navigation visually rich while the results remain calm.

---

## 5. Sidebar Parity Rules

`RecordBrowser` should follow these sidebar rules as closely as possible:

### Parent rows

- Height: match sidebar parent row rhythm (`40px`)
- Icon size: match sidebar parent icon treatment
- Hover: use sidebar hover token language
- Active/expanded state: use sidebar-selected tint/border language where appropriate
- Labels: exact text from sidebar, including `Business Development`

### Child rows

- Height: match sidebar sub-item rhythm (`36px`)
- Include child icons
- Use sidebar active row treatment, not pills
- Use same spacing and left indentation pattern as the real sidebar

### Colors and tokens

Use existing Neuron tokens from `src/styles/globals.css`:

- `--neuron-state-hover`
- `--neuron-state-selected`
- `--neuron-ui-active-border`
- `--neuron-ink-secondary`
- `--neuron-ink-muted`
- `--neuron-brand-green`
- `--neuron-ui-border`
- `--neuron-ui-divider`

Avoid introducing a separate mini design language for this component.

---

## 6. Visibility and Browsing Rules

### Department visibility

Show only modules visible to the current user, matching the real sidebar visibility logic:

- Business Development users: Business Development only
- Pricing users: Pricing only
- Operations users: Operations only
- Accounting users: Accounting only
- Executive users: all visible business modules in scope for linking

### Linking scope

Only linkable child items appear. Non-linkable sidebar items are excluded.

Included shapes:

- Business Development: Contacts, Customers, Inquiries, Projects, Contracts
- Pricing: Contacts, Customers, Quotations, Projects, Contracts
- Operations: Forwarding, Brokerage, Trucking, Marine Insurance, Others
- Accounting (`Essentials` version for this browser): Customers, Projects, Contracts, Bookings

Excluded from browser nav:

- Tasks
- Activities
- Budget Requests
- Reports
- Vendors
- Transactions
- E-Vouchers
- Billings
- Invoices
- Collections
- Expenses
- Chart of Accounts
- Financials
- HR

### Search behavior

Search input is always visible.

Browsing rules:

- Regular users remain in search-first mode for sections they do not own
- Executive users can browse records normally across visible sections without entering search first

### Default open state

On open:

- Expand the default department module only
- Auto-select the first child item in that module
- Keep the right pane ready for search
- Do not preload broad result sets for search-first users

---

## 7. Results Pane Rules

The results area should not mimic the sidebar too aggressively.

Keep it lighter than the nav:

- Checkbox on the left
- Primary label
- One secondary line
- Optional status badge
- Soft selected state
- Subtle hover state

Do not:

- Turn result rows into cards
- Add rich metadata blocks
- Add a selected-chip strip above results
- Use heavy green active styling that competes with nav selection

---

## 8. Recommended Technical Approach

### A. Replace duplicated visual logic with sidebar-aligned config

The current browser duplicates taxonomy but not sidebar behavior. To get closer to true parity:

- Refactor `RecordBrowser` nav config so it models parent modules and child items in the same shape as the sidebar
- Use exact labels and icon assignments from `NeuronSidebar`
- Keep the browser-specific data fetch metadata attached to child items

### B. Match sidebar rendering patterns

Rebuild the left pane using:

- expandable parent buttons
- child nav rows
- chevrons
- sidebar spacing and active states

The top pill strip should be removed entirely.

### C. Keep browser-specific behavior isolated to the right pane

The right pane remains responsible for:

- search input
- search-only hint states
- fetching records
- multi-select
- footer summary and primary action

### D. Use custom width instead of changing shared `SidePanel` sizes

Prefer passing a custom width to `SidePanel` rather than redefining shared size semantics.

Recommended starting width: `720px`

---

## 9. Implementation Phases

### Phase 1 - Information Architecture Alignment

**Deliverable:** browser nav model rewritten to match sidebar structure

- Replace current section/entity model with parent/child sidebar-style nav model
- Align labels and icons exactly with `NeuronSidebar`
- Restrict modules by current-user visibility
- Apply `Essentials` accounting subset
- Exclude all non-linkable items

Status: ☐ Not started

### Phase 2 - Sidebar-Style Left Navigation

**Deliverable:** left column rendered like a compact Neuron sidebar inside the panel

- Remove icon rail
- Remove top child pills
- Add expandable parent rows with chevrons
- Add child rows with icons
- Match parent/child heights and spacing
- Match hover and active states to Neuron tokens
- Expand only the default department on open

Status: ☐ Not started

### Phase 3 - Right Pane Simplification

**Deliverable:** cleaner search/results pane that complements the new nav

- Keep always-visible search
- Preserve search-first behavior where required
- Preserve Executive browse behavior
- Keep rows light and list-like
- Ensure selected rows remain readable but visually secondary to nav
- Preserve existing status badges where still useful

Status: ☐ Not started

### Phase 4 - Panel Sizing and Fit

**Deliverable:** balanced layout that feels native inside compose flows

- Widen `RecordBrowser` via custom `SidePanel` width
- Tune left/right column proportions
- Verify compose screen does not feel overcrowded
- Check desktop behavior and minimum usable width

Status: ☐ Not started

### Phase 5 - Polish and Regression Pass

**Deliverable:** final QA pass on usability and consistency

- Verify multi-select persists across child switches
- Verify footer count and link action still work
- Verify already-linked records remain disabled
- Verify Executive visibility and browse behavior
- Verify default-department open state
- Verify no non-linkable entities leak into the browser

Status: ☐ Not started

---

## 10. Files Expected to Change

Primary:

- `src/components/inbox/RecordBrowser.tsx`

Possible supporting files:

- `src/components/common/SidePanel.tsx` only if minor panel-fit adjustments are truly needed
- shared helper/config file only if nav metadata extraction becomes clearly cleaner than keeping it local

Do not modify protected files.

---

## 11. Risks and Watchouts

### Risk 1 - False parity through duplication

If `RecordBrowser` copies labels manually but not the sidebar structure, it will drift again.

Mitigation:

- Rebuild around sidebar-like parent/child data shape, not just reordered arrays

### Risk 2 - Overdesigning the results pane

If both the nav and results become visually heavy, the browser will feel cluttered.

Mitigation:

- Keep results lighter than nav
- Keep selection summary in footer only

### Risk 3 - Width creep

If the panel grows too wide, it will overpower the compose layout.

Mitigation:

- Start at `720px`
- Increase only if the nav genuinely feels cramped

### Risk 4 - Search-first friction

Search-first is good for containment, but it can feel empty if not communicated well.

Mitigation:

- Keep a clear empty hint for search-only states
- Preserve Executive browse exception

---

## 12. Open Items

These are intentionally deferred, not blockers:

- HR fallback behavior
- Whether nav metadata should be extracted into a shared source for both sidebar and browser
- Whether result-row status badges should be normalized further

---

## 13. Execution Log

| Date | Phase | Action | Result |
|---|---|---|---|
| 2026-03-23 | Planning | Interviewed product direction for RecordBrowser redesign | UI direction locked and blueprint written |
