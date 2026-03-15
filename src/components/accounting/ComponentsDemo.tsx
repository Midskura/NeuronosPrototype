import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import {
  FilterBarSticky,
  TableAccountingEntries,
  AccountingEntry,
  BadgeType,
  ModalNewEntry,
  RowApprovalActions,
  CardAccount,
  Account,
  ListCategories,
  Category,
  ImportPreviewTable,
  ImportRow,
  CommandBarAccounting,
  TabsAccounting,
  AccountingTabValue,
} from "./shared";

export function ComponentsDemo() {
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  
  // State for new components demo
  const [company, setCompany] = useState("jjb");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<AccountingTabValue>("entries");
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for TableAccountingEntries
  const mockEntries: AccountingEntry[] = [
    {
      id: "1",
      bookingNo: "ND-2025-0021",
      client: "ABC Corp",
      type: "expense",
      amount: 5000,
      account: "Cash",
      category: "Fuel",
      date: "2025-10-20",
      note: "Diesel fuel for long-haul route",
      status: "Approved",
    },
    {
      id: "2",
      bookingNo: "ND-2025-0022",
      client: "XYZ Inc",
      type: "revenue",
      amount: 15000,
      account: "Bank - BPI",
      category: "Transport Services",
      date: "2025-10-21",
      note: "Payment for delivery services",
      status: "Pending",
    },
    {
      id: "3",
      bookingNo: "ND-2025-0023",
      client: "ABC Corp",
      type: "transfer",
      amount: 10000,
      account: "Cash → Bank",
      date: "2025-10-22",
      note: "Cash deposit to bank account",
      status: "Approved",
    },
  ];

  // Mock data for CardAccount
  const mockAccounts: Account[] = [
    { id: "1", name: "Cash on Hand", type: "Asset", balance: 150000, code: "1000" },
    { id: "2", name: "Bank - BPI", type: "Asset", balance: 450000, code: "1100" },
    { id: "3", name: "Revenue - Transport", type: "Revenue", balance: 650000, code: "4000" },
    { id: "4", name: "Fuel Expenses", type: "Expense", balance: 120000, code: "5000" },
  ];

  // Mock data for ListCategories
  const mockRevenueCategories: Category[] = [
    { id: "1", name: "Transport Services", type: "revenue" },
    { id: "2", name: "Warehousing", type: "revenue", parent: "Transport Services" },
  ];

  const mockExpenseCategories: Category[] = [
    { id: "3", name: "Fuel", type: "expense" },
    { id: "4", name: "Toll Fees", type: "expense" },
    { id: "5", name: "Maintenance", type: "expense", parent: "Operations" },
  ];

  // Mock data for ImportPreviewTable
  const mockImportRows: ImportRow[] = [
    {
      line: 1,
      parsed: {
        date: "2025-10-20",
        bookingNo: "ND-2025-0021",
        client: "ABC Corp",
        type: "expense",
        amount: "5000",
        account: "Cash",
        category: "Fuel",
      },
      status: "valid",
    },
    {
      line: 2,
      parsed: {
        date: "2025-10-21",
        bookingNo: "ND-2025-0022",
        client: "XYZ Inc",
        type: "revenue",
        amount: "15000",
        account: "Bank",
        category: "Transport",
      },
      status: "warning",
      error: "Category name doesn't match exactly",
    },
    {
      line: 3,
      parsed: {
        date: "2025-10-22",
        bookingNo: "",
        client: "",
        type: "expense",
        amount: "invalid",
        account: "",
      },
      status: "error",
      error: "Missing required fields: booking, client, account",
    },
  ];

  return (
    <>
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-[#0A1D4D] mb-2">Components Demo</h1>
        <p className="text-[14px] text-[#6B7280] leading-[20px]">
          Showcase of reusable accounting components
        </p>
      </div>

      <Tabs defaultValue="filter" className="w-full">
        <TabsList className="bg-[#F9FAFB] p-1 mb-6 h-10" style={{ borderRadius: 'var(--radius-sm)' }}>
          <TabsTrigger value="commandbar" className="text-[14px]" style={{ borderRadius: 'var(--radius-xs)' }}>
            CommandBar
          </TabsTrigger>
          <TabsTrigger value="tabs" className="text-[14px]" style={{ borderRadius: 'var(--radius-xs)' }}>
            Tabs
          </TabsTrigger>
          <TabsTrigger value="filter" className="text-[14px]" style={{ borderRadius: 'var(--radius-xs)' }}>
            FilterBar
          </TabsTrigger>
          <TabsTrigger value="table" className="text-[14px]" style={{ borderRadius: 'var(--radius-xs)' }}>
            Table
          </TabsTrigger>
          <TabsTrigger value="badges" className="text-[14px]" style={{ borderRadius: 'var(--radius-xs)' }}>
            Badges
          </TabsTrigger>
          <TabsTrigger value="modal" className="text-[14px]" style={{ borderRadius: 'var(--radius-xs)' }}>
            Modal
          </TabsTrigger>
          <TabsTrigger value="approvals" className="text-[14px]" style={{ borderRadius: 'var(--radius-xs)' }}>
            Approvals
          </TabsTrigger>
          <TabsTrigger value="accounts" className="text-[14px]" style={{ borderRadius: 'var(--radius-xs)' }}>
            Accounts
          </TabsTrigger>
          <TabsTrigger value="categories" className="text-[14px]" style={{ borderRadius: 'var(--radius-xs)' }}>
            Categories
          </TabsTrigger>
          <TabsTrigger value="import" className="text-[14px]" style={{ borderRadius: 'var(--radius-xs)' }}>
            Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="commandbar">
          <div className="space-y-6">
            <div>
              <h2 className="text-[#0A1D4D] mb-2">CommandBar.Accounting</h2>
              <p className="text-[14px] text-[#6B7280] mb-4">
                Persistent command bar with company switcher, date range, search, and New Entry button. Height: 56px, Gap: 12px.
              </p>
            </div>

            <div className="border border-[#E5E7EB]" style={{ borderRadius: 'var(--radius-sm)' }}>
              <CommandBarAccounting
                company={company}
                onCompanyChange={setCompany}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onNewEntry={() => alert("New Entry clicked!")}
                loading={isLoading}
              />
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsLoading(!isLoading)}
              >
                Toggle Loading: {isLoading ? "ON" : "OFF"}
              </Button>
            </div>

            <div className="p-4 bg-[#F9FAFB]" style={{ borderRadius: 'var(--radius-sm)' }}>
              <p className="text-[12px] text-[#6B7280] mb-2">Current State:</p>
              <pre className="text-[12px] text-[#374151]">
                {JSON.stringify({ company, dateRange, searchQuery, isLoading }, null, 2)}
              </pre>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tabs">
          <div className="space-y-6">
            <div>
              <h2 className="text-[#0A1D4D] mb-2">Tabs.Accounting</h2>
              <p className="text-[14px] text-[#6B7280] mb-4">
                Tab navigation for accounting module with icons and underline indicator. Height: 44px.
              </p>
            </div>

            <div className="border border-[#E5E7EB]" style={{ borderRadius: 'var(--radius-sm)' }}>
              <TabsAccounting
                active={activeTab}
                onTabChange={setActiveTab}
                showIcons={true}
              />
            </div>

            <div>
              <h3 className="text-[#0A1D4D] mb-2">With Disabled Tabs</h3>
              <div className="border border-[#E5E7EB]" style={{ borderRadius: 'var(--radius-sm)' }}>
                <TabsAccounting
                  active={activeTab}
                  onTabChange={setActiveTab}
                  disabled={["import-export", "clients"]}
                  showIcons={true}
                />
              </div>
            </div>

            <div>
              <h3 className="text-[#0A1D4D] mb-2">Without Icons</h3>
              <div className="border border-[#E5E7EB]" style={{ borderRadius: 'var(--radius-sm)' }}>
                <TabsAccounting
                  active={activeTab}
                  onTabChange={setActiveTab}
                  showIcons={false}
                />
              </div>
            </div>

            <div className="p-4 bg-[#F9FAFB]" style={{ borderRadius: 'var(--radius-sm)' }}>
              <p className="text-[12px] text-[#6B7280] mb-2">Active Tab:</p>
              <pre className="text-[12px] text-[#374151]">{activeTab}</pre>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="filter">
          <div className="space-y-6">
            <div>
              <h2 className="text-[#0A1D4D] mb-2">FilterBar.Sticky (Enhanced)</h2>
              <p className="text-[14px] text-[#6B7280] mb-4">
                Sticky filter bar with autocomplete, multi-select, and variants. Height: 56px, Gap: 12px.
              </p>
            </div>

            <div>
              <h3 className="text-[#0A1D4D] mb-2">Default Variant</h3>
              <FilterBarSticky
                variant="default"
                bookingNoOptions={["ND-2025-001", "ND-2025-002", "ND-2025-003"]}
                clientOptions={["ABC Corp", "XYZ Inc", "Demo Client"]}
                companyOptions={[
                  { value: "jjb", label: "JJB Group" },
                  { value: "subsidiary", label: "JJB Subsidiary" },
                ]}
                typeOptions={[
                  { value: "all", label: "All Types" },
                  { value: "revenue", label: "Revenue" },
                  { value: "expense", label: "Expense" },
                  { value: "transfer", label: "Transfer" },
                ]}
                statusOptions={[
                  { value: "all", label: "All Statuses" },
                  { value: "Pending", label: "Pending" },
                  { value: "Approved", label: "Approved" },
                  { value: "Rejected", label: "Rejected" },
                ]}
              />
            </div>

            <div>
              <h3 className="text-[#0A1D4D] mb-2">Compact Variant</h3>
              <FilterBarSticky
                variant="compact"
                bookingNoOptions={["ND-2025-001", "ND-2025-002"]}
                clientOptions={["ABC Corp", "XYZ Inc"]}
                typeOptions={[
                  { value: "all", label: "All Types" },
                  { value: "revenue", label: "Revenue" },
                  { value: "expense", label: "Expense" },
                ]}
              />
            </div>

            <div>
              <h3 className="text-[#0A1D4D] mb-2">Locked Status Variant (for Approvals)</h3>
              <FilterBarSticky
                variant="locked-status"
                status="Pending"
                bookingNoOptions={["ND-2025-001", "ND-2025-002"]}
                clientOptions={["ABC Corp", "XYZ Inc"]}
              />
              <p className="text-[12px] text-[#6B7280] mt-2">
                ⓘ Status field is locked to "Pending" and cannot be changed
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="table">
          <div className="space-y-4">
            <h2 className="text-[#0A1D4D]">Table.AccountingEntries</h2>
            <p className="text-[14px] text-[#6B7280] mb-4">
              Specialized table for accounting entries with truncated notes and action buttons.
            </p>
            <TableAccountingEntries
              entries={mockEntries}
              onView={(id) => console.log("View:", id)}
              onEdit={(id) => console.log("Edit:", id)}
            />
          </div>
        </TabsContent>

        <TabsContent value="badges">
          <div className="space-y-4">
            <h2 className="text-[#0A1D4D]">Badge.Type</h2>
            <p className="text-[14px] text-[#6B7280] mb-4">
              Type badges with semantic colors for revenue, expense, and transfer.
            </p>
            <div className="flex gap-3">
              <BadgeType type="revenue" />
              <BadgeType type="expense" />
              <BadgeType type="transfer" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="modal">
          <div className="space-y-4">
            <h2 className="text-[#0A1D4D]">Modal.NewEntry</h2>
            <p className="text-[14px] text-[#6B7280] mb-4">
              800px wide modal with segmented control, two-column form, and validation.
            </p>
            <Button
              className="bg-[#F25C05] hover:bg-[#D84D00] text-white"
              onClick={() => setIsNewEntryOpen(true)}
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              Open New Entry Modal
            </Button>
            <ModalNewEntry
              open={isNewEntryOpen}
              onOpenChange={setIsNewEntryOpen}
              onSave={(data) => console.log("Save:", data)}
              onSaveAndNew={(data) => console.log("Save & New:", data)}
              companyOptions={[
                { value: "jjb", label: "JJB Group" },
                { value: "subsidiary", label: "Subsidiary Co" },
              ]}
              accountOptions={[
                { value: "cash", label: "Cash on Hand" },
                { value: "bank", label: "Bank - BPI" },
              ]}
              categoryOptions={[
                { value: "fuel", label: "Fuel" },
                { value: "toll", label: "Toll Fees" },
              ]}
              clientOptions={[
                { value: "abc", label: "ABC Corp" },
                { value: "xyz", label: "XYZ Inc" },
              ]}
              bookingOptions={[
                { value: "b1", label: "ND-2025-0021" },
                { value: "b2", label: "ND-2025-0022" },
              ]}
            />
          </div>
        </TabsContent>

        <TabsContent value="approvals">
          <div className="space-y-4">
            <h2 className="text-[#0A1D4D]">Row.ApprovalActions</h2>
            <p className="text-[14px] text-[#6B7280] mb-4">
              Approval action buttons with optional comment modals.
            </p>
            <div className="border border-[#E5E7EB] p-4" style={{ borderRadius: 'var(--radius-sm)' }}>
              <RowApprovalActions
                onApprove={(comment) => console.log("Approved:", comment)}
                onReject={(comment) => console.log("Rejected:", comment)}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="accounts">
          <div className="space-y-4">
            <h2 className="text-[#0A1D4D]">Card.Account</h2>
            <p className="text-[14px] text-[#6B7280] mb-4">
              Account cards with kebab menu and approved balance display.
            </p>
            <div className="grid grid-cols-4 gap-4">
              {mockAccounts.map((account) => (
                <CardAccount
                  key={account.id}
                  account={account}
                  onEdit={(id) => console.log("Edit:", id)}
                  onDelete={(id) => console.log("Delete:", id)}
                  onArchive={(id) => console.log("Archive:", id)}
                />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <div className="space-y-4">
            <h2 className="text-[#0A1D4D]">List.Categories</h2>
            <p className="text-[14px] text-[#6B7280] mb-4">
              Side-by-side category lists for revenue and expense with parent relationships.
            </p>
            <ListCategories
              revenueCategories={mockRevenueCategories}
              expenseCategories={mockExpenseCategories}
              onEdit={(id) => console.log("Edit:", id)}
              onDelete={(id) => console.log("Delete:", id)}
              onAddRevenue={() => console.log("Add Revenue Category")}
              onAddExpense={() => console.log("Add Expense Category")}
            />
          </div>
        </TabsContent>

        <TabsContent value="import">
          <div className="space-y-4">
            <h2 className="text-[#0A1D4D]">ImportPreviewTable</h2>
            <p className="text-[14px] text-[#6B7280] mb-4">
              Import preview with validation status and blocking errors.
            </p>
            <ImportPreviewTable
              rows={mockImportRows}
              onCommit={() => console.log("Commit import")}
              onCancel={() => console.log("Cancel import")}
            />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
