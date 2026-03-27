import { useState, useEffect, useMemo } from "react";
import { Search, X, Check, ChevronDown, ChevronRight, Folder, Wallet, CreditCard } from "lucide-react";
import type { Account } from "../../types/accounting-core";

interface ManageAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  visibleAccountIds: string[];
  onSave: (ids: string[]) => void;
}

export function ManageAccountsModal({ 
  isOpen, 
  onClose, 
  accounts, 
  visibleAccountIds, 
  onSave 
}: ManageAccountsModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(visibleAccountIds));
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Sync with props when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(visibleAccountIds));
      setSearchQuery("");
      // Auto-expand folders that contain selected items
      const newExpanded = new Set<string>();
      accounts.forEach(acc => {
          if (visibleAccountIds.includes(acc.id) && acc.parent_id) {
              newExpanded.add(acc.parent_id);
          }
      });
      setExpandedFolders(newExpanded);
    }
  }, [isOpen, visibleAccountIds, accounts]);

  // Filter accounts suitable for "Bank Feed" (Assets & Liabilities)
  const eligibleAccounts = useMemo(() => {
    return accounts.filter(a => 
      (a.type === 'Asset' || a.type === 'Liability') && 
      // Exclude system accounts if necessary, but usually we want them available
      true
    );
  }, [accounts]);

  // Build Hierarchy for Display
  const accountTree = useMemo(() => {
    const rootNodes: Account[] = [];
    const childrenMap = new Map<string, Account[]>();

    eligibleAccounts.forEach(acc => {
      if (acc.parent_id) {
        if (!childrenMap.has(acc.parent_id)) {
          childrenMap.set(acc.parent_id, []);
        }
        childrenMap.get(acc.parent_id)?.push(acc);
      } else {
        rootNodes.push(acc);
      }
    });

    return { rootNodes, childrenMap };
  }, [eligibleAccounts]);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleFolder = (id: string) => {
    const newSet = new Set(expandedFolders);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedFolders(newSet);
  };

  const handleSave = () => {
    onSave(Array.from(selectedIds));
    onClose();
  };

  if (!isOpen) return null;

  // Recursive Tree Renderer
  const renderTree = (nodes: Account[], level = 0) => {
    // Apply search filter
    const filteredNodes = nodes.filter(node => {
       if (!searchQuery) return true;
       // Include if name matches OR if any children match (complex, skipping deep tree search for now, just name)
       return node.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (filteredNodes.length === 0 && searchQuery) return null;

    return filteredNodes.map(node => {
      const children = accountTree.childrenMap.get(node.id) || [];
      const hasChildren = children.length > 0;
      const isExpanded = expandedFolders.has(node.id) || searchQuery.length > 0; // Auto expand on search
      const isSelected = selectedIds.has(node.id);

      return (
        <div key={node.id} className="select-none">
          <div 
            className={`
               flex items-center py-2 px-3 hover:bg-[var(--theme-bg-surface-subtle)] rounded-lg cursor-pointer transition-colors
               ${isSelected ? 'bg-green-50/50' : ''}
            `}
            style={{ paddingLeft: `${level * 20 + 12}px` }}
            onClick={() => !node.is_folder ? toggleSelect(node.id) : toggleFolder(node.id)}
          >
            {/* Expand/Collapse Icon */}
            <div 
                className="mr-2 text-[var(--theme-text-muted)] p-1 hover:text-[var(--theme-text-secondary)]"
                onClick={(e) => {
                    e.stopPropagation();
                    toggleFolder(node.id);
                }}
            >
               {hasChildren ? (
                   isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
               ) : <div className="w-[14px]" />}
            </div>

            {/* Checkbox (Only for Leaf Nodes i.e. actual accounts) */}
            <div 
                className={`
                   mr-3 w-5 h-5 rounded border flex items-center justify-center transition-all
                   ${isSelected 
                     ? 'bg-[var(--theme-action-primary-bg)] border-[var(--theme-action-primary-bg)] text-white' 
                     : 'border-[var(--theme-border-default)] bg-[var(--theme-bg-surface)] text-transparent hover:border-[var(--theme-border-default)]'
                   }
                   ${node.is_folder ? 'opacity-30 cursor-not-allowed bg-[var(--theme-bg-surface-subtle)]' : ''}
                `}
                onClick={(e) => {
                    e.stopPropagation();
                    if (!node.is_folder) toggleSelect(node.id);
                }}
            >
                <Check size={12} strokeWidth={3} />
            </div>

            {/* Icon & Name */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
               {node.is_folder ? (
                   <Folder size={16} className="text-blue-400" />
               ) : node.type === 'Liability' ? (
                   <CreditCard size={16} className="text-purple-400" />
               ) : (
                   <Wallet size={16} className="text-[var(--theme-text-muted)]" />
               )}
               <span className={`text-sm truncate ${node.is_folder ? 'font-semibold text-[var(--theme-text-secondary)]' : 'text-[var(--theme-text-secondary)]'}`}>
                   {node.name}
               </span>
               {node.currency && (
                   <span className="text-[10px] font-mono bg-[var(--theme-bg-surface-subtle)] text-[var(--theme-text-muted)] px-1.5 rounded">
                       {node.currency}
                   </span>
               )}
               {node.code && (
                   <span className="text-[10px] text-[var(--theme-text-muted)] font-mono">
                       #{node.code}
                   </span>
               )}
            </div>
          </div>
          
          {/* Children */}
          {hasChildren && isExpanded && (
             <div>
                {renderTree(children, level + 1)}
             </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--theme-bg-surface)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--theme-border-subtle)] flex justify-between items-center bg-[var(--theme-bg-surface)]">
           <div>
              <h2 className="text-xl font-semibold text-[var(--theme-text-primary)]">Manage Transaction Accounts</h2>
              <p className="text-sm text-[var(--theme-text-muted)] mt-1">Select which Chart of Accounts items to show in Transactions.</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-[var(--theme-bg-surface-subtle)] rounded-full text-[var(--theme-text-muted)] hover:text-[var(--theme-text-secondary)] transition-colors">
              <X size={20} />
           </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[var(--theme-border-subtle)] bg-[var(--theme-bg-surface-subtle)]/50">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)]" size={16} />
              <input 
                type="text" 
                placeholder="Search accounts..." 
                className="w-full pl-10 pr-4 py-2 bg-[var(--theme-bg-surface)] border border-[var(--theme-border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[var(--theme-action-primary-bg)]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
           {accountTree.rootNodes.length > 0 ? (
               renderTree(accountTree.rootNodes)
           ) : (
               <div className="text-center py-12 text-[var(--theme-text-muted)]">
                   No accounts found.
               </div>
           )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--theme-border-subtle)] bg-[var(--theme-bg-surface-subtle)] flex justify-between items-center">
           <div className="text-sm text-[var(--theme-text-muted)]">
               {selectedIds.size} accounts selected
           </div>
           <div className="flex gap-3">
               <button 
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-[var(--theme-text-secondary)] bg-[var(--theme-bg-surface)] border border-[var(--theme-border-default)] rounded-lg hover:bg-[var(--theme-bg-surface-subtle)] transition-colors shadow-sm"
               >
                  Cancel
               </button>
               <button 
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-[var(--theme-action-primary-bg)] rounded-lg hover:bg-[var(--theme-action-primary-border)] transition-colors shadow-sm"
               >
                  Save Changes
               </button>
           </div>
        </div>
      </div>
    </div>
  );
}
