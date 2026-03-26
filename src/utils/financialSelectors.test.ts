import { describe, it, expect } from "vitest";
import {
  collectLinkedBookingIds,
  buildServiceToBookingMap,
  resolveBookingIdForService,
  filterBillingItemsForScope,
  filterInvoicesForScope,
  filterCollectionsForScope,
  mapExpenseRowsForScope,
  mapEvoucherExpensesForScope,
} from "./financialSelectors";

type RawRow = Record<string, unknown>;

// ── collectLinkedBookingIds ─────────────────────────────────────────────────

describe("collectLinkedBookingIds", () => {
  it("extracts string entries", () => {
    expect(collectLinkedBookingIds(["a", "b", "c"])).toEqual(["a", "b", "c"]);
  });

  it("extracts bookingId from objects", () => {
    expect(collectLinkedBookingIds([{ bookingId: "x" }, { bookingId: "y" }])).toEqual(["x", "y"]);
  });

  it("falls back to id when bookingId is missing", () => {
    expect(collectLinkedBookingIds([{ id: "z" }])).toEqual(["z"]);
  });

  it("deduplicates", () => {
    expect(collectLinkedBookingIds(["a", "a", { bookingId: "a" }])).toEqual(["a"]);
  });

  it("skips empty/whitespace strings", () => {
    expect(collectLinkedBookingIds(["", "  ", "valid"])).toEqual(["valid"]);
  });

  it("returns empty for undefined input", () => {
    expect(collectLinkedBookingIds(undefined)).toEqual([]);
  });
});

// ── buildServiceToBookingMap ────────────────────────────────────────────────

describe("buildServiceToBookingMap", () => {
  it("maps service type to booking id (lowercase key)", () => {
    const map = buildServiceToBookingMap([
      { serviceType: "Forwarding", bookingId: "b1" },
      { service_type: "Trucking", id: "b2" },
    ]);
    expect(map.get("forwarding")).toBe("b1");
    expect(map.get("trucking")).toBe("b2");
  });

  it("skips entries without service type", () => {
    const map = buildServiceToBookingMap([{ bookingId: "b1" }]);
    expect(map.size).toBe(0);
  });
});

// ── resolveBookingIdForService ──────────────────────────────────────────────

describe("resolveBookingIdForService", () => {
  it("returns direct bookingId when provided", () => {
    expect(resolveBookingIdForService({ bookingId: "direct" })).toBe("direct");
  });

  it("resolves via linkedBookings when no direct bookingId", () => {
    expect(
      resolveBookingIdForService({
        serviceType: "Forwarding",
        linkedBookings: [{ serviceType: "Forwarding", bookingId: "b1" }],
      })
    ).toBe("b1");
  });

  it("returns null when nothing matches", () => {
    expect(resolveBookingIdForService({})).toBeNull();
    expect(resolveBookingIdForService({ serviceType: "Trucking", linkedBookings: [] })).toBeNull();
  });
});

// ── filterBillingItemsForScope ──────────────────────────────────────────────

