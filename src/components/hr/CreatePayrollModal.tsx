import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface CreatePayrollModalProps {
  open: boolean;
  onClose: () => void;
  onContinue: (company: string, period: string) => void;
}

const COMPANIES = ["CCE", "ZEUJ", "JUAN", "ZN INT."];
const PERIODS = ["Oct 1–15, 2025", "Oct 16–31, 2025", "Sep 1–15, 2025", "Sep 16–30, 2025"];

export function CreatePayrollModal({
  open,
  onClose,
  onContinue,
}: CreatePayrollModalProps) {
  const [company, setCompany] = useState("");
  const [period, setPeriod] = useState("Oct 1–15, 2025");

  if (!open) return null;

  const handleContinue = () => {
    if (company) {
      onContinue(company, period);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8"
      onClick={onClose}
    >
      <div
        className="bg-[var(--theme-bg-surface)] rounded-lg shadow-2xl flex flex-col"
        style={{ width: "480px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="border-b border-[var(--theme-border-default)] px-6 py-4 flex items-center justify-between">
          <h3 className="text-[16px] text-[var(--theme-text-primary)]" style={{ fontWeight: 600 }}>
            Create Payroll Run
          </h3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-[var(--theme-bg-page)]"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <Label className="text-[11px] text-[var(--theme-text-muted)] mb-2 block uppercase">
                Company
              </Label>
              <Select value={company} onValueChange={setCompany}>
                <SelectTrigger className="border-[var(--theme-border-default)] text-[13px] h-10 rounded">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {COMPANIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[11px] text-[var(--theme-text-muted)] mb-2 block uppercase">
                Period
              </Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="border-[var(--theme-border-default)] text-[13px] h-10 rounded">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-[var(--theme-border-default)] px-6 py-4 flex items-center justify-end gap-2 bg-[var(--theme-bg-surface)]">
          <Button
            onClick={onClose}
            variant="ghost"
            className="h-10 px-5 rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!company}
            className="h-10 px-5 rounded-lg bg-[var(--theme-action-primary-bg)] hover:bg-[var(--theme-action-primary-border)] text-white disabled:opacity-50"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}