"use client";

import OrderStepper from "@/components/OrderStepper";
import { formatPrice } from "@/components/ImagePlaceholder";
import { formatOrderDateTime, type TrackedOrder } from "@/lib/orderStatus";

type OrdersPanelProps = {
  open: boolean;
  onClose: () => void;
  orders: TrackedOrder[];
  selectedOrderId: string | null;
  onSelectOrder: (orderId: string) => void;
  toastMessage: string | null;
  onDismissToast: () => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

export default function OrdersPanel({
  open,
  onClose,
  orders,
  selectedOrderId,
  onSelectOrder,
  toastMessage,
  onDismissToast,
  loading = false,
  error = null,
  onRetry,
}: OrdersPanelProps) {
  if (!open) {
    return null;
  }

  const selectedOrder =
    orders.find((order) => order.id === selectedOrderId) || orders[0] || null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Закрити"
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="animate-sheet-up relative max-h-[92vh] overflow-hidden rounded-t-[32px] border border-white/10 bg-[#0a120e] shadow-2xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.16),transparent_65%)]" />

        {toastMessage ? (
          <div className="animate-toast-in relative mx-4 mt-4 flex items-start justify-between gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3">
            <p className="text-sm font-medium text-amber-100">{toastMessage}</p>
            <button
              type="button"
              onClick={onDismissToast}
              className="text-sm text-amber-100/70"
            >
              ✕
            </button>
          </div>
        ) : null}

        <div className="relative mx-auto mt-3 h-1 w-12 rounded-full bg-white/20" />

        <div className="relative flex items-start justify-between px-5 pb-3 pt-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-400/70">
              Мої замовлення
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              {selectedOrder
                ? `Замовлення ${selectedOrder.id.slice(0, 8)}`
                : "Статус замовлення"}
            </h2>
            <p className="mt-1 text-sm text-white/45">
              Оновлення кожні кілька секунд, поки апп відкритий
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm text-white/70"
          >
            Закрити
          </button>
        </div>

        {orders.length > 1 ? (
          <div className="relative flex gap-2 overflow-x-auto px-5 pb-4">
            {orders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => onSelectOrder(order.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${
                  selectedOrder?.id === order.id
                    ? "bg-amber-400 text-[#0a120e]"
                    : "border border-white/10 bg-white/[0.04] text-white/70"
                }`}
              >
                {formatOrderDateTime(order.createdAt)} · {formatPrice(order.total)}
              </button>
            ))}
          </div>
        ) : null}

        <div className="relative max-h-[58vh] overflow-y-auto px-5 pb-8">
          {loading ? (
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-6 py-12 text-center text-white/60">
              Завантаження статусу...
            </div>
          ) : error ? (
            <div className="rounded-[24px] border border-red-400/20 bg-red-400/5 px-6 py-8 text-center">
              <p className="text-sm text-red-100">{error}</p>
              {onRetry ? (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-sm"
                >
                  Спробувати знову
                </button>
              ) : null}
            </div>
          ) : selectedOrder ? (
            <div className="space-y-5">
              <OrderStepper order={selectedOrder} />

              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-white/40">
                  Деталі
                </p>
                <div className="mt-3 space-y-2 text-sm text-white/70">
                  <p>📍 {selectedOrder.locationNote || "—"}</p>
                  {selectedOrder.scheduledFor ? (
                    <p>🕐 Подача: {formatOrderDateTime(selectedOrder.scheduledFor)}</p>
                  ) : null}
                  {selectedOrder.comment ? (
                    <p className="text-white/55">💬 {selectedOrder.comment}</p>
                  ) : null}
                </div>
                <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
                  {selectedOrder.cart.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between text-sm text-white/70"
                    >
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-sm text-white/45">Разом</span>
                  <span className="text-lg font-semibold text-amber-300">
                    {formatPrice(selectedOrder.total)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-6 py-12 text-center">
              <p className="text-base text-white/75">Активних замовлень немає</p>
              <p className="mt-2 text-sm text-white/40">
                Оформіть замовлення з меню — трекер з&apos;явиться одразу після
                відправки
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
