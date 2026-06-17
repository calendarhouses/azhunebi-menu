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
    <div className="overflow-hidden rounded-[24px] border border-stone-600/20 bg-brand-input p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-brand-accent/75">
            Статус замовлення
          </p>
          <p className="mt-1 text-lg font-semibold text-stone-50 transition-all duration-300">
            {currentStep.label}
          </p>
        </div>
        <div className="rounded-full border border-brand-accent/20 bg-brand-accent/10 px-3 py-1 text-xs font-medium text-stone-200 transition-all duration-300">
          {currentIndex + 1}/{ORDER_STEPS.length}
        </div>
      </div>

      <div className="mb-5 h-2 overflow-hidden rounded-full bg-brand-surface-elevated">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-accent via-brand-accent-hover to-emerald-300 transition-[width] duration-300 ease-out"
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
              className={`rounded-2xl border px-3 py-3 transition-all duration-300 ease-out ${
                isCurrent
                  ? "border-brand-accent/40 bg-brand-accent/10 shadow-[0_0_24px_rgba(196,165,116,0.12)]"
                  : isComplete
                    ? "border-emerald-400/20 bg-emerald-400/5"
                    : "border-stone-600/20 bg-brand-surface/50"
              }`}
            >
              <div
                className={`mb-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ease-out ${
                  isCurrent
                    ? "bg-brand-accent text-brand-accent-text"
                    : isComplete
                      ? "bg-emerald-400/20 text-emerald-200"
                      : "bg-brand-surface-elevated text-brand-muted"
                }`}
              >
                {isComplete ? "✓" : index + 1}
              </div>
              <p
                className={`text-xs leading-snug transition-colors duration-300 ${
                  isCurrent
                    ? "font-medium text-stone-50"
                    : isComplete
                      ? "text-stone-300"
                      : "text-brand-muted"
                }`}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>

      {order.scheduledFor && order.status === "accepted" ? (
        <p className="mt-4 rounded-2xl border border-sky-400/15 bg-sky-400/5 px-4 py-3 text-xs leading-relaxed text-sky-100/80 transition-all duration-300">
          🕐 Подача о {formatOrderDateTime(order.scheduledFor)}. Статус «Готуємо»
          увімкнеться автоматично за 1 годину до цього часу.
        </p>
      ) : null}

      {order.status === "ready" ? (
        <p className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-100 transition-all duration-300">
          🍽 Можна забирати
          {order.readyAt
            ? ` · ${formatOrderDateTime(order.readyAt)}`
            : ""}
        </p>
      ) : null}
    </div>
  );
}
