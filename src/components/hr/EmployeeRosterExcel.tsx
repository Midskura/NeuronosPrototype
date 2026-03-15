import React from "react";
import { cn } from "../ui/utils";

interface EmployeeData {
  regularization: string;
  employeeName: string;
  middleName: string;
  birthdate: string;
  idNumber: string;
  designation: string;
  email: string;
  contactNumber: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyContact: string;
  sssNumber: string;
  philhealthNumber: string;
  pagibigNumber: string;
  tinNumber: string;
}

interface CompanySection {
  companyName: string;
  headerColor: string;
  headerTextColor: string;
  employees: EmployeeData[];
}

const COMPANY_DATA: CompanySection[] = [
  {
    companyName: "CONFORME CARGO EXPRESS",
    headerColor: "#F9D71C",
    headerTextColor: "#000000",
    employees: [
      {
        regularization: "12/2/2017",
        employeeName: "PAYCANA, GERLIE",
        middleName: "JASTO",
        birthdate: "1/16/1975",
        idNumber: "CCE-087-01043",
        designation: "VICE PRESIDENT",
        email: "gerlie@conformecargoexpress.com",
        contactNumber: "(+63) 9108019804",
        emergencyName: "JANUS MATTHEW PAYCANA",
        emergencyRelationship: "SON",
        emergencyContact: "(+63) 918 778 5232",
        sssNumber: "0064-4655-964",
        philhealthNumber: "02-05058289-80",
        pagibigNumber: "",
        tinNumber: "",
      },
      {
        regularization: "5/13/2019",
        employeeName: "VALERA, PABLO JR.",
        middleName: "FALCIS",
        birthdate: "12/5/1986",
        idNumber: "CCE-087-02142",
        designation: "OPERATIONS MANAGER",
        email: "pablo@conformecargoexpress.com",
        contactNumber: "(+63) 94512536744",
        emergencyName: "ROSEMARIE VALERA",
        emergencyRelationship: "WIFE",
        emergencyContact: "3394-385-868",
        sssNumber: "00-8565176-34",
        philhealthNumber: "2-12017326-84",
        pagibigNumber: "MISSING",
        tinNumber: "",
      },
      {
        regularization: "3/1/2021",
        employeeName: "TURGO, CHRISTINE JOY",
        middleName: "RUTIAQUO",
        birthdate: "3/28/1995",
        idNumber: "CCE-087-03571",
        designation: "IMPEX SUPERVISOR",
        email: "christine@conformecargoexpress.com",
        contactNumber: "(+63) 927 771 5560",
        emergencyName: "ROSA R. TURGO",
        emergencyRelationship: "MOTHER",
        emergencyContact: "346-274-843",
        sssNumber: "132006750293",
        philhealthNumber: "1-22106752-03",
        pagibigNumber: "",
        tinNumber: "",
      },
      {
        regularization: "8/8/2023",
        employeeName: "BALAGT, JAKE",
        middleName: "BULA",
        birthdate: "10/12/1989",
        idNumber: "CCE-087-03576",
        designation: "COMPANY DRIVER",
        email: "jake@libergroupscompanies.com",
        contactNumber: "(+63) 977 629 4406",
        emergencyName: "REINA O. HONRALES",
        emergencyRelationship: "WIFE",
        emergencyContact: "342-5384-913",
        sssNumber: "132006750293",
        philhealthNumber: "1-22106752-03",
        pagibigNumber: "",
        tinNumber: "",
      },
      {
        regularization: "9/5/2023",
        employeeName: "JAVIER, RONALD",
        middleName: "SALVINO",
        birthdate: "5/14/1985",
        idNumber: "CCE-087-03579",
        designation: "ADMIN STAFF",
        email: "ronald@libergroupscompanies.com",
        contactNumber: "(+63) 905 579 0391",
        emergencyName: "RIHANNA JAVIER",
        emergencyRelationship: "DAUGHTER",
        emergencyContact: "341 089 034",
        sssNumber: "02066196327",
        philhealthNumber: "",
        pagibigNumber: "MISSING",
        tinNumber: "",
      },
      {
        regularization: "10/24/2022",
        employeeName: "ARCIGA, ARLIANE",
        middleName: "RAMOS",
        birthdate: "5/4/1989",
        idNumber: "CCE-087-04568",
        designation: "IMPEX ASSISTANT",
        email: "arcilane@libergroupscompanies.com",
        contactNumber: "(+63) 9650674821",
        emergencyName: "THESE ARCIGA",
        emergencyRelationship: "WIFE",
        emergencyContact: "038-8086-775",
        sssNumber: "19-025177331-08",
        philhealthNumber: "",
        pagibigNumber: "",
        tinNumber: "",
      },
    ],
  },
  {
    companyName: "ZEUJ ONE MARKETING INTERNATIONAL",
    headerColor: "#E8B923",
    headerTextColor: "#000000",
    employees: [
      {
        regularization: "8/3/2022",
        employeeName: "AMANDO, SHEILA MAE",
        middleName: "ARUNA",
        birthdate: "8/28/2000",
        idNumber: "ZEUJ-048",
        designation: "ACCOUNTING HEAD",
        email: "sheila@zeujonemarketinginternational.com",
        contactNumber: "(+63) 9456234789",
        emergencyName: "MARILYN AMANDO",
        emergencyRelationship: "MOTHER",
        emergencyContact: "(+63) 9286442346",
        sssNumber: "172-8849473",
        philhealthNumber: "08-5344518821-2",
        pagibigNumber: "",
        tinNumber: "121636412-6",
      },
    ],
  },
  {
    companyName: "JUAN LOGISTICA COURIER SERVICES",
    headerColor: "#E67E22",
    headerTextColor: "#FFFFFF",
    employees: [
      {
        regularization: "04/05/2024",
        employeeName: "AYUBABAR, ROSELYN",
        middleName: "MENDEZ",
        birthdate: "4/4/1999",
        idNumber: "JUAN-P-1049",
        designation: "ADMIN ASSISTANT",
        email: "roselyn@juanlogisticacourierservices.com",
        contactNumber: "(+63) 9485651738",
        emergencyName: "LILIAN M. ALCAZAR",
        emergencyRelationship: "MOTHER",
        emergencyContact: "(+63) 9446448923",
        sssNumber: "34-6886-885",
        philhealthNumber: "01-03659379-07",
        pagibigNumber: "",
        tinNumber: "9-22139476-9",
      },
    ],
  },
  {
    companyName: "ZN INTERNATIONAL CARGO FORWARDING",
    headerColor: "#1A2B4D",
    headerTextColor: "#FFFFFF",
    employees: [
      {
        regularization: "8/4/2025",
        employeeName: "RERAL, CHRISTIAN PATRICK",
        middleName: "SANCHEZ",
        birthdate: "10/12/1998",
        idNumber: "ZN-P77-1602",
        designation: "MANAGING DIRECTOR",
        email: "christian@zninternational.com",
        contactNumber: "(+63) 9158969401",
        emergencyName: "BEJO NOEL RIDA",
        emergencyRelationship: "FATHER",
        emergencyContact: "(+63) 9158330389",
        sssNumber: "340904-585",
        philhealthNumber: "08-02575387-04",
        pagibigNumber: "",
        tinNumber: "7-32727934-4",
      },
      {
        regularization: "9/9/2023",
        employeeName: "BARCELLON, PRINCE HARVEY",
        middleName: "SEBULON",
        birthdate: "1/4/2000",
        idNumber: "ZN-U7-1451",
        designation: "CHSS AGENT",
        email: "prince@zninternational.com",
        contactNumber: "(+63) 9170341145",
        emergencyName: "JEMMA M. BARCELLON",
        emergencyRelationship: "MOTHER",
        emergencyContact: "9155325831",
        sssNumber: "1-3-27170-2271",
        philhealthNumber: "",
        pagibigNumber: "",
        tinNumber: "9-34175336-4",
      },
      {
        regularization: "8/6/2024",
        employeeName: "MORFE, LIANCEL",
        middleName: "MORENO",
        birthdate: "10/27/1996",
        idNumber: "ZN-P77-1597",
        designation: "OPERATIONS SUPERVISOR",
        email: "liancel@zninternational.com",
        contactNumber: "(+63) 9214780481",
        emergencyName: "ARJUN MORFE",
        emergencyRelationship: "BROTHER",
        emergencyContact: "9-47584236481",
        sssNumber: "1-15-31-1651",
        philhealthNumber: "",
        pagibigNumber: "",
        tinNumber: "7-31575667-90",
      },
      {
        regularization: "9/25/2024",
        employeeName: "ABUAN, CEZLIE",
        middleName: "BUGARIN",
        birthdate: "2/6/2000",
        idNumber: "ZN-U71-1605",
        designation: "ADMIN COORDINATOR",
        email: "cezlie@zninternational.com",
        contactNumber: "(+63) 9638867803",
        emergencyName: "JOSEPH M. ABUAN",
        emergencyRelationship: "FATHER",
        emergencyContact: "9383851927",
        sssNumber: "",
        philhealthNumber: "",
        pagibigNumber: "",
        tinNumber: "",
      },
    ],
  },
];

