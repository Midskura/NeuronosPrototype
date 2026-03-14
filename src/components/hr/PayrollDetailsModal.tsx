import { useState } from "react";
import { X, Edit } from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { cn } from "../ui/utils";

interface PayrollDetailsModalProps {
  open: boolean;
  onClose: () => void;
  company: string;
  period: string;
  onSave: () => void;
}

interface PayrollRow {
  employeeName: string;
  basicPay: number;
  perDay: number;
  perHr: number;
  noOfDays: number;
  basicPayTotal: number;
  leaveWPay: number;
  leaveWPayDays?: number;
  absent: number;
  absentDays?: number;
  late: number;
  totalDeduction: number;
  finalBasicPay: number;
  sss: number;
  sssLoan: number;
  ca: number;
  totalAmt: number;
  cola: number;
  netPay: number;
}

const MOCK_PAYROLL_DATA: PayrollRow[] = [
  {
    employeeName: "Gerona, Gerlie",
    basicPay: 29023.79,
    perDay: 1334.43,
    perHr: 166.8,
    noOfDays: 10.875,
    basicPayTotal: 14511.9,
    leaveWPay: 0,
    absent: 1.82,
    late: 378.71,
    totalDeduction: 378.71,
    finalBasicPay: 14133.19,
    sss: 1000.0,
    sssLoan: 833.33,
    ca: 1833.33,
    totalAmt: 3666.66,
    cola: 0,
    netPay: 14205.3,
  },
  {
    employeeName: "Valera, Pablo Jr.",
    basicPay: 19800.0,
    perDay: 910.34,
    perHr: 113.79,
    noOfDays: 10.875,
    basicPayTotal: 9900.0,
    leaveWPay: 0,
    absent: 0.92,
    late: 827.75,
    totalDeduction: 827.75,
    finalBasicPay: 9072.25,
    sss: 1000.0,
    sssLoan: 0,
    ca: 1225.0,
    totalAmt: 2225.0,
    cola: 3941.67,
    netPay: 11788.92,
  },
  {
    employeeName: "Turgo, Christine Joy",
    basicPay: 20700.0,
    perDay: 951.72,
    perHr: 118.97,
    noOfDays: 10.875,
    basicPayTotal: 10350.0,
    leaveWPay: 951.72,
    leaveWPayDays: 1,
    absent: 0,
    late: 0,
    totalDeduction: 951.72,
    finalBasicPay: 9398.28,
    sss: 925.0,
    sssLoan: 0,
    ca: 0,
    totalAmt: 925.0,
    cola: 2400.0,
    netPay: 10873.28,
  },
  {
    employeeName: "Morfe, Liancel",
    basicPay: 16500.0,
    perDay: 758.62,
    perHr: 94.83,
    noOfDays: 10.875,
    basicPayTotal: 8250.0,
    leaveWPay: 0,
    absent: 0,
    late: 0,
    totalDeduction: 0,
    finalBasicPay: 8250.0,
    sss: 825.0,
    sssLoan: 0,
    ca: 625.0,
    totalAmt: 1450.0,
    cola: 3250.0,
    netPay: 10050.0,
  },
];

