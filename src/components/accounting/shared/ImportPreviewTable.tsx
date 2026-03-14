import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";

export interface ImportRow {
  line: number;
  parsed: {
    date?: string;
    bookingNo?: string;
    client?: string;
    type?: string;
    amount?: string;
    account?: string;
    category?: string;
    note?: string;
  };
  status: "valid" | "warning" | "error";
  error?: string;
}

interface ImportPreviewTableProps {
  rows: ImportRow[];
  onCommit: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ImportPreviewTable({
  rows,
  onCommit,
  onCancel,
  loading = false,
}: ImportPreviewTableProps) {
  const hasBlockingErrors = rows.some((row) => row.status === "error");
  const validCount = rows.filter((row) => row.status === "valid").length;
  const warningCount = rows.filter((row) => row.status === "warning").length;
  const errorCount = rows.filter((row) => row.status === "error").length;

  const StatusIcon = ({ status }: { status: ImportRow["status"] }) => {
    switch (status) {
      case "valid":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const StatusBadge = ({ status }: { status: ImportRow["status"] }) => {
    const variants = {
      valid: "bg-green-100 text-green-800 border-green-200",
      warning: "bg-orange-100 text-orange-800 border-orange-200",
      error: "bg-red-100 text-red-800 border-red-200",
    };
    const labels = {
      valid: "Valid",
      warning: "Warning",
      error: "Error",
    };
    return (
      <Badge
        className={`${variants[status]} border text-xs px-2 py-0.5`}
        style={{ borderRadius: 'var(--radius-xs)' }}
      >
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between p-4 bg-[#F9FAFB] border border-[#E5E7EB]" style={{ borderRadius: 'var(--radius-sm)' }}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-[14px] text-[#374151]">
              <span className="font-medium tabular-nums">{validCount}</span> Valid
            </span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="text-[14px] text-[#374151]">
              <span className="font-medium tabular-nums">{warningCount}</span> Warnings
            </span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-[14px] text-[#374151]">
              <span className="font-medium tabular-nums">{errorCount}</span> Errors
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            style={{ borderRadius: 'var(--radius-sm)' }}
          >
            Cancel
          </Button>
          <Button
            className="bg-[#F25C05] hover:bg-[#D84D00] text-white"
            onClick={onCommit}
            disabled={hasBlockingErrors || loading}
            style={{ borderRadius: 'var(--radius-sm)' }}
          >
            {loading ? "Committing..." : `Commit ${validCount} Entries`}
          </Button>
        </div>
      </div>

      {/* Preview Table */}
      <div className="border border-[#E5E7EB] overflow-hidden" style={{ borderRadius: 'var(--radius-sm)' }}>
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <TableHead className="text-[12px] text-[#6B7280] h-12 w-16">Line</TableHead>
              <TableHead className="text-[12px] text-[#6B7280] h-12">Date</TableHead>
              <TableHead className="text-[12px] text-[#6B7280] h-12">Booking</TableHead>
              <TableHead className="text-[12px] text-[#6B7280] h-12">Client</TableHead>
              <TableHead className="text-[12px] text-[#6B7280] h-12">Type</TableHead>
              <TableHead className="text-[12px] text-[#6B7280] h-12 text-right">Amount</TableHead>
              <TableHead className="text-[12px] text-[#6B7280] h-12">Account</TableHead>
              <TableHead className="text-[12px] text-[#6B7280] h-12">Category</TableHead>
              <TableHead className="text-[12px] text-[#6B7280] h-12">Status</TableHead>
              <TableHead className="text-[12px] text-[#6B7280] h-12">Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-[14px] text-[#6B7280] h-24">
                  No data to preview
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.line}
                  className={`border-b border-[#E5E7EB] ${
                    row.status === "error" ? "bg-red-50" : ""
                  }`}
                  style={{ minHeight: '48px' }}
                >
                  <TableCell className="text-[14px] text-[#6B7280] font-mono tabular-nums">
                    {row.line}
                  </TableCell>
                  <TableCell className="text-[14px] text-[#374151]">
                    {row.parsed.date || "—"}
                  </TableCell>
                  <TableCell className="text-[14px] text-[#0A1D4D]">
                    {row.parsed.bookingNo || "—"}
                  </TableCell>
                  <TableCell className="text-[14px] text-[#374151]">
                    {row.parsed.client || "—"}
                  </TableCell>
                  <TableCell className="text-[14px] text-[#374151] capitalize">
                    {row.parsed.type || "—"}
                  </TableCell>
                  <TableCell className="text-[14px] text-right tabular-nums">
                    {row.parsed.amount ? `₱${parseFloat(row.parsed.amount).toLocaleString()}` : "—"}
                  </TableCell>
                  <TableCell className="text-[14px] text-[#374151]">
                    {row.parsed.account || "—"}
                  </TableCell>
                  <TableCell className="text-[14px] text-[#374151]">
                    {row.parsed.category || "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="text-[12px] text-red-600 max-w-[200px]">
                    {row.error ? (
                      <div className="flex items-start gap-1">
                        <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span className="truncate">{row.error}</span>
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
