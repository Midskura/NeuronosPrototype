import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  pdf,
  Font,
} from "@react-pdf/renderer";
import type { InvoicePrintOptions } from "./InvoiceDocument";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PDFLineItem {
  description: string;
  remarks?: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  amount: number;
  tax_type?: "VAT" | "NON-VAT";
  original_currency?: string;
  exchange_rate?: number;
}

interface PDFInvoice {
  id?: string;
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  credit_terms?: string;
  customer_name?: string;
  customer_address?: string;
  customer_tin?: string;
  bl_number?: string;
  commodity_description?: string;
  consignee?: string;
  line_items?: PDFLineItem[];
  subtotal?: number;
  tax_amount?: number;
  total_amount?: number;
  amount?: number;
  currency?: string;
  notes?: string;
  created_by_name?: string;
  project_number?: string;
}

interface InvoicePDFDocumentProps {
  invoice: PDFInvoice;
  options?: InvoicePrintOptions;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#111827",
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 44,
    backgroundColor: "#FFFFFF",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E9F0",
    borderBottomStyle: "solid",
  },
  companyBlock: { flexDirection: "column", gap: 2 },
  companyName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#12332B", letterSpacing: 1 },
  companyTagline: { fontSize: 7.5, color: "#667085", marginTop: 2 },
  companyAddress: { fontSize: 7.5, color: "#475467", marginTop: 4, lineHeight: 1.4 },

  invoiceMetaBlock: { flexDirection: "column", alignItems: "flex-end", gap: 3 },
  invoiceTitle: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#0F766E", letterSpacing: 0.5 },
  metaRow: { flexDirection: "row", gap: 6, marginTop: 2 },
  metaLabel: { fontSize: 8, color: "#667085", width: 72, textAlign: "right" },
  metaValue: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#12332B" },

  // Bill-to section
  billToSection: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  billToBlock: { flex: 1 },
  sectionLabel: { fontSize: 7, color: "#667085", fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  billToName: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#12332B" },
  billToLine: { fontSize: 8, color: "#475467", marginTop: 2, lineHeight: 1.4 },

  // Shipping info
  shipInfoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 },
  shipInfoItem: { flexDirection: "column", minWidth: 120 },
  shipInfoLabel: { fontSize: 7, color: "#667085", fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.6 },
  shipInfoValue: { fontSize: 8, color: "#12332B", marginTop: 1 },

  // Line items table
  table: { marginBottom: 12 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    borderBottomStyle: "solid",
  },
  tableRowAlt: { backgroundColor: "#FAFAFA" },

  colDesc: { flex: 1 },
  colQty: { width: 42, textAlign: "center" },
  colUnit: { width: 36, textAlign: "center" },
  colRate: { width: 72, textAlign: "right" },
  colAmt: { width: 72, textAlign: "right" },

  thText: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#374151", textTransform: "uppercase", letterSpacing: 0.5 },
  tdText: { fontSize: 8, color: "#111827" },
  tdRemark: { fontSize: 7, color: "#6B7280", marginTop: 2 },

  // VAT section label
  vatLabel: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#0F766E", paddingVertical: 3, paddingHorizontal: 6, backgroundColor: "#F0FDF4" },

  // Totals
  totalsSection: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 16 },
  totalsTable: { width: 200 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2.5 },
  totalLabel: { fontSize: 8, color: "#667085" },
  totalValue: { fontSize: 8, color: "#111827", fontFamily: "Helvetica-Bold" },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 6,
    backgroundColor: "#12332B",
    borderRadius: 3,
    marginTop: 4,
  },
  grandTotalLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  grandTotalValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },

  // Tax summary
  taxBox: {
    borderWidth: 1,
    borderColor: "#E5E9F0",
    borderStyle: "solid",
    borderRadius: 3,
    padding: 8,
    marginBottom: 12,
  },
  taxTitle: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#374151", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.6 },
  taxRow: { flexDirection: "row", gap: 24, marginBottom: 2 },
  taxCell: { flexDirection: "column", gap: 1 },
  taxCellLabel: { fontSize: 7, color: "#667085" },
  taxCellValue: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#111827" },

  // Bank details
  bankBox: {
    borderWidth: 1,
    borderColor: "#E5E9F0",
    borderStyle: "solid",
    borderRadius: 3,
    padding: 8,
    marginBottom: 12,
    backgroundColor: "#F9FAFB",
  },
  bankTitle: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#374151", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.6 },
  bankGrid: { flexDirection: "row", gap: 24 },
  bankItem: { flexDirection: "column", gap: 1 },
  bankLabel: { fontSize: 7, color: "#667085" },
  bankValue: { fontSize: 8, color: "#111827" },

  // Notes
  notesBox: { marginBottom: 12 },
  notesTitle: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#374151", marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.6 },
  notesText: { fontSize: 8, color: "#475467", lineHeight: 1.5 },

  // Signatories
  signBlock: { flexDirection: "row", justifyContent: "space-between", marginTop: 24 },
  signItem: { flexDirection: "column", alignItems: "center", width: "45%" },
  signLine: { width: "100%", borderBottomWidth: 1, borderBottomColor: "#374151", borderBottomStyle: "solid", marginBottom: 4 },
  signName: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#111827" },
  signTitle: { fontSize: 7, color: "#667085", marginTop: 1 },
  signRole: { fontSize: 7, color: "#9CA3AF", marginTop: 1, textTransform: "uppercase", letterSpacing: 0.5 },

  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E5E9F0",
    borderTopStyle: "solid",
    paddingTop: 6,
  },
  footerText: { fontSize: 7, color: "#9CA3AF" },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtMoney(val?: number, currency = "PHP"): string {
  if (val === undefined || val === null) return "0.00";
  const symbol = currency === "PHP" ? "₱" : currency === "USD" ? "$" : `${currency} `;
  return `${symbol}${val.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(val?: string): string {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function t(val: any, fallback = "—"): string {
  if (val === 0) return "0";
  return val || fallback;
}

// ─── Document Component ───────────────────────────────────────────────────────

export function InvoicePDFDocument({ invoice, options }: InvoicePDFDocumentProps) {
  const currency = invoice.currency || "PHP";
  const lineItems = invoice.line_items || [];
  const vatItems = lineItems.filter((i) => i.tax_type === "VAT");
  const nonVatItems = lineItems.filter((i) => i.tax_type !== "VAT");
  const hasVatAndNonVat = vatItems.length > 0 && nonVatItems.length > 0;
  const vatSubtotal = vatItems.reduce((s, i) => s + (i.amount || 0), 0);
  const nonVatSubtotal = nonVatItems.reduce((s, i) => s + (i.amount || 0), 0);
  const vatAmount = vatSubtotal * 0.12;

  const preparedBy = options?.signatories.prepared_by.name || invoice.created_by_name || "Authorized User";
  const preparedByTitle = options?.signatories.prepared_by.title || "Authorized User";
  const approvedBy = options?.signatories.approved_by.name || "MANAGEMENT";
  const approvedByTitle = options?.signatories.approved_by.title || "Authorized Signatory";
  const showBankDetails = options ? options.display.show_bank_details : true;
  const showNotes = options ? options.display.show_notes : true;
  const showTax = options ? options.display.show_tax_summary : true;
  const notes = options?.custom_notes ?? invoice.notes;

  const renderItems = (items: PDFLineItem[], startIdx: number) =>
    items.map((item, idx) => (
      <View key={idx} style={[s.tableRow, (startIdx + idx) % 2 === 1 ? s.tableRowAlt : {}]}>
        <View style={s.colDesc}>
          <Text style={s.tdText}>{item.description || "—"}</Text>
          {item.remarks ? <Text style={s.tdRemark}>{item.remarks}</Text> : null}
          {item.original_currency && item.original_currency !== currency ? (
            <Text style={s.tdRemark}>
              Original: {fmtMoney(item.unit_price, item.original_currency)} ×{" "}
              {item.exchange_rate ?? 1} = {fmtMoney(item.unit_price, currency)}
            </Text>
          ) : null}
        </View>
        <Text style={[s.colQty, s.tdText]}>{item.quantity ?? 1}</Text>
        <Text style={[s.colUnit, s.tdText]}>{item.unit || "—"}</Text>
        <Text style={[s.colRate, s.tdText]}>{fmtMoney(item.unit_price, currency)}</Text>
        <Text style={[s.colAmt, s.tdText]}>{fmtMoney(item.amount, currency)}</Text>
      </View>
    ));

  return (
    <Document title={`Invoice ${invoice.invoice_number || ""}`} author="Neuron OS">
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.companyBlock}>
            <Text style={s.companyName}>NEURON</Text>
            <Text style={s.companyTagline}>Freight Forwarding & Logistics</Text>
            <Text style={s.companyAddress}>
              {"Philippines\ninfo@neuronsystem.io"}
            </Text>
          </View>
          <View style={s.invoiceMetaBlock}>
            <Text style={s.invoiceTitle}>INVOICE</Text>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Invoice No.</Text>
              <Text style={s.metaValue}>{t(invoice.invoice_number)}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Date</Text>
              <Text style={s.metaValue}>{fmtDate(invoice.invoice_date)}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Terms</Text>
              <Text style={s.metaValue}>{t(invoice.credit_terms, "NET 15")}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Due Date</Text>
              <Text style={s.metaValue}>{fmtDate(invoice.due_date)}</Text>
            </View>
          </View>
        </View>

        {/* ── Bill To ── */}
        <View style={s.billToSection}>
          <View style={s.billToBlock}>
            <Text style={s.sectionLabel}>Bill To</Text>
            <Text style={s.billToName}>{t(invoice.customer_name)}</Text>
            <Text style={s.billToLine}>{t(invoice.customer_address, "No address provided")}</Text>
            {invoice.customer_tin ? (
              <Text style={s.billToLine}>TIN: {invoice.customer_tin}</Text>
            ) : null}
          </View>
        </View>

        {/* ── Shipping Info ── */}
        {(invoice.bl_number || invoice.commodity_description || invoice.consignee || invoice.project_number) ? (
          <View style={s.shipInfoGrid}>
            {invoice.bl_number ? (
              <View style={s.shipInfoItem}>
                <Text style={s.shipInfoLabel}>B/L No.</Text>
                <Text style={s.shipInfoValue}>{invoice.bl_number}</Text>
              </View>
            ) : null}
            {invoice.commodity_description ? (
              <View style={s.shipInfoItem}>
                <Text style={s.shipInfoLabel}>Commodity</Text>
                <Text style={s.shipInfoValue}>{invoice.commodity_description}</Text>
              </View>
            ) : null}
            {invoice.consignee ? (
              <View style={s.shipInfoItem}>
                <Text style={s.shipInfoLabel}>Consignee</Text>
                <Text style={s.shipInfoValue}>{invoice.consignee}</Text>
              </View>
            ) : null}
            {invoice.project_number ? (
              <View style={s.shipInfoItem}>
                <Text style={s.shipInfoLabel}>Project No.</Text>
                <Text style={s.shipInfoValue}>{invoice.project_number}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* ── Line Items Table ── */}
        <View style={s.table}>
          {/* Table Header */}
          <View style={s.tableHeader}>
            <Text style={[s.colDesc, s.thText]}>Description</Text>
            <Text style={[s.colQty, s.thText]}>Qty</Text>
            <Text style={[s.colUnit, s.thText]}>Unit</Text>
            <Text style={[s.colRate, s.thText]}>Rate</Text>
            <Text style={[s.colAmt, s.thText]}>Amount</Text>
          </View>

          {/* Rows — grouped by VAT type if mixed */}
          {hasVatAndNonVat ? (
            <>
              <View><Text style={s.vatLabel}>VATable Items</Text></View>
              {renderItems(vatItems, 0)}
              <View style={{ paddingVertical: 3, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: "#E5E9F0", borderBottomStyle: "solid" }}>
                <Text style={{ fontSize: 7.5, color: "#667085", textAlign: "right" }}>
                  VAT Subtotal: {fmtMoney(vatSubtotal, currency)}
                </Text>
              </View>
              <View><Text style={s.vatLabel}>Non-VAT Items</Text></View>
              {renderItems(nonVatItems, vatItems.length)}
              <View style={{ paddingVertical: 3, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: "#E5E9F0", borderBottomStyle: "solid" }}>
                <Text style={{ fontSize: 7.5, color: "#667085", textAlign: "right" }}>
                  Non-VAT Subtotal: {fmtMoney(nonVatSubtotal, currency)}
                </Text>
              </View>
            </>
          ) : (
            renderItems(lineItems, 0)
          )}
        </View>

        {/* ── Totals ── */}
        <View style={s.totalsSection}>
          <View style={s.totalsTable}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Subtotal</Text>
              <Text style={s.totalValue}>{fmtMoney(invoice.subtotal, currency)}</Text>
            </View>
            {(invoice.tax_amount ?? 0) > 0 ? (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>VAT (12%)</Text>
                <Text style={s.totalValue}>{fmtMoney(invoice.tax_amount, currency)}</Text>
              </View>
            ) : null}
            <View style={s.grandTotalRow}>
              <Text style={s.grandTotalLabel}>TOTAL DUE</Text>
              <Text style={s.grandTotalValue}>
                {fmtMoney(invoice.total_amount ?? invoice.amount, currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Tax Summary ── */}
        {showTax && vatItems.length > 0 ? (
          <View style={s.taxBox}>
            <Text style={s.taxTitle}>Tax Summary</Text>
            <View style={s.taxRow}>
              <View style={s.taxCell}>
                <Text style={s.taxCellLabel}>VATable Sales</Text>
                <Text style={s.taxCellValue}>{fmtMoney(vatSubtotal, currency)}</Text>
              </View>
              <View style={s.taxCell}>
                <Text style={s.taxCellLabel}>VAT Amount (12%)</Text>
                <Text style={s.taxCellValue}>{fmtMoney(vatAmount, currency)}</Text>
              </View>
              <View style={s.taxCell}>
                <Text style={s.taxCellLabel}>Non-VAT Sales</Text>
                <Text style={s.taxCellValue}>{fmtMoney(nonVatSubtotal, currency)}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* ── Bank Details ── */}
        {showBankDetails ? (
          <View style={s.bankBox}>
            <Text style={s.bankTitle}>Payment Details</Text>
            <View style={s.bankGrid}>
              <View style={s.bankItem}>
                <Text style={s.bankLabel}>Bank</Text>
                <Text style={s.bankValue}>BDO Unibank</Text>
              </View>
              <View style={s.bankItem}>
                <Text style={s.bankLabel}>Account Name</Text>
                <Text style={s.bankValue}>Neuron Logistics Inc.</Text>
              </View>
              <View style={s.bankItem}>
                <Text style={s.bankLabel}>Account No.</Text>
                <Text style={s.bankValue}>0000-0000-0000</Text>
              </View>
              <View style={s.bankItem}>
                <Text style={s.bankLabel}>Swift / BIC</Text>
                <Text style={s.bankValue}>BNORPHMM</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* ── Notes ── */}
        {showNotes && notes ? (
          <View style={s.notesBox}>
            <Text style={s.notesTitle}>Notes</Text>
            <Text style={s.notesText}>{notes}</Text>
          </View>
        ) : null}

        {/* ── Signatories ── */}
        <View style={s.signBlock}>
          <View style={s.signItem}>
            <View style={s.signLine} />
            <Text style={s.signName}>{preparedBy}</Text>
            <Text style={s.signTitle}>{preparedByTitle}</Text>
            <Text style={s.signRole}>Prepared By</Text>
          </View>
          <View style={s.signItem}>
            <View style={s.signLine} />
            <Text style={s.signName}>{approvedBy}</Text>
            <Text style={s.signTitle}>{approvedByTitle}</Text>
            <Text style={s.signRole}>Approved By</Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {t(invoice.invoice_number, "Invoice")} · {fmtDate(invoice.invoice_date)}
          </Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
          <Text style={s.footerText}>Generated by Neuron OS</Text>
        </View>

      </Page>
    </Document>
  );
}

// ─── Download Utility ─────────────────────────────────────────────────────────

export async function downloadInvoicePDF(
  invoice: PDFInvoice,
  options?: InvoicePrintOptions
): Promise<void> {
  const doc = <InvoicePDFDocument invoice={invoice} options={options} />;
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Invoice-${invoice.invoice_number || "draft"}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
