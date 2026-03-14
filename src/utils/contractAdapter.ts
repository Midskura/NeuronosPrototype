/**
 * contractAdapter.ts
 *
 * Thin adapter that converts a QuotationNew (contract) into a Project-shaped
 * object so that shared accounting components (UnifiedInvoicesTab,
 * UnifiedCollectionsTab, InvoiceBuilder, ProjectFinancialOverview, etc.)
 * can be reused without modification.
 *
 * The key mapping is `quote_number → project_number` because invoices,
 * collections, and billing items are all keyed by `project_number` in the
 * backend APIs.
 *
 * @see /docs/blueprints/CONTRACT_PARITY_BLUEPRINT.md — Architecture Decision
 */

import type { QuotationNew, Project, ProjectStatus, ProjectBookingStatus } from "../types/pricing";

/**
 * Convert a contract quotation + its linked bookings into a Project-shaped
 * object that all shared accounting/financial components accept.
 *
 * @param contract  The contract quotation (QuotationNew with quotation_type === "contract")
 * @param linkedBookings  Array of bookings linked to this contract (from ContractDetailView state)
 * @returns A Project-shaped object suitable for shared component props
 */
export function contractAsProject(
  contract: QuotationNew,
  linkedBookings: any[] = []
): Project {
  // Determine a booking status based on linked bookings
  const bookingStatus: ProjectBookingStatus =
    linkedBookings.length > 0 ? "Fully Booked" : "Not Booked";

  // Map contract_status to a Project-compatible status
  const statusMap: Record<string, ProjectStatus> = {
    Active: "Active",
    Expiring: "Active",
    Draft: "Active",
    Sent: "Active",
    Expired: "Completed",
    Renewed: "Completed",
  };
  const projectStatus: ProjectStatus =
    statusMap[contract.contract_status || "Active"] || "Active";

  return {
    // Identity
    id: contract.id,
    project_number: contract.quote_number, // KEY: used by invoices/collections APIs
    quotation_id: contract.id,
    quotation_number: contract.quote_number,
    quotation_name: contract.quotation_name,

    // Customer
    customer_id: contract.customer_id,
    customer_name: contract.customer_name,
    customer_department: contract.customer_department,
    customer_role: contract.customer_role,
    contact_person_id: contract.contact_person_id,
    contact_person_name: contract.contact_person_name,

    // Shipment / Service details
    movement: contract.movement || "IMPORT",
    services: contract.services || [],
    service_mode: contract.service_mode,
    services_metadata: contract.services_metadata || [],
    charge_categories: contract.charge_categories || [],
    currency: contract.currency || "PHP",
    total: contract.financial_summary?.grand_total,

    category: contract.category,
    pol_aol: contract.pol_aol,
    pod_aod: contract.pod_aod,
    commodity: contract.commodity,
    packaging_type: contract.packaging_type,
    incoterm: contract.incoterm,
    carrier: contract.carrier,
    volume: contract.volume,
    gross_weight: contract.gross_weight,
    chargeable_weight: contract.chargeable_weight,
    dimensions: contract.dimensions,
    transit_time: contract.transit_time,
    routing_info: contract.routing_info,
    collection_address: contract.collection_address,
    pickup_address: contract.pickup_address,

    // Status
    status: projectStatus,
    booking_status: bookingStatus,

    // Linking
    linkedBookings,

    // Ownership
    bd_owner_user_name: contract.prepared_by,
    created_at: contract.created_at,
    updated_at: contract.updated_at,

    // Pass the full quotation so UnifiedBillingsTab / useBillingMerge can
    // extract virtual items for reflective billing
    quotation: contract,
  };
}
