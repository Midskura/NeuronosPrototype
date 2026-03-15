import React, { useState } from "react";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { X, Printer, Download } from "lucide-react";
import { toast } from "../ui/toast-utils";

interface PayrollPayslipsModalProps {
  open: boolean;
  onClose: () => void;
  company: string;
  period: string;
}

interface PayslipData {
  employeeName: string;
  designation: string;
  copyType: "Employee Copy" | "Company Copy";
  earnings: {
    basicPay: number;
    allowance: number;
    overtime: number;
    holidaysPay: number;
    adjustments: number;
    cola: number;
  };
  deductions: {
    lateUndertime: number;
    absences: number;
    sssContribution: number;
    philHealth: number;
    hdmf: number;
    salaryAdj: number;
    sssLoan: number;
    advances: number;
  };
  netPay: number;
}

// Mock payroll data
const MOCK_PAYROLL_DATA: Record<string, PayslipData[]> = {
  "Conforme Cargo Express": [
    {
      employeeName: "Paycana, Gerlie",
      designation: "VICE PRESIDENT",
      copyType: "Employee Copy",
      earnings: {
        basicPay: 14511.9,
        allowance: 0,
        overtime: 0,
        holidaysPay: 0,
        adjustments: 0,
        cola: 5438.11,
      },
      deductions: {
        lateUndertime: 547.67,
        absences: 0,
        sssContribution: 0,
        philHealth: 725.59,
        hdmf: 200.0,
        salaryAdj: 0,
        sssLoan: 0,
        advances: 4000.0,
      },
      netPay: 14476.75,
    },
    {
      employeeName: "Turgo, Christine Joy",
      designation: "OPERATIONS STAFF",
      copyType: "Employee Copy",
      earnings: {
        basicPay: 12800.0,
        allowance: 500,
        overtime: 0,
        holidaysPay: 0,
        adjustments: 0,
        cola: 4800.0,
      },
      deductions: {
        lateUndertime: 0,
        absences: 0,
        sssContribution: 581.3,
        philHealth: 650.0,
        hdmf: 200.0,
        salaryAdj: 0,
        sssLoan: 0,
        advances: 2000.0,
      },
      netPay: 14668.7,
    },
    {
      employeeName: "Morfe, Liancel",
      designation: "DRIVER",
      copyType: "Employee Copy",
      earnings: {
        basicPay: 11500.0,
        allowance: 1000,
        overtime: 450,
        holidaysPay: 0,
        adjustments: 0,
        cola: 4300.0,
      },
      deductions: {
        lateUndertime: 230.0,
        absences: 0,
        sssContribution: 525.0,
        philHealth: 575.0,
        hdmf: 200.0,
        salaryAdj: 0,
        sssLoan: 500.0,
        advances: 1500.0,
      },
      netPay: 13720.0,
    },
  ],
  "ZEUJ One Marketing International": [
    {
      employeeName: "Valera, Pablo Jr.",
      designation: "WAREHOUSE STAFF",
      copyType: "Employee Copy",
      earnings: {
        basicPay: 13200.0,
        allowance: 800,
        overtime: 320,
        holidaysPay: 0,
        adjustments: 0,
        cola: 4950.0,
      },
      deductions: {
        lateUndertime: 0,
        absences: 0,
        sssContribution: 600.0,
        philHealth: 685.0,
        hdmf: 200.0,
        salaryAdj: 0,
        sssLoan: 0,
        advances: 3000.0,
      },
      netPay: 14785.0,
    },
  ],
  "Juan Logistica Courier Services": [
    {
      employeeName: "Gerona, Gerlie",
      designation: "ADMIN ASSISTANT",
      copyType: "Employee Copy",
      earnings: {
        basicPay: 12000.0,
        allowance: 500,
        overtime: 0,
        holidaysPay: 0,
        adjustments: 0,
        cola: 4500.0,
      },
      deductions: {
        lateUndertime: 0,
        absences: 0,
        sssContribution: 550.0,
        philHealth: 625.0,
        hdmf: 200.0,
        salaryAdj: 0,
        sssLoan: 0,
        advances: 2500.0,
      },
      netPay: 13125.0,
    },
  ],
  "ZN International Cargo Forwarding": [
    {
      employeeName: "Santos, Maria",
      designation: "ACCOUNTING CLERK",
      copyType: "Employee Copy",
      earnings: {
        basicPay: 13500.0,
        allowance: 600,
        overtime: 0,
        holidaysPay: 0,
        adjustments: 0,
        cola: 5062.5,
      },
      deductions: {
        lateUndertime: 0,
        absences: 0,
        sssContribution: 612.5,
        philHealth: 700.0,
        hdmf: 200.0,
        salaryAdj: 0,
        sssLoan: 0,
        advances: 2800.0,
      },
      netPay: 14850.0,
    },
  ],
};

