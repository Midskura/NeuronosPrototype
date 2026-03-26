# Seed & Crash Fix Blueprint

> Status: in-progress
> Last updated: 2026-03-20

---

## 1. Goal

Fix all empty/broken modules identified during the full-app module tour on 2026-03-20.
This covers two categories:

- **Crash fixes** — code bugs that break pages when data is absent
- **Seed gaps** — tables that are empty, causing modules to show blank states

Work is strictly step-by-step. Each phase must be confirmed complete before moving to the next.

---

## 2. Identified Gaps (from tour)

| # | Module | Type | Root Cause |
|---|---|---|---|
| 1 | Accounting → Catalog | CRASH | `catalog_items` table empty; `ChargeExpenseMatrix` throws `TypeError` accessing undefined key |
| 2 | Pricing → Quotations | EMPTY | No `quotations` rows with `quotation_type = 'spot'` |
| 3 | BD → Inquiries | NEAR-EMPTY | Only 1 untitled draft `inquiry`; no linked quotations or real data |
| 4 | Pricing → Reports | EMPTY (derivative) | Driven by #2 — no approved quotations → all KPIs zero |
| 5 | Operations → Reports | DATE MISMATCH | Bookings exist but fall outside the default filter window |
| 6 | Tickets | EMPTY | No rows in `tickets` table |
| 7 | Activity Log | EMPTY | No rows in `activity_logs` table |
| 8 | My Inbox | EMPTY | No tasks/notifications assigned to `exec@neuron.ph` |

---

## 3. Phases

---

### Phase 1 — Fix Accounting Catalog Crash
**Type:** Code fix + Seed
**Priority:** Highest — page is currently broken/inaccessible

**1a. Code fix** — `ChargeExpenseMatrix` (or its parent) must not crash when `catalog_items` is empty.
- Guard against undefined catalog map before keying into it
- Show an empty state ("No catalog items yet") instead of throwing

**1b. Seed** — Insert standard freight catalog items into `catalog_items`:
- Origin Handling Fee
- Destination Handling Fee
- Documentation Fee
- Customs Brokerage Fee
- Trucking / Drayage
- Marine Insurance Premium
- Storage / Demurrage
- Miscellaneous / Others

Status: ☐ Code fix | ☐ Seed applied

---

### Phase 2 — Seed Inquiries + Spot Quotations
**Type:** Seed (SQL via Supabase MCP)
**Tables:** `inquiries`, `quotations`

Seed 5 inquiries linked to existing customers (use IDs from `customers` table):
- 2 inquiries → `won` (linked to an approved spot quotation)
- 1 inquiry → `in-progress` (linked to a waiting-approval quotation)
- 1 inquiry → `quoted` (linked to a draft quotation)
- 1 inquiry → `lost`

Seed 4 spot quotations (`quotation_type = 'spot'`):
- 2 `approved` — with a `total_amount` > 0 to populate Pricing Reports KPIs
- 1 `waiting_approval`
- 1 `draft`

Status: ☐ Not started

---

### Phase 3 — Fix Operations Reports Date Filter
**Type:** Investigation → either data fix or code adjustment

The default filter window on Operations Reports appears to be `Oct 1–15, 2025`.
All 12 seeded bookings likely have dates outside this range.

**3a. Investigate** — Query `bookings` table for the actual `date` / `created_at` range.
**3b. Fix** — Either:
  - (Preferred) Update seeded booking dates to fall within a recent realistic window (e.g. Jan–Mar 2026)
  - (Alternative) Check whether the default filter range in the component should default to "All time" or "Last 30 days"

Status: ☐ Not started

---

### Phase 4 — Seed Tickets
**Type:** Seed (SQL via Supabase MCP)
**Table:** `tickets`

Seed 5 tickets:
- 2 `open` — different subjects, assigned to different users
- 2 `in-progress`
- 1 `resolved`

Include realistic freight-ops subjects: e.g. "BL correction request", "Cargo damage report", "Customer billing dispute".

Status: ☐ Not started

---

### Phase 5 — Seed Activity Log
**Type:** Seed (SQL via Supabase MCP)
**Table:** `activity_logs` (verify exact table name first)

Seed 10–15 representative audit events:
- Booking created, invoice approved, collection recorded, quotation submitted, etc.
- Spread across multiple users and timestamps

Status: ☐ Not started

---

### Phase 6 — Seed My Inbox
**Type:** Seed (SQL via Supabase MCP)
**Table:** Verify which table drives Inbox (likely `tasks` or a notifications table)

Seed 3 inbox items assigned to `exec@neuron.ph`:
- 1 pending approval
- 1 for-your-information
- 1 overdue follow-up

Status: ☐ Not started

---

## 4. Non-Goals

- **My Calendar** — "Coming soon" placeholder, not a data gap. Skip.
- **BD Contacts KPI activity** — Contacts show "Lead" with zero linked quotations/projects. This may be a UI computation issue, not a seed gap. Defer until after Phases 1–3.
- **Full HR payroll logic** — HR Timekeeping and Payroll are functional. No action needed.

---

## 5. Completion Criteria

- [ ] Accounting Catalog loads without crash (empty or with data)
- [ ] Pricing Quotations shows ≥ 4 spot quotation rows
- [ ] Pricing Reports shows non-zero approved rate and total value
- [ ] BD Inquiries shows ≥ 4 realistic inquiries
- [ ] Operations Reports shows bookings when default filter is applied
- [ ] Tickets shows ≥ 5 rows
- [ ] Activity Log shows ≥ 10 entries
- [ ] My Inbox shows ≥ 3 items for exec user

---

## 6. Execution Log

| Date | Phase | Action | Result |
|---|---|---|---|
| 2026-03-20 | Audit | Full module tour completed | 8 gaps identified (see §2) |
