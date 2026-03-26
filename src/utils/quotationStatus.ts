import type { ContractQuotationStatus, QuotationNew, QuotationStatus } from "../types/pricing";

type QuotationStatusRecord = {
  status?: string | null;
  project_id?: QuotationNew["project_id"];
  project_number?: QuotationNew["project_number"];
  quotation_type?: QuotationNew["quotation_type"];
  contract_status?: QuotationNew["contract_status"];
};

const CANONICAL_QUOTATION_STATUSES: readonly QuotationStatus[] = [
  "Draft",
  "Pending Pricing",
  "Priced",
  "Sent to Client",
  "Accepted by Client",
  "Rejected by Client",
  "Needs Revision",
  "Disapproved",
  "Converted to Project",
  "Converted to Contract",
  "Cancelled",
] as const;

export const QUOTATION_INQUIRY_STATUSES: readonly QuotationStatus[] = [
  "Draft",
  "Pending Pricing",
  "Needs Revision",
] as const;

export const QUOTATION_NEGOTIATION_STATUSES: readonly QuotationStatus[] = [
  "Priced",
  "Sent to Client",
] as const;

export const QUOTATION_COMPLETED_STATUSES: readonly QuotationStatus[] = [
  "Accepted by Client",
  "Rejected by Client",
  "Disapproved",
  "Cancelled",
  "Converted to Project",
  "Converted to Contract",
] as const;

export const QUOTATION_APPROVED_STATUSES: readonly QuotationStatus[] = [
  "Accepted by Client",
  "Converted to Project",
  "Converted to Contract",
] as const;

export const CANONICAL_QUOTATION_STATUS_ORDER: readonly QuotationStatus[] = [
  "Draft",
  "Pending Pricing",
  "Priced",
  "Needs Revision",
  "Sent to Client",
  "Accepted by Client",
  "Converted to Project",
  "Converted to Contract",
  "Rejected by Client",
  "Disapproved",
  "Cancelled",
] as const;

function isCanonicalQuotationStatus(value: string): value is QuotationStatus {
  return (CANONICAL_QUOTATION_STATUSES as readonly string[]).includes(value);
}

export function getNormalizedContractStatus(
  quotation: { status?: string | null; contract_status?: QuotationNew["contract_status"] },
): ContractQuotationStatus | undefined {
  if (quotation.contract_status) {
    return quotation.contract_status;
  }

  if (quotation.status === "Active Contract") {
    return "Active";
  }

  return undefined;
}

export function normalizeQuotationStatus(
  rawStatus?: string | null,
  quotation?: QuotationStatusRecord,
): QuotationStatus {
  if (!rawStatus) {
    return "Draft";
  }

  if (isCanonicalQuotationStatus(rawStatus)) {
    return rawStatus;
  }

  switch (rawStatus) {
    case "Waiting Approval":
      return "Sent to Client";
    case "Accepted":
      return quotation?.project_id || quotation?.project_number
        ? "Converted to Project"
        : "Accepted by Client";
    case "Approved":
      if (quotation?.project_id || quotation?.project_number) {
        return "Converted to Project";
      }
      if (
        quotation?.quotation_type === "contract" &&
        getNormalizedContractStatus(quotation) === "Active"
      ) {
        return "Converted to Contract";
      }
      return "Accepted by Client";
    case "Active Contract":
      return "Converted to Contract";
    default:
      return "Draft";
  }
}

export function getNormalizedQuotationStatus(quotation: QuotationStatusRecord): QuotationStatus {
  return normalizeQuotationStatus(quotation.status, quotation);
}

export function isQuotationLocked(quotation: QuotationStatusRecord): boolean {
  const status = getNormalizedQuotationStatus(quotation);
  return Boolean(
    quotation.project_id ||
      quotation.project_number ||
      status === "Converted to Project" ||
      status === "Converted to Contract" ||
      quotation.contract_status === "Active",
  );
}
