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
};

export default function OrdersPanel({
  open,
  onClose,
  orders,
  selectedOrderId,
  onSelectOrder,
  toastMessage,
  onDismissToast,
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
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="animate-sheet-up relative max-h-[90vh] overflow-hidden rounded-t-[28px] border border-white/10 bg-[#101812] shadow-2xl">
        {toastMessage ? (
          <div className="animate-toast-in mx-4 mt-4 flex items-start justify-between gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3">
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

        <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-white/20" />

        <div className="flex items-center justify-between px-5 pb-3 pt-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-amber-400/70">
              Мої замовлення
            </p>
            <h2 className="text-lg font-semibold text-white">
              {selectedOrder ? `№ ${selectedOrder.id.slice(0, 8)}` : "Немає активних"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/70"
          >
            Закрити
          </button>
        </div>

        {orders.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto px-5 pb-4">
            {orders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => onSelectOrder(order.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm ${
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

        <div className="max-h-[58vh] overflow-y-auto px-5 pb-6">
          {selectedOrder ? (
            <div className="space-y-5">
              <OrderStepper order={selectedOrder} />

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-wide text-white/40">
                  Деталі
                </p>
                <p className="mt-2 text-sm text-white/70">
                  📍 {selectedOrder.locationNote || "—"}
                </p>
                {selectedOrder.scheduledFor ? (
                  <p className="mt-1 text-sm text-white/70">
                    🕐 Подача: {formatOrderDateTime(selectedOrder.scheduledFor)}
                  </p>
                ) : null}
                {selectedOrder.comment ? (
                  <p className="mt-1 text-sm text-white/55">
                    💬 {selectedOrder.comment}
                  </p>
                ) : null}
                <ul className="mt-3 space-y-1 border-t border-white/10 pt-3">
                  {selectedOrder.cart.map((item) => (
                    <li key={item.id} className="text-sm text-white/65">
                      {item.name} × {item.quantity}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-base font-semibold text-amber-300">
                  {formatPrice(selectedOrder.total)}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center">
              <p className="text-white/70">Активних замовлень немає</p>
              <p className="mt-2 text-sm text-white/40">
                Оформіть замовлення з меню — статус з&apos;явиться тут
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
