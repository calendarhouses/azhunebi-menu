"use client";

import AdminArchiveSwipeRow from "@/components/AdminArchiveSwipeRow";
import AdminBottomSheet from "@/components/AdminBottomSheet";
import AdminConfirmDialog from "@/components/AdminConfirmDialog";
import AdminSessionsSkeleton from "@/components/AdminSessionsSkeleton";
import { formatPrice } from "@/components/ImagePlaceholder";
import {
  adminCancelOrder,
  adminCheckOutSession,
  adminDeleteClosedSession,
  adminLoadClosedSessionsArchive,
  adminLoadSessionDetail,
  adminLoadSessionsDashboard,
  adminMoveOrderToHouse,
} from "@/lib/adminApi";
import {
  formatCabinDisplay,
  formatOrderLocationDisplay,
} from "@/lib/startParamLocation";
import type {
  CabinDashboardCard,
  ClosedSessionArchiveItem,
  SessionDetailData,
} from "@/lib/runningTab";
import { formatOrderDateTime } from "@/lib/orderStatus";
import { triggerImpact, triggerSuccess } from "@/lib/haptic";
import { ArrowRightLeft, Home } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const POLL_MS = 5000;

type ViewMode = "active" | "archive";

type ConfirmAction =
  | { type: "checkout" }
  | { type: "cancel"; orderId: string }
  | { type: "deleteArchive"; sessionId: string };

type Props = {
  onStatus: (message: string) => void;
};

