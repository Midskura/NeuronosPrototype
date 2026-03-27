import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Plus } from "lucide-react";

export function CategoriesPage() {
  // Mock data for demonstration
  const categories = [
    { id: "1", name: "Fuel", type: "Expense", count: 45, total: 125000 },
    { id: "2", name: "Toll", type: "Expense", count: 32, total: 18500 },
    { id: "3", name: "Maintenance", type: "Expense", count: 12, total: 45000 },
    { id: "4", name: "Allowance", type: "Expense", count: 28, total: 35000 },
    { id: "5", name: "Misc", type: "Expense", count: 8, total: 12000 },
  ];

  return (
    <>
      {/* Page Title */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[var(--theme-text-primary)] mb-2">Categories</h1>
          <p className="text-[14px] text-[var(--theme-text-muted)] leading-[20px]">
            Manage expense and revenue categories
          </p>
        </div>
        <Button className="bg-[#F25C05] hover:bg-[#D84D00] text-white h-10 px-4" style={{ borderRadius: 'var(--radius-sm)' }}>
          <Plus className="w-4 h-4 mr-2" />
          New Category
        </Button>
      </div>

      <div className="border border-[var(--theme-border-default)] overflow-hidden" style={{ borderRadius: 'var(--radius-sm)' }}>
        <Table>
          <TableHeader>
            <TableRow className="bg-[var(--theme-bg-page)] border-b border-[var(--theme-border-default)]">
              <TableHead className="text-[12px] text-[var(--theme-text-muted)] h-12">Category</TableHead>
              <TableHead className="text-[12px] text-[var(--theme-text-muted)] h-12">Type</TableHead>
              <TableHead className="text-[12px] text-[var(--theme-text-muted)] h-12 text-right">Entries</TableHead>
              <TableHead className="text-[12px] text-[var(--theme-text-muted)] h-12 text-right">Total Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow 
                key={category.id} 
                className="border-b border-[var(--theme-border-default)] hover:bg-[var(--theme-bg-page)] cursor-pointer"
                style={{ minHeight: '48px' }}
              >
                <TableCell className="text-[14px] text-[var(--theme-text-primary)] font-medium">
                  {category.name}
                </TableCell>
                <TableCell className="text-[14px] text-[var(--theme-text-secondary)]">
                  {category.type}
                </TableCell>
                <TableCell className="text-[14px] text-right text-[var(--theme-text-muted)] tabular-nums">
                  {category.count}
                </TableCell>
                <TableCell 
                  className="text-[14px] text-right font-medium tabular-nums"
                  style={{ color: 'var(--text-expense)' }}
                >
                  ₱{category.total.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
