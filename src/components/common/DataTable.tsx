import React from "react";
import { Loader2, LucideIcon } from "lucide-react";
import { SkeletonTable } from "../shared/NeuronSkeleton";

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  width?: string;
  align?: "left" | "right" | "center";
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

export interface TableSummary {
  label: string;
  value: React.ReactNode; // Flexible: can be formatted string or element
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  emptyMessage?: React.ReactNode;
  onRowClick?: (item: T) => void;
  rowClassName?: (item: T) => string;
  icon?: LucideIcon; // New Prop for the leftmost icon
  footerSummary?: TableSummary[]; // Flexible footer array
  
  // Selection Props
  enableSelection?: boolean;
  selectedIds?: (string | number)[];
  onSelectRow?: (id: string | number) => void;
  onSelectAll?: (checked: boolean) => void;

  // Render Options
  renderTableOnEmpty?: boolean;
}

export function DataTable<T extends { id?: string | number }>({
  data,
  columns,
  isLoading,
  emptyMessage = "No data found",
  onRowClick,
  rowClassName,
  icon: Icon,
  footerSummary,
  enableSelection,
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  renderTableOnEmpty = false
}: DataTableProps<T>) {

  const allSelected = data.length > 0 && data.every(item => item.id && selectedIds.includes(item.id));
  const isIndeterminate = data.some(item => item.id && selectedIds.includes(item.id)) && !allSelected;

  if (isLoading) {
    return (
      <SkeletonTable rows={8} cols={columns.length} />
    );
  }

  if (data.length === 0 && !renderTableOnEmpty) {
    return (
      <div className="border border-[#E5E9F0] rounded-[10px] overflow-hidden bg-white">
        <div className="px-6 py-12 text-center text-[#667085] text-[13px]">
           {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[#E5E9F0] rounded-[10px] overflow-hidden bg-white">
      <table className="w-full border-collapse">
        <thead className="bg-[#F7FAF8] border-b border-[#E5E9F0]">
          <tr>
            {/* Selection Header Column */}
            {enableSelection && (
              <th className="w-10 px-4 py-3 text-center">
                 <input 
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-[#0F766E] focus:ring-[#0F766E]"
                    checked={allSelected}
                    ref={input => {
                      if (input) input.indeterminate = isIndeterminate;
                    }}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                 />
              </th>
            )}

            {/* Icon Header Column - Only if Icon provided */}
            {Icon && <th className="w-10 px-4 py-3"></th>}
            
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-4 py-3 text-[11px] font-semibold text-[#667085] uppercase tracking-[0.002em] ${col.className || ''}`}
                style={{ 
                  textAlign: col.align || "left", 
                  width: col.width 
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E9F0]">
          {data.length === 0 && renderTableOnEmpty ? (
            <tr>
              <td 
                colSpan={columns.length + (enableSelection ? 1 : 0) + (Icon ? 1 : 0)} 
                className="px-6 py-12 text-center text-[#667085] text-[13px]"
              >
                 {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, rowIdx) => (
            <tr
              key={item.id || rowIdx}
              onClick={() => onRowClick?.(item)}
              className={`
                transition-colors 
                ${onRowClick ? "cursor-pointer hover:bg-[#F1F6F4]" : ""}
                ${rowClassName ? rowClassName(item) : ""}
              `}
            >
              {/* Selection Cell */}
              {enableSelection && (
                <td className="w-10 px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                   <input 
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-[#0F766E] focus:ring-[#0F766E]"
                      checked={item.id ? selectedIds.includes(item.id) : false}
                      onChange={() => item.id && onSelectRow?.(item.id)}
                   />
                </td>
              )}

              {/* Icon Cell - Only if Icon provided */}
              {Icon && (
                <td className="w-10 px-4 py-3 text-center">
                    <div className="flex items-center justify-center">
                        <Icon className="w-4 h-4 text-[#98A2B3]" />
                    </div>
                </td>
              )}

              {columns.map((col, colIdx) => (
                <td
                  key={colIdx}
                  className="px-4 py-3"
                  style={{ textAlign: col.align || "left" }}
                >
                  {col.cell ? (
                    col.cell(item)
                  ) : (
                    <span className="text-[12px] text-[#111827] font-medium">
                       {/* @ts-ignore - Generic accessor handling */}
                       {item[col.accessorKey]}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))
          )}
        </tbody>
        
        {/* Footer Row */}
        {footerSummary && footerSummary.length > 0 && (
           <tfoot className="bg-white border-t border-[#E5E9F0]">
             <tr>
               <td colSpan={columns.length + (enableSelection ? 2 : 1)} className="px-4 py-3">
                 <div className="flex items-center justify-end gap-8">
                    {footerSummary.map((summary, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-[0.002em]">
                                {summary.label}
                            </span>
                            <span className="text-[13px] font-bold">
                                {summary.value}
                            </span>
                        </div>
                    ))}
                 </div>
               </td>
             </tr>
           </tfoot>
        )}
      </table>
    </div>
  );
}