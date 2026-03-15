/**
 * MultiInputField — Dynamic input list for multi-value operational fields.
 *
 * Minimal inline UX: single input with [+] on last row, [x] on all rows
 * when multiple rows exist. No separate "Add" button below.
 *
 * Storage abstraction: accepts and emits comma-separated strings.
 * The component is a pure UI concern — no storage/backend changes needed.
 *
 * @see /docs/blueprints/MULTI_INPUT_FIELDS_BLUEPRINT.md — Phase 1
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Plus, X } from "lucide-react";

interface MultiInputFieldProps {
  /** Current value as comma-separated string */
  value: string;
  /** Called with the new comma-separated string on every change */
  onChange: (value: string) => void;
  /** Label displayed above the input group (optional — parent may provide its own) */
  label?: string;
  /** Placeholder for each input row */
  placeholder?: string;
  /** Text for the add button (e.g., "Add MBL/MAWB") */
  addButtonText?: string;
  /** Minimum number of visible rows (default: 1) */
  minRows?: number;
  /** Optional style override for matching existing form input styling */
  inputStyle?: React.CSSProperties;
  /** Optional className for the outer wrapper */
  className?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
}

/**
 * Split a comma-separated string into an array of trimmed, non-empty entries.
 * Always returns at least one entry (empty string) so there's always one input visible.
 */
function parseEntries(value: string, minRows: number = 1): string[] {
  if (!value || value.trim() === "") {
    return Array(minRows).fill("");
  }
  const entries = value.split(",").map((s) => s.trim());
  while (entries.length < minRows) {
    entries.push("");
  }
  return entries;
}

/**
 * Join an array of strings into a comma-separated string.
 * Filters empty entries so storage stays clean.
 */
function joinEntries(entries: string[]): string {
  return entries
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
}

export function MultiInputField({
  value,
  onChange,
  label,
  placeholder = "Enter value...",
  addButtonText = "Add",
  minRows = 1,
  inputStyle,
  className = "",
  disabled = false,
}: MultiInputFieldProps) {
  const [entries, setEntries] = useState<string[]>(() => parseEntries(value, minRows));
  const lastAddedRef = useRef<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync internal state when external value changes (e.g., form reset, prefill)
  useEffect(() => {
    const parsed = parseEntries(value, minRows);
    const currentJoined = joinEntries(entries);
    const incomingJoined = joinEntries(parsed);
    if (currentJoined !== incomingJoined) {
      setEntries(parsed);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus newly added input
  useEffect(() => {
    if (lastAddedRef.current !== null) {
      const idx = lastAddedRef.current;
      inputRefs.current[idx]?.focus();
      lastAddedRef.current = null;
    }
  }, [entries.length]);

  const emitChange = useCallback(
    (newEntries: string[]) => {
      setEntries(newEntries);
      onChange(joinEntries(newEntries));
    },
    [onChange]
  );

  const handleEntryChange = (index: number, newValue: string) => {
    const updated = [...entries];
    updated[index] = newValue;
    emitChange(updated);
  };

  const handleAdd = () => {
    const updated = [...entries, ""];
    lastAddedRef.current = updated.length - 1;
    emitChange(updated);
  };

  const handleRemove = (index: number) => {
    if (entries.length <= minRows) return;
    const updated = entries.filter((_, i) => i !== index);
    emitChange(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
    if (e.key === "Backspace" && entries[index] === "" && entries.length > minRows) {
      e.preventDefault();
      handleRemove(index);
      const prevIdx = Math.max(0, index - 1);
      setTimeout(() => inputRefs.current[prevIdx]?.focus(), 0);
    }
  };

  const defaultInputStyle: React.CSSProperties = {
    border: "1px solid var(--neuron-ui-border)",
    backgroundColor: "#FFFFFF",
    color: "#12332B",
    ...inputStyle,
  };

  const isLastRow = (index: number) => index === entries.length - 1;
  const canRemove = entries.length > minRows;

  return (
    <div className={className}>
      {label && (
        <label
          className="block mb-1.5"
          style={{ fontSize: "13px", fontWeight: 500, color: "#12332B" }}
        >
          {label}
        </label>
      )}

      <div className="flex flex-col gap-1.5">
        {entries.map((entry, index) => (
          <div key={index} className="flex items-center gap-1">
            <input
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              value={entry}
              onChange={(e) => handleEntryChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              placeholder={placeholder}
              disabled={disabled}
              className="flex-1 px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] text-[13px] transition-colors"
              style={defaultInputStyle}
            />
            {!disabled && isLastRow(index) && (
              <button
                type="button"
                onClick={handleAdd}
                className="flex items-center justify-center w-7 h-7 rounded transition-colors hover:bg-[#0F766E]/10 text-[#0F766E] shrink-0"
                title="Add row"
              >
                <Plus size={14} />
              </button>
            )}
            {canRemove && (
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={disabled}
                className="flex items-center justify-center w-7 h-7 rounded transition-colors hover:bg-red-50 text-[#9CA3AF] hover:text-red-500 shrink-0"
                title="Remove"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
