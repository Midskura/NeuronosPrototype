import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "../../ui/drawer";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Separator } from "../../ui/separator";
import { Edit2, CheckCircle, XCircle, Trash2, Download, Calendar, Building2, Wallet, User, FileText } from "lucide-react";
import { format } from "date-fns";
import { EntryType, BadgeType } from "./BadgeType";
import { AccountingEntry } from "./TableAccountingEntries";

interface DrawerEntryDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: AccountingEntry | null;
  onEdit?: (entry: AccountingEntry) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function DrawerEntryDetails({
  open,
  onOpenChange,
  entry,
  onEdit,
  onApprove,
  onReject,
  onDelete,
}: DrawerEntryDetailsProps) {
  if (!entry) return null;

  const canEdit = entry.status === "Pending";
  const canApprove = entry.status === "Pending";
  const canDelete = entry.status === "Pending";

  const handleEdit = () => {
    onEdit?.(entry);
    onOpenChange(false);
  };

  const handleApprove = () => {
    onApprove?.(entry.id);
    onOpenChange(false);
  };

  const handleReject = () => {
    onReject?.(entry.id);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      onDelete?.(entry.id);
      onOpenChange(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      Pending: "bg-orange-100 text-orange-800 border-orange-200",
      Approved: "bg-green-100 text-green-800 border-green-200",
      Rejected: "bg-red-100 text-red-800 border-red-200",
    };
    return (
      <Badge className={`${styles[status as keyof typeof styles]} border text-[12px] px-2 py-0.5`} style={{ borderRadius: 'var(--radius-xs)' }}>
        {status}
      </Badge>
    );
  };

  const formatAmount = (amount: number, type: EntryType) => {
    const formatted = `₱${amount.toLocaleString()}`;
    if (type === "revenue") return `+${formatted}`;
    if (type === "expense") return `-${formatted}`;
    return formatted;
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-[600px] mx-auto">
        <DrawerHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DrawerTitle className="text-[#0A1D4D] mb-2">Entry Details</DrawerTitle>
              <DrawerDescription className="flex items-center gap-2">
                <BadgeType type={entry.type} />
                {getStatusBadge(entry.status)}
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <div className="px-6 pb-6 space-y-6">
          {/* Amount - Large Display */}
          <div className="text-center py-4">
            <div 
              className="text-[32px] tabular-nums"
              style={{ 
                color: entry.type === "revenue" ? "var(--text-revenue)" : entry.type === "expense" ? "var(--text-expense)" : "#374151" 
              }}
            >
              {formatAmount(entry.amount, entry.type)}
            </div>
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
                <Calendar className="w-4 h-4" />
                Date
              </div>
              <div className="text-[14px] text-[#374151]">
                {format(new Date(entry.date), "MMM d, yyyy")}
              </div>
            </div>

            {/* Booking No */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
                <FileText className="w-4 h-4" />
                Booking No
              </div>
              <div className="text-[14px] text-[#0A1D4D] font-medium">
                {entry.bookingNo}
              </div>
            </div>

            {/* Client */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
                <Building2 className="w-4 h-4" />
                Client
              </div>
              <div className="text-[14px] text-[#374151]">
                {entry.client}
              </div>
            </div>

            {/* Account */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
                <Wallet className="w-4 h-4" />
                Account
              </div>
              <div className="text-[14px] text-[#374151]">
                {entry.account}
              </div>
            </div>

            {/* Category (if not transfer) */}
            {entry.category && (
              <div className="space-y-1">
                <div className="text-[12px] text-[#6B7280]">Category</div>
                <div className="text-[14px] text-[#374151]">
                  {entry.category}
                </div>
              </div>
            )}

            {/* Entered By */}
            {entry.enteredBy && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
                  <User className="w-4 h-4" />
                  Entered By
                </div>
                <div className="text-[14px] text-[#374151]">
                  {entry.enteredBy}
                </div>
              </div>
            )}
          </div>

          {/* Note */}
          {entry.note && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-[12px] text-[#6B7280]">Note</div>
                <div className="text-[14px] text-[#374151] p-3 bg-[#F9FAFB] rounded-lg">
                  {entry.note}
                </div>
              </div>
            </>
          )}

          {/* Attachment */}
          {entry.attachment && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-[12px] text-[#6B7280]">Attachment</div>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  style={{ borderRadius: 'var(--radius-sm)' }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {entry.attachment}
                </Button>
              </div>
            </>
          )}
        </div>

        <DrawerFooter className="border-t border-[#E5E7EB]">
          <div className="flex gap-3 w-full">
            {/* Edit Button */}
            {canEdit && onEdit && (
              <Button
                variant="outline"
                onClick={handleEdit}
                className="flex-1"
                style={{ borderRadius: 'var(--radius-sm)' }}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}

            {/* Approve Button */}
            {canApprove && onApprove && (
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleApprove}
                style={{ borderRadius: 'var(--radius-sm)' }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
            )}

            {/* Reject Button */}
            {canApprove && onReject && (
              <Button
                variant="outline"
                onClick={handleReject}
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                style={{ borderRadius: 'var(--radius-sm)' }}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            )}

            {/* Delete Button */}
            {canDelete && onDelete && (
              <Button
                variant="ghost"
                onClick={handleDelete}
                className="text-red-600 hover:bg-red-50"
                style={{ borderRadius: 'var(--radius-sm)' }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