describe("filterBillingItemsForScope", () => {
  it("filters by booking_id match", () => {
    const rows: RawRow[] = [
      { id: "1", booking_id: "b1" },
      { id: "2", booking_id: "b2" },
      { id: "3", booking_id: "b3" },
    ];
    const result = filterBillingItemsForScope(rows, ["b1", "b3"]);
    expect(result.map((r) => r.id)).toEqual(["1", "3"]);
  });

  it("filters by legacy container reference (project_number)", () => {
    const rows: RawRow[] = [
      { id: "1", project_number: "PRJ-001" },
      { id: "2", project_number: "PRJ-002" },
    ];
    const result = filterBillingItemsForScope(rows, [], "PRJ-001");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("matches source_booking_id as well", () => {
    const rows: RawRow[] = [{ id: "1", source_booking_id: "b1" }];
    const result = filterBillingItemsForScope(rows, ["b1"]);
    expect(result).toHaveLength(1);
  });

  it("matches booking_ids array entries", () => {
    const rows: RawRow[] = [{ id: "1", booking_ids: ["b1", "b2"] }];
    const result = filterBillingItemsForScope(rows, ["b2"]);
    expect(result).toHaveLength(1);
  });
});

// ── filterInvoicesForScope ──────────────────────────────────────────────────

describe("filterInvoicesForScope", () => {
  it("only includes visible invoices that match booking scope", () => {
    const rows: RawRow[] = [
      { id: "inv-1", status: "posted", booking_id: "b1" },
      { id: "inv-2", status: "reversed", booking_id: "b1" }, // included: visible (reversed original)
      { id: "inv-3", status: "posted", booking_id: "b99" }, // excluded: wrong booking
      { id: "inv-4", status: "cancelled", booking_id: "b1" }, // excluded: not visible
    ];
    const result = filterInvoicesForScope(rows, ["b1"]);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toContain("inv-1");
    expect(result.map((r) => r.id)).toContain("inv-2");
  });

  it("excludes reversal documents", () => {
    const rows: RawRow[] = [
      { id: "inv-1", status: "posted", booking_id: "b1", metadata: { reversal_of_invoice_id: "inv-0" } },
    ];
    const result = filterInvoicesForScope(rows, ["b1"]);
    expect(result).toHaveLength(0);
  });
});

// ── filterCollectionsForScope ───────────────────────────────────────────────

describe("filterCollectionsForScope", () => {
  it("matches by invoice_id", () => {
    const rows: RawRow[] = [
      { id: "c1", invoice_id: "inv-1", amount: 5000 },
      { id: "c2", invoice_id: "inv-99", amount: 3000 },
    ];
    const result = filterCollectionsForScope(rows, ["inv-1"]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("c1");
  });

  it("matches via linked_billings array", () => {
    const rows: RawRow[] = [
      { id: "c1", linked_billings: [{ id: "inv-1" }, { id: "inv-2" }] },
    ];
    const result = filterCollectionsForScope(rows, ["inv-2"]);
    expect(result).toHaveLength(1);
  });

  it("falls back to legacy container reference", () => {
    const rows: RawRow[] = [
      { id: "c1", project_number: "PRJ-001" },
    ];
    const result = filterCollectionsForScope(rows, [], "PRJ-001");
    expect(result).toHaveLength(1);
  });
});

// ── mapExpenseRowsForScope ──────────────────────────────────────────────────

describe("mapExpenseRowsForScope", () => {
  it("only includes approved/posted/paid/partial expenses matching scope", () => {
    const rows: RawRow[] = [
      { id: "e1", booking_id: "b1", status: "approved", amount: 1000, created_at: "2025-01-01" },
      { id: "e2", booking_id: "b1", status: "draft", amount: 2000, created_at: "2025-01-01" }, // excluded
      { id: "e3", booking_id: "b99", status: "approved", amount: 3000, created_at: "2025-01-01" }, // wrong booking
    ];
    const result = mapExpenseRowsForScope(rows, ["b1"]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("e1");
    expect(result[0].amount).toBe(1000);
  });

  it("maps output fields correctly", () => {
    const rows: RawRow[] = [
      {
        id: "e1", booking_id: "b1", status: "paid", amount: 5000,
        receipt_number: "RN-001", category: "Fuel", vendor_name: "Vendor A",
        description: "Fuel for truck", expense_date: "2025-03-01", created_at: "2025-03-01",
        currency: "USD", is_billable: true, service_type: "Trucking",
        project_number: "PRJ-001", contract_id: "c1",
      },
    ];
    const result = mapExpenseRowsForScope(rows, ["b1"]);
    expect(result[0].expenseName).toBe("RN-001");
    expect(result[0].expenseCategory).toBe("Fuel");
    expect(result[0].vendorName).toBe("Vendor A");
    expect(result[0].currency).toBe("USD");
    expect(result[0].isBillable).toBe(true);
  });
});

// ── mapEvoucherExpensesForScope ──────────────────────────────────────────────

describe("mapEvoucherExpensesForScope", () => {
  it("only includes expense/budget_request transactions", () => {
    const rows: RawRow[] = [
      { id: "v1", booking_id: "b1", transaction_type: "expense", status: "approved", total_amount: 1000 },
      { id: "v2", booking_id: "b1", transaction_type: "collection", status: "approved", total_amount: 2000 }, // excluded
    ];
    const result = mapEvoucherExpensesForScope(rows, ["b1"]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("v1");
  });

  it("sets payment_status to paid when status is paid", () => {
    const rows: RawRow[] = [
      { id: "v1", booking_id: "b1", transaction_type: "expense", status: "paid", total_amount: 1000 },
      { id: "v2", booking_id: "b1", transaction_type: "expense", status: "approved", total_amount: 2000 },
    ];
    const result = mapEvoucherExpensesForScope(rows, ["b1"]);
    expect(result.find((r) => r.id === "v1")?.payment_status).toBe("paid");
    expect(result.find((r) => r.id === "v2")?.payment_status).toBe("unpaid");
  });
});
