import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Button } from "../../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../ui/tooltip";
import { Badge } from "../../ui/badge";
import { Eye, Edit2 } from "lucide-react";

export interface AccountingEntry {
  id: string;
  bookingNo: string;
  client: string;
  type: "revenue" | "expense" | "transfer";
  amount: number;
  account: string;
  category?: string;
  date: string;
  note?: string;
  status: "Pending" | "Approved" | "Rejected";
}

interface TableAccountingEntriesProps {
  entries: AccountingEntry[];
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  zebra?: boolean;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
}

export function TableAccountingEntries({
  entries,
  onView,
  onEdit,
  zebra = false,
  loading = false,
  error,
  emptyMessage = "No entries found",
}: TableAccountingEntriesProps) {
  const getAmountColor = (type: AccountingEntry["type"]) => {
    switch (type) {
      case "revenue":
        return "var(--text-revenue)";
      case "expense":
        return "var(--text-expense)";
      case "transfer":
        return "var(--text-transfer)";
      default:
        return "#374151";
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
      Pending: "bg-orange-100 text-orange-800 border-orange-200",
      Approved: "bg-green-100 text-green-800 border-green-200",
      Rejected: "bg-red-100 text-red-800 border-red-200",
    };
    return (
      <Badge className={`${colors[status as keyof typeof colors]} border text-xs px-2 py-0.5`} style={{ borderRadius: 'var(--radius-xs)' }}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="border border-[#E5E7EB] overflow-hidden" style={{ borderRadius: 'var(--radius-sm)' }}>
        <div className="flex items-center justify-center h-64 text-[14px] text-[#6B7280]">
          Loading entries...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-[#E5E7EB] overflow-hidden" style={{ borderRadius: 'var(--radius-sm)' }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-[14px] text-red-600 mb-2">{error}</p>
            <p className="text-[12px] text-[#6B7280]">Please try again or contact support</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[#E5E7EB] overflow-hidden" style={{ borderRadius: 'var(--radius-sm)' }}>
      <Table>
        <TableHeader>
          <TableRow className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
            <TableHead className="text-[12px] text-[#6B7280] h-12">Booking No</TableHead>
            <TableHead className="text-[12px] text-[#6B7280] h-12">Client</TableHead>
            <TableHead className="text-[12px] text-[#6B7280] h-12">Type</TableHead>
            <TableHead className="text-[12px] text-[#6B7280] h-12 text-right">Amount</TableHead>
            <TableHead className="text-[12px] text-[#6B7280] h-12">Account</TableHead>
            <TableHead className="text-[12px] text-[#6B7280] h-12">Category</TableHead>
            <TableHead className="text-[12px] text-[#6B7280] h-12">Date</TableHead>
            <TableHead className="text-[12px] text-[#6B7280] h-12">Note</TableHead>
            <TableHead className="text-[12px] text-[#6B7280] h-12">Status</TableHead>
            <TableHead className="text-[12px] text-[#6B7280] h-12 text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-[14px] text-[#6B7280] h-24">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry, index) => (
              <TableRow
                key={entry.id}
                className={`border-b border-[#E5E7EB] hover:bg-[#F9FAFB] ${
                  zebra && index % 2 === 1 ? 'bg-[#FAFBFC]' : ''
                }`}
                style={{ minHeight: '48px' }}
              >
                <TableCell className="text-[14px] text-[#0A1D4D] font-medium">
                  {entry.bookingNo}
                </TableCell>
                <TableCell className="text-[14px] text-[#374151]">
                  {entry.client}
                </TableCell>
                <TableCell className="text-[14px] text-[#374151] capitalize">
                  {entry.type}
                </TableCell>
                <TableCell
                  className="text-[14px] text-right font-medium tabular-nums"
                  style={{ color: getAmountColor(entry.type) }}
                >
                  ₱{entry.amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-[14px] text-[#374151]">
                  {entry.account}
                </TableCell>
                <TableCell className="text-[14px] text-[#374151]">
                  {entry.category || "—"}
                </TableCell>
                <TableCell className="text-[14px] text-[#374151]">
                  {new Date(entry.date).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-[14px] text-[#6B7280] max-w-[200px]">
                  {entry.note ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="truncate block cursor-help">{entry.note}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{entry.note}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={entry.status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    {onView && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onView(entry.id)}
                      >
                        <Eye className="w-4 h-4 text-[#6B7280]" />
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onEdit(entry.id)}
                      >
                        <Edit2 className="w-4 h-4 text-[#6B7280]" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
