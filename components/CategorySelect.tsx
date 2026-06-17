"use client";

import { useEffect, useRef, useState } from "react";

type Option = { value: string; label: string };

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  error?: boolean;
};

/**
 * Custom dropdown that looks identical to the other admin form inputs.
 * Renders the list INLINE (no absolute) so it works correctly inside
 * any overflow-y-auto scroll container (like AdminBottomSheet).
 */
export default function CategorySelect({
  value,
  onChange,
  options,
  placeholder = "Оберіть категорію…",
  error = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? null;

  // Close on outside click / touch
  useEffect(() => {
    if (!open) return;

    function handleOutside(e: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [open]);

  const triggerCls = [
    "w-full rounded-lg border px-4 py-3 text-sm text-left",
    "flex items-center justify-between gap-2",
    "bg-brand-input outline-none transition",
    error
      ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
      : open
        ? "border-brand-accent ring-1 ring-brand-accent"
        : "border-white/10 hover:border-white/20",
    selectedLabel ? "text-white" : "text-white/30",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button type="button" onClick={() => setOpen((v) => !v)} className={triggerCls}>
        <span className="min-w-0 truncate">{selectedLabel ?? placeholder}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 shrink-0 text-white/35 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown list — inline, NOT absolute, so it works in scroll containers */}
      {open && (
        <div className="animate-dropdown-in mt-1 overflow-hidden rounded-xl border border-white/10 bg-brand-surface shadow-2xl">
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                  isSelected
                    ? "bg-brand-accent/10 font-medium text-brand-accent"
                    : "text-white/80 hover:bg-brand-surface-elevated"
                }`}
              >
                {option.value === "" ? (
                  <span className="text-white/30">{option.label}</span>
                ) : (
                  option.label
                )}

                {isSelected && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="ml-2 inline h-3.5 w-3.5 text-brand-accent"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
