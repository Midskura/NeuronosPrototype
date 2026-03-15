import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Plus, Filter } from "lucide-react";

interface Expense {
  id: string;
  bookingId: string;
  bookingNo: string;
  type: string;
  amount: number;
  description?: string;
  date: string;
  status: "Pending" | "Approved" | "Rejected";
  enteredBy: string;
}

interface EntriesPageProps {
  expenses: Expense[];
  bookings: Array<{ id: string; trackingNo: string; client: string }>;
  onCreateExpense: (expense: Omit<Expense, "id" | "status" | "enteredBy">) => void;
  onViewExpense?: (id: string) => void;
}

const EXPENSE_TYPES = ["Fuel", "Toll", "Maintenance", "Allowance", "Misc"];

export function EntriesPage({ expenses, bookings, onCreateExpense, onViewExpense }: EntriesPageProps) {
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [filterBooking, setFilterBooking] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [newEntryForm, setNewEntryForm] = useState({
    bookingId: "",
    type: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  const filteredExpenses = expenses.filter((expense) => {
    if (filterBooking !== "all" && expense.bookingId !== filterBooking) return false;
    if (filterType !== "all" && expense.type !== filterType) return false;
    if (filterStatus !== "all" && expense.status !== filterStatus) return false;
    return true;
  });

  const handleCreateEntry = () => {
    if (!newEntryForm.bookingId || !newEntryForm.type || !newEntryForm.amount) {
      return;
    }

    const booking = bookings.find((b) => b.id === newEntryForm.bookingId);
    if (!booking) return;

    onCreateExpense({
      bookingId: newEntryForm.bookingId,
      bookingNo: booking.trackingNo,
      type: newEntryForm.type,
      amount: parseFloat(newEntryForm.amount),
      description: newEntryForm.description,
      date: newEntryForm.date,
    });

    setNewEntryForm({
      bookingId: "",
      type: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
    });
    setIsNewEntryOpen(false);
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

  return (
    <>
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-[#0A1D4D] mb-2">All Entries</h1>
        <p className="text-[14px] text-[#6B7280] leading-[20px]">
          View and manage all expense entries across bookings
        </p>
      </div>

      {/* New Entry Dialog */}
      <Dialog open={isNewEntryOpen} onOpenChange={setIsNewEntryOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
                <DialogTitle>Create New Entry</DialogTitle>
                <DialogDescription>
                  Add a new expense entry for a booking. It will be submitted for approval.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Booking</Label>
                  <Select
                    value={newEntryForm.bookingId}
                    onValueChange={(value) => setNewEntryForm({ ...newEntryForm, bookingId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select booking" />
                    </SelectTrigger>
                    <SelectContent>
                      {bookings.map((booking) => (
                        <SelectItem key={booking.id} value={booking.id}>
                          {booking.trackingNo} - {booking.client}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Expense Type</Label>
                  <Select
                    value={newEntryForm.type}
                    onValueChange={(value) => setNewEntryForm({ ...newEntryForm, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount (₱)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newEntryForm.amount}
                    onChange={(e) => setNewEntryForm({ ...newEntryForm, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newEntryForm.date}
                    onChange={(e) => setNewEntryForm({ ...newEntryForm, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    placeholder="Add notes or details"
                    value={newEntryForm.description}
                    onChange={(e) => setNewEntryForm({ ...newEntryForm, description: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsNewEntryOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-[#F25C05] hover:bg-[#D84D00] text-white"
                    onClick={handleCreateEntry}
                  >
                    Create Entry
                  </Button>
                </div>
              </div>
            </DialogContent>
      </Dialog>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <Filter className="w-4 h-4 text-[#6B7280]" />
        <Select value={filterBooking} onValueChange={setFilterBooking}>
          <SelectTrigger className="w-[200px] h-10" style={{ borderRadius: 'var(--radius-sm)' }}>
            <SelectValue placeholder="All Bookings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Bookings</SelectItem>
            {bookings.map((booking) => (
              <SelectItem key={booking.id} value={booking.id}>
                {booking.trackingNo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px] h-10" style={{ borderRadius: 'var(--radius-sm)' }}>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {EXPENSE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px] h-10" style={{ borderRadius: 'var(--radius-sm)' }}>
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Entries Table */}
      <div className="border border-[#E5E7EB] overflow-hidden" style={{ borderRadius: 'var(--radius-sm)' }}>
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <TableHead className="text-[12px] text-[#6B7280] h-12">Date</TableHead>
              <TableHead className="text-[12px] text-[#6B7280] h-12">Booking</TableHead>
              <TableHead className="text-[12px] text-[#6B7280] h-12">Type</TableHead>
              <TableHead className="text-[12px] text-[#6B7280] h-12 text-right">Amount</TableHead>
              <TableHead className="text-[12px] text-[#6B7280] h-12">Description</TableHead>
              <TableHead className="text-[12px] text-[#6B7280] h-12">Entered By</TableHead>
              <TableHead className="text-[12px] text-[#6B7280] h-12">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.map((expense) => (
              <TableRow 
                key={expense.id} 
                className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] cursor-pointer"
                onClick={() => onViewExpense?.(expense.id)}
                style={{ minHeight: '48px' }}
              >
                <TableCell className="text-[14px] text-[#374151]">
                  {new Date(expense.date).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-[14px] text-[#0A1D4D] font-medium">
                  {expense.bookingNo}
                </TableCell>
                <TableCell className="text-[14px] text-[#374151]">
                  {expense.type}
                </TableCell>
                <TableCell className="text-[14px] text-right font-medium tabular-nums" style={{ color: 'var(--text-expense)' }}>
                  ₱{expense.amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-[14px] text-[#6B7280] max-w-[200px] truncate">
                  {expense.description || "—"}
                </TableCell>
                <TableCell className="text-[14px] text-[#374151]">
                  {expense.enteredBy}
                </TableCell>
                <TableCell>
                  <StatusBadge status={expense.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
