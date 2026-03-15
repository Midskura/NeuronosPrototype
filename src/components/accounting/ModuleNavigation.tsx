import { 
  FileText, 
  CheckSquare, 
  Wallet, 
  FolderTree, 
  ArrowUpDown, 
  Users 
} from "lucide-react";

interface ModuleNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { value: "entries", label: "Entries", icon: FileText },
  { value: "approvals", label: "Approvals", icon: CheckSquare },
  { value: "accounts", label: "Accounts", icon: Wallet },
  { value: "categories", label: "Categories", icon: FolderTree },
  { value: "clients", label: "Clients Ledger", icon: Users },
  { value: "import-export", label: "Import/Export", icon: ArrowUpDown },
];

export function ModuleNavigation({ activeTab, onTabChange }: ModuleNavigationProps) {
  return (
    <div className="w-full border-b border-[#E5E7EB] bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <nav className="flex items-center h-12">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            
            return (
              <button
                key={tab.value}
                onClick={() => onTabChange(tab.value)}
                className={`
                  flex items-center gap-2 h-full px-4 text-[14px] font-medium
                  border-b-2 transition-colors relative
                  ${
                    isActive
                      ? "text-[#F25C05] border-[#F25C05]"
                      : "text-[#6B7280] border-transparent hover:text-[#374151]"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
