import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { NeuronStatusPill } from "../../NeuronStatusPill";

interface ServiceBookingRowProps {
  icon: LucideIcon;
  iconColor?: string;
  bookingId: string;
  projectNumber?: string;
  customerName: string;
  status: string;
  createdAt: string;
  onClick: () => void;
  additionalColumns?: ReactNode[];
}

export function ServiceBookingRow({
  icon: Icon,
  iconColor = "#0F766E",
  bookingId,
  projectNumber,
  customerName,
  status,
  createdAt,
  onClick,
  additionalColumns = []
}: ServiceBookingRowProps) {
  return (
    <tr
      className="border-b border-[#12332B]/5 hover:bg-[#0F766E]/5 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <td className="py-4">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Icon size={20} color={iconColor} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ 
              fontSize: "14px", 
              fontWeight: 600, 
              color: "#12332B",
              marginBottom: "2px"
            }}>
              {bookingId}
            </div>
            {projectNumber && (
              <div style={{ 
                fontSize: "13px", 
                color: "#667085"
              }}>
                Project: {projectNumber}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="py-4">
        <div style={{ fontSize: "14px", color: "#12332B" }}>
          {customerName}
        </div>
      </td>
      {additionalColumns.map((column, index) => (
        <td key={index} className="py-4">
          {column}
        </td>
      ))}
      <td className="py-4">
        <NeuronStatusPill status={status} />
      </td>
      <td className="py-4">
        <div style={{ fontSize: "13px", color: "#667085" }}>
          {new Date(createdAt).toLocaleDateString()}
        </div>
      </td>
    </tr>
  );
}

interface ServiceBookingTableProps {
  children: ReactNode;
  headers: string[];
}

export function ServiceBookingTable({ children, headers }: ServiceBookingTableProps) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-[#12332B]/10">
          {headers.map((header, index) => (
            <th 
              key={index}
              className="text-left pb-3 text-[#667085] font-semibold text-xs uppercase tracking-wide"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {children}
      </tbody>
    </table>
  );
}