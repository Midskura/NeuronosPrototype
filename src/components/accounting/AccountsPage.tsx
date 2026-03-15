import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Plus } from "lucide-react";

export function AccountsPage() {
  // Mock data for demonstration
  const accounts = [
    { id: "1", code: "1000", name: "Cash on Hand", type: "Asset", balance: 150000 },
    { id: "2", code: "1100", name: "Bank - BPI", type: "Asset", balance: 450000 },
    { id: "3", code: "2000", name: "Accounts Payable", type: "Liability", balance: 80000 },
    { id: "4", code: "4000", name: "Revenue - Transport", type: "Revenue", balance: 650000 },
    { id: "5", code: "5000", name: "Fuel Expenses", type: "Expense", balance: 120000 },
    { id: "6", code: "5100", name: "Maintenance", type: "Expense", balance: 45000 },
  ];

  return (
    <>
      {/* Page Title */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[#0A1D4D] mb-2">Chart of Accounts</h1>
          <p className="text-[14px] text-[#6B7280] leading-[20px]">
            Manage your accounting structure and balances
          </p>
        </div>
        <Button className="bg-[#F25C05] hover:bg-[#D84D00] text-white h-10 px-4" style={{ borderRadius: 'var(--radius-sm)' }}>
          <Plus className="w-4 h-4 mr-2" />
          New Account
        </Button>
      </div>

      <div className="border border-[#E5E7EB] overflow-hidden" style={{ borderRadius: 'var(--radius-sm)' }}>
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <TableHead className="text-[12px] text-[#6B7280] h-12">Code</TableHead>
              <TableHead className="text-[12px] text-[#6B7280] h-12">Account Name</TableHead>
              <TableHead className="text-[12px] text-[#6B7280] h-12">Type</TableHead>
              <TableHead className="text-[12px] text-[#6B7280] h-12 text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow 
                key={account.id} 
                className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] cursor-pointer"
                style={{ minHeight: '48px' }}
              >
                <TableCell className="text-[14px] text-[#6B7280] font-mono tabular-nums">
                  {account.code}
                </TableCell>
                <TableCell className="text-[14px] text-[#0A1D4D] font-medium">
                  {account.name}
                </TableCell>
                <TableCell className="text-[14px] text-[#374151]">
                  {account.type}
                </TableCell>
                <TableCell 
                  className="text-[14px] text-right font-medium tabular-nums"
                  style={{ 
                    color: account.type === "Revenue" ? 'var(--text-revenue)' : 
                           account.type === "Expense" ? 'var(--text-expense)' : 
                           'var(--text-transfer)' 
                  }}
                >
                  ₱{account.balance.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