// Get company-specific header color
function getCompanyHeaderStyle(company: string) {
  switch (company) {
    case "Conforme Cargo Express":
      return { background: "#FFFFFF", color: "#000000" };
    case "ZEUJ One Marketing International":
      return { background: "#FCD34D", color: "#000000" };
    case "Juan Logistica Courier Services":
      return { background: "#F97316", color: "#FFFFFF" };
    case "ZN International Cargo Forwarding":
      return { background: "#0A1D4D", color: "#FFFFFF" };
    default:
      return { background: "#FFFFFF", color: "#000000" };
  }
}

function PayslipCard({
  data,
  company,
  period,
}: {
  data: PayslipData;
  company: string;
  period: string;
}) {
  const headerStyle = getCompanyHeaderStyle(company);
  const grossPay =
    data.earnings.basicPay +
    data.earnings.allowance +
    data.earnings.overtime +
    data.earnings.holidaysPay +
    data.earnings.adjustments +
    data.earnings.cola;
  const totalDeductions =
    data.deductions.lateUndertime +
    data.deductions.absences +
    data.deductions.sssContribution +
    data.deductions.philHealth +
    data.deductions.hdmf +
    data.deductions.salaryAdj +
    data.deductions.sssLoan +
    data.deductions.advances;

  return (
    <div
      className="bg-white"
      style={{
        width: "330px",
        border: "2px solid #B9B9B9",
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: headerStyle.background,
          color: headerStyle.color,
          padding: "12px 16px",
          borderBottom: "1px solid #B9B9B9",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px" }}>
          {company.toUpperCase()}
        </div>
        <div style={{ fontSize: "10px", fontWeight: 600, marginTop: "2px", letterSpacing: "0.3px" }}>
          PAYSLIP
        </div>
        <div style={{ fontSize: "9px", fontWeight: 500, marginTop: "4px", letterSpacing: "0.2px" }}>
          Cut off {period}
        </div>
      </div>

      {/* Employee Info */}
      <div
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid #B9B9B9",
          position: "relative",
        }}
      >
        <div style={{ fontSize: "11px", marginBottom: "4px" }}>
          <span style={{ fontWeight: 600 }}>Employee Name:</span>{" "}
          <span style={{ fontWeight: 400 }}>{data.employeeName}</span>
        </div>
        <div style={{ fontSize: "11px" }}>
          <span style={{ fontWeight: 600 }}>Designation:</span>{" "}
          <span style={{ fontWeight: 400 }}>{data.designation}</span>
        </div>
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "16px",
            fontSize: "9px",
            color: "#6B7280",
            fontWeight: 500,
          }}
        >
          {data.copyType}
        </div>
      </div>

      {/* Earnings */}
      <div style={{ padding: "12px 16px" }}>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 700,
            marginBottom: "6px",
            padding: "4px 8px",
            background: "#F9FAFB",
            border: "1px solid #B9B9B9",
            letterSpacing: "0.3px",
          }}
        >
          EARNINGS
        </div>
        <div style={{ fontSize: "11px", lineHeight: "1.6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
            <span>Basic Pay</span>
            <span style={{ fontWeight: 500 }}>₱{data.earnings.basicPay.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
            <span>Allowance</span>
            <span style={{ fontWeight: 500 }}>₱{data.earnings.allowance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
            <span>Overtime</span>
            <span style={{ fontWeight: 500 }}>₱{data.earnings.overtime.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
            <span>HOLIDAYS pay</span>
            <span style={{ fontWeight: 500 }}>₱{data.earnings.holidaysPay.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
            <span>Adjustments</span>
            <span style={{ fontWeight: 500 }}>₱{data.earnings.adjustments.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
            <span>COLA</span>
            <span style={{ fontWeight: 500 }}>₱{data.earnings.cola.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingTop: "4px",
              borderTop: "1px solid #B9B9B9",
              fontWeight: 700,
            }}
          >
            <span>Gross Pay</span>
            <span>₱{grossPay.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Deductions */}
      <div style={{ padding: "0 16px 12px" }}>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 700,
            marginBottom: "6px",
            padding: "4px 8px",
            background: "#F9FAFB",
            border: "1px solid #B9B9B9",
            letterSpacing: "0.3px",
          }}
        >
          DEDUCTIONS
        </div>
        <div style={{ fontSize: "11px", lineHeight: "1.6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
            <span>Late/Undertime</span>
            <span style={{ fontWeight: 500 }}>₱{data.deductions.lateUndertime.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
            <span>Absences</span>
            <span style={{ fontWeight: 500 }}>₱{data.deductions.absences.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
            <span>SSS Cont</span>
            <span style={{ fontWeight: 500 }}>₱{data.deductions.sssContribution.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
            <span>PhilHealth</span>
            <span style={{ fontWeight: 500 }}>₱{data.deductions.philHealth.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
            <span>HDMF</span>
            <span style={{ fontWeight: 500 }}>₱{data.deductions.hdmf.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
            <span>Salary adj.</span>
            <span style={{ fontWeight: 500 }}>₱{data.deductions.salaryAdj.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
            <span>SSS LOAN</span>
            <span style={{ fontWeight: 500 }}>₱{data.deductions.sssLoan.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
            <span>Advances</span>
            <span style={{ fontWeight: 500 }}>₱{data.deductions.advances.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingTop: "4px",
              borderTop: "1px solid #B9B9B9",
              fontWeight: 700,
            }}
          >
            <span>Total Deductions</span>
            <span>₱{totalDeductions.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Net Pay */}
      <div
        style={{
          margin: "0 16px 12px",
          padding: "8px 12px",
          border: "2px solid #B9B9B9",
          borderRadius: "4px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "10px", fontWeight: 600, marginBottom: "2px", letterSpacing: "0.3px" }}>
          NET PAY
        </div>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "#0A1D4D" }}>
          ₱{data.netPay.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Signature */}
      <div style={{ padding: "0 16px 12px", textAlign: "center" }}>
        <div style={{ fontSize: "10px", marginBottom: "16px" }}>Received by:</div>
        <div
          style={{
            borderBottom: "1px solid #000000",
            marginBottom: "4px",
            height: "20px",
          }}
        />
        <div style={{ fontSize: "9px", color: "#6B7280" }}>Signature</div>
      </div>
    </div>
  );
}

export function PayrollPayslipsModal({
  open,
  onClose,
  company,
  period,
}: PayrollPayslipsModalProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");

  if (!open) return null;

  const payslips = MOCK_PAYROLL_DATA[company] || [];
  const filteredPayslips =
    selectedEmployee === "all"
      ? payslips
      : payslips.filter((p) => p.employeeName === selectedEmployee);

  // Generate duplicates for employee and company copies
  const allPayslips = filteredPayslips.flatMap((slip) => [
    { ...slip, copyType: "Employee Copy" as const },
    { ...slip, copyType: "Company Copy" as const },
  ]);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center"
      style={{ zIndex: 100 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[16px] overflow-hidden flex flex-col"
        style={{
          width: "1180px",
          height: "90vh",
          maxHeight: "900px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="border-b border-[#E6E9F0] flex items-center justify-between flex-shrink-0"
          style={{ padding: "20px 24px" }}
        >
          <div>
            <h2
              className="text-[#0A1D4D]"
              style={{ fontSize: "18px", fontWeight: 600 }}
            >
              Payroll Payslips – {company}
            </h2>
            <p className="text-[12px] text-[#6B7280] mt-1">
              {period}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => toast.success("Downloading Excel...")}
              variant="ghost"
              className="h-11 text-[14px]"
              style={{ fontWeight: 500, minWidth: "120px", borderRadius: "10px" }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Excel
            </Button>
            <Button
              onClick={() => window.print()}
              className="h-11 px-6 bg-[#F25C05] hover:bg-[#E55304] text-white text-[14px]"
              style={{ fontWeight: 500, minWidth: "140px", borderRadius: "10px" }}
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Filter */}
        <div
          className="border-b border-[#E6E9F0] flex-shrink-0"
          style={{ padding: "16px 24px" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-[#6B7280]" style={{ fontWeight: 500 }}>
              Employee:
            </span>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger
                className="h-9 rounded-lg border-[#E5E7EB] text-[13px]"
                style={{ width: "240px" }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {payslips.map((slip) => (
                  <SelectItem key={slip.employeeName} value={slip.employeeName}>
                    {slip.employeeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Payslips Grid */}
        <div
          className="flex-1 overflow-y-auto"
          style={{
            background: "#F3F4F6",
            padding: "24px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 330px)",
              gap: "24px",
              justifyContent: "center",
            }}
          >
            {allPayslips.map((slip, index) => (
              <PayslipCard
                key={`${slip.employeeName}-${slip.copyType}-${index}`}
                data={slip}
                company={company}
                period={period}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
