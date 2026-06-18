"use client";

import AnimatedTotal from "@/components/AnimatedTotal";
import { formatPrice } from "@/components/ImagePlaceholder";
import type { RunningTabData } from "@/lib/runningTab";
import { triggerImpact } from "@/lib/haptic";
import { useEffect, useRef, useState } from "react";

type RunningTabCardProps = {
  data: RunningTabData;
  onChangeHouse: (cabinNumber: number) => Promise<void>;
  busy?: boolean;
};

const HOUSES = Array.from({ length: 12 }, (_, index) => index + 1);

export default function RunningTabCard({
  data,
  onChangeHouse,
  busy = false,
}: RunningTabCardProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const prevConfirmedRef = useRef(data.confirmedTotal);

  useEffect(() => {
    if (prevConfirmedRef.current !== data.confirmedTotal) {
      triggerImpact("light");
      prevConfirmedRef.current = data.confirmedTotal;
    }
  }, [data.confirmedTotal]);

  return (
    <div className="sticky top-0 z-10 -mx-5 mb-4 px-5 pb-1 pt-1">
      <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-brand-surface/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_32px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(196,165,116,0.14),transparent_70%)]" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-brand-accent/80">
              Рахунок Будинку №{data.cabinNumber}
            </p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <AnimatedTotal
                value={data.confirmedTotal}
                className="text-4xl font-bold tracking-tight text-stone-50"
              />
              <span className="text-lg font-semibold text-brand-accent">₴</span>
            </p>
            {data.pendingTotal > 0 ? (
              <p className="mt-1 animate-pulse text-sm text-brand-muted">
                + {formatPrice(data.pendingTotal)} в обробці
              </p>
            ) : null}
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => setPickerOpen((open) => !open)}
            className="shrink-0 rounded-xl border border-white/10 bg-brand-input px-3 py-2 text-xs font-medium text-brand-muted transition hover:border-brand-accent/30 hover:text-stone-200 disabled:opacity-50"
          >
            Змінити номер
          </button>
        </div>

        {pickerOpen ? (
          <div className="relative mt-4 border-t border-white/10 pt-4">
            <p className="mb-3 text-xs text-brand-muted">
              Оберіть правильний будинок — ваші замовлення будуть перенесені.
            </p>
            <div className="grid grid-cols-4 gap-2">
              {HOUSES.map((house) => {
                const active = house === data.cabinNumber;
                return (
                  <button
                    key={house}
                    type="button"
                    disabled={busy || active}
                    onClick={async () => {
                      triggerImpact("medium");
                      await onChangeHouse(house);
                      setPickerOpen(false);
                    }}
                    className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "border-brand-accent/50 bg-brand-accent/15 text-stone-50"
                        : "border-stone-600/25 bg-brand-input text-brand-muted hover:border-brand-accent/25 hover:text-stone-200"
                    } disabled:opacity-60`}
                  >
                    {house}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
