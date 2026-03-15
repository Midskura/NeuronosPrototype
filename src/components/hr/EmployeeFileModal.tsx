import React, { useState } from "react";
import { X, Pencil } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { cn } from "../ui/utils";

interface EmployeeFileData {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  middleName: string;
  fullName: string;
  company: string;
  designation: string;
  regularization: string;
  birthdate: string;
  email: string;
  contactNumber: string;
  address?: string;
  rateType?: "Monthly" | "Daily";
  salary?: number;
  status: "Active" | "Separated";
  notes?: string;
  includedInPayroll?: boolean;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyContact: string;
  sssNumber: string;
  philhealthNumber: string;
  pagibigNumber: string;
  tinNumber: string;
}

interface EmployeeFileModalProps {
  open: boolean;
  onClose: () => void;
  employee: EmployeeFileData;
}

const COMPANY_COLORS: Record<string, string> = {
  "Conforme Cargo Express": "bg-[#FEF3C7] text-[#92400E]",
  "ZEUJ One Marketing International": "bg-[#D1FAE5] text-[#065F46]",
  "Juan Logistica Courier Services": "bg-[#FED7AA] text-[#9A3412]",
  "ZN International Cargo Forwarding": "bg-[#E0E7FF] text-[#3730A3]",
};

export function EmployeeFileModal({
  open,
  onClose,
  employee,
}: EmployeeFileModalProps) {
  const [activeTab, setActiveTab] = useState("personal");

  if (!open) return null;

  const hasMissingPagibig = !employee.pagibigNumber || employee.pagibigNumber === "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal - Enlarged and following Neuron design system */}
      <div
        className="relative bg-white rounded-[24px] flex flex-col overflow-hidden"
        style={{ 
          width: "1400px", 
          maxWidth: "95vw", 
          maxHeight: "90vh",
          border: "1px solid #E5E9F0",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b border-[#E5E9F0] flex-shrink-0"
          style={{ padding: "24px 32px", background: "#FFFFFF" }}
        >
          <div>
            <div className="flex items-center gap-3">
              <h2
                style={{ fontSize: "24px", fontWeight: 600, color: "#12332B", letterSpacing: "-0.5px" }}
              >
                {employee.fullName}
              </h2>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "6px 14px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 600,
                  backgroundColor: employee.company === "Conforme Cargo Express" ? "#FEF3C7" :
                                   employee.company === "ZEUJ One Marketing International" ? "#D1FAE5" :
                                   employee.company === "Juan Logistica Courier Services" ? "#FED7AA" : "#E0E7FF",
                  color: employee.company === "Conforme Cargo Express" ? "#92400E" :
                         employee.company === "ZEUJ One Marketing International" ? "#065F46" :
                         employee.company === "Juan Logistica Courier Services" ? "#9A3412" : "#3730A3"
                }}
              >
                {employee.company}
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "#667085", marginTop: "4px" }}>
              Employee ID: {employee.employeeId} • {employee.designation}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              style={{
                height: "40px",
                padding: "0 20px",
                borderRadius: "12px",
                background: "#0F766E",
                border: "none",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 150ms ease"
              }}
            >
              <Pencil className="w-4 h-4" />
              Edit Profile
            </button>
            <button
              onClick={onClose}
              style={{
                height: "40px",
                width: "40px",
                padding: 0,
                borderRadius: "12px",
                background: "transparent",
                border: "1px solid #E5E9F0",
                color: "#667085",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 150ms ease"
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Employee Header Block */}
        <div
          className="border-b border-[#E5E9F0] flex-shrink-0"
          style={{ padding: "24px 32px", background: "#F9FAFB" }}
        >
          <div className="grid grid-cols-4 gap-8">
            <div>
              <p style={{ fontSize: "11px", color: "#667085", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                Designation
              </p>
              <p style={{ fontSize: "15px", color: "#12332B", fontWeight: 600 }}>
                {employee.designation}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "11px", color: "#667085", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                Date Hired / Regularization
              </p>
              <p style={{ fontSize: "15px", color: "#12332B", fontWeight: 600 }}>
                {employee.regularization}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "11px", color: "#667085", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                Employee ID
              </p>
              <p style={{ fontSize: "15px", color: "#12332B", fontWeight: 600 }}>
                {employee.employeeId}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "11px", color: "#667085", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                Status
              </p>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "4px 12px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 600,
                  backgroundColor: employee.status === "Active" ? "#E8F5E9" : "#F3F4F6",
                  color: employee.status === "Active" ? "#10b981" : "#6B7280"
                }}
              >
                {employee.status}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b border-[#E5E9F0] flex-shrink-0" style={{ padding: "0 32px", background: "#FFFFFF" }}>
              <div style={{ display: "flex", gap: "32px" }}>
                <button
                  onClick={() => setActiveTab("personal")}
                  style={{
                    padding: "16px 0",
                    fontSize: "14px",
                    fontWeight: activeTab === "personal" ? 600 : 500,
                    color: activeTab === "personal" ? "#12332B" : "#667085",
                    background: "transparent",
                    border: "none",
                    borderBottom: activeTab === "personal" ? "2px solid #0F766E" : "2px solid transparent",
                    cursor: "pointer",
                    transition: "all 150ms ease"
                  }}
                >
                  Personal Info
                </button>
                <button
                  onClick={() => setActiveTab("employment")}
                  style={{
                    padding: "16px 0",
                    fontSize: "14px",
                    fontWeight: activeTab === "employment" ? 600 : 500,
                    color: activeTab === "employment" ? "#12332B" : "#667085",
                    background: "transparent",
                    border: "none",
                    borderBottom: activeTab === "employment" ? "2px solid #0F766E" : "2px solid transparent",
                    cursor: "pointer",
                    transition: "all 150ms ease"
                  }}
                >
                  Employment & Payroll
                </button>
                <button
                  onClick={() => setActiveTab("emergency")}
                  style={{
                    padding: "16px 0",
                    fontSize: "14px",
                    fontWeight: activeTab === "emergency" ? 600 : 500,
                    color: activeTab === "emergency" ? "#12332B" : "#667085",
                    background: "transparent",
                    border: "none",
                    borderBottom: activeTab === "emergency" ? "2px solid #0F766E" : "2px solid transparent",
                    cursor: "pointer",
                    transition: "all 150ms ease"
                  }}
                >
                  Emergency & Government IDs
                </button>
              </div>
            </div>

            {/* Divider under tabs */}
            <div className="border-b border-[#E5E9F0] flex-shrink-0" />

            <div className="flex-1 overflow-y-auto" style={{ padding: "32px" }}>
              {/* Tab 1: Personal Info */}
              <TabsContent value="personal" className="mt-0">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-[11px] text-[#6B7280] uppercase tracking-wide mb-2 block">
                      Last Name
                    </Label>
                    <Input
                      value={employee.lastName}
                      disabled
                      className="bg-[#F9FAFB] border-[#E5E7EB] text-[14px]"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-[#6B7280] uppercase tracking-wide mb-2 block">
                      First Name
                    </Label>
                    <Input
                      value={employee.firstName}
                      disabled
                      className="bg-[#F9FAFB] border-[#E5E7EB] text-[14px]"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-[#6B7280] uppercase tracking-wide mb-2 block">
                      Middle Name
                    </Label>
                    <Input
                      value={employee.middleName}
                      disabled
                      className="bg-[#F9FAFB] border-[#E5E7EB] text-[14px]"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-[#6B7280] uppercase tracking-wide mb-2 block">
                      Birthdate
                    </Label>
                    <Input
                      value={employee.birthdate}
                      disabled
                      className="bg-[#F9FAFB] border-[#E5E7EB] text-[14px]"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-[#6B7280] uppercase tracking-wide mb-2 block">
                      Email
                    </Label>
                    <a
                      href={`mailto:${employee.email}`}
                      className="block text-[14px] text-[#0F766E] underline hover:text-[#0D6560] py-2"
                    >
                      {employee.email}
                    </a>
                  </div>
                  <div>
                    <Label className="text-[11px] text-[#6B7280] uppercase tracking-wide mb-2 block">
                      Contact Number
                    </Label>
                    <Input
                      value={employee.contactNumber}
                      disabled
                      className="bg-[#F9FAFB] border-[#E5E7EB] text-[14px]"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[11px] text-[#6B7280] uppercase tracking-wide mb-2 block">
                      Address
                    </Label>
                    <Input
                      value={employee.address || "Not provided"}
                      disabled
                      className="bg-[#F9FAFB] border-[#E5E7EB] text-[14px]"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Employment & Payroll */}
              <TabsContent value="employment" className="mt-0">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-[11px] text-[#6B7280] uppercase tracking-wide mb-2 block">
                      Company
                    </Label>
                    <Select value={employee.company} disabled>
                      <SelectTrigger className="bg-[#F9FAFB] border-[#E5E7EB] text-[14px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Conforme Cargo Express">
                          Conforme Cargo Express
                        </SelectItem>
                        <SelectItem value="ZEUJ One Marketing International">
                          ZEUJ One Marketing International
                        </SelectItem>
                        <SelectItem value="Juan Logistica Courier Services">
                          Juan Logistica Courier Services
                        </SelectItem>
                        <SelectItem value="ZN International Cargo Forwarding">
                          ZN International Cargo Forwarding
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[11px] text-[#6B7280] uppercase tracking-wide mb-2 block">
                      Designation
                    </Label>
                    <Input
                      value={employee.designation}
                      disabled
                      className="bg-[#F9FAFB] border-[#E5E7EB] text-[14px]"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-[#6B7280] uppercase tracking-wide mb-2 block">
                      Rate Type
                    </Label>
                    <Select value={employee.rateType || "Monthly"} disabled>
                      <SelectTrigger className="bg-[#F9FAFB] border-[#E5E7EB] text-[14px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Daily">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[11px] text-[#6B7280] uppercase tracking-wide mb-2 block">
                      {employee.rateType === "Daily" ? "Daily Rate" : "Monthly Salary"}
                    </Label>
                    <div className="relative">
                      <span 
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[#6B7280]"
                        style={{ fontWeight: 500 }}
                      >
                        ₱
                      </span>
                      <Input
                        value={employee.salary ? employee.salary.toLocaleString() : "Not set"}
                        disabled
                        className="bg-[#F9FAFB] border-[#E5E7EB] text-[14px] pl-8"
                        style={{ fontWeight: 600 }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px] text-[#6B7280] uppercase tracking-wide mb-2 block">
                      Status
                    </Label>
                    <Select value={employee.status} disabled>
                      <SelectTrigger className="bg-[#F9FAFB] border-[#E5E7EB] text-[14px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Separated">Separated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[11px] text-[#6B7280] uppercase tracking-wide mb-2 block">
                      Date Hired / Regularization
                    </Label>
                    <Input
                      value={employee.regularization}
                      disabled
                      className="bg-[#F9FAFB] border-[#E5E7EB] text-[14px]"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[11px] text-[#6B7280] uppercase tracking-wide mb-2 block">
                      Notes
                    </Label>
                    <Textarea
                      value={employee.notes || "No notes"}
                      disabled
                      className="bg-[#F9FAFB] border-[#E5E7EB] text-[14px] min-h-[80px]"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                      <Label className="text-[13px] text-[#0A1D4D]" style={{ fontWeight: 500 }}>
                        Included in Payroll?
                      </Label>
                      <Switch checked={employee.includedInPayroll !== false} disabled />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 3: Emergency & Government IDs */}
              <TabsContent value="emergency" className="mt-0">
                <div className="space-y-6">
                  {/* Emergency Contact Section */}
                  <div>
                    <h3
                      className="text-[#0A1D4D] mb-4"
                      style={{ fontSize: "14px", fontWeight: 600 }}
                    >
                      In Case of Emergency
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="col-span-2">
                        <Label className="text-[11px] text-[#6B7280] uppercase tracking-wide mb-2 block">
                          Emergency Contact Name
                        </Label>
                        <Input
                          value={employee.emergencyName}
                          disabled
                          className="bg-[#F9FAFB] border-[#E5E7EB] text-[14px]"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-[#6B7280] uppercase tracking-wide mb-2 block">
                          Relationship
                        </Label>
                        <Input
                          value={employee.emergencyRelationship}
                          disabled
                          className="bg-[#F9FAFB] border-[#E5E7EB] text-[14px]"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-[#6B7280] uppercase tracking-wide mb-2 block">
                          Emergency Contact No.
                        </Label>
                        <Input
                          value={employee.emergencyContact}
                          disabled
                          className="bg-[#F9FAFB] border-[#E5E7EB] text-[14px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Government IDs Section */}
                  <div>
                    <h3
                      className="text-[#0A1D4D] mb-4"
                      style={{ fontSize: "14px", fontWeight: 600 }}
                    >
                      Government IDs
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label className="text-[11px] text-[#6B7280] uppercase tracking-wide mb-2 block">
                          SSS Number
                        </Label>
                        <Input
                          value={employee.sssNumber || "Not provided"}
                          disabled
                          className="bg-[#DBEAFE] border-[#93C5FD] text-[14px]"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-[#6B7280] uppercase tracking-wide mb-2 block">
                          PhilHealth Number
                        </Label>
                        <Input
                          value={employee.philhealthNumber || "Not provided"}
                          disabled
                          className="bg-[#D1FAE5] border-[#6EE7B7] text-[14px]"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-[#6B7280] uppercase tracking-wide mb-2 block">
                          Pag-IBIG Number
                        </Label>
                        <div className="space-y-2">
                          <Input
                            value={employee.pagibigNumber || "Not provided"}
                            disabled
                            className={cn(
                              "border-[#FCA5A5] text-[14px]",
                              hasMissingPagibig
                                ? "bg-[#FEE2E2] placeholder:text-[#991B1B]"
                                : "bg-[#FEE2E2]"
                            )}
                          />
                          {hasMissingPagibig && (
                            <span
                              className="inline-flex items-center px-2 py-1 rounded-full bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-[11px]"
                              style={{ fontWeight: 600 }}
                            >
                              Missing in roster
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-[11px] text-[#6B7280] uppercase tracking-wide mb-2 block">
                          TIN Number
                        </Label>
                        <Input
                          value={employee.tinNumber || "Not provided"}
                          disabled
                          className="bg-[#F9FAFB] border-[#E5E7EB] text-[14px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sync Note */}
                  <div
                    className="p-4 bg-[#F0F9FF] border border-[#BFDBFE] rounded-lg"
                  >
                    <p className="text-[12px] text-[#1E40AF]">
                      <strong>Note:</strong> Values synced from Excel roster 2025. HR can complete missing IDs here.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}