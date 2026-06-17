"use client";

import { ClockIcon, PickupIcon } from "@/components/HeaderIcons";
import Lottie from "lottie-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  ORDER_STEPS,
  formatOrderDateTime,
  getStepIndex,
  type TrackedOrder,
} from "@/lib/orderStatus";

type OrderStepperProps = {
  order: TrackedOrder;
  onDismissCancelled?: () => void;
};

const LOTTIE_BASE_PATH = "/azhunebi-menu";

function DetailIconTile({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-accent/10 text-brand-accent ring-1 ring-brand-accent/15">
      {children}
    </span>
  );
}

export default function OrderStepper({ order, onDismissCancelled }: OrderStepperProps) {
  const [badAnimation, setBadAnimation] = useState<object | null>(null);

  useEffect(() => {
    if (order.status !== "cancelled") return;

    fetch(`${LOTTIE_BASE_PATH}/bad.json`)
      .then((r) => r.json())
      .then((data) => setBadAnimation(data))
      .catch(() => setBadAnimation(null));
  }, [order.status]);

  if (order.status === "cancelled") {
    return (
      <div className="flex flex-col items-center rounded-[24px] border border-red-400/15 bg-gradient-to-br from-red-500/8 to-brand-input px-5 py-8 text-center">
        {badAnimation ? (
          <Lottie
            animationData={badAnimation}
            loop={false}
            className="mx-auto h-[min(60vw,240px)] w-[min(60vw,240px)]"
          />
        ) : (
          <div className="mx-auto h-40 w-40 rounded-full bg-red-400/10" />
        )}

        <p className="mt-4 text-xl font-bold text-stone-50">
          На жаль, замовлення скасовано 💔
        </p>
        <p className="mt-2 text-sm leading-relaxed text-stone-400">
          Кухар вже плаче, але зараз ми не маємо змоги його виконати.
          <br />
          Спробуйте зробити нове замовлення трохи пізніше!
        </p>

        {onDismissCancelled ? (
          <button
            type="button"
            onClick={onDismissCancelled}
            className="btn-accent mt-6 w-full rounded-2xl px-4 py-3.5 text-sm font-semibold transition active:scale-[0.98]"
          >
            Повернутися в меню
          </button>
        ) : null}
      </div>
    );
  }

  const currentIndex = getStepIndex(order.status);
  const progress =
    currentIndex < 0 ? 0 : ((currentIndex + 1) / ORDER_STEPS.length) * 100;
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
          className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-brand-accent via-brand-accent-hover to-emerald-300 transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        >
          <div className="animate-progress-shimmer absolute inset-0 bg-[length:200%_100%] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
      </div>

      <div className="grid grid-cols-2 items-stretch gap-2 sm:grid-cols-4">
        {ORDER_STEPS.map((step, index) => {
          const isComplete = currentIndex > index;
          const isCurrent = currentIndex === index;
          const isReadyCurrent = isCurrent && step.key === "ready";
          const useGreen = isComplete || isReadyCurrent;
          const useGoldCurrent = isCurrent && !isReadyCurrent;

          return (
            <div
              key={step.key}
              className={`flex h-full min-h-[5.75rem] flex-col rounded-2xl border px-3 py-3 transition-all duration-300 ease-out ${
                useGoldCurrent
                  ? "border-brand-accent/40 bg-brand-accent/10 shadow-[0_0_24px_rgba(196,165,116,0.12)]"
                  : useGreen
                    ? "border-emerald-400/30 bg-emerald-400/10 shadow-[0_0_24px_rgba(52,211,153,0.14)]"
                    : "border-stone-600/20 bg-brand-surface/50"
              }`}
            >
              <div
                className={`mb-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ease-out ${
                  useGoldCurrent
                    ? "bg-brand-accent text-brand-accent-text"
                    : useGreen
                      ? "bg-emerald-400/25 text-emerald-100"
                      : "bg-brand-surface-elevated text-brand-muted"
                }`}
              >
                {useGreen && !useGoldCurrent ? "✓" : index + 1}
              </div>
              <p
                className={`flex-1 text-xs leading-snug transition-colors duration-300 ${
                  useGoldCurrent || isReadyCurrent
                    ? "font-medium text-stone-50"
                    : useGreen
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
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-brand-accent/15 bg-brand-accent/5 px-4 py-3 text-xs leading-relaxed text-stone-200/90 transition-all duration-300">
          <DetailIconTile>
            <ClockIcon />
          </DetailIconTile>
          <p>
            Подача о {formatOrderDateTime(order.scheduledFor)}. Статус «Готуємо»
            увімкнеться автоматично за 1 годину до цього часу.
          </p>
        </div>
      ) : null}

      {order.status === "ready" ? (
        <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-100 transition-all duration-300">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/20">
            <PickupIcon />
          </span>
          <p>
            Можна забирати
            {order.readyAt ? ` · ${formatOrderDateTime(order.readyAt)}` : ""}
          </p>
        </div>
      ) : null}
    </div>
  );
}
