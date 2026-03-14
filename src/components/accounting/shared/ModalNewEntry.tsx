import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Calendar } from "../../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Alert, AlertDescription } from "../../ui/alert";
import { Calendar as CalendarIcon, Upload, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { EntryType } from "./BadgeType";

interface FormData {
  type: EntryType;
  amount: string;
  date: Date;
  company: string;
  account: string;
  targetAccount?: string;
  category?: string;
  client: string;
  bookingNo: string;
  note: string;
  attachment?: File;
}

interface ModalNewEntryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: FormData) => void;
  onSaveAndNew?: (data: FormData) => void;
  initialData?: Partial<FormData>;
  companyOptions?: Array<{ value: string; label: string }>;
  accountOptions?: Array<{ value: string; label: string }>;
  categoryOptions?: Array<{ value: string; label: string }>;
  clientOptions?: Array<{ value: string; label: string }>;
  bookingOptions?: Array<{ value: string; label: string }>;
}

export function ModalNewEntry({
  open,
  onOpenChange,
  onSave,
  onSaveAndNew,
  initialData,
  companyOptions = [],
  accountOptions = [],
  categoryOptions = [],
  clientOptions = [],
  bookingOptions = [],
}: ModalNewEntryProps) {
  const getInitialFormData = () => ({
    type: initialData?.type || "expense",
    amount: initialData?.amount || "",
    date: initialData?.date || new Date(),
    company: initialData?.company || "",
    account: initialData?.account || "",
    targetAccount: initialData?.targetAccount || "",
    category: initialData?.category || "",
    client: initialData?.client || "",
    bookingNo: initialData?.bookingNo || "",
    note: initialData?.note || "",
  });

  const [formData, setFormData] = useState<FormData>(getInitialFormData());

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Update form data when initialData changes
  useEffect(() => {
    if (open) {
      setFormData(getInitialFormData());
      setErrors({});
    }
  }, [open, initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount is required and must be greater than 0";
    }
    if (!formData.company) {
      newErrors.company = "Company is required";
    }
    if (!formData.account) {
      newErrors.account = "Account is required";
    }
    if (formData.type === "transfer" && !formData.targetAccount) {
      newErrors.targetAccount = "Target account is required for transfers";
    }
    if (formData.type !== "transfer" && !formData.category) {
      newErrors.category = "Category is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
      resetForm();
      onOpenChange(false);
    }
  };

  const handleSaveAndNew = () => {
    if (validateForm()) {
      onSaveAndNew?.(formData);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      type: "expense",
      amount: "",
      date: new Date(),
      company: "",
      account: "",
      targetAccount: "",
      category: "",
      client: "",
      bookingNo: "",
      note: "",
    });
    setErrors({});
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  const hasClientOrBooking = formData.client || formData.bookingNo;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Entry" : "New Entry"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Update the accounting entry" : "Create a new accounting entry"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Type Segmented Control */}
          <div className="flex gap-2 p-1 bg-[#F9FAFB] w-fit" style={{ borderRadius: 'var(--radius-sm)' }}>
            <button
              className={`px-4 py-2 text-[14px] transition-colors ${
                formData.type === "revenue"
                  ? "bg-white shadow-sm"
                  : "text-[#6B7280] hover:text-[#374151]"
              }`}
              style={{ borderRadius: 'var(--radius-xs)' }}
              onClick={() => setFormData({ ...formData, type: "revenue" })}
            >
              Revenue
            </button>
            <button
              className={`px-4 py-2 text-[14px] transition-colors ${
                formData.type === "expense"
                  ? "bg-white shadow-sm"
                  : "text-[#6B7280] hover:text-[#374151]"
              }`}
              style={{ borderRadius: 'var(--radius-xs)' }}
              onClick={() => setFormData({ ...formData, type: "expense" })}
            >
              Expense
            </button>
            <button
              className={`px-4 py-2 text-[14px] transition-colors ${
                formData.type === "transfer"
                  ? "bg-white shadow-sm"
                  : "text-[#6B7280] hover:text-[#374151]"
              }`}
              style={{ borderRadius: 'var(--radius-xs)' }}
              onClick={() => setFormData({ ...formData, type: "transfer" })}
            >
              Transfer
            </button>
          </div>

          {/* Blocking Banner */}
          {!hasClientOrBooking && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-[14px] text-orange-800">
                Please select either a Client or Booking No to continue
              </AlertDescription>
            </Alert>
          )}

          {/* Two-Column Form */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Amount */}
              <div className="space-y-2">
                <Label className="text-[14px]">
                  Amount <span className="text-red-600">*</span>
                </Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="text-[20px] h-14"
                  style={{ borderRadius: 'var(--radius-sm)' }}
                />
                {errors.amount && (
                  <p className="text-[12px] text-red-600">{errors.amount}</p>
                )}
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label className="text-[14px]">Date</Label>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-[14px] h-10"
                      style={{ borderRadius: 'var(--radius-sm)' }}
                    >
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {format(formData.date, "MMM d, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => {
                        if (date) {
                          setFormData({ ...formData, date });
                          setIsDatePickerOpen(false);
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Company */}
              <div className="space-y-2">
                <Label className="text-[14px]">
                  Company <span className="text-red-600">*</span>
                </Label>
                <Select value={formData.company} onValueChange={(value) => setFormData({ ...formData, company: value })}>
                  <SelectTrigger style={{ borderRadius: 'var(--radius-sm)' }}>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.company && (
                  <p className="text-[12px] text-red-600">{errors.company}</p>
                )}
              </div>

              {/* Account */}
              <div className="space-y-2">
                <Label className="text-[14px]">
                  {formData.type === "transfer" ? "Source Account" : "Account"}{" "}
                  <span className="text-red-600">*</span>
                </Label>
                <Select value={formData.account} onValueChange={(value) => setFormData({ ...formData, account: value })}>
                  <SelectTrigger style={{ borderRadius: 'var(--radius-sm)' }}>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.account && (
                  <p className="text-[12px] text-red-600">{errors.account}</p>
                )}
              </div>

              {/* Category (not shown for Transfer) */}
              {formData.type !== "transfer" && (
                <div className="space-y-2">
                  <Label className="text-[14px]">
                    Category <span className="text-red-600">*</span>
                  </Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger style={{ borderRadius: 'var(--radius-sm)' }}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-[12px] text-red-600">{errors.category}</p>
                  )}
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Client */}
              <div className="space-y-2">
                <Label className="text-[14px]">Client</Label>
                <Select value={formData.client} onValueChange={(value) => setFormData({ ...formData, client: value })}>
                  <SelectTrigger style={{ borderRadius: 'var(--radius-sm)' }}>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Booking No */}
              <div className="space-y-2">
                <Label className="text-[14px]">Booking No</Label>
                <Select value={formData.bookingNo} onValueChange={(value) => setFormData({ ...formData, bookingNo: value })}>
                  <SelectTrigger style={{ borderRadius: 'var(--radius-sm)' }}>
                    <SelectValue placeholder="Select booking" />
                  </SelectTrigger>
                  <SelectContent>
                    {bookingOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target Account (only for Transfer) */}
              {formData.type === "transfer" && (
                <div className="space-y-2">
                  <Label className="text-[14px]">
                    Target Account <span className="text-red-600">*</span>
                  </Label>
                  <Select value={formData.targetAccount} onValueChange={(value) => setFormData({ ...formData, targetAccount: value })}>
                    <SelectTrigger style={{ borderRadius: 'var(--radius-sm)' }}>
                      <SelectValue placeholder="Select target account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accountOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.targetAccount && (
                    <p className="text-[12px] text-red-600">{errors.targetAccount}</p>
                  )}
                </div>
              )}

              {/* Note */}
              <div className="space-y-2">
                <Label className="text-[14px]">Note</Label>
                <Textarea
                  placeholder="Add notes or details"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="min-h-[100px]"
                  style={{ borderRadius: 'var(--radius-sm)' }}
                />
              </div>

              {/* Attachment */}
              <div className="space-y-2">
                <Label className="text-[14px]">Attachment</Label>
                <Button
                  variant="outline"
                  className="w-full justify-start h-10"
                  style={{ borderRadius: 'var(--radius-sm)' }}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        setFormData({ ...formData, attachment: file });
                      }
                    };
                    input.click();
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {formData.attachment ? formData.attachment.name : "Upload file"}
                </Button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
            <Button
              variant="ghost"
              onClick={handleCancel}
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              Cancel
            </Button>
            {onSaveAndNew && (
              <Button
                variant="outline"
                onClick={handleSaveAndNew}
                style={{ borderRadius: 'var(--radius-sm)' }}
              >
                Save & New
              </Button>
            )}
            <Button
              className="bg-[#F25C05] hover:bg-[#D84D00] text-white"
              onClick={handleSave}
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
