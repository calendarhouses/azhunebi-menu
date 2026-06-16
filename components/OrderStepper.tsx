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
  const progress =
    currentIndex < 0 ? 0 : ((currentIndex + 1) / ORDER_STEPS.length) * 100;

  if (order.status === "cancelled") {
    return (
      <div className="rounded-[24px] border border-red-400/20 bg-gradient-to-br from-red-500/10 to-transparent px-5 py-6 text-center">
        <p className="text-base font-semibold text-red-100">Замовлення скасовано</p>
      </div>
    );
  }

  const currentStep = ORDER_STEPS[currentIndex] || ORDER_STEPS[0];

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-amber-400/70">
            Статус замовлення
          </p>
          <p className="mt-1 text-lg font-semibold text-white">
            {currentStep.label}
          </p>
        </div>
        <div className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-100">
          {currentIndex + 1}/{ORDER_STEPS.length}
        </div>
      </div>

      <div className="mb-5 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-emerald-300 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ORDER_STEPS.map((step, index) => {
          const isComplete = currentIndex > index;
          const isCurrent = currentIndex === index;

          return (
            <div
              key={step.key}
              className={`rounded-2xl border px-3 py-3 transition ${
                isCurrent
                  ? "border-amber-400/40 bg-amber-400/10 shadow-[0_0_24px_rgba(251,191,36,0.12)]"
                  : isComplete
                    ? "border-emerald-400/20 bg-emerald-400/5"
                    : "border-white/8 bg-white/[0.02]"
              }`}
            >
              <div
                className={`mb-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  isCurrent
                    ? "bg-amber-400 text-[#0a120e]"
                    : isComplete
                      ? "bg-emerald-400/20 text-emerald-200"
                      : "bg-white/10 text-white/35"
                }`}
              >
                {isComplete ? "✓" : index + 1}
              </div>
              <p
                className={`text-xs leading-snug ${
                  isCurrent
                    ? "font-medium text-amber-100"
                    : isComplete
                      ? "text-white/70"
                      : "text-white/35"
                }`}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>

      {order.scheduledFor && order.status === "accepted" ? (
        <p className="mt-4 rounded-2xl border border-sky-400/15 bg-sky-400/5 px-4 py-3 text-xs leading-relaxed text-sky-100/80">
          🕐 Подача о {formatOrderDateTime(order.scheduledFor)}. Статус «Готуємо»
          увімкнеться автоматично за 1 годину до цього часу.
        </p>
      ) : null}

      {order.status === "ready" ? (
        <p className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-100">
          🍽 Можна забирати
          {order.readyAt
            ? ` · ${formatOrderDateTime(order.readyAt)}`
            : ""}
        </p>
      ) : null}
    </div>
  );
}
