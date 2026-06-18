"use client";

import HouseBillCard from "@/components/HouseBillCard";
import HouseBillSkeleton from "@/components/HouseBillSkeleton";
import SessionOrderHistory from "@/components/SessionOrderHistory";
import type { RunningTabData } from "@/lib/runningTab";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import {
  buildSheetPanelTransform,
  useSheetPresence,
} from "@/lib/useSheetPresence";
import { useSwipeToDismissSheet } from "@/lib/useSwipeToDismissSheet";
import type { CSSProperties } from "react";

type HouseBillPanelProps = {
  open: boolean;
  onClose: () => void;
  runningTab: RunningTabData | null;
  loading?: boolean;
  onChangeHouse: (cabinNumber: number) => Promise<void>;
  changeHouseBusy?: boolean;
};

export default function HouseBillPanel({
  open,
  onClose,
  runningTab,
  loading = false,
  onChangeHouse,
  changeHouseBusy = false,
}: HouseBillPanelProps) {
  const { mounted, visible } = useSheetPresence(open);
  const { dragOffset, isDragging, swipeAreaProps } = useSwipeToDismissSheet(onClose);

  useBodyScrollLock(open);

  if (!mounted) {
    return null;
  }

  const panelStyle: CSSProperties = {
    ...buildSheetPanelTransform(0, dragOffset, isDragging),
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-end transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <button
        type="button"
        aria-label="Закрити"
        className="absolute inset-0 bg-brand-overlay backdrop-blur-md"
        onClick={onClose}
      />

      <div
        style={panelStyle}
        className={`sheet-panel sheet-panel-motion relative flex max-h-[92vh] flex-col overflow-hidden rounded-t-[32px] border shadow-2xl ${
          visible ? "is-visible" : ""
        }`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(196,165,116,0.1),transparent_65%)]" />

        <div className="shrink-0 touch-pan-y" {...swipeAreaProps}>
          <div className="sheet-handle relative mx-auto mt-3 h-1 w-12 rounded-full" />

          <div className="relative flex items-start justify-between px-5 pb-3 pt-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-brand-accent/75">
                Відкритий рахунок
              </p>
              <h2 className="mt-1 text-xl font-semibold text-stone-50">
                Рахунок будинку
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-stone-600/25 bg-brand-surface-elevated/70 px-3 py-1.5 text-sm text-brand-muted"
            >
              Закрити
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-1">
          {loading && !runningTab ? (
            <HouseBillSkeleton />
          ) : runningTab ? (
            <div className="space-y-5">
              <HouseBillCard
                data={runningTab}
                onChangeHouse={onChangeHouse}
                busy={changeHouseBusy}
              />

              <section>
                <p className="mb-3 text-xs uppercase tracking-[0.18em] text-brand-muted">
                  Замовлення в рахунку
                </p>
                <SessionOrderHistory orders={runningTab.orders} />
              </section>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-brand-muted">
              Немає активного рахунку
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
