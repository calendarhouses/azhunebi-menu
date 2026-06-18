"use client";

import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import { useSheetPresence } from "@/lib/useSheetPresence";
import type { ReactNode } from "react";

type AdminConfirmDialogProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmBusy?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Підтвердити",
  cancelLabel = "Скасувати",
  confirmBusy = false,
  destructive = false,
  onConfirm,
  onClose,
}: AdminConfirmDialogProps) {
  const { mounted, visible } = useSheetPresence(open);

  useBodyScrollLock(open);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center p-5 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      role="presentation"
    >
      <button
        type="button"
        aria-label="Закрити"
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={confirmBusy ? undefined : onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        className={`relative w-full max-w-sm overflow-hidden rounded-[24px] border border-stone-600/25 bg-gradient-to-br from-brand-surface-elevated to-brand-surface shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] transition duration-300 ${
          visible ? "scale-100" : "scale-[0.97]"
        }`}
      >
        <div className="h-0.5 bg-gradient-to-r from-brand-accent to-brand-accent-hover" />

        <div className="p-5">
          <h2
            id="admin-confirm-title"
            className="text-lg font-semibold leading-snug text-stone-50"
          >
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-brand-muted">
            {description}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={confirmBusy}
              onClick={onClose}
              className="rounded-xl border border-stone-600/25 bg-brand-input px-4 py-3 text-sm font-semibold text-stone-200 transition hover:border-stone-500/35 active:scale-[0.99] disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              disabled={confirmBusy}
              onClick={onConfirm}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition active:scale-[0.99] disabled:opacity-50 ${
                destructive
                  ? "border border-red-400/30 bg-red-500/15 text-red-200 hover:bg-red-500/20"
                  : "btn-accent shadow-[0_8px_24px_rgba(196,165,116,0.2)]"
              }`}
            >
              {confirmBusy ? "Обробка…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
