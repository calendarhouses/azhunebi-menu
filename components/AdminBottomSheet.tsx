"use client";

import {
  buildSheetPanelTransform,
  useSheetPresence,
} from "@/lib/useSheetPresence";
import { useSwipeToDismissSheet } from "@/lib/useSwipeToDismissSheet";
import type { CSSProperties, ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export default function AdminBottomSheet({
  open,
  onClose,
  title,
  children,
}: Props) {
  const { mounted, visible } = useSheetPresence(open);
  const { dragOffset, isDragging, swipeAreaProps } =
    useSwipeToDismissSheet(onClose);

  if (!mounted) return null;

  const panelStyle: CSSProperties = {
    ...buildSheetPanelTransform(0, dragOffset, isDragging),
  };

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <button
        type="button"
        aria-label="Закрити"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div
        style={panelStyle}
        className={`sheet-panel sheet-panel-motion relative flex max-h-[92vh] w-full max-w-lg min-h-0 flex-col overflow-hidden rounded-t-[28px] border shadow-2xl ${
          visible ? "is-visible" : ""
        }`}
      >
        <div className="shrink-0 touch-pan-y" {...swipeAreaProps}>
          <div className="sheet-handle relative mx-auto mt-3 h-1 w-12 shrink-0 rounded-full" />
          <div className="px-5 pb-3 pt-4">
            <h2 className="text-base font-semibold text-white">{title}</h2>
          </div>
        </div>

        <div className="checkout-form-scroll min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-5 pb-safe">
          {children}
          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}
