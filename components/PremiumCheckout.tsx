"use client";

import { formatPrice } from "@/components/ImagePlaceholder";
import type { CartItem } from "@/lib/cart";
import { formatOrderDateTime, minScheduledDateTimeLocal, validateScheduledDateTimeLocal, dateTimeLocalToIso } from "@/lib/orderStatus";
import { useState } from "react";

export type PaymentMethod = "cash" | "card";

type PremiumCheckoutProps = {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  comment: string;
  locationNote: string;
  paymentMethod: PaymentMethod;
  isScheduledOrder: boolean;
  scheduledFor: string;
  onCommentChange: (value: string) => void;
  onLocationNoteChange: (value: string) => void;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  onIsScheduledOrderChange: (value: boolean) => void;
  onScheduledForChange: (value: string) => void;
  onIncrement: (itemId: string) => void;
  onDecrement: (itemId: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  total: number;
};

type Step = "cart" | "details" | "confirm";

export default function PremiumCheckout({
  open,
  onClose,
  cart,
  comment,
  locationNote,
  paymentMethod,
  isScheduledOrder,
  scheduledFor,
  onCommentChange,
  onLocationNoteChange,
  onPaymentMethodChange,
  onIsScheduledOrderChange,
  onScheduledForChange,
  onIncrement,
  onDecrement,
  onSubmit,
  isSubmitting,
  total,
}: PremiumCheckoutProps) {
  const [step, setStep] = useState<Step>("cart");

  if (!open) {
    return null;
  }

  function closeCheckout() {
    setStep("cart");
    onClose();
  }

  function goNext() {
    if (step === "cart") {
      setStep("details");
      return;
    }

    if (step === "details") {
      if (!locationNote.trim()) {
        window.Telegram?.WebApp.showAlert("Вкажіть номер столика або будиночка.");
        return;
      }

      if (isScheduledOrder && !scheduledFor) {
        window.Telegram?.WebApp.showAlert("Оберіть час подачі замовлення.");
        return;
      }

      if (isScheduledOrder && scheduledFor) {
        try {
          validateScheduledDateTimeLocal(scheduledFor);
        } catch (error) {
          window.Telegram?.WebApp.showAlert(
            error instanceof Error
              ? error.message
              : "Невірний час подачі замовлення."
          );
          return;
        }
      }

      setStep("confirm");
    }
  }

  function goBack() {
    if (step === "details") {
      setStep("cart");
      return;
    }

    if (step === "confirm") {
      setStep("details");
    }
  }

  const stepTitle =
    step === "cart"
      ? "Ваш кошик"
      : step === "details"
        ? "Деталі замовлення"
        : "Підтвердження";

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Закрити"
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={closeCheckout}
      />

      <div className="animate-sheet-up relative max-h-[88vh] overflow-hidden rounded-t-[28px] border border-white/10 bg-[#101812] shadow-2xl">
        <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-white/20" />

        <div className="flex items-center justify-between px-5 pb-3 pt-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-amber-400/70">
              Оформлення
            </p>
            <h2 className="text-lg font-semibold text-white">{stepTitle}</h2>
          </div>
          <button
            type="button"
            onClick={closeCheckout}
            className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/70"
          >
            Закрити
          </button>
        </div>

        <div className="flex gap-2 px-5 pb-4">
          {(["cart", "details", "confirm"] as Step[]).map((item, index) => (
            <div
              key={item}
              className={`h-1 flex-1 rounded-full ${
                (step === "cart" && index === 0) ||
                (step === "details" && index <= 1) ||
                (step === "confirm" && index <= 2)
                  ? "bg-amber-400"
                  : "bg-white/10"
              }`}
            />
          ))}
        </div>

        <div className="max-h-[46vh] overflow-y-auto px-5">
          {step === "cart" && (
            <ul className="space-y-3">
              {cart.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {item.name}
                    </p>
                    <p className="text-xs text-white/45">
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onDecrement(item.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white"
                    >
                      −
                    </button>
                    <span className="min-w-5 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onIncrement(item.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-[#0a120e]"
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {step === "details" && (
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/45">
                  Номер столика / будиночка *
                </span>
                <input
                  type="text"
                  value={locationNote}
                  onChange={(event) => onLocationNoteChange(event.target.value)}
                  placeholder="Наприклад: Будиночок 7"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-400/40"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/45">
                  Коментар
                </span>
                <textarea
                  value={comment}
                  onChange={(event) => onCommentChange(event.target.value)}
                  placeholder="Поб побажання, алергії..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-400/40"
                />
              </label>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isScheduledOrder}
                    onChange={(event) =>
                      onIsScheduledOrderChange(event.target.checked)
                    }
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-medium text-white">
                      Замовлення наперед
                    </span>
                    <span className="mt-1 block text-xs text-white/45">
                      Оберіть час подачі — «Готуємо» почнеться автоматично за
                      1 годину до цього часу
                    </span>
                  </span>
                </label>

                {isScheduledOrder ? (
                  <label className="mt-4 block">
                    <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/45">
                      Час подачі *
                    </span>
                    <input
                      type="datetime-local"
                      value={scheduledFor}
                      min={minScheduledDateTimeLocal()}
                      onChange={(event) =>
                        onScheduledForChange(event.target.value)
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-amber-400/40"
                    />
                  </label>
                ) : null}
              </div>

              <div>
                <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-white/45">
                  Спосіб оплати
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { id: "cash", label: "Готівка", icon: "💵" },
                      { id: "card", label: "Картка", icon: "💳" },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => onPaymentMethodChange(option.id)}
                      className={`rounded-2xl border px-4 py-4 text-left transition ${
                        paymentMethod === option.id
                          ? "border-amber-400/50 bg-amber-400/10"
                          : "border-white/10 bg-white/[0.03]"
                      }`}
                    >
                      <span className="text-xl">{option.icon}</span>
                      <p className="mt-2 text-sm font-medium text-white">
                        {option.label}
                      </p>
                      <p className="text-xs text-white/45">При отриманні</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/40">
                  Доставка
                </p>
                <p className="mt-1 text-sm text-white">{locationNote}</p>
              </div>
              {comment ? (
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/40">
                    Коментар
                  </p>
                  <p className="mt-1 text-sm text-white/75">{comment}</p>
                </div>
              ) : null}
              {isScheduledOrder && scheduledFor ? (
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/40">
                    Час подачі
                  </p>
                  <p className="mt-1 text-sm text-white">
                    {formatOrderDateTime(dateTimeLocalToIso(scheduledFor))}
                  </p>
                </div>
              ) : null}
              <div>
                <p className="text-xs uppercase tracking-wide text-white/40">
                  Оплата
                </p>
                <p className="mt-1 text-sm text-white">
                  {paymentMethod === "cash" ? "Готівка при отриманні" : "Картка при отриманні"}
                </p>
              </div>
              <div className="border-t border-white/10 pt-4">
                <p className="text-xs uppercase tracking-wide text-white/40">
                  Склад замовлення
                </p>
                <ul className="mt-2 space-y-1">
                  {cart.map((item) => (
                    <li key={item.id} className="text-sm text-white/70">
                      {item.name} × {item.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 border-t border-white/10 px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/55">Разом</span>
            <span className="text-xl font-semibold text-amber-300">
              {formatPrice(total)}
            </span>
          </div>

          <div className="flex gap-3">
            {step !== "cart" ? (
              <button
                type="button"
                onClick={goBack}
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/80"
              >
                Назад
              </button>
            ) : null}

            {step !== "confirm" ? (
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={goNext}
                className="flex-1 rounded-xl bg-amber-400 px-4 py-3 text-sm font-semibold text-[#0a120e] disabled:opacity-50"
              >
                Далі
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onSubmit}
                className="flex-1 rounded-xl bg-amber-400 px-4 py-3 text-sm font-semibold text-[#0a120e] disabled:opacity-50"
              >
                {isSubmitting ? "Відправка..." : "Підтвердити замовлення"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
