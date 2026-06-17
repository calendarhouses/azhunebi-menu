"use client";

import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import {
  buildSheetPanelTransform,
  useKeyboardLayoutOffset,
  useSheetPresence,
  useStableSheetHeight,
} from "@/lib/useSheetPresence";
import { useSwipeToDismissSheet } from "@/lib/useSwipeToDismissSheet";
import type { CSSProperties, ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

/**
 * Reusable premium bottom sheet for admin modals.
 * Uses the same animation system as PremiumCheckout and OrdersPanel:
 *   - overlay: fade in/out (transition-opacity)
 *   - panel: slides up from bottom (sheet-panel-motion / is-visible)
 *   - swipe handle: drag down ≥72px to dismiss
 *   - tap overlay: close
 */
export default function AdminBottomSheet({
  open,
  onClose,
  title,
  children,
}: Props) {
  const { mounted, visible } = useSheetPresence(open);
  const maxHeight = useStableSheetHeight(mounted);
  const keyboardOffset = useKeyboardLayoutOffset(mounted);
  const { dragOffset, isDragging, swipeAreaProps } =
    useSwipeToDismissSheet(onClose);

  useBodyScrollLock(mounted);

  if (!mounted) return null;

  const panelStyle: CSSProperties = {
    maxHeight: maxHeight ? `${maxHeight}px` : "92vh",
    ...buildSheetPanelTransform(keyboardOffset, dragOffset, isDragging),
  };

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Tap-to-close overlay */}
      <button
        type="button"
        aria-label="Закрити"
        className="absolute inset-0"
        onClick={onClose}
      />

      {/* Sheet panel */}
      <div
        style={panelStyle}
        className={`sheet-panel sheet-panel-motion relative flex w-full max-w-lg min-h-0 flex-col overflow-hidden rounded-t-[28px] border shadow-2xl ${
          visible ? "is-visible" : ""
        }`}
      >
        {/* Swipe handle + title */}
        <div className="shrink-0 touch-pan-y" {...swipeAreaProps}>
          <div className="sheet-handle relative mx-auto mt-3 h-1 w-12 shrink-0 rounded-full" />
          <div className="px-5 pb-3 pt-4">
            <h2 className="text-base font-semibold text-white">{title}</h2>
          </div>
        </div>

        {/* Scrollable form content */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-none touch-pan-y px-5 pb-safe">
          {children}
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}
