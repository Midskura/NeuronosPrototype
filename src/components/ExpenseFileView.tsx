import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { ChevronRight, Printer, Download, FileText, Image } from "lucide-react";

interface ExpenseFileViewProps {
  expense: {
    id: string;
    bookingId: string;
    bookingNo: string;
    type: string;
    amount: number;
    description?: string;
    date: string;
    status: "Pending" | "Approved" | "Rejected";
    enteredBy: string;
  };
  onBack: () => void;
}

export function ExpenseFileView({ expense, onBack }: ExpenseFileViewProps) {
  const handlePrint = () => {
    window.print();
  };

  // Format expense ID to match pattern EXP-2025-XXXX
  const expenseId = expense.id.startsWith('e') 
    ? `EXP-2025-${expense.id.substring(1).padStart(4, '0')}`
    : `EXP-2025-${expense.id.padStart(4, '0')}`;

  // Mock route data - in a real app this would come from booking data
  const route = "Cavite → Baguio";
  const vendor = "Shell Aguinaldo Hiway, Cavite";
  const paymentMethod = "Company Card • ****9123";
  const lastUpdatedBy = expense.enteredBy;
  const lastUpdatedDate = expense.date;
  const lastUpdatedTime = "14:05";

  // Mock attachments
  const attachments = [
    { name: "Receipt_1021.jpg", size: "235 KB", type: "image" },
    { name: "PumpInvoice_ABC.pdf", size: "98 KB", type: "pdf" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "Pending":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-section, .print-section * {
            visibility: visible;
          }
          .print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .print-header {
            display: flex !important;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid #E5E7EB;
          }
          .print-logo {
            font-size: 20px;
            font-weight: 600;
            color: #0A1D4D;
          }
        }
        @media screen {
          .print-header {
            display: none;
          }
        }
      `}</style>

      <div className="print-section p-8 max-w-5xl mx-auto">
        {/* Print-only header with logo */}
        <div className="print-header">
          <div className="print-logo">JJB Group Logistics</div>
          <div className="text-sm text-[#6B7280]">
            Generated: {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Breadcrumb - hide on print */}
        <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-4 no-print">
          <button onClick={onBack} className="hover:text-[#F25C05] transition-colors">
            Accounting
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="hover:text-[#F25C05] transition-colors cursor-pointer">Entries</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#0A1D4D]">{expenseId}</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[#0A1D4D]">Expense File — {expenseId}</h1>
          </div>
          <div className="flex items-center gap-3 no-print">
            <span
              className={`px-3 py-1.5 rounded-md border text-sm ${getStatusColor(
                expense.status
              )}`}
            >
              {expense.status}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="border-[#E5E7EB] text-[#0A1D4D] hover:bg-[#F9FAFB]"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Summary Section - 2x2 Grid */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-white border border-[#E5E7EB] rounded-lg">
            <p className="text-xs text-[#6B7280] mb-2 uppercase tracking-wide">Amount</p>
            <p className="text-2xl text-[#0A1D4D]">₱{expense.amount.toLocaleString()}</p>
          </Card>

          <Card className="p-4 bg-white border border-[#E5E7EB] rounded-lg">
            <p className="text-xs text-[#6B7280] mb-2 uppercase tracking-wide">Type</p>
            <p className="text-2xl text-[#0A1D4D]">{expense.type}</p>
          </Card>

          <Card className="p-4 bg-white border border-[#E5E7EB] rounded-lg">
            <p className="text-xs text-[#6B7280] mb-2 uppercase tracking-wide">Linked Booking</p>
            <p className="text-2xl text-[#0A1D4D]">{expense.bookingNo}</p>
          </Card>

          <Card className="p-4 bg-white border border-[#E5E7EB] rounded-lg">
            <p className="text-xs text-[#6B7280] mb-2 uppercase tracking-wide">Date Incurred</p>
            <p className="text-2xl text-[#0A1D4D]">{expense.date}</p>
          </Card>
        </div>

        {/* Main Details Section */}
        <Card className="p-6 bg-white border border-[#E5E7EB] rounded-lg mb-6">
          <h3 className="text-[#0A1D4D] mb-4">Details</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[#E5E7EB]">
              <span className="text-sm text-[#6B7280]">Booking No</span>
              <span className="text-sm text-[#1F2937]">{expense.bookingNo}</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-[#E5E7EB]">
              <span className="text-sm text-[#6B7280]">Route</span>
              <span className="text-sm text-[#1F2937]">{route}</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-[#E5E7EB]">
              <span className="text-sm text-[#6B7280]">Entered By</span>
              <span className="text-sm text-[#1F2937]">{expense.enteredBy}</span>
            </div>

            <div className="flex items-start justify-between py-3 border-b border-[#E5E7EB]">
              <span className="text-sm text-[#6B7280]">Description</span>
              <span className="text-sm text-[#1F2937] text-right max-w-md">
                {expense.description || "No description provided"}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-[#E5E7EB]">
              <span className="text-sm text-[#6B7280]">Vendor</span>
              <span className="text-sm text-[#1F2937]">{vendor}</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-[#E5E7EB]">
              <span className="text-sm text-[#6B7280]">Payment Method</span>
              <span className="text-sm text-[#1F2937]">{paymentMethod}</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-[#6B7280]">Status</span>
              <span
                className={`px-3 py-1 rounded-md border text-xs ${getStatusColor(
                  expense.status
                )}`}
              >
                {expense.status}
              </span>
            </div>
          </div>
        </Card>

        {/* Attachments Section */}
        <Card className="p-6 bg-white border border-[#E5E7EB] rounded-lg mb-6">
          <h3 className="text-[#0A1D4D] mb-4">Attachments</h3>
          <div className="space-y-3">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg hover:bg-white transition-colors"
              >
                <div className="flex items-center gap-3">
                  {file.type === "image" ? (
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Image className="w-5 h-5 text-blue-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-[#1F2937]">{file.name}</p>
                    <p className="text-xs text-[#6B7280]">{file.size}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#F25C05] hover:text-[#D84D00] hover:bg-[#F25C05]/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB] no-print">
          <p className="text-sm text-[#6B7280]">
            Last updated by {lastUpdatedBy} · {lastUpdatedDate} {lastUpdatedTime}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-[#F25C05] text-[#F25C05] hover:bg-[#F25C05]/10"
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="border-[#F25C05] text-[#F25C05] hover:bg-[#F25C05]/10"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
