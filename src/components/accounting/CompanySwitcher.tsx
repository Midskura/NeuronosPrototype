import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Building2 } from "lucide-react";

interface CompanySwitcherProps {
  value: string;
  onValueChange: (value: string) => void;
  companies?: Array<{ value: string; label: string }>;
}

export function CompanySwitcher({
  value,
  onValueChange,
  companies = [
    { value: "jjb", label: "JJB Group" },
    { value: "subsidiary", label: "JJB Subsidiary" },
    { value: "logistics", label: "JJB Logistics" },
  ],
}: CompanySwitcherProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger 
        className="w-[200px] h-10 text-[14px] border-[#E5E7EB]" 
        style={{ borderRadius: 'var(--radius-sm)' }}
      >
        <Building2 className="w-4 h-4 mr-2 text-[#6B7280]" />
        <SelectValue placeholder="Select company" />
      </SelectTrigger>
      <SelectContent>
        {companies.map((company) => (
          <SelectItem key={company.value} value={company.value}>
            {company.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