export function EmployeeRosterExcel() {
  return (
    <div
      className="bg-white border border-[#E5E7EB] rounded-[20px] overflow-hidden flex flex-col"
      style={{ maxHeight: "640px" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between border-b border-[#E5E7EB] flex-shrink-0"
        style={{ padding: "20px 24px" }}
      >
        <h2
          className="text-[#0A1D4D]"
          style={{ fontSize: "18px", fontWeight: 600 }}
        >
          Employee Roster (Excel View)
        </h2>
      </div>

      {/* Scrollable Excel Sheet */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-max">
          {COMPANY_DATA.map((company, companyIdx) => (
            <div key={companyIdx} className="mb-6">
              {/* Company Header - Full Width Merged Cell */}
              <div
                className="px-6 py-3 text-center"
                style={{
                  backgroundColor: company.headerColor,
                  color: company.headerTextColor,
                  fontSize: "14px",
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  height: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderTopLeftRadius: companyIdx === 0 ? "0" : "4px",
                  borderTopRightRadius: companyIdx === 0 ? "0" : "4px",
                }}
              >
                {company.companyName}
              </div>

              {/* Column Headers */}
              <div className="border-b border-[#D9D9D9]">
                <table className="w-full" style={{ tableLayout: "fixed" }}>
                  <thead>
                    {/* Main Header Row */}
                    <tr className="bg-[#F3F4F6]">
                      <th
                        className="border-r border-[#D9D9D9] px-2 py-2 text-center text-[10px] text-[#000000] uppercase"
                        style={{ width: "40px", fontWeight: 600 }}
                      >
                        #
                      </th>
                      <th
                        className="border-r border-[#D9D9D9] px-2 py-2 text-center text-[10px] text-[#000000] uppercase"
                        style={{ width: "100px", fontWeight: 600 }}
                      >
                        REGULARIZATION
                      </th>
                      <th
                        className="border-r border-[#D9D9D9] px-2 py-2 text-left text-[10px] text-[#000000] uppercase"
                        style={{ width: "160px", fontWeight: 600 }}
                      >
                        EMPLOYEE'S NAME
                      </th>
                      <th
                        className="border-r border-[#D9D9D9] px-2 py-2 text-left text-[10px] text-[#000000] uppercase"
                        style={{ width: "120px", fontWeight: 600 }}
                      >
                        MIDDLE NAME
                      </th>
                      <th
                        className="border-r border-[#D9D9D9] px-2 py-2 text-center text-[10px] text-[#000000] uppercase"
                        style={{ width: "100px", fontWeight: 600 }}
                      >
                        BIRTHDATE
                      </th>
                      <th
                        className="border-r border-[#D9D9D9] px-2 py-2 text-center text-[10px] text-[#000000] uppercase"
                        style={{ width: "130px", fontWeight: 600 }}
                      >
                        ID NUMBER
                      </th>
                      <th
                        className="border-r border-[#D9D9D9] px-2 py-2 text-left text-[10px] text-[#000000] uppercase"
                        style={{ width: "160px", fontWeight: 600 }}
                      >
                        DESIGNATION
                      </th>
                      <th
                        className="border-r border-[#D9D9D9] px-2 py-2 text-left text-[10px] text-[#000000] uppercase"
                        style={{ width: "220px", fontWeight: 600 }}
                      >
                        EMAIL ADDRESS
                      </th>
                      <th
                        className="border-r border-[#D9D9D9] px-2 py-2 text-center text-[10px] text-[#000000] uppercase"
                        style={{ width: "140px", fontWeight: 600 }}
                      >
                        CONTACT NUMBER
                      </th>
                      <th
                        className="border-r border-[#D9D9D9] px-2 py-2 text-center text-[10px] text-[#000000] uppercase"
                        style={{ width: "420px", fontWeight: 600 }}
                        colSpan={3}
                      >
                        IN CASE OF EMERGENCY
                      </th>
                      <th
                        className="border-r border-[#D9D9D9] px-2 py-2 text-center text-[10px] text-[#000000] uppercase"
                        style={{ width: "140px", fontWeight: 600, backgroundColor: "#DBEAFE" }}
                      >
                        SSS NUMBER
                      </th>
                      <th
                        className="border-r border-[#D9D9D9] px-2 py-2 text-center text-[10px] text-[#000000] uppercase"
                        style={{ width: "140px", fontWeight: 600, backgroundColor: "#D1FAE5" }}
                      >
                        PHILHEALTH NUMBER
                      </th>
                      <th
                        className="border-r border-[#D9D9D9] px-2 py-2 text-center text-[10px] text-[#000000] uppercase"
                        style={{ width: "140px", fontWeight: 600, backgroundColor: "#FEE2E2" }}
                      >
                        PAG-IBIG NUMBER
                      </th>
                      <th
                        className="px-2 py-2 text-center text-[10px] text-[#000000] uppercase"
                        style={{ width: "140px", fontWeight: 600 }}
                      >
                        TIN NUMBER
                      </th>
                    </tr>
                    {/* Subheader Row for Emergency Contact */}
                    <tr className="bg-[#F3F4F6] border-t border-[#D9D9D9]">
                      <th className="border-r border-[#D9D9D9]" colSpan={9}></th>
                      <th
                        className="border-r border-[#D9D9D9] px-2 py-1 text-center text-[9px] text-[#000000] uppercase"
                        style={{ width: "140px", fontWeight: 600 }}
                      >
                        NAME
                      </th>
                      <th
                        className="border-r border-[#D9D9D9] px-2 py-1 text-center text-[9px] text-[#000000] uppercase"
                        style={{ width: "140px", fontWeight: 600 }}
                      >
                        RELATIONSHIP
                      </th>
                      <th
                        className="border-r border-[#D9D9D9] px-2 py-1 text-center text-[9px] text-[#000000] uppercase"
                        style={{ width: "140px", fontWeight: 600 }}
                      >
                        CONTACT NUMBER
                      </th>
                      <th className="border-r border-[#D9D9D9]" colSpan={4}></th>
                    </tr>
                  </thead>
                </table>
              </div>

              {/* Employee Rows */}
              <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
                <tbody>
                  {company.employees.map((emp, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className="border-b border-[#D9D9D9] hover:bg-[#F9FAFB] transition-colors"
                    >
                      {/* Row Number */}
                      <td
                        className="border-r border-[#D9D9D9] px-2 py-3 text-center text-[11px] text-[#6B7280] bg-[#F9FAFB]"
                        style={{ width: "40px" }}
                      >
                        {rowIdx + 1}
                      </td>
                      {/* Regularization */}
                      <td
                        className="border-r border-[#D9D9D9] px-2 py-3 text-center text-[11px] text-[#000000]"
                        style={{ width: "100px" }}
                      >
                        {emp.regularization}
                      </td>
                      {/* Employee Name */}
                      <td
                        className="border-r border-[#D9D9D9] px-2 py-3 text-left text-[11px] text-[#000000]"
                        style={{ width: "160px", fontWeight: 600 }}
                      >
                        {emp.employeeName}
                      </td>
                      {/* Middle Name */}
                      <td
                        className="border-r border-[#D9D9D9] px-2 py-3 text-left text-[11px] text-[#000000]"
                        style={{ width: "120px" }}
                      >
                        {emp.middleName}
                      </td>
                      {/* Birthdate */}
                      <td
                        className="border-r border-[#D9D9D9] px-2 py-3 text-center text-[11px] text-[#000000]"
                        style={{ width: "100px" }}
                      >
                        {emp.birthdate}
                      </td>
                      {/* ID Number */}
                      <td
                        className="border-r border-[#D9D9D9] px-2 py-3 text-center text-[11px] text-[#000000]"
                        style={{ width: "130px" }}
                      >
                        {emp.idNumber}
                      </td>
                      {/* Designation */}
                      <td
                        className="border-r border-[#D9D9D9] px-2 py-3 text-left text-[11px] text-[#000000]"
                        style={{ width: "160px" }}
                      >
                        {emp.designation}
                      </td>
                      {/* Email */}
                      <td
                        className="border-r border-[#D9D9D9] px-2 py-3 text-left text-[11px]"
                        style={{ width: "220px" }}
                      >
                        <a
                          href={`mailto:${emp.email}`}
                          className="text-[#0F5EFE] underline hover:text-[#0D4ED6]"
                        >
                          {emp.email}
                        </a>
                      </td>
                      {/* Contact Number */}
                      <td
                        className="border-r border-[#D9D9D9] px-2 py-3 text-center text-[11px] text-[#000000]"
                        style={{ width: "140px" }}
                      >
                        {emp.contactNumber}
                      </td>
                      {/* Emergency Name */}
                      <td
                        className="border-r border-[#D9D9D9] px-2 py-3 text-left text-[11px] text-[#000000]"
                        style={{ width: "140px" }}
                      >
                        {emp.emergencyName}
                      </td>
                      {/* Emergency Relationship */}
                      <td
                        className="border-r border-[#D9D9D9] px-2 py-3 text-center text-[11px] text-[#000000]"
                        style={{ width: "140px" }}
                      >
                        {emp.emergencyRelationship}
                      </td>
                      {/* Emergency Contact */}
                      <td
                        className="border-r border-[#D9D9D9] px-2 py-3 text-center text-[11px] text-[#000000]"
                        style={{ width: "140px" }}
                      >
                        {emp.emergencyContact}
                      </td>
                      {/* SSS Number */}
                      <td
                        className="border-r border-[#D9D9D9] px-2 py-3 text-center text-[11px] text-[#000000]"
                        style={{ width: "140px", backgroundColor: "#DBEAFE" }}
                      >
                        {emp.sssNumber}
                      </td>
                      {/* Philhealth Number */}
                      <td
                        className="border-r border-[#D9D9D9] px-2 py-3 text-center text-[11px] text-[#000000]"
                        style={{ width: "140px", backgroundColor: "#D1FAE5" }}
                      >
                        {emp.philhealthNumber}
                      </td>
                      {/* Pag-IBIG Number */}
                      <td
                        className={cn(
                          "border-r border-[#D9D9D9] px-2 py-3 text-center text-[11px]",
                          emp.pagibigNumber === "MISSING"
                            ? "bg-[#FCA5A5] text-white"
                            : "bg-[#FEE2E2] text-[#000000]"
                        )}
                        style={{ width: "140px" }}
                      >
                        {emp.pagibigNumber === "MISSING" ? "" : emp.pagibigNumber}
                      </td>
                      {/* TIN Number */}
                      <td
                        className="px-2 py-3 text-center text-[11px] text-[#000000]"
                        style={{ width: "140px" }}
                      >
                        {emp.tinNumber}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
