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
import {
  buildSheetPanelTransform,
  useSheetPresence,
} from "@/lib/useSheetPresence";
import { useSwipeToDismissSheet } from "@/lib/useSwipeToDismissSheet";
import Lottie from "lottie-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

const LOTTIE_BASE_PATH = "/azhunebi-menu";
const SUCCESS_CLOSE_MS = 2500;

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
  onSubmit: () => Promise<void>;
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

const HOUSES = Array.from({ length: 12 }, (_, i) => `Будинок ${i + 1}`);

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
  const { mounted, visible } = useSheetPresence(open);
  const { dragOffset, isDragging, swipeAreaProps } = useSwipeToDismissSheet(onClose);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState<object | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  useBodyScrollLock(mounted);

  useEffect(() => {
    fetch(`${LOTTIE_BASE_PATH}/yes.json`)
      .then((r) => r.json())
      .then((data) => setSuccessAnimation(data))
      .catch(() => setSuccessAnimation(null));
  }, []);

  useEffect(() => {
    if (!open) setShowSuccess(false);
  }, [open]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  if (!mounted) {
    return null;
  }

  async function handleSubmit() {
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

    try {
      await onSubmit();
      setShowSuccess(true);
      closeTimerRef.current = window.setTimeout(() => {
        onClose();
      }, SUCCESS_CLOSE_MS);
    } catch {
      // errors are surfaced by submitOrder via Telegram alert
    }
  }

  function setOrderTiming(scheduled: boolean) {
    onIsScheduledOrderChange(scheduled);
    if (scheduled && !scheduledFor) {
      onScheduledForChange(minScheduledDateTimeLocal());
    }
  }

  const panelStyle: CSSProperties = {
    ...buildSheetPanelTransform(0, dragOffset, isDragging),
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <button
        type="button"
        aria-label="Закрити"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div
        style={panelStyle}
        className={`sheet-panel sheet-panel-motion relative flex w-full max-h-[90vh] flex-col overflow-hidden rounded-t-[28px] border shadow-2xl sm:max-w-md ${
          visible ? "is-visible" : ""
        }`}
      >
        <div className="shrink-0 touch-pan-y" {...swipeAreaProps}>
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

        <div className="checkout-form-scroll min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-none px-4 py-4">
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

              <section className="mb-5">
                <SectionTitle>В якому будинку ви проживаєте?</SectionTitle>
                <div className="grid grid-cols-4 gap-2">
                  {HOUSES.map((house) => (
                    <button
                      key={house}
                      type="button"
                      onClick={() => onLocationNoteChange(house)}
                      className={`rounded-2xl border py-2.5 text-sm font-medium transition active:scale-[0.98] ${
                        locationNote === house
                          ? "border-brand-accent/50 bg-brand-accent/15 text-stone-50 shadow-[inset_0_0_0_1px_rgba(201,165,116,0.25)]"
                          : "border-stone-600/25 bg-brand-input text-brand-muted"
                      }`}
                    >
                      {house.replace("Будинок ", "")}
                    </button>
                  ))}
                </div>
                {locationNote ? (
                  <p className="mt-2 text-xs text-brand-muted">
                    Обрано: <span className="text-stone-200">{locationNote}</span>
                  </p>
                ) : null}
              </section>

              <section>
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
          <div className="shrink-0 border-t border-stone-600/20 bg-brand-surface p-4 pb-safe">
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

        {showSuccess ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-surface px-6 text-center">
            {successAnimation ? (
              <Lottie
                animationData={successAnimation}
                loop={false}
                className="mx-auto h-[min(68vw,280px)] w-[min(68vw,280px)] animate-sheet-up drop-shadow-2xl"
              />
            ) : (
              <div className="mx-auto h-[min(68vw,280px)] w-[min(68vw,280px)] animate-sheet-up rounded-full bg-brand-accent/15" />
            )}
            <p className="mt-3 animate-sheet-up text-2xl font-bold tracking-tight text-stone-50">
              Є! Чекайте на підтвердження!
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
