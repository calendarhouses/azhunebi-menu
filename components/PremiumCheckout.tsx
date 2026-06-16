"use client";

import EmptyStateScreen from "@/components/EmptyStateScreen";
import { formatPrice } from "@/components/ImagePlaceholder";
import QuantityControl from "@/components/QuantityControl";
import type { CartItem } from "@/lib/cart";
import {
  minScheduledDateTimeLocal,
  validateScheduledDateTimeLocal,
} from "@/lib/orderStatus";
import type { ReactNode } from "react";

type PremiumCheckoutProps = {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  comment: string;
  locationNote: string;
  isScheduledOrder: boolean;
  scheduledFor: string;
  onCommentChange: (value: string) => void;
  onLocationNoteChange: (value: string) => void;
  onIsScheduledOrderChange: (value: boolean) => void;
  onScheduledForChange: (value: string) => void;
  onIncrement: (itemId: string) => void;
  onDecrement: (itemId: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  total: number;
};

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
      {children}
    </p>
  );
}

export default function PremiumCheckout({
  open,
  onClose,
  cart,
  comment,
  locationNote,
  isScheduledOrder,
  scheduledFor,
  onCommentChange,
  onLocationNoteChange,
  onIsScheduledOrderChange,
  onScheduledForChange,
  onIncrement,
  onDecrement,
  onSubmit,
  isSubmitting,
  total,
}: PremiumCheckoutProps) {
  if (!open) {
    return null;
  }

  function handleSubmit() {
    if (!locationNote.trim()) {
      window.Telegram?.WebApp.showAlert("Вкажіть номер столика або будиночка.");
      return;
    }

    if (isScheduledOrder) {
      if (!scheduledFor) {
        window.Telegram?.WebApp.showAlert("Оберіть час подачі замовлення.");
        return;
      }

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

    onSubmit();
  }

  function setOrderTiming(scheduled: boolean) {
    onIsScheduledOrderChange(scheduled);
    if (scheduled && !scheduledFor) {
      onScheduledForChange(minScheduledDateTimeLocal());
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Закрити"
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="animate-sheet-up relative flex max-h-[92vh] flex-col overflow-hidden rounded-t-[28px] border border-zinc-800/50 bg-zinc-900 shadow-2xl">
        <div className="mx-auto mt-3 h-1 w-12 shrink-0 rounded-full bg-zinc-700" />

        <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-amber-500/80">
              Оформлення
            </p>
            <h2 className="text-lg font-semibold text-zinc-100">Ваше замовлення</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-800/50 bg-zinc-800 px-3 py-1 text-sm text-zinc-400"
          >
            Закрити
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
          {cart.length === 0 ? (
            <EmptyStateScreen
              variant="cart"
              title="Ваш кошик сумує"
              subtitle="Додайте кілька страв, щоб ми почали готувати магію"
              onGoToMenu={onClose}
            />
          ) : (
            <>
              <section className="mb-5">
                <SectionTitle>Кошик</SectionTitle>
                <ul className="space-y-2">
                  {cart.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-800/50 bg-zinc-950 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-zinc-100">
                          {item.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {formatPrice(item.price)} × {item.quantity} ={" "}
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                      <QuantityControl
                        quantity={item.quantity}
                        hideAdd
                        onAdd={() => onIncrement(item.id)}
                        onIncrement={() => onIncrement(item.id)}
                        onDecrement={() => onDecrement(item.id)}
                      />
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mb-5 space-y-3">
                <SectionTitle>Деталі</SectionTitle>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-zinc-400">
                    Стіл / будиночок *
                  </span>
                  <input
                    type="text"
                    value={locationNote}
                    onChange={(event) => onLocationNoteChange(event.target.value)}
                    placeholder="Наприклад: Будиночок 7"
                    className="w-full rounded-xl border border-zinc-800/50 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm text-zinc-400">
                    Коментар
                  </span>
                  <textarea
                    value={comment}
                    onChange={(event) => onCommentChange(event.target.value)}
                    placeholder="Поб побажання, алергії..."
                    rows={2}
                    className="w-full resize-none rounded-xl border border-zinc-800/50 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20"
                  />
                </label>
              </section>

              <section className="mb-5">
                <SectionTitle>Час подачі</SectionTitle>
                <div className="grid grid-cols-2 gap-2 rounded-2xl border border-zinc-800/50 bg-zinc-950 p-1">
                  <button
                    type="button"
                    onClick={() => setOrderTiming(false)}
                    className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      !isScheduledOrder
                        ? "bg-amber-500 text-amber-950"
                        : "text-zinc-400"
                    }`}
                  >
                    Зараз
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderTiming(true)}
                    className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      isScheduledOrder
                        ? "bg-amber-500 text-amber-950"
                        : "text-zinc-400"
                    }`}
                  >
                    Наперед
                  </button>
                </div>

                {isScheduledOrder ? (
                  <label className="mt-3 block">
                    <span className="mb-1.5 block text-sm text-zinc-400">
                      Оберіть час
                    </span>
                    <input
                      type="datetime-local"
                      value={scheduledFor}
                      min={minScheduledDateTimeLocal()}
                      onChange={(event) =>
                        onScheduledForChange(event.target.value)
                      }
                      className="w-full rounded-xl border border-zinc-800/50 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20"
                    />
                    <p className="mt-1.5 text-xs text-zinc-500">
                      «Готуємо» почнеться автоматично за 1 год до подачі
                    </p>
                  </label>
                ) : null}
              </section>
            </>
          )}
        </div>

        {cart.length > 0 ? (
          <div className="shrink-0 border-t border-zinc-800/50 bg-zinc-900 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="w-full rounded-2xl bg-amber-500 px-4 py-3.5 text-sm font-semibold text-amber-950 transition disabled:opacity-50"
            >
              {isSubmitting
                ? "Відправка..."
                : `Оформити замовлення на ${formatPrice(total)}`}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
