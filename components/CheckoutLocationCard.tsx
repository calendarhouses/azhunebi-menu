"use client";

import type { ReactNode } from "react";

type CheckoutLocationCardProps = {
  label: string;
  value: string;
  icon: ReactNode;
  subdued?: boolean;
};

export default function CheckoutLocationCard({
  label,
  value,
  icon,
  subdued = false,
}: CheckoutLocationCardProps) {
  return (
    <div
      className={`overflow-hidden rounded-[22px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_28px_rgba(0,0,0,0.12)] ${
        subdued
          ? "border-stone-600/15 bg-gradient-to-br from-brand-surface/80 to-brand-input/60"
          : "border-stone-600/20 bg-gradient-to-br from-brand-surface-elevated/95 to-brand-surface/70"
      }`}
    >
      {!subdued ? (
        <div className="h-0.5 bg-gradient-to-r from-brand-accent to-brand-accent-hover" />
      ) : null}

      <div className="flex items-center gap-3.5 p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-accent/12 text-brand-accent ring-1 ring-brand-accent/20">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand-muted">
            {label}
          </p>
          <p className="mt-1 text-base font-semibold leading-snug text-stone-50">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
