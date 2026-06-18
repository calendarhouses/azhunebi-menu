"use client";

import SessionOrderHistory from "@/components/SessionOrderHistory";
import type { TrackedOrder } from "@/lib/orderStatus";
import { useState } from "react";

type SessionHistoryAccordionProps = {
  orders: TrackedOrder[];
};

export default function SessionHistoryAccordion({
  orders,
}: SessionHistoryAccordionProps) {
  const [open, setOpen] = useState(false);

  if (orders.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-brand-surface/50">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-stone-200">
          Історія рахунку
        </span>
        <span className="flex items-center gap-2 text-xs text-brand-muted">
          {orders.length} чек{orders.length === 1 ? "" : "и"}
          <span
            className={`inline-block transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          >
            ▾
          </span>
        </span>
      </button>

      {open ? (
        <div className="border-t border-white/10 px-2 pb-3 pt-2">
          <SessionOrderHistory orders={orders} />
        </div>
      ) : null}
    </div>
  );
}
