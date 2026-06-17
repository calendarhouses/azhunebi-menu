"use client";

import { formatPrice } from "@/components/ImagePlaceholder";
import DishImage from "@/components/DishImage";
import { formatAllergens, formatWeight } from "@/lib/branding";
import type { MenuItemRow } from "@/lib/supabase";
import { triggerImpact, triggerSuccess } from "@/lib/haptic";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import {
  useSheetPresence,
  useStableSheetHeight,
} from "@/lib/useSheetPresence";
import { useSwipeToDismissSheet } from "@/lib/useSwipeToDismissSheet";
import Lottie from "lottie-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

const LOTTIE_BASE_PATH = "/azhunebi-menu";
const SUCCESS_CLOSE_MS = 3000;

type DishModalProps = {
  item: MenuItemRow | null;
  quantity: number;
  onClose: () => void;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
};

export default function DishModal({
  item,
  quantity,
  onClose,
  onAdd,
  onIncrement,
  onDecrement,
}: DishModalProps) {
  const open = Boolean(item);
  const { mounted, visible } = useSheetPresence(open);
  const maxHeight = useStableSheetHeight(mounted);
  const { sheetStyle, swipeAreaProps } = useSwipeToDismissSheet(onClose);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState<object | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  useBodyScrollLock(mounted);

  useEffect(() => {
    if (!open) {
      setShowSuccess(false);
    }
  }, [open]);

  useEffect(() => {
    setShowSuccess(false);
  }, [item?.id]);

  useEffect(() => {
    let cancelled = false;

    fetch(`${LOTTIE_BASE_PATH}/yes.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load success animation");
        }
        return response.json();
      })
      .then((data) => {
        if (!cancelled) {
          setSuccessAnimation(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSuccessAnimation(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const handleDone = useCallback(() => {
    triggerSuccess();
    setShowSuccess(true);

    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = window.setTimeout(() => {
      onClose();
    }, SUCCESS_CLOSE_MS);
  }, [onClose]);

  if (!mounted || !item) {
    return null;
  }

  const panelStyle: CSSProperties = {
    ...sheetStyle,
    maxHeight,
  };

  return (
    <div className="fixed inset-0 z-[55]">
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
        <div
          className={`relative transition-opacity duration-300 ${
            showSuccess ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <div
            className="relative aspect-[16/10] shrink-0 touch-pan-y overflow-hidden rounded-t-[28px]"
            {...swipeAreaProps}
          >
            {item.image_url ? (
              <DishImage
                src={item.image_url}
                alt={item.name}
                large
                className="h-full w-full object-cover"
              />
            ) : (
              <DishImage src="" alt={item.name} large className="h-full w-full" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-surface via-brand-surface/20 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center">
              <div className="sheet-handle h-1 w-12 rounded-full shadow-sm" />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-full border border-stone-600/25 bg-brand-bg/70 px-3 py-1 text-sm text-stone-100 backdrop-blur-sm"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2.5 px-5 pt-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                {item.category ? (
                  <p className="mb-0.5 text-xs font-medium uppercase tracking-[0.18em] text-brand-accent/90">
                    {item.category}
                  </p>
                ) : null}
                <h2 className="text-2xl font-semibold text-stone-50">{item.name}</h2>
              </div>
              <span className="shrink-0 rounded-full border border-stone-600/25 bg-brand-surface-elevated px-3 py-1.5 text-base font-medium text-stone-50">
                {formatPrice(item.price)}
              </span>
            </div>

            {item.description ? (
              <p className="text-sm leading-6 text-brand-muted">{item.description}</p>
            ) : (
              <p className="text-sm leading-6 text-brand-muted">
                Смачна страва від нашого шеф-кухаря
              </p>
            )}

            {(formatWeight(item.weight_g) || formatAllergens(item.allergens)) && (
              <div className="flex flex-wrap gap-2 pt-0.5">
                {formatWeight(item.weight_g) ? (
                  <span className="rounded-full border border-stone-600/25 bg-brand-input px-3 py-1 text-xs text-brand-muted">
                    ⚖ {formatWeight(item.weight_g)}
                  </span>
                ) : null}
                {formatAllergens(item.allergens) ? (
                  <span className="rounded-full border border-brand-accent/20 bg-brand-accent/10 px-3 py-1 text-xs text-brand-accent">
                    ⚠ {formatAllergens(item.allergens)}
                  </span>
                ) : null}
              </div>
            )}
          </div>

          <div className="mt-4 space-y-3 border-t border-stone-600/20 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
            {quantity === 0 ? (
              <button
                type="button"
                onClick={() => {
                  triggerImpact("medium");
                  onAdd();
                }}
                className="btn-accent w-full rounded-2xl px-4 py-3.5 text-sm font-semibold transition active:scale-[0.98]"
              >
                Додати до замовлення
              </button>
            ) : (
              <>
                <div className="flex items-center justify-between rounded-2xl border border-brand-accent/20 bg-brand-accent/10 p-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerImpact("light");
                      onDecrement();
                    }}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-input text-xl font-semibold text-brand-accent"
                  >
                    −
                  </button>
                  <div className="text-center">
                    <p className="text-xs uppercase tracking-wide text-brand-muted">
                      У кошику
                    </p>
                    <p className="text-lg font-semibold text-stone-50">{quantity}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      triggerImpact("light");
                      onIncrement();
                    }}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-accent text-xl font-semibold text-brand-accent-text"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleDone}
                  className="btn-accent w-full rounded-2xl px-4 py-3.5 text-sm font-semibold transition active:scale-[0.98]"
                >
                  Готово
                </button>
              </>
            )}
          </div>
        </div>

        {showSuccess ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-surface px-6 text-center">
            {successAnimation ? (
              <Lottie
                animationData={successAnimation}
                loop={false}
                className="mx-auto h-[min(68vw,300px)] w-[min(68vw,300px)] animate-sheet-up drop-shadow-2xl"
              />
            ) : (
              <div className="mx-auto h-[min(68vw,300px)] w-[min(68vw,300px)] animate-sheet-up rounded-full bg-brand-accent/15" />
            )}
            <p className="mt-3 animate-sheet-up text-4xl font-bold tracking-tight text-stone-50">
              Записав!
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
