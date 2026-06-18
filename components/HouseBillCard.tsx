"use client";

import AnimatedTotal from "@/components/AnimatedTotal";
import { formatPrice } from "@/components/ImagePlaceholder";
import type { RunningTabData } from "@/lib/runningTab";
import { triggerImpact } from "@/lib/haptic";
import { MapPin, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type HouseBillCardProps = {
  data: RunningTabData;
  onChangeHouse: (cabinNumber: number) => Promise<void>;
  busy?: boolean;
  className?: string;
};

const HOUSES = Array.from({ length: 12 }, (_, index) => index + 1);

export default function HouseBillCard({
  data,
  onChangeHouse,
  busy = false,
  className = "",
}: HouseBillCardProps) {
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
    <div className={className}>
      <div className="overflow-hidden rounded-[22px] border border-stone-600/20 bg-gradient-to-br from-brand-surface-elevated/95 to-brand-surface/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_32px_rgba(0,0,0,0.18)]">
        <div className="h-0.5 bg-gradient-to-r from-brand-accent to-brand-accent-hover" />

        <div className="p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-accent/12 text-brand-accent ring-1 ring-brand-accent/20">
              <MapPin className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold leading-tight text-stone-50">
                Проживання: {data.cabinLabel}
              </p>
              <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.2em] text-brand-muted">
                Поточний рахунок
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
                <AnimatedTotal
                  value={displayTotal}
                  className="text-2xl font-bold tracking-tight text-brand-accent"
                />
                <span className="text-lg font-semibold text-brand-accent">₴</span>
                {data.pendingTotal > 0 ? (
                  <span className="ml-1 text-xs text-brand-muted">
                    (+{formatPrice(data.pendingTotal)} в обробці)
                  </span>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={() => {
                triggerImpact("light");
                setPickerOpen((open) => !open);
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-600/25 bg-brand-surface/80 text-brand-muted transition hover:border-brand-accent/30 hover:text-brand-accent active:scale-[0.97] disabled:opacity-50"
              aria-label="Змінити номер будинку"
              aria-expanded={pickerOpen}
            >
              <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {pickerOpen ? (
        <div className="mt-2 overflow-hidden rounded-[20px] border border-stone-600/20 bg-brand-input/95 p-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md">
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
                  className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition active:scale-[0.98] ${
                    active
                      ? "border-brand-accent/50 bg-brand-accent/15 text-stone-50 shadow-[inset_0_0_0_1px_rgba(201,165,116,0.25)]"
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
