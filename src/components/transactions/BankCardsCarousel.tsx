import { useRef } from "react";
import { Plus } from "lucide-react";
import type { BankAccountSummary } from "./types";
export type { BankAccountSummary };
import { BankCard } from "./BankCard";

interface BankCardsCarouselProps {
  accounts: BankAccountSummary[];
  selectedAccountId: string | null;
  onSelectAccount: (accountId: string) => void;
  isLoading?: boolean;
  onRenameAccount?: (accountId: string, newName: string) => void;
  onDeleteAccount?: (accountId: string) => void;
  onAddAccount?: () => void;
}

export function BankCardsCarousel({ 
  accounts, 
  selectedAccountId, 
  onSelectAccount,
  isLoading,
  onRenameAccount,
  onDeleteAccount,
  onAddAccount
}: BankCardsCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-hidden px-1">
        {[1, 2].map((i) => (
          <div key={i} className="w-[180px] h-[60px] bg-[var(--theme-bg-surface-subtle)] rounded-[7.5px] animate-pulse border border-[var(--theme-border-default)]" />
        ))}
      </div>
    );
  }

  return (
    <div 
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto px-1 scrollbar-hide items-center"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
        {accounts.map((account) => (
          <BankCard 
            key={account.id}
            account={account}
            isSelected={selectedAccountId === account.id}
            onSelect={onSelectAccount}
            onRename={onRenameAccount || (() => {})}
            onDelete={onDeleteAccount || (() => {})}
          />
        ))}
        
        {/* Link Account Card / Plus Button */}
        <div className="flex items-center justify-center shrink-0">
            <button 
                onClick={onAddAccount}
                className="w-9 h-9 rounded-full border border-dashed border-[var(--theme-border-default)] flex items-center justify-center text-[var(--theme-text-muted)] hover:text-[var(--theme-action-primary-bg)] hover:border-[var(--theme-action-primary-bg)] transition-colors bg-[var(--theme-bg-surface)] hover:bg-[var(--theme-bg-surface-subtle)]"
            >
                <Plus size={16} />
            </button>
        </div>
    </div>
  );
}
