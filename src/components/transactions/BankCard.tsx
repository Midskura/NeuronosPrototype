import { useState, useRef, useEffect } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { formatCurrency } from "../../utils/accounting-math";
import type { BankAccountSummary } from "./types";

interface BankCardProps {
  account: BankAccountSummary;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
}

export function BankCard({ 
  account, 
  isSelected, 
  onSelect, 
  onRename, 
  onDelete 
}: BankCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(account.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedName(account.name);
  }, [account.name]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editedName.trim() && editedName !== account.name) {
      onRename(account.id, editedName);
    } else {
        // Revert if empty or unchanged
        setEditedName(account.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditedName(account.name);
      setIsEditing(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(account.id);
  };

  return (
    <div
      onClick={() => !isEditing && onSelect(account.id)}
      className={`
        w-[180px] h-[60px] px-4 py-0 rounded-[7.5px] border cursor-pointer transition-all duration-200 shrink-0
        flex flex-col justify-center relative bg-white group
        ${isSelected 
          ? "border-[#0F766E] shadow-[0px_0px_0px_0px_rgba(15,118,110,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)]" 
          : "border-[#E5E7EB] hover:border-gray-300"
        }
      `}
    >
      <div className="flex flex-col gap-0.5 pr-5"> {/* Added pr-5 for icon space */}
        
        {isEditing ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <input
                ref={inputRef}
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                className="font-medium text-[11px] tracking-[0.02em] text-[#12332B] w-full border-b border-[#0F766E] outline-none bg-transparent p-0 m-0 leading-tight"
            />
          </div>
        ) : (
          <span className={`font-medium text-[11px] tracking-[0.02em] truncate ${isSelected ? "text-[#0F766E]" : "text-[#667085]"}`}>
            {account.name}
          </span>
        )}
        
        <span className="text-[17px] font-bold text-[#12332B] font-sans leading-none tracking-tight">
            {formatCurrency(account.bankBalance, account.currency)}
        </span>
      </div>
      
      {/* Active Indicator Bottom Strip */}
      {isSelected && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0F766E] rounded-bl-[7px] rounded-br-[7px]" />
      )}

      {/* Action Icon: Pencil (Edit) or Trash (Delete) */}
      <div className={`absolute top-2 right-2 transition-opacity ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        {isEditing ? (
             <button 
                // onMouseDown prevents the input blur event from firing before the click
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleDelete}
                className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600 outline-none transition-colors"
                title="Delete Account"
             >
                <Trash2 size={12} />
             </button>
        ) : (
             <button 
                onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                }}
                className="p-1 hover:bg-gray-100 rounded text-gray-300 hover:text-[#0F766E] outline-none transition-colors"
                title="Rename Account"
             >
                <Edit2 size={12} />
             </button>
        )}
      </div>
    </div>
  );
}
