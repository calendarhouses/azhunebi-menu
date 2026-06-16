"use client";

import EmptyStateScreen from "@/components/EmptyStateScreen";
import { CheckoutIcon } from "@/components/HeaderIcons";
import { formatPrice } from "@/components/ImagePlaceholder";
import QuantityControl from "@/components/QuantityControl";
import ScheduledDateTimePicker from "@/components/ScheduledDateTimePicker";
import type { CartItem } from "@/lib/cart";
import {
  minScheduledDateTimeLocal,
  validateScheduledDateTimeLocal,
} from "@/lib/orderStatus";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import { useKeyboardFieldScroll } from "@/lib/useKeyboardFieldScroll";
import {
  useSheetPresence,
  useStableSheetHeight,
} from "@/lib/useSheetPresence";
import { useSwipeToDismissSheet } from "@/lib/useSwipeToDismissSheet";
import type { CSSProperties, ReactNode } from "react";
import { useRef } from "react";

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
    <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-brand-muted">
      {children}
    </p>
  );
}

const inputClassName =
  "w-full rounded-xl border border-stone-600/25 bg-brand-input px-4 py-3 text-sm text-stone-100 placeholder:text-stone-500 outline-none focus:border-brand-accent/40 focus:ring-1 focus:ring-brand-accent/20";

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const { mounted, visible } = useSheetPresence(open);
  const maxHeight = useStableSheetHeight(mounted);
  const { sheetStyle, swipeAreaProps } = useSwipeToDismissSheet(onClose);
  const { keyboardInset, handleFieldFocus, handleFieldBlur } =
    useKeyboardFieldScroll(mounted && cart.length > 0, scrollRef);

  useBodyScrollLock(mounted);

  if (!mounted) {
    return null;
  }

  function handleSubmit() {
    if (!locationNote.trim()) {
      window.Telegram?.WebApp.showAlert("Вкажіть, в якому будинку ви проживаєте.");
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

  const panelStyle: CSSProperties = {
    ...sheetStyle,
    maxHeight,
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Закрити"
        className={`sheet-overlay absolute inset-0 bg-brand-overlay backdrop-blur-sm ${
          visible ? "is-visible" : ""
        }`}
        onClick={onClose}
      />

      <div
        style={panelStyle}
        className={`sheet-panel sheet-panel-motion fixed inset-x-0 bottom-0 flex flex-col overflow-hidden rounded-t-[28px] border shadow-2xl ${
          visible ? "is-visible" : ""
        }`}
      >
        <div className="shrink-0 touch-pan-y" {...swipeAreaProps}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(196,165,116,0.1),transparent_70%)]" />
          <div className="sheet-handle relative mx-auto mt-3 h-1 w-12 shrink-0 rounded-full" />

          {cart.length > 0 ? (
            <div className="relative flex items-center justify-between px-5 pb-3 pt-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-accent/12 text-brand-accent ring-1 ring-brand-accent/20">
                  <CheckoutIcon />
                </span>
                <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-stone-50">
                  Ваше замовлення
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-stone-600/25 bg-brand-surface-elevated/70 px-3 py-1.5 text-sm text-brand-muted"
              >
                Закрити
              </button>
            </div>
          ) : null}
        </div>

        <div
          ref={scrollRef}
          className={`relative min-h-0 flex-1 overscroll-contain ${
            cart.length === 0 ? "overflow-hidden" : "overflow-y-auto px-5 pb-4"
          }`}
          style={
            keyboardInset > 0
              ? { paddingBottom: `${keyboardInset + 24}px` }
              : undefined
          }
        >
          {cart.length === 0 ? (
            <EmptyStateScreen
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
                      className="flex items-center justify-between gap-3 rounded-2xl border border-stone-600/20 bg-brand-input px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-stone-50">
                          {item.name}
                        </p>
                        <p className="text-xs text-brand-muted">
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
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-brand-muted">
                    В якому будинку ви проживаєте?
                  </span>
                  <input
                    type="text"
                    value={locationNote}
                    onChange={(event) => onLocationNoteChange(event.target.value)}
                    onFocus={(event) => handleFieldFocus(event.currentTarget)}
                    onBlur={handleFieldBlur}
                    placeholder="Будиночок 7"
                    className={inputClassName}
                  />
                </label>

                <label className="block">
                  <SectionTitle>Коментар</SectionTitle>
                  <textarea
                    value={comment}
                    onChange={(event) => onCommentChange(event.target.value)}
                    onFocus={(event) => handleFieldFocus(event.currentTarget)}
                    onBlur={handleFieldBlur}
                    placeholder="Побажання, алергії..."
                    rows={2}
                    className={`${inputClassName} resize-none`}
                  />
                </label>
              </section>

              <section className="mb-5">
                <SectionTitle>Час подачі</SectionTitle>
                <div className="grid grid-cols-2 gap-2 rounded-2xl border border-stone-600/20 bg-brand-input p-1">
                  <button
                    type="button"
                    onClick={() => setOrderTiming(false)}
                    className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-300 ${
                      !isScheduledOrder
                        ? "bg-brand-accent text-brand-accent-text"
                        : "text-brand-muted"
                    }`}
                  >
                    Якнайшвидше
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderTiming(true)}
                    className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-300 ${
                      isScheduledOrder
                        ? "bg-brand-accent text-brand-accent-text"
                        : "text-brand-muted"
                    }`}
                  >
                    Запланувати
                  </button>
                </div>

                <div
                  className={`grid transition-[grid-template-rows,margin-top,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isScheduledOrder
                      ? "mt-4 grid-rows-[1fr] opacity-100"
                      : "mt-0 grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <ScheduledDateTimePicker
                      value={scheduledFor}
                      onChange={onScheduledForChange}
                    />
                  </div>
                </div>
              </section>
            </>
          )}
        </div>

        {cart.length > 0 ? (
          <div className="relative shrink-0 border-t border-stone-600/20 bg-brand-surface px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="btn-accent w-full rounded-2xl px-4 py-3.5 text-sm font-semibold transition disabled:opacity-50"
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
