"use client";

import AnimatedTotal from "@/components/AnimatedTotal";
import { PencilIcon } from "@/components/HeaderIcons";
import { formatPrice } from "@/components/ImagePlaceholder";
import type { RunningTabData } from "@/lib/runningTab";
import { triggerImpact } from "@/lib/haptic";
import { useEffect, useRef, useState } from "react";

type RunningTabBarProps = {
  data: RunningTabData;
  onChangeHouse: (cabinNumber: number) => Promise<void>;
  busy?: boolean;
};

const HOUSES = Array.from({ length: 12 }, (_, index) => index + 1);

export default function RunningTabBar({
  data,
  onChangeHouse,
  busy = false,
}: RunningTabBarProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const prevConfirmedRef = useRef(data.confirmedTotal);

  useEffect(() => {
    if (prevConfirmedRef.current !== data.confirmedTotal) {
      triggerImpact("light");
      prevConfirmedRef.current = data.confirmedTotal;
    }
  }, [data.confirmedTotal]);

  const displayTotal = data.confirmedTotal + data.pendingTotal;

  return (
    <div className="px-5 pb-3">
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-brand-surface/90 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md">
        <div className="min-w-0 flex-1 text-sm leading-snug text-stone-200">
          <span className="text-base" aria-hidden>
            🏠
          </span>{" "}
          <span className="font-medium">{data.cabinLabel}</span>
          <span className="text-brand-muted"> | </span>
          <span className="text-brand-muted">Загальний рахунок:</span>{" "}
          <AnimatedTotal
            value={displayTotal}
            className="font-semibold text-brand-accent"
          />
          <span className="font-semibold text-brand-accent"> ₴</span>
          {data.pendingTotal > 0 ? (
            <span className="ml-1 block text-xs text-brand-muted">
              (+{formatPrice(data.pendingTotal)} в обробці)
            </span>
          ) : null}
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => setPickerOpen((open) => !open)}
          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand-muted transition hover:bg-white/5 hover:text-stone-200 disabled:opacity-50"
          aria-label="Змінити будинок"
        >
          <PencilIcon className="h-3.5 w-3.5" />
          <span>Змінити</span>
        </button>
      </div>

      {pickerOpen ? (
        <div className="mt-2 rounded-2xl border border-white/10 bg-brand-input/95 p-3 backdrop-blur-md">
          <p className="mb-2 text-xs text-brand-muted">
            Перенесемо лише ваші замовлення
          </p>
          <div className="grid grid-cols-4 gap-1.5">
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
                  className={`rounded-lg border px-2 py-2 text-sm font-semibold transition ${
                    active
                      ? "border-brand-accent/50 bg-brand-accent/15 text-stone-50"
                      : "border-stone-600/25 bg-brand-surface text-brand-muted hover:border-brand-accent/25"
                  } disabled:opacity-50`}
                >
                  {house}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
