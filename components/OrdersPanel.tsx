"use client";

import EmptyStateScreen from "@/components/EmptyStateScreen";
import {
  ChatIcon,
  ClockIcon,
  LocationIcon,
} from "@/components/HeaderIcons";
import OrderStatusSkeleton from "@/components/OrderStatusSkeleton";
import OrderStepper from "@/components/OrderStepper";
import HouseBillCard from "@/components/HouseBillCard";
import HouseBillSkeleton from "@/components/HouseBillSkeleton";
import SessionHistoryAccordion from "@/components/SessionHistoryAccordion";
import { formatPrice } from "@/components/ImagePlaceholder";
import { formatOrderDateTime, type TrackedOrder } from "@/lib/orderStatus";
import type { RunningTabData } from "@/lib/runningTab";
import { formatOrderLocationDisplay } from "@/lib/startParamLocation";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import {
  buildSheetPanelTransform,
  useSheetPresence,
} from "@/lib/useSheetPresence";
import { useSwipeToDismissSheet } from "@/lib/useSwipeToDismissSheet";
import type { CSSProperties, ReactNode } from "react";

type OrdersPanelProps = {
  open: boolean;
  onClose: () => void;
  orders: TrackedOrder[];
  selectedOrderId: string | null;
  onSelectOrder: (orderId: string) => void;
  onDismissCancelledOrder?: (orderId: string) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  runningTab?: RunningTabData | null;
  runningTabLoading?: boolean;
  onChangeHouse?: (cabinNumber: number) => Promise<void>;
  changeHouseBusy?: boolean;
};

const chipBase =
  "shrink-0 rounded-2xl border px-4 py-2 text-sm font-medium transition active:scale-[0.98]";
const chipActive =
  "border-brand-accent/50 bg-brand-accent/15 text-stone-50 shadow-[inset_0_0_0_1px_rgba(201,165,116,0.25)]";
const chipInactive = "border-stone-600/25 bg-brand-input text-brand-muted";

function DetailIconTile({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-accent/10 text-brand-accent ring-1 ring-brand-accent/15">
      {children}
    </span>
  );
}

function DetailRow({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-stone-300">
      <DetailIconTile>{icon}</DetailIconTile>
      <span className="min-w-0">{children}</span>
    </div>
  );
}

export default function OrdersPanel({
  open,
  onClose,
  orders,
  selectedOrderId,
  onSelectOrder,
  onDismissCancelledOrder,
  loading = false,
  error = null,
  onRetry,
  runningTab = null,
  runningTabLoading = false,
  onChangeHouse,
  changeHouseBusy = false,
}: OrdersPanelProps) {
  const { mounted, visible } = useSheetPresence(open);
  const { dragOffset, isDragging, swipeAreaProps } = useSwipeToDismissSheet(onClose);

  useBodyScrollLock(open);

  if (!mounted) {
    return null;
  }

  const selectedOrder =
    orders.find((order) => order.id === selectedOrderId) || orders[0] || null;
  const isEmptyState = !loading && !error && !selectedOrder;

  const historyOrders =
    runningTab?.orders.filter((order) => order.id !== selectedOrder?.id) || [];

  const panelStyle: CSSProperties = {
    ...buildSheetPanelTransform(0, dragOffset, isDragging),
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-end transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <button
        type="button"
        aria-label="Закрити"
        className="absolute inset-0 bg-brand-overlay backdrop-blur-md"
        onClick={onClose}
      />

      <div
        style={panelStyle}
        className={`sheet-panel sheet-panel-motion relative flex max-h-[92vh] flex-col overflow-hidden rounded-t-[32px] border shadow-2xl ${
          visible ? "is-visible" : ""
        }`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(196,165,116,0.1),transparent_65%)]" />

        <div className="shrink-0 touch-pan-y" {...swipeAreaProps}>
          <div className="sheet-handle relative mx-auto mt-3 h-1 w-12 rounded-full" />

          {!isEmptyState ? (
            <div className="relative flex items-start justify-between px-5 pb-2 pt-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-brand-accent/75">
                  Мої замовлення
                </p>
                <h2 className="mt-1 text-xl font-semibold text-stone-50">
                  Статус замовлення
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

          {runningTabLoading && !runningTab ? (
            <HouseBillSkeleton className="mx-5" />
          ) : runningTab && onChangeHouse ? (
            <HouseBillCard
              className="mx-5"
              data={runningTab}
              onChangeHouse={onChangeHouse}
              busy={changeHouseBusy}
            />
          ) : null}

          {orders.length > 1 ? (
            <div className="scrollbar-hide flex gap-2 overflow-x-auto px-5 pb-3">
              {orders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => onSelectOrder(order.id)}
                  className={`${chipBase} ${
                    selectedOrder?.id === order.id ? chipActive : chipInactive
                  }`}
                >
                  {formatOrderDateTime(order.createdAt)}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div
          className={`min-h-0 flex-1 overflow-y-auto px-5 ${
            isEmptyState ? "pb-8 pt-2" : "pb-8 pt-1"
          }`}
        >
          {loading && orders.length === 0 ? (
            <OrderStatusSkeleton />
          ) : error && orders.length === 0 ? (
            <div className="rounded-[24px] border border-red-400/20 bg-red-400/5 px-6 py-8 text-center">
              <p className="text-sm text-red-100">{error}</p>
              {onRetry ? (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-4 rounded-xl border border-stone-600/25 bg-brand-surface-elevated px-4 py-2 text-sm text-brand-muted"
                >
                  Спробувати знову
                </button>
              ) : null}
            </div>
          ) : selectedOrder ? (
            <div className="space-y-5">
              <OrderStepper
                order={selectedOrder}
                onDismissCancelled={
                  onDismissCancelledOrder
                    ? () => onDismissCancelledOrder(selectedOrder.id)
                    : undefined
                }
              />

              <div className="rounded-[24px] border border-stone-600/20 bg-brand-input p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-brand-muted">
                  Деталі замовлення
                </p>
                <div className="mt-3 space-y-2.5">
                  <DetailRow icon={<LocationIcon />}>
                    {formatOrderLocationDisplay(
                      selectedOrder.locationNote,
                      selectedOrder.tableNumber
                    )}
                  </DetailRow>
                  {selectedOrder.scheduledFor ? (
                    <DetailRow icon={<ClockIcon />}>
                      Подача: {formatOrderDateTime(selectedOrder.scheduledFor)}
                    </DetailRow>
                  ) : null}
                  {selectedOrder.comment ? (
                    <DetailRow icon={<ChatIcon />}>
                      <span className="text-brand-muted">{selectedOrder.comment}</span>
                    </DetailRow>
                  ) : null}
                </div>
                <ul className="mt-4 space-y-2 border-t border-stone-600/20 pt-4">
                  {selectedOrder.cart.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start justify-between gap-3 text-sm text-stone-300"
                    >
                      <span className="min-w-0 flex-1 leading-snug">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="shrink-0 whitespace-nowrap tabular-nums">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center justify-between border-t border-stone-600/20 pt-4">
                  <span className="text-sm text-brand-muted">Разом</span>
                  <span className="text-lg font-semibold text-brand-accent">
                    {formatPrice(selectedOrder.total)}
                  </span>
                </div>
              </div>

              {runningTab ? (
                <SessionHistoryAccordion orders={historyOrders} />
              ) : null}
            </div>
          ) : (
            <EmptyStateScreen
              title="Немає активних замовлень"
              subtitle="Оформіть замовлення з меню — трекер з'явиться одразу після відправки"
              onGoToMenu={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
