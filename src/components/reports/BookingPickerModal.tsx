import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Check, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "../ui/utils";

interface BookingData {
  bookingNo: string;
  client: string;
  company: string;
  date: string;
  revenue: number;
}

interface BookingPickerModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (bookingNo: string) => void;
  bookings: BookingData[];
  currentFilters: {
    period: string;
    company: string;
    source: string;
  };
}

export function BookingPickerModal({ 
  open, 
  onClose, 
  onConfirm, 
  bookings,
  currentFilters 
}: BookingPickerModalProps) {
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState(currentFilters.period);
  const [filterCompany, setFilterCompany] = useState(currentFilters.company);
  const [filterClient, setFilterClient] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;

  // Get unique clients
  const uniqueClients = useMemo(() => {
    return Array.from(new Set(bookings.map(b => b.client))).sort();
  }, [bookings]);

  // Get unique companies
  const uniqueCompanies = useMemo(() => {
    return Array.from(new Set(bookings.map(b => b.company))).sort();
  }, [bookings]);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const matchesSearch = searchQuery === "" || 
        booking.bookingNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.company.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCompany = filterCompany === "All" || booking.company === filterCompany;
      const matchesClient = filterClient === "All" || booking.client === filterClient;
      
      return matchesSearch && matchesCompany && matchesClient;
    });
  }, [bookings, searchQuery, filterCompany, filterClient]);

  // Paginate
  const totalPages = Math.ceil(filteredBookings.length / rowsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleConfirm = () => {
    if (selectedBooking) {
      onConfirm(selectedBooking);
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedBooking(null);
    setSearchQuery("");
    setCurrentPage(1);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="bg-white border-[#E5E7EB] p-0"
        style={{ 
          maxWidth: '960px',
          width: '90vw',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#E5E7EB]">
          <DialogTitle 
            className="text-[#0A1D4D]"
            style={{ 
              fontSize: '20px',
              fontWeight: 700,
            }}
          >
            Select Booking
          </DialogTitle>
          <DialogDescription 
            className="text-[#6B7280] mt-1"
            style={{ 
              fontSize: '13px',
              fontWeight: 400,
            }}
          >
            Filtered to: {currentFilters.period} · {currentFilters.company === "All" ? "All companies" : currentFilters.company} · {currentFilters.source === "Both" ? "All sources" : currentFilters.source}
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar */}
        <div className="px-6 pt-4 pb-3 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <Input
                placeholder="Search booking, client, company…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 border-[#E5E7EB] rounded-full text-[13px]"
              />
            </div>

            {/* Filter Dropdowns */}
            <Select value={filterCompany} onValueChange={setFilterCompany}>
              <SelectTrigger className="h-10 w-[140px] rounded-full border-[#E5E7EB] text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Companies</SelectItem>
                {uniqueCompanies.map(company => (
                  <SelectItem key={company} value={company}>{company}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterClient} onValueChange={setFilterClient}>
              <SelectTrigger className="h-10 w-[140px] rounded-full border-[#E5E7EB] text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Clients</SelectItem>
                {uniqueClients.map(client => (
                  <SelectItem key={client} value={client}>{client}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="px-6 py-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="w-full" style={{ fontSize: '13px' }}>
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-[#E5E7EB]">
                <th className="text-left py-3 px-3 text-[#6B7280]" style={{ fontWeight: 600, fontSize: '12px' }}>
                  BOOKING / JOB NO.
                </th>
                <th className="text-left py-3 px-3 text-[#6B7280]" style={{ fontWeight: 600, fontSize: '12px' }}>
                  CLIENT
                </th>
                <th className="text-left py-3 px-3 text-[#6B7280]" style={{ fontWeight: 600, fontSize: '12px' }}>
                  COMPANY
                </th>
                <th className="text-left py-3 px-3 text-[#6B7280]" style={{ fontWeight: 600, fontSize: '12px' }}>
                  DATE
                </th>
                <th className="text-right py-3 px-3 text-[#6B7280]" style={{ fontWeight: 600, fontSize: '12px' }}>
                  REVENUE (₱)
                </th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedBookings.map((booking) => (
                <tr
                  key={booking.bookingNo}
                  onClick={() => setSelectedBooking(booking.bookingNo)}
                  className={cn(
                    "border-b border-[#F3F4F6] cursor-pointer transition-colors",
                    selectedBooking === booking.bookingNo 
                      ? "bg-[#FFF7ED]" 
                      : "hover:bg-[#F9FAFB]"
                  )}
                >
                  <td className="py-3 px-3 text-[#0A1D4D]" style={{ fontWeight: 500 }}>
                    {booking.bookingNo}
                  </td>
                  <td className="py-3 px-3 text-[#4B5563]">{booking.client}</td>
                  <td className="py-3 px-3 text-[#4B5563]">{booking.company}</td>
                  <td className="py-3 px-3 text-[#4B5563]">{booking.date}</td>
                  <td className="py-3 px-3 text-right text-[#4B5563]">
                    ₱{booking.revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {selectedBooking === booking.bookingNo && (
                      <Check className="w-4 h-4 text-[#F25C05] mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-[#E5E7EB] flex items-center justify-between">
            <div className="text-[13px] text-[#6B7280]">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-3 rounded-full border-[#E5E7EB] text-[13px]"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-3 rounded-full border-[#E5E7EB] text-[13px]"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="h-10 px-5 rounded-full text-[13px]"
            style={{ fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedBooking}
            className="h-10 px-5 rounded-full bg-[#F25C05] hover:bg-[#F25C05]/90 text-white text-[13px]"
            style={{ fontWeight: 600 }}
          >
            Use this booking
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