function formatArchiveDate(isoDate?: string | null) {
  if (!isoDate) {
    return "—";
  }

  return new Date(isoDate).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminSessionsTab({ onStatus }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("active");
  const [cabins, setCabins] = useState<CabinDashboardCard[]>([]);
  const [archive, setArchive] = useState<ClosedSessionArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCabin, setSelectedCabin] = useState<CabinDashboardCard | null>(
    null
  );
  const [selectedArchiveId, setSelectedArchiveId] = useState<string | null>(
    null
  );
  const [detail, setDetail] = useState<SessionDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [moveOrderId, setMoveOrderId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const loadedOnceRef = useRef(false);

  const isReadOnly =
    detail?.session.status === "closed" || viewMode === "archive";

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

  const loadArchive = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const data = await adminLoadClosedSessionsArchive();
      setArchive(data.sessions || []);
      loadedOnceRef.current = true;
    } catch (err) {
      if (!silent || !loadedOnceRef.current) {
        setError(
          err instanceof Error ? err.message : "Не вдалося завантажити архів"
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
        checkoutBlocked: data.checkoutBlocked,
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
    if (viewMode === "active") {
      void loadDashboard();
      const timer = window.setInterval(() => {
        void loadDashboard(true);
      }, POLL_MS);
      return () => window.clearInterval(timer);
    }

    void loadArchive();
    return undefined;
  }, [viewMode, loadDashboard, loadArchive]);

  useEffect(() => {
    const sessionId =
      viewMode === "active"
        ? selectedCabin?.session?.id
        : selectedArchiveId;

    if (!sessionId) {
      setDetail(null);
      return;
    }

    void loadDetail(sessionId);

    if (viewMode !== "active") {
      return undefined;
    }

    const timer = window.setInterval(() => {
      void loadDetail(sessionId, true);
    }, POLL_MS);

    return () => window.clearInterval(timer);
  }, [selectedCabin, selectedArchiveId, viewMode, loadDetail]);

  function openCheckOutConfirm() {
    if (!detail?.session?.id || isReadOnly) {
      return;
    }

    if (detail.checkoutBlocked) {
      onStatus(
        "Неможливо розрахувати: є замовлення, які ще очікують або готуються."
      );
      return;
    }

    setConfirmAction({ type: "checkout" });
  }

  async function executeCheckOut() {
    if (!detail?.session?.id) {
      return;
    }

    setBusy(true);
    triggerImpact("medium");

    try {
      await adminCheckOutSession(detail.session.id);
      triggerSuccess();
      onStatus("Рахунок закрито, гостям надіслано повідомлення");
      setConfirmAction(null);
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
    if (!detail?.session?.id || isReadOnly) {
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
        checkoutBlocked: data.checkoutBlocked,
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

  function openCancelConfirm(orderId: string) {
    if (!detail?.session?.id || isReadOnly) {
      return;
    }

    setConfirmAction({ type: "cancel", orderId });
  }

  async function executeCancelOrder(orderId: string) {
    if (!detail?.session?.id) {
      return;
    }

    setBusy(true);
    triggerImpact("medium");

    try {
      // Uses bot handleOrderCallback("cancel") — same as Telegram inline button.
      const data = await adminCancelOrder({
        orderId,
        sessionId: detail.session.id,
      });

      setDetail({
        session: data.session,
        confirmedTotal: data.confirmedTotal,
        pendingTotal: data.pendingTotal,
        orders: data.orders,
        guestCount: data.guestCount,
        checkoutBlocked: data.checkoutBlocked,
      });
      setConfirmAction(null);
      onStatus("Замовлення видалено");
      await loadDashboard(true);
    } catch (err) {
      onStatus(
        err instanceof Error ? err.message : "Не вдалося видалити замовлення"
      );
    } finally {
      setBusy(false);
    }
  }

  async function executeDeleteArchive(sessionId: string) {
    setBusy(true);

    try {
      await adminDeleteClosedSession(sessionId);

      if (selectedArchiveId === sessionId) {
        closeSheet();
      }

      setConfirmAction(null);
      setOpenSwipeId(null);
      triggerSuccess();
      onStatus("Архівний рахунок видалено");
      await loadArchive(true);
    } catch (err) {
      onStatus(
        err instanceof Error ? err.message : "Не вдалося видалити рахунок"
      );
    } finally {
      setBusy(false);
    }
  }

  function handleConfirmDialog() {
    if (!confirmAction) {
      return;
    }

    if (confirmAction.type === "checkout") {
      void executeCheckOut();
      return;
    }

    if (confirmAction.type === "deleteArchive") {
      void executeDeleteArchive(confirmAction.sessionId);
      return;
    }

    void executeCancelOrder(confirmAction.orderId);
  }

  function closeSheet() {
    setSelectedCabin(null);
    setSelectedArchiveId(null);
    setMoveOrderId(null);
    setOpenSwipeId(null);
    setDetail(null);
  }

  const sheetOpen =
    viewMode === "active"
      ? Boolean(selectedCabin?.session)
      : Boolean(selectedArchiveId);

  const sheetTitle =
    viewMode === "active"
      ? selectedCabin?.cabinLabel || "Рахунок"
      : detail?.session.cabinLabel || "Архів";

  if (loading && cabins.length === 0 && archive.length === 0) {
    return <AdminSessionsSkeleton />;
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-4 inline-flex rounded-xl bg-white/5 p-1">
        {(
          [
            ["active", "Активні"],
            ["archive", "Архів розрахунків"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setViewMode(id);
              closeSheet();
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              viewMode === id
                ? "bg-brand-surface-elevated text-brand-accent shadow-sm"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {viewMode === "active" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cabins.map((cabin) => {
            const total = cabin.confirmedTotal + cabin.pendingTotal;
            const active =
              Boolean(cabin.session) && (cabin.orderCount > 0 || total > 0);

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
                    {formatCabinDisplay(cabin.cabinLabel, cabin.cabinNumber)}
                  </p>
                  {active ? (
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  ) : null}
                </div>

                <p className="mt-3 text-2xl font-bold text-brand-accent">
                  {active
                    ? `${cabin.confirmedTotal.toLocaleString("uk-UA")} ₴`
                    : "—"}
                </p>

                {active && cabin.pendingTotal > 0 ? (
                  <p className="mt-0.5 text-xs text-brand-muted">
                    +{cabin.pendingTotal.toLocaleString("uk-UA")} ₴ в обробці
                  </p>
                ) : null}

                <p className="mt-1 text-xs text-brand-muted">
                  {active ? `${cabin.orderCount} замовл.` : "Вільний"}
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {archive.length === 0 ? (
            <p className="py-8 text-center text-sm text-brand-muted">
              Закритих рахунків ще немає
            </p>
          ) : (
            archive.map((item) => (
              <AdminArchiveSwipeRow
                key={item.id}
                open={openSwipeId === item.id}
                onOpenChange={(open) => {
                  setOpenSwipeId(open ? item.id : null);
                }}
                onPress={() => setSelectedArchiveId(item.id)}
                onDelete={() => {
                  setConfirmAction({ type: "deleteArchive", sessionId: item.id });
                }}
              >
                <div className="flex w-full items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-stone-100">
                      {formatCabinDisplay(item.cabinLabel, item.cabinNumber)}
                    </p>
                    <p className="mt-0.5 text-xs text-brand-muted">
                      Розраховано: {formatArchiveDate(item.closedAt)}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-brand-accent">
                    {item.finalTotal != null
                      ? `${item.finalTotal.toLocaleString("uk-UA")} ₴`
                      : "—"}
                  </p>
                </div>
              </AdminArchiveSwipeRow>
            ))
          )}
        </div>
      )}

      <AdminBottomSheet open={sheetOpen} onClose={closeSheet} title={sheetTitle}>
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
                {isReadOnly ? "Фінальний рахунок" : "Поточний рахунок"}
              </p>
              <p className="mt-2 text-3xl font-bold whitespace-nowrap text-stone-50">
                {isReadOnly
                  ? formatPrice(
                      detail.session.finalTotal ??
                        detail.session.closedTotal ??
                        detail.confirmedTotal
                    )
                  : formatPrice(detail.confirmedTotal)}
              </p>
              {!isReadOnly && detail.pendingTotal > 0 ? (
                <p className="mt-1 text-sm text-brand-muted">
                  +{formatPrice(detail.pendingTotal)} в обробці
                </p>
              ) : null}
              {isReadOnly ? (
                <p className="mt-2 text-xs text-brand-muted">
                  Закрито: {formatArchiveDate(detail.session.closedAt)}
                </p>
              ) : (
                <p className="mt-2 text-xs text-brand-muted">
                  Гостей у рахунку: {detail.guestCount}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.18em] text-brand-muted">
                Замовлення
              </p>

              {detail.orders.length === 0 ? (
                <p className="text-sm text-brand-muted">Замовлень немає</p>
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
                          {order.userFirstName || "Гість"} · {order.statusLabel}
                          {order.locationNote || order.tableNumber
                            ? ` · ${formatOrderLocationDisplay(
                                order.locationNote,
                                order.tableNumber
                              )}`
                            : ""}
                        </p>
                        {order.scheduledFor ? (
                          <p className="mt-1 text-xs text-brand-accent/90">
                            Подача: {formatOrderDateTime(order.scheduledFor)}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-brand-muted/70">
                            Якнайшвидше
                          </p>
                        )}
                      </div>
                      <p className="shrink-0 whitespace-nowrap text-sm font-bold tabular-nums text-brand-accent">
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

                    {!isReadOnly && order.status !== "cancelled" ? (
                      <>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              setMoveOrderId((current) =>
                                current === order.id ? null : order.id
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-brand-input px-3 py-2 text-xs font-semibold text-stone-200 transition hover:border-brand-accent/30 disabled:opacity-50"
                          >
                            <span
                              className="inline-flex items-center gap-0.5 text-brand-accent"
                              aria-hidden
                            >
                              <Home className="h-3.5 w-3.5" strokeWidth={1.75} />
                              <ArrowRightLeft className="h-3 w-3" strokeWidth={2} />
                            </span>
                            Перенести
                          </button>

                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => openCancelConfirm(order.id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/15 disabled:opacity-50"
                          >
                            Видалити
                          </button>
                        </div>

                        {moveOrderId === order.id ? (
                          <div className="mt-3 grid grid-cols-4 gap-2">
                            {Array.from({ length: 12 }, (_, index) => index + 1).map(
                              (house) => (
                                <button
                                  key={house}
                                  type="button"
                                  disabled={
                                    busy || house === detail.session.cabinNumber
                                  }
                                  onClick={() => handleMoveOrder(order.id, house)}
                                  className="rounded-lg border border-white/10 bg-brand-input px-2 py-2 text-xs font-semibold text-stone-200 disabled:opacity-40"
                                >
                                  {house}
                                </button>
                              )
                            )}
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                ))
              )}
            </div>

            {!isReadOnly ? (
              <button
                type="button"
                disabled={busy || Boolean(detail.checkoutBlocked)}
                onClick={openCheckOutConfirm}
                className="btn-accent w-full rounded-2xl py-4 text-base font-bold shadow-[0_12px_32px_rgba(196,165,116,0.22)] disabled:opacity-50"
              >
                {busy ? "Обробка…" : "Розрахувати / Виселити"}
              </button>
            ) : null}
          </div>
        ) : null}
      </AdminBottomSheet>

      <AdminConfirmDialog
        open={confirmAction !== null}
        title={
          confirmAction?.type === "checkout"
            ? "Розрахувати гостей?"
            : confirmAction?.type === "deleteArchive"
              ? "Видалити архівний рахунок?"
              : "Видалити замовлення?"
        }
        description={
          confirmAction?.type === "checkout" ? (
            <>
              Розрахувати гостей у{" "}
              <span className="font-medium text-stone-200">
                {detail?.session
                  ? formatCabinDisplay(
                      detail.session.cabinLabel,
                      detail.session.cabinNumber
                    )
                  : ""}
              </span>
              ? Рахунок буде закрито, гостям надійде повідомлення.
            </>
          ) : confirmAction?.type === "deleteArchive" ? (
            <>
              Видалити архівний рахунок{" "}
              <span className="font-medium text-stone-200">
                {(() => {
                  const item = archive.find(
                    (entry) => entry.id === confirmAction.sessionId
                  );
                  return item
                    ? formatCabinDisplay(item.cabinLabel, item.cabinNumber)
                    : "";
                })()}
              </span>
              ? Цю дію не можна скасувати.
            </>
          ) : (
            "Сума автоматично зникне з рахунку будинку. Гість отримає сповіщення про скасування."
          )
        }
        confirmLabel={
          confirmAction?.type === "checkout"
            ? "Розрахувати"
            : confirmAction?.type === "deleteArchive"
              ? "Видалити"
              : "Видалити"
        }
        cancelLabel="Назад"
        destructive={
          confirmAction?.type === "cancel" ||
          confirmAction?.type === "deleteArchive"
        }
        confirmBusy={busy}
        onClose={() => {
          if (!busy) {
            setConfirmAction(null);
          }
        }}
        onConfirm={handleConfirmDialog}
      />
    </div>
  );
}