export function PayrollDetailsModal({
  open,
  onClose,
  company,
  period,
  onSave,
}: PayrollDetailsModalProps) {
  const [editMode, setEditMode] = useState(false);

  if (!open) return null;

  const totalBasicPay = MOCK_PAYROLL_DATA.reduce(
    (sum, row) => sum + row.basicPayTotal,
    0
  );
  const totalFinalBasicPay = MOCK_PAYROLL_DATA.reduce(
    (sum, row) => sum + row.finalBasicPay,
    0
  );
  const totalSSS = MOCK_PAYROLL_DATA.reduce((sum, row) => sum + row.sss, 0);
  const totalSSSLoan = MOCK_PAYROLL_DATA.reduce(
    (sum, row) => sum + row.sssLoan,
    0
  );
  const totalCA = MOCK_PAYROLL_DATA.reduce((sum, row) => sum + row.ca, 0);
  const totalAmt = MOCK_PAYROLL_DATA.reduce((sum, row) => sum + row.totalAmt, 0);
  const totalCOLA = MOCK_PAYROLL_DATA.reduce((sum, row) => sum + row.cola, 0);
  const totalNetPay = MOCK_PAYROLL_DATA.reduce((sum, row) => sum + row.netPay, 0);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-8 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl flex flex-col my-10"
        style={{ width: "1200px", maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-[16px] text-[#0A1D4D]" style={{ fontWeight: 600 }}>
              Payroll Details – {company} – {period}
            </h3>
            <p className="text-[12px] text-[#6B7280] mt-1">
              Review and finalize employee payroll
            </p>
          </div>
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <Button
                  onClick={() => setEditMode(false)}
                  variant="outline"
                  className="h-9 px-4 rounded-lg border-[#E5E7EB] text-[13px]"
                  style={{ fontWeight: 600 }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setEditMode(false);
                    onSave();
                  }}
                  className="h-9 px-4 rounded-lg bg-[#0A1D4D] hover:bg-[#0A1D4D]/90 text-white text-[13px]"
                  style={{ fontWeight: 600 }}
                >
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setEditMode(true)}
                  className="h-9 px-4 rounded-lg bg-[#0A1D4D] hover:bg-[#0A1D4D]/90 text-white text-[13px]"
                  style={{ fontWeight: 600 }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-[#F9FAFB]"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Spreadsheet Area */}
          <div className="flex-1 overflow-x-auto overflow-y-auto p-6">
            <div className="border border-[#D1D5DB] rounded-lg overflow-hidden">
              <table className="w-full" style={{ minWidth: "1800px" }}>
                <thead>
                  <tr className="bg-[#D4AF37]">
                    <th
                      className="px-2 py-2 text-left text-[10px] text-[#000000] uppercase border-r border-[#000000]"
                      style={{ fontWeight: 700, width: "140px" }}
                    >
                      Employees
                    </th>
                    <th
                      className="px-2 py-2 text-center text-[10px] text-[#000000] uppercase border-r border-[#000000]"
                      style={{ fontWeight: 700, width: "80px" }}
                    >
                      Basic Pay
                    </th>
                    <th
                      className="px-2 py-2 text-center text-[10px] text-[#000000] uppercase border-r border-[#000000]"
                      style={{ fontWeight: 700, width: "70px" }}
                    >
                      Per Day
                    </th>
                    <th
                      className="px-2 py-2 text-center text-[10px] text-[#000000] uppercase border-r border-[#000000]"
                      style={{ fontWeight: 700, width: "70px" }}
                    >
                      Per Hr
                    </th>
                    <th
                      className="px-2 py-2 text-center text-[10px] text-[#000000] uppercase border-r border-[#000000]"
                      style={{ fontWeight: 700, width: "80px" }}
                    >
                      No of Days
                    </th>
                    <th
                      className="px-2 py-2 text-center text-[10px] text-[#000000] uppercase border-r border-[#000000]"
                      style={{ fontWeight: 700, width: "90px" }}
                    >
                      Basic Pay
                    </th>
                    <th
                      colSpan={2}
                      className="px-2 py-2 text-center text-[10px] text-[#000000] uppercase border-r border-[#000000]"
                      style={{ fontWeight: 700 }}
                    >
                      Leave w/Pay
                    </th>
                    <th
                      colSpan={2}
                      className="px-2 py-2 text-center text-[10px] text-[#000000] uppercase border-r border-[#000000]"
                      style={{ fontWeight: 700 }}
                    >
                      Absent
                    </th>
                    <th
                      colSpan={2}
                      className="px-2 py-2 text-center text-[10px] text-[#000000] uppercase border-r border-[#000000]"
                      style={{ fontWeight: 700 }}
                    >
                      Late
                    </th>
                    <th
                      colSpan={2}
                      className="px-2 py-2 text-center text-[10px] text-[#000000] uppercase border-r border-[#000000]"
                      style={{ fontWeight: 700 }}
                    >
                      Total Absent/Late
                    </th>
                    <th
                      className="px-2 py-2 text-center text-[10px] text-[#000000] uppercase border-r border-[#000000]"
                      style={{ fontWeight: 700, width: "90px" }}
                    >
                      Final Basic Pay
                    </th>
                    <th
                      className="px-2 py-2 text-center text-[10px] text-[#000000] uppercase border-r border-[#000000]"
                      style={{ fontWeight: 700, width: "70px" }}
                    >
                      SSS
                    </th>
                    <th
                      className="px-2 py-2 text-center text-[10px] text-[#000000] uppercase border-r border-[#000000]"
                      style={{ fontWeight: 700, width: "70px" }}
                    >
                      SSS Loan Payable
                    </th>
                    <th
                      className="px-2 py-2 text-center text-[10px] text-[#000000] uppercase border-r border-[#000000]"
                      style={{ fontWeight: 700, width: "70px" }}
                    >
                      CA
                    </th>
                    <th
                      className="px-2 py-2 text-center text-[10px] text-[#000000] uppercase border-r border-[#000000]"
                      style={{ fontWeight: 700, width: "80px" }}
                    >
                      Total Amt
                    </th>
                    <th
                      className="px-2 py-2 text-center text-[10px] text-[#000000] uppercase border-r border-[#000000]"
                      style={{ fontWeight: 700, width: "70px" }}
                    >
                      COLA
                    </th>
                    <th
                      className="px-2 py-2 text-center text-[10px] text-[#000000] uppercase border-r border-[#000000]"
                      style={{ fontWeight: 700, width: "90px" }}
                    >
                      Net Pay
                    </th>
                    <th
                      className="px-2 py-2 text-center text-[10px] text-[#000000] uppercase"
                      style={{ fontWeight: 700, width: "100px" }}
                    >
                      Signature
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {MOCK_PAYROLL_DATA.map((row, idx) => (
                    <tr key={idx} className="border-b border-[#D1D5DB]">
                      <td
                        className="px-2 py-2 text-[11px] text-[#000000] border-r border-[#D1D5DB]"
                        style={{ fontWeight: 500 }}
                      >
                        {row.employeeName}
                      </td>
                      <td className="px-2 py-2 text-[11px] text-[#000000] text-right border-r border-[#D1D5DB] font-mono">
                        {row.basicPay.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-2 py-2 text-[11px] text-[#000000] text-right border-r border-[#D1D5DB] font-mono">
                        {row.perDay.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-2 py-2 text-[11px] text-[#000000] text-right border-r border-[#D1D5DB] font-mono">
                        {row.perHr.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-2 py-2 text-[11px] text-[#000000] text-center border-r border-[#D1D5DB] font-mono">
                        {row.noOfDays}
                      </td>
                      <td className="px-2 py-2 text-[11px] text-[#000000] text-right border-r border-[#D1D5DB] font-mono">
                        {row.basicPayTotal.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-2 py-2 text-[10px] text-[#000000] text-center border-r border-[#D1D5DB]">
                        {row.leaveWPayDays || "-"}
                      </td>
                      <td className="px-2 py-2 text-[11px] text-[#000000] text-right border-r border-[#D1D5DB] font-mono">
                        {row.leaveWPay > 0
                          ? row.leaveWPay.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })
                          : "-"}
                      </td>
                      <td className="px-2 py-2 text-[10px] text-[#000000] text-center border-r border-[#D1D5DB]">
                        {row.absentDays || "-"}
                      </td>
                      <td className="px-2 py-2 text-[11px] text-[#000000] text-right border-r border-[#D1D5DB] font-mono">
                        {row.absent > 0
                          ? row.absent.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })
                          : "-"}
                      </td>
                      <td className="px-2 py-2 text-[10px] text-[#000000] text-center border-r border-[#D1D5DB]">
                        {row.late > 0 ? "hrs" : "-"}
                      </td>
                      <td className="px-2 py-2 text-[11px] text-[#000000] text-right border-r border-[#D1D5DB] font-mono">
                        {row.late > 0
                          ? row.late.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })
                          : "-"}
                      </td>
                      <td className="px-2 py-2 text-[10px] text-[#000000] text-center border-r border-[#D1D5DB]">
                        {row.totalDeduction > 0 ? "1.82" : "-"}
                      </td>
                      <td className="px-2 py-2 text-[11px] text-[#000000] text-right border-r border-[#D1D5DB] font-mono">
                        {row.totalDeduction > 0
                          ? row.totalDeduction.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })
                          : "-"}
                      </td>
                      <td
                        className="px-2 py-2 text-[11px] text-[#000000] text-right border-r border-[#D1D5DB] font-mono"
                        style={{ fontWeight: 600 }}
                      >
                        {row.finalBasicPay.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-2 py-2 text-[11px] text-[#000000] text-right border-r border-[#D1D5DB] font-mono">
                        {row.sss.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-2 py-2 text-[11px] text-[#000000] text-right border-r border-[#D1D5DB] font-mono">
                        {row.sssLoan > 0
                          ? row.sssLoan.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })
                          : "-"}
                      </td>
                      <td className="px-2 py-2 text-[11px] text-[#000000] text-right border-r border-[#D1D5DB] font-mono">
                        {row.ca > 0
                          ? row.ca.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })
                          : "-"}
                      </td>
                      <td className="px-2 py-2 text-[11px] text-[#000000] text-right border-r border-[#D1D5DB] font-mono">
                        {row.totalAmt.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-2 py-2 text-[11px] text-[#000000] text-right border-r border-[#D1D5DB] font-mono">
                        {row.cola > 0
                          ? row.cola.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })
                          : "-"}
                      </td>
                      <td
                        className="px-2 py-2 text-[11px] text-[#000000] text-right border-r border-[#D1D5DB] font-mono"
                        style={{ fontWeight: 700 }}
                      >
                        {row.netPay.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-2 py-2 border-[#D1D5DB]"></td>
                    </tr>
                  ))}
                  {/* TOTAL Row */}
                  <tr className="bg-[#F9FAFB] border-t-2 border-[#000000]">
                    <td
                      className="px-2 py-2 text-[11px] text-[#000000] border-r border-[#D1D5DB]"
                      style={{ fontWeight: 700 }}
                    >
                      TOTAL
                    </td>
                    <td className="px-2 py-2 border-r border-[#D1D5DB]"></td>
                    <td className="px-2 py-2 border-r border-[#D1D5DB]"></td>
                    <td className="px-2 py-2 border-r border-[#D1D5DB]"></td>
                    <td className="px-2 py-2 border-r border-[#D1D5DB]"></td>
                    <td
                      className="px-2 py-2 text-[11px] text-[#000000] text-right border-r border-[#D1D5DB] font-mono"
                      style={{ fontWeight: 700 }}
                    >
                      {totalBasicPay.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-2 py-2 border-r border-[#D1D5DB]"></td>
                    <td className="px-2 py-2 border-r border-[#D1D5DB]"></td>
                    <td className="px-2 py-2 border-r border-[#D1D5DB]"></td>
                    <td className="px-2 py-2 border-r border-[#D1D5DB]"></td>
                    <td className="px-2 py-2 border-r border-[#D1D5DB]"></td>
                    <td className="px-2 py-2 border-r border-[#D1D5DB]"></td>
                    <td className="px-2 py-2 border-r border-[#D1D5DB]"></td>
                    <td className="px-2 py-2 border-r border-[#D1D5DB]"></td>
                    <td
                      className="px-2 py-2 text-[11px] text-[#000000] text-right border-r border-[#D1D5DB] font-mono"
                      style={{ fontWeight: 700 }}
                    >
                      {totalFinalBasicPay.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td
                      className="px-2 py-2 text-[11px] text-[#000000] text-right border-r border-[#D1D5DB] font-mono"
                      style={{ fontWeight: 700 }}
                    >
                      {totalSSS.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td
                      className="px-2 py-2 text-[11px] text-[#000000] text-right border-r border-[#D1D5DB] font-mono"
                      style={{ fontWeight: 700 }}
                    >
                      {totalSSSLoan.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td
                      className="px-2 py-2 text-[11px] text-[#000000] text-right border-r border-[#D1D5DB] font-mono"
                      style={{ fontWeight: 700 }}
                    >
                      {totalCA.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td
                      className="px-2 py-2 text-[11px] text-[#000000] text-right border-r border-[#D1D5DB] font-mono"
                      style={{ fontWeight: 700 }}
                    >
                      {totalAmt.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td
                      className="px-2 py-2 text-[11px] text-[#000000] text-right border-r border-[#D1D5DB] font-mono"
                      style={{ fontWeight: 700 }}
                    >
                      {totalCOLA.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td
                      className="px-2 py-2 text-[11px] text-[#000000] text-right border-r border-[#D1D5DB] font-mono"
                      style={{ fontWeight: 700 }}
                    >
                      {totalNetPay.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-2 py-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Settings Panel */}
          <div
            className="border-l border-[#E5E7EB] bg-[#F9FAFB] flex-shrink-0 p-6 overflow-y-auto"
            style={{ width: "280px" }}
          >
            <h4
              className="text-[#0A1D4D] mb-4"
              style={{ fontSize: "14px", fontWeight: 600 }}
            >
              Payroll Settings
            </h4>
            <div className="space-y-4">
              <div>
                <Label className="text-[10px] text-[#6B7280] mb-2 block uppercase">
                  Formula
                </Label>
                <div className="text-[12px] text-[#0A1D4D]">
                  Standard PH – JJB
                </div>
              </div>
              <div>
                <Label className="text-[10px] text-[#6B7280] mb-2 block uppercase">
                  Gov Table Version
                </Label>
                <div className="text-[12px] text-[#0A1D4D]">2025-Q3</div>
              </div>
              <div>
                <Label className="text-[10px] text-[#6B7280] mb-2 block uppercase">
                  Rounding
                </Label>
                <div className="text-[12px] text-[#0A1D4D]">Nearest peso</div>
              </div>
              <div className="pt-4 border-t border-[#E5E7EB]">
                <p className="text-[11px] text-[#6B7280] italic">
                  Note: Deductions handled manually for now.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
