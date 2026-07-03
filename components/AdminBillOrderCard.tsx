"use client";

import { formatPrice } from "@/components/ImagePlaceholder";
import {
  adminCancelOrder,
  adminSettleOrderLine,
  adminUpdateOrderCart,
} from "@/lib/adminApi";
import {
  getLineOpenQuantity,
  getLineOpenTotal,
  getOrderFullTotal,
  getOrderOpenTotal,
  isOrderFullySettled,
  normalizeCart,
} from "@/lib/billCart";
import type { OrderCartLine, TrackedOrder } from "@/lib/orderStatus";
import { triggerImpact, triggerSuccess } from "@/lib/haptic";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

type Props = {
  order: TrackedOrder;
  sessionId: string;
  disabled?: boolean;
  onDetailChange: (
    detail: Awaited<ReturnType<typeof adminUpdateOrderCart>>
  ) => void;
  onStatus: (message: string) => void;
};

const lineActionBase =
  "inline-flex h-9 items-center justify-center rounded-xl border text-xs font-semibold transition disabled:opacity-50";

export default function AdminBillOrderCard({
  order,
  sessionId,
  disabled = false,
  onDetailChange,
  onStatus,
}: Props) {
  const [busy, setBusy] = useState(false);
  const openTotal = getOrderOpenTotal(order.cart);
  const fullTotal = getOrderFullTotal(order.cart);
  const fullySettled = isOrderFullySettled(order.cart);

  async function persistCart(nextCart: OrderCartLine[]) {
    setBusy(true);
    triggerImpact("light");

    try {
      const detail = await adminUpdateOrderCart({
        orderId: order.id,
        sessionId,
        cart: nextCart,
      });
      onDetailChange(detail);
      onStatus("Рахунок оновлено");
    } catch (error) {
      onStatus(
        error instanceof Error ? error.message : "Не вдалося оновити рахунок"
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleQuantityChange(lineIndex: number, delta: number) {
    const cart = normalizeCart(order.cart).map((line) => ({ ...line }));
    const line = cart[lineIndex];
    if (!line) {
      return;
    }

    const nextQuantity = line.quantity + delta;
    if (nextQuantity <= 0) {
      await handleRemoveLine(lineIndex);
      return;
    }

    line.quantity = nextQuantity;
    if (line.settledQuantity && line.settledQuantity > nextQuantity) {
      line.settledQuantity = nextQuantity;
    }

    await persistCart(cart);
  }

  async function handleRemoveLine(lineIndex: number) {
    const cart = normalizeCart(order.cart).map((line) => ({ ...line }));

    if (!cart[lineIndex]) {
      return;
    }

    if (cart.length === 1) {
      setBusy(true);
      triggerImpact("medium");

      try {
        const detail = await adminCancelOrder({
          orderId: order.id,
          sessionId,
        });
        onDetailChange(detail);
        onStatus("Замовлення видалено");
      } catch (error) {
        onStatus(
          error instanceof Error ? error.message : "Не вдалося видалити замовлення"
        );
      } finally {
        setBusy(false);
      }
      return;
    }

    cart.splice(lineIndex, 1);
    await persistCart(cart);
    onStatus("Страву видалено");
  }

  async function handleSettleLine(lineIndex: number) {
    setBusy(true);
    triggerImpact("medium");

    try {
      const detail = await adminSettleOrderLine({
        orderId: order.id,
        sessionId,
        lineIndex,
      });
      triggerSuccess();
      onDetailChange(detail);
      onStatus("Позицію розраховано");
    } catch (error) {
      onStatus(
        error instanceof Error ? error.message : "Не вдалося розрахувати позицію"
      );
    } finally {
      setBusy(false);
    }
  }

  const lines = normalizeCart(order.cart);
  const cardBusy = disabled || busy;

  return (
    <div
      className={`rounded-xl border bg-brand-surface p-4 ${
        fullySettled ? "border-emerald-400/20 opacity-80" : "border-white/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-stone-100">
            {order.userFirstName || "Гість"}
          </p>
          {fullySettled ? (
            <p className="mt-1 text-xs text-emerald-300/90">Усе розраховано</p>
          ) : (
            <p className="mt-1 text-xs text-brand-muted">
              До оплати: {formatPrice(openTotal)}
              {openTotal !== fullTotal ? ` · всього ${formatPrice(fullTotal)}` : ""}
            </p>
          )}
        </div>
        <p className="shrink-0 whitespace-nowrap text-sm font-bold tabular-nums text-brand-accent">
          {formatPrice(openTotal > 0 ? openTotal : fullTotal)}
        </p>
      </div>

      <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
        {lines.map((line, lineIndex) => {
          const openQuantity = getLineOpenQuantity(line);
          const openAmount = getLineOpenTotal(line);
          const settled = openQuantity === 0;

          return (
            <div
              key={`${order.id}-${line.id}-${lineIndex}`}
              className={`rounded-xl border px-3 py-2.5 ${
                settled
                  ? "border-emerald-400/15 bg-emerald-400/5"
                  : "border-white/10 bg-brand-input/60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      settled
                        ? "text-stone-400 line-through"
                        : "text-stone-100"
                    }`}
                  >
                    {line.name}
                  </p>
                  <p className="mt-1 text-xs text-brand-muted">
                    {formatPrice(line.price)} × {line.quantity}
                  </p>
                </div>
                <p
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    settled ? "text-stone-500" : "text-brand-accent"
                  }`}
                >
                  {formatPrice(settled ? line.quantity * line.price : openAmount)}
                </p>
              </div>

              {!disabled ? (
                <div className="@container mt-2.5 flex flex-nowrap items-stretch gap-2">
                  <div className="inline-flex h-9 shrink-0 items-stretch rounded-xl border border-white/10 bg-brand-surface">
                    <button
                      type="button"
                      disabled={cardBusy}
                      onClick={() => void handleQuantityChange(lineIndex, -1)}
                      className="flex h-full items-center justify-center px-2.5 text-brand-muted transition hover:text-stone-100 disabled:opacity-40"
                      aria-label="Зменшити кількість"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="flex min-w-7 items-center justify-center text-sm font-medium tabular-nums text-stone-100">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={cardBusy}
                      onClick={() => void handleQuantityChange(lineIndex, 1)}
                      className="flex h-full items-center justify-center px-2.5 text-brand-muted transition hover:text-stone-100 disabled:opacity-40"
                      aria-label="Збільшити кількість"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {openQuantity > 0 ? (
                    <button
                      type="button"
                      disabled={cardBusy}
                      onClick={() => void handleSettleLine(lineIndex)}
                      className={`${lineActionBase} min-w-0 flex-1 shrink truncate border-brand-accent/30 bg-brand-accent/10 px-2 text-brand-accent hover:bg-brand-accent/15 @[300px]:px-3`}
                    >
                      Розрахувати
                      {openQuantity < line.quantity
                        ? ` ×${openQuantity}`
                        : ""}
                    </button>
                  ) : (
                    <span className="inline-flex h-9 min-w-0 flex-1 items-center justify-center truncate px-1 text-xs font-medium text-emerald-300/90">
                      Розраховано
                    </span>
                  )}

                  <button
                    type="button"
                    disabled={cardBusy}
                    onClick={() => void handleRemoveLine(lineIndex)}
                    aria-label="Видалити страву"
                    className={`${lineActionBase} w-9 shrink-0 gap-0 border-red-400/25 bg-red-500/10 px-0 text-red-300 hover:bg-red-500/15 @[300px]:w-auto @[300px]:gap-1.5 @[300px]:px-3`}
                  >
                    <Trash2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                    <span className="hidden @[300px]:inline">Видалити</span>
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
