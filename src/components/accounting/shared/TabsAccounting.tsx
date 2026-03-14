import { 
  FileText, 
  CheckSquare, 
  Wallet, 
  FolderTree, 
  ArrowUpDown, 
  Users 
} from "lucide-react";

export type AccountingTabValue = 
  | "entries" 
  | "approvals" 
  | "accounts" 
  | "categories" 
  | "import-export" 
  | "clients";

interface Tab {
  value: AccountingTabValue;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface TabsAccountingProps {
  active: AccountingTabValue;
  onTabChange: (tab: AccountingTabValue) => void;
  disabled?: AccountingTabValue[];
  showIcons?: boolean;
  className?: string;
}

const tabs: Tab[] = [
  { value: "entries", label: "Entries", icon: FileText },
  { value: "approvals", label: "Approvals", icon: CheckSquare },
  { value: "accounts", label: "Accounts", icon: Wallet },
  { value: "categories", label: "Categories", icon: FolderTree },
  { value: "clients", label: "Clients Ledger", icon: Users },
  { value: "import-export", label: "Import/Export", icon: ArrowUpDown },
];

export function TabsAccounting({ 
  active, 
  onTabChange, 
  disabled = [],
  showIcons = true,
  className = "",
}: TabsAccountingProps) {
  return (
    <div className={`w-full border-b border-[#E5E7EB] bg-white ${className}`}>
      <div className="max-w-[1200px] mx-auto px-3">
        <nav className="flex items-center h-[44px]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.value;
            const isDisabled = disabled.includes(tab.value);
            
            return (
              <button
                key={tab.value}
                onClick={() => !isDisabled && onTabChange(tab.value)}
                disabled={isDisabled}
                className={`
                  flex items-center gap-2 h-full px-4 text-[14px] font-medium
                  border-b-2 transition-colors relative
                  ${
                    isActive
                      ? "text-[#F25C05] border-[#F25C05]"
                      : isDisabled
                      ? "text-[#D1D5DB] border-transparent cursor-not-allowed"
                      : "text-[#6B7280] border-transparent hover:text-[#374151] cursor-pointer"
                  }
                `}
              >
                {showIcons && Icon && <Icon className="w-4 h-4" />}
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
