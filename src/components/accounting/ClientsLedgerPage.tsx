import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

interface Payment {
  id: string;
  bookingId: string;
  bookingNo: string;
  amount: number;
  date: string;
  method: string;
  status: "Pending" | "Approved" | "Rejected";
}

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

interface ClientsLedgerPageProps {
  bookings: Array<{ id: string; trackingNo: string; client: string }>;
  expenses: Expense[];
  payments: Payment[];
}

export function ClientsLedgerPage({ bookings, expenses, payments }: ClientsLedgerPageProps) {
  const [selectedClient, setSelectedClient] = useState<string>("all");

  // Get unique clients
  const clients = Array.from(new Set(bookings.map((b) => b.client))).sort();

  // Calculate per-booking financials
  const bookingFinancials = bookings
    .filter((booking) => selectedClient === "all" || booking.client === selectedClient)
    .map((booking) => {
      const bookingExpenses = expenses.filter(
        (e) => e.bookingId === booking.id && e.status === "Approved"
      );
      const bookingPayments = payments.filter(
        (p) => p.bookingId === booking.id && p.status === "Approved"
      );
      const revenue = bookingPayments.reduce((sum, p) => sum + p.amount, 0);
      const cost = bookingExpenses.reduce((sum, e) => sum + e.amount, 0);
      const profit = revenue - cost;
      const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0.0";

      return {
        bookingNo: booking.trackingNo,
        client: booking.client,
        revenue,
        expenses: cost,
        profit,
        margin,
      };
    })
    .filter((b) => b.revenue > 0 || b.expenses > 0);

  return (
    <>
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-[#0A1D4D] mb-2">Clients Ledger</h1>
        <p className="text-[14px] text-[#6B7280] leading-[20px]">
          Per-booking revenue, expenses, and profit margins
        </p>
      </div>

      {/* Client Filter */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-[14px] text-[#6B7280]">Filter by client:</span>
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger className="w-[280px] h-10" style={{ borderRadius: 'var(--radius-sm)' }}>
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client} value={client}>
                {client}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ledger Table */}
      <div className="border border-[#E5E7EB] overflow-hidden" style={{ borderRadius: 'var(--radius-sm)' }}>
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <TableHead className="text-[12px] text-[#6B7280] h-12">Booking</TableHead>
              <TableHead className="text-[12px] text-[#6B7280] h-12">Client</TableHead>
              <TableHead className="text-[12px] text-[#6B7280] h-12 text-right">Revenue</TableHead>
              <TableHead className="text-[12px] text-[#6B7280] h-12 text-right">Expenses</TableHead>
              <TableHead className="text-[12px] text-[#6B7280] h-12 text-right">Profit</TableHead>
              <TableHead className="text-[12px] text-[#6B7280] h-12 text-right">Margin %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookingFinancials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-[14px] text-[#6B7280] h-24">
                  No financial data available
                </TableCell>
              </TableRow>
            ) : (
              bookingFinancials.map((booking, index) => (
                <TableRow 
                  key={index} 
                  className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB]"
                  style={{ minHeight: '48px' }}
                >
                  <TableCell className="text-[14px] text-[#0A1D4D] font-medium">
                    {booking.bookingNo}
                  </TableCell>
                  <TableCell className="text-[14px] text-[#374151]">
                    {booking.client}
                  </TableCell>
                  <TableCell 
                    className="text-[14px] text-right font-medium tabular-nums"
                    style={{ color: 'var(--text-revenue)' }}
                  >
                    ₱{booking.revenue.toLocaleString()}
                  </TableCell>
                  <TableCell 
                    className="text-[14px] text-right font-medium tabular-nums"
                    style={{ color: 'var(--text-expense)' }}
                  >
                    ₱{booking.expenses.toLocaleString()}
                  </TableCell>
                  <TableCell 
                    className="text-[14px] text-right font-medium tabular-nums"
                    style={{ color: booking.profit >= 0 ? 'var(--text-revenue)' : 'var(--text-expense)' }}
                  >
                    ₱{booking.profit.toLocaleString()}
                  </TableCell>
                  <TableCell 
                    className="text-[14px] text-right font-medium tabular-nums"
                    style={{ color: parseFloat(booking.margin) >= 0 ? 'var(--text-revenue)' : 'var(--text-expense)' }}
                  >
                    {booking.margin}%
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
