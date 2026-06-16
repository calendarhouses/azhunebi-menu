"use client";

import {
  ORDER_STEPS,
  formatOrderDateTime,
  getStepIndex,
  type TrackedOrder,
} from "@/lib/orderStatus";

type OrderStepperProps = {
  order: TrackedOrder;
};

export default function OrderStepper({ order }: OrderStepperProps) {
  const currentIndex = getStepIndex(order.status);

  if (order.status === "cancelled") {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-5 text-center">
        <p className="text-sm font-medium text-red-100">Замовлення скасовано</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {ORDER_STEPS.map((step, index) => {
        const isComplete = currentIndex > index;
        const isCurrent = currentIndex === index;
        const isLast = index === ORDER_STEPS.length - 1;

        return (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
                  isComplete
                    ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-200"
                    : isCurrent
                      ? "border-amber-400 bg-amber-400 text-[#0a120e]"
                      : "border-white/10 bg-white/[0.04] text-white/35"
                }`}
              >
                {isComplete ? "✓" : index + 1}
              </div>
              {!isLast ? (
                <div
                  className={`my-1 w-px flex-1 min-h-8 ${
                    isComplete ? "bg-emerald-400/40" : "bg-white/10"
                  }`}
                />
              ) : null}
            </div>

            <div className={`pb-5 ${isLast ? "pb-0" : ""}`}>
              <p
                className={`text-sm font-medium ${
                  isCurrent
                    ? "text-amber-200"
                    : isComplete
                      ? "text-white/75"
                      : "text-white/35"
                }`}
              >
                {step.label}
              </p>
              {isCurrent && order.scheduledFor && step.key === "accepted" ? (
                <p className="mt-1 text-xs text-white/45">
                  Подача о {formatOrderDateTime(order.scheduledFor)} · готувати
                  почнемо за годину
                </p>
              ) : null}
              {isCurrent && order.status === "ready" ? (
                <p className="mt-1 text-xs text-emerald-200/80">
                  Можна забирати · {formatOrderDateTime(order.readyAt)}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
