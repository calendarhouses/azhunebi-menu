"use client";

import AdminBottomSheet from "@/components/AdminBottomSheet";
import AdminSessionsSkeleton from "@/components/AdminSessionsSkeleton";
import { formatPrice } from "@/components/ImagePlaceholder";
import {
  adminCheckOutSession,
  adminLoadSessionDetail,
  adminLoadSessionsDashboard,
  adminMoveOrderToHouse,
} from "@/lib/adminApi";
import type { CabinDashboardCard, SessionDetailData } from "@/lib/runningTab";
import { formatOrderDateTime } from "@/lib/orderStatus";
import { triggerImpact, triggerSuccess } from "@/lib/haptic";
import { useCallback, useEffect, useRef, useState } from "react";

const POLL_MS = 5000;

type Props = {
  onStatus: (message: string) => void;
};

export default function AdminSessionsTab({ onStatus }: Props) {
  const [cabins, setCabins] = useState<CabinDashboardCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCabin, setSelectedCabin] = useState<CabinDashboardCard | null>(
    null
  );
  const [detail, setDetail] = useState<SessionDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [moveOrderId, setMoveOrderId] = useState<string | null>(null);
  const loadedOnceRef = useRef(false);

  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const data = await adminLoadSessionsDashboard();
      setCabins(data.cabins || []);
      loadedOnceRef.current = true;
    } catch (err) {
      if (!silent || !loadedOnceRef.current) {
        setError(
          err instanceof Error ? err.message : "Не вдалося завантажити рахунки"
        );
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  const loadDetail = useCallback(async (sessionId: string, silent = false) => {
    if (!silent) {
      setDetailLoading(true);
    }

    try {
      const data = await adminLoadSessionDetail(sessionId);
      setDetail({
        session: data.session,
        confirmedTotal: data.confirmedTotal,
        pendingTotal: data.pendingTotal,
        orders: data.orders,
        guestCount: data.guestCount,
      });
    } catch (err) {
      onStatus(
        err instanceof Error ? err.message : "Не вдалося завантажити сесію"
      );
    } finally {
      if (!silent) {
        setDetailLoading(false);
      }
    }
  }, [onStatus]);

  useEffect(() => {
    void loadDashboard();
    const timer = window.setInterval(() => {
      void loadDashboard(true);
    }, POLL_MS);

    return () => window.clearInterval(timer);
  }, [loadDashboard]);

  useEffect(() => {
    if (!selectedCabin?.session?.id) {
      setDetail(null);
      return;
    }

    void loadDetail(selectedCabin.session.id);

    const timer = window.setInterval(() => {
      if (selectedCabin.session?.id) {
        void loadDetail(selectedCabin.session.id, true);
      }
    }, POLL_MS);

    return () => window.clearInterval(timer);
  }, [selectedCabin, loadDetail]);

  async function handleCheckOut() {
    if (!detail?.session?.id) {
      return;
    }

    if (
      !window.confirm(
        `Розрахувати гостей у ${detail.session.cabinLabel}? Рахунок буде закрито.`
      )
    ) {
      return;
    }

    setBusy(true);
    triggerImpact("medium");

    try {
      await adminCheckOutSession(detail.session.id);
      triggerSuccess();
      onStatus("Рахунок закрито, гостям надіслано повідомлення");
      setSelectedCabin(null);
      setDetail(null);
      await loadDashboard();
    } catch (err) {
      onStatus(
        err instanceof Error ? err.message : "Не вдалося закрити рахунок"
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleMoveOrder(orderId: string, cabinNumber: number) {
    if (!detail?.session?.id) {
      return;
    }

    setBusy(true);

    try {
      const data = await adminMoveOrderToHouse({
        orderId,
        cabinNumber,
        sessionId: detail.session.id,
      });

      setDetail({
        session: data.session,
        confirmedTotal: data.confirmedTotal,
        pendingTotal: data.pendingTotal,
        orders: data.orders,
        guestCount: data.guestCount,
      });
      setMoveOrderId(null);
      onStatus(`Замовлення перенесено до Будинку ${cabinNumber}`);
      await loadDashboard(true);
    } catch (err) {
      onStatus(
        err instanceof Error ? err.message : "Не вдалося перенести замовлення"
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading && cabins.length === 0) {
    return <AdminSessionsSkeleton />;
  }

  return (
    <div className="max-w-5xl">
      {error ? (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cabins.map((cabin) => {
          const active = Boolean(cabin.session);
          const total = cabin.confirmedTotal + cabin.pendingTotal;

          return (
            <button
              key={cabin.cabinNumber}
              type="button"
              onClick={() => {
                if (cabin.session) {
                  setSelectedCabin(cabin);
                }
              }}
              className={`rounded-2xl border p-4 text-left transition active:scale-[0.99] ${
                active
                  ? "border-brand-accent/30 bg-gradient-to-br from-brand-surface-elevated to-brand-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  : "border-white/10 bg-brand-surface"
              } ${!active ? "opacity-80" : "hover:border-brand-accent/40"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-stone-100">
                  {cabin.cabinLabel}
                </p>
                {active ? (
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                ) : null}
              </div>

              <p className="mt-3 text-2xl font-bold text-brand-accent">
                {active ? `${total.toLocaleString("uk-UA")} ₴` : "—"}
              </p>

              <p className="mt-1 text-xs text-brand-muted">
                {active
                  ? `${cabin.orderCount} замовл.`
                  : "Вільний"}
              </p>
            </button>
          );
        })}
      </div>

      <AdminBottomSheet
        open={Boolean(selectedCabin?.session)}
        onClose={() => {
          setSelectedCabin(null);
          setMoveOrderId(null);
        }}
        title={selectedCabin?.cabinLabel || "Рахунок"}
      >
        {detailLoading && !detail ? (
          <div className="space-y-3 py-2" aria-hidden>
            <div className="h-10 animate-pulse rounded-xl bg-brand-surface-elevated" />
            <div className="h-24 animate-pulse rounded-xl bg-brand-surface-elevated" />
            <div className="h-24 animate-pulse rounded-xl bg-brand-surface-elevated" />
          </div>
        ) : detail ? (
          <div className="space-y-5 pb-6">
            <div className="rounded-2xl border border-white/10 bg-brand-input p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-brand-muted">
                Поточний рахунок
              </p>
              <p className="mt-2 text-3xl font-bold text-stone-50">
                {formatPrice(detail.confirmedTotal + detail.pendingTotal)}
              </p>
              {detail.pendingTotal > 0 ? (
                <p className="mt-1 text-sm text-brand-muted">
                  з них {formatPrice(detail.pendingTotal)} в обробці
                </p>
              ) : null}
              <p className="mt-2 text-xs text-brand-muted">
                Гостей у рахунку: {detail.guestCount}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.18em] text-brand-muted">
                Замовлення
              </p>

              {detail.orders.length === 0 ? (
                <p className="text-sm text-brand-muted">Замовлень ще немає</p>
              ) : (
                detail.orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-white/10 bg-brand-surface p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-stone-100">
                          {formatOrderDateTime(order.createdAt)}
                        </p>
                        <p className="mt-1 text-xs text-brand-muted">
                          {order.statusLabel}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-brand-accent">
                        {formatPrice(order.total)}
                      </p>
                    </div>

                    <div className="mt-3 space-y-1 border-t border-white/10 pt-3 text-sm text-stone-300">
                      {order.cart.map((line) => (
                        <p key={`${order.id}-${line.id}`}>
                          {line.name} ×{line.quantity}
                        </p>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        setMoveOrderId((current) =>
                          current === order.id ? null : order.id
                        )
                      }
                      className="mt-3 text-xs font-medium text-brand-accent/90 underline-offset-2 hover:underline disabled:opacity-50"
                    >
                      Перенести на інший будинок
                    </button>

                    {moveOrderId === order.id ? (
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {Array.from({ length: 12 }, (_, index) => index + 1).map(
                          (house) => (
                            <button
                              key={house}
                              type="button"
                              disabled={busy || house === detail.session.cabinNumber}
                              onClick={() => handleMoveOrder(order.id, house)}
                              className="rounded-lg border border-white/10 bg-brand-input px-2 py-2 text-xs font-semibold text-stone-200 disabled:opacity-40"
                            >
                              {house}
                            </button>
                          )
                        )}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={handleCheckOut}
              className="btn-accent w-full rounded-2xl py-4 text-base font-bold shadow-[0_12px_32px_rgba(196,165,116,0.22)] disabled:opacity-50"
            >
              {busy ? "Обробка…" : "Розрахувати / Виселити"}
            </button>
          </div>
        ) : null}
      </AdminBottomSheet>
    </div>
  );
}
