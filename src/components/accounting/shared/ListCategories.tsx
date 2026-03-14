import { Button } from "../../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../ui/dropdown-menu";
import { MoreVertical, Edit2, Trash2, Plus } from "lucide-react";

export interface Category {
  id: string;
  name: string;
  parent?: string;
  type: "revenue" | "expense";
}

interface ListCategoriesProps {
  revenueCategories: Category[];
  expenseCategories: Category[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAddRevenue?: () => void;
  onAddExpense?: () => void;
  loading?: boolean;
  error?: string;
}

export function ListCategories({
  revenueCategories,
  expenseCategories,
  onEdit,
  onDelete,
  onAddRevenue,
  onAddExpense,
  loading = false,
  error,
}: ListCategoriesProps) {
  const CategoryRow = ({ category }: { category: Category }) => (
    <div
      className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB] hover:bg-[#F9FAFB] group"
    >
      <div className="flex-1">
        <p className="text-[14px] text-[#0A1D4D] font-medium">{category.name}</p>
        {category.parent && (
          <p className="text-[12px] text-[#6B7280] mt-0.5">
            Parent: {category.parent}
          </p>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4 text-[#6B7280]" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onEdit && (
            <DropdownMenuItem onClick={() => onEdit(category.id)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
          )}
          {onDelete && (
            <DropdownMenuItem
              onClick={() => onDelete(category.id)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="border border-[#E5E7EB] animate-pulse" style={{ borderRadius: 'var(--radius-sm)' }}>
            <div className="h-12 bg-gray-200"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 p-8 text-center" style={{ borderRadius: 'var(--radius-sm)' }}>
        <p className="text-[14px] text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Revenue Categories */}
      <div className="border border-[#E5E7EB] overflow-hidden" style={{ borderRadius: 'var(--radius-sm)' }}>
        <div className="flex items-center justify-between px-4 py-3 bg-[#F9FAFB] border-b border-[#E5E7EB]">
          <h3 className="text-[14px] text-[#0A1D4D] font-medium">
            Revenue Categories
          </h3>
          {onAddRevenue && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={onAddRevenue}
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div>
          {revenueCategories.length === 0 ? (
            <div className="px-4 py-8 text-center text-[14px] text-[#6B7280]">
              No revenue categories
            </div>
          ) : (
            revenueCategories.map((category) => (
              <CategoryRow key={category.id} category={category} />
            ))
          )}
        </div>
      </div>

      {/* Expense Categories */}
      <div className="border border-[#E5E7EB] overflow-hidden" style={{ borderRadius: 'var(--radius-sm)' }}>
        <div className="flex items-center justify-between px-4 py-3 bg-[#F9FAFB] border-b border-[#E5E7EB]">
          <h3 className="text-[14px] text-[#0A1D4D] font-medium">
            Expense Categories
          </h3>
          {onAddExpense && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={onAddExpense}
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div>
          {expenseCategories.length === 0 ? (
            <div className="px-4 py-8 text-center text-[14px] text-[#6B7280]">
              No expense categories
            </div>
          ) : (
            expenseCategories.map((category) => (
              <CategoryRow key={category.id} category={category} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
