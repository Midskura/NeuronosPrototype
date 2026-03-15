import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../ui/dropdown-menu";
import { MoreVertical, Edit2, Trash2, Archive } from "lucide-react";

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  code?: string;
}

interface CardAccountProps {
  account: Account;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  loading?: boolean;
}

export function CardAccount({
  account,
  onEdit,
  onDelete,
  onArchive,
  loading = false,
}: CardAccountProps) {
  const getBalanceColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "revenue":
        return "var(--text-revenue)";
      case "expense":
        return "var(--text-expense)";
      default:
        return "var(--text-transfer)";
    }
  };

  if (loading) {
    return (
      <Card className="p-4 animate-pulse" style={{ borderRadius: 'var(--radius-sm)' }}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
      </Card>
    );
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow" style={{ borderRadius: 'var(--radius-sm)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {account.code && (
              <span className="text-[12px] text-[#6B7280] font-mono tabular-nums">
                {account.code}
              </span>
            )}
            <h3 className="text-[14px] text-[#0A1D4D] font-medium">
              {account.name}
            </h3>
          </div>
          <p className="text-[12px] text-[#6B7280]">{account.type}</p>
        </div>

        {/* Kebab Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <MoreVertical className="w-4 h-4 text-[#6B7280]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(account.id)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
            )}
            {onArchive && (
              <DropdownMenuItem onClick={() => onArchive(account.id)}>
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(account.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Balance - Approved only */}
      <div className="pt-3 border-t border-[#E5E7EB]">
        <p className="text-[12px] text-[#6B7280] mb-1">Balance (Approved)</p>
        <p
          className="text-[20px] font-medium tabular-nums"
          style={{ color: getBalanceColor(account.type) }}
        >
          ₱{account.balance.toLocaleString()}
        </p>
      </div>
    </Card>
  );
}
