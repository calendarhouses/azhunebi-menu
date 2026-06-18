"use client";

import AnimatedTotal from "@/components/AnimatedTotal";
import { formatPrice } from "@/components/ImagePlaceholder";
import { formatCabinDisplay } from "@/lib/startParamLocation";
import type { RunningTabData } from "@/lib/runningTab";
import { triggerImpact } from "@/lib/haptic";
import { MapPin } from "lucide-react";
import { useEffect, useRef } from "react";

type HouseBillCardProps = {
  data: RunningTabData;
  className?: string;
};

export default function HouseBillCard({
  data,
  className = "",
}: HouseBillCardProps) {
  const prevConfirmedRef = useRef(data.confirmedTotal);

  useEffect(() => {
    if (prevConfirmedRef.current !== data.confirmedTotal) {
      triggerImpact("light");
      prevConfirmedRef.current = data.confirmedTotal;
    }
  }, [data.confirmedTotal]);

  const displayTotal = data.confirmedTotal;

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
                {formatCabinDisplay(data.cabinLabel, data.cabinNumber)}
              </p>
              <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.2em] text-brand-muted">
                Поточний рахунок
              </p>
              <div className="mt-1 flex flex-nowrap items-baseline gap-x-1">
                <AnimatedTotal
                  value={displayTotal}
                  className="text-2xl font-bold tracking-tight text-brand-accent"
                />
                <span className="shrink-0 text-lg font-semibold text-brand-accent">
                  ₴
                </span>
                {data.pendingTotal > 0 ? (
                  <span className="ml-1 text-xs text-brand-muted">
                    (+{formatPrice(data.pendingTotal)} в обробці)
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
