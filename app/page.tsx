"use client";

import OrdersPanel from "@/components/OrdersPanel";
import FloatingCartBar from "@/components/FloatingCartBar";
import PremiumCheckout from "@/components/PremiumCheckout";
import CategoryBar from "@/components/CategoryBar";
import DishCard from "@/components/DishCard";
import DishModal from "@/components/DishModal";
import ErrorState from "@/components/ErrorState";
import MenuHeader from "@/components/MenuHeader";
import { useAppReady } from "@/components/AppReadyProvider";
import {
  attachOrderScreenshot,
  changeGuestHouseRequest,
  createOrderRequest,
  fetchActiveOrders,
  fetchHouseBinding,
  fetchOrderById,
  fetchRunningTab,
  isTelegramWebApp,
} from "@/lib/ordersApi";
import {
  readDismissedOrderIds,
  readKnownOrderIds,
  rememberDismissedOrderId,
  rememberOrderId,
} from "@/lib/orderStorage";
import {
  getStatusChangeMessage,
  dateTimeLocalToIso,
  type OrderStatus,
  type TrackedOrder,
} from "@/lib/orderStatus";
import { getCartCount, getCartTotal, type CartItem } from "@/lib/cart";
import { captureOrderCard } from "@/lib/orderCardCapture";
import { formatOrderLocationDisplay } from "@/lib/startParamLocation";
import { triggerError, triggerImpact, triggerSuccess } from "@/lib/haptic";
import { useCartStorage } from "@/lib/useCartStorage";
import { useStartParamLocation } from "@/lib/useStartParamLocation";
import { useTelegramApp } from "@/lib/useTelegramApp";
import type { HouseBinding, RunningTabData } from "@/lib/runningTab";
import type { MenuItemRow } from "@/lib/supabase";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const ORDER_POLL_MS = 5000;
const ORPHAN_CANCEL_THRESHOLD = 3;

type CategoryFilter = string | "all";

export default function Home() {
  const {
    items,
    categories,
    logoUrl,
    showAdminLink,
    menuLoadError: loadError,
    refreshMenu,
  } = useAppReady();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<MenuItemRow | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderToast, setOrderToast] = useState<string | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [inTelegram, setInTelegram] = useState(false);
  const [runningTab, setRunningTab] = useState<RunningTabData | null>(null);
  const [runningTabLoading, setRunningTabLoading] = useState(false);
  const [changeHouseBusy, setChangeHouseBusy] = useState(false);
  const [houseBinding, setHouseBinding] = useState<HouseBinding | null>(null);

  const {
    cart,
    setCart,
    comment,
    setComment,
    locationNote,
    setLocationNote,
    isScheduledOrder,
    setIsScheduledOrder,
    scheduledFor,
    setScheduledFor,
    clearStoredCart,
    hydrated: cartHydrated,
  } = useCartStorage();

  const { startParamLocation, startParamReady } = useStartParamLocation();

  const isSubmittingRef = useRef(false);
  const orderJustSubmittedRef = useRef(false);
  const cartRef = useRef(cart);
  const commentRef = useRef(comment);
  const locationNoteRef = useRef(locationNote);
  const isScheduledOrderRef = useRef(isScheduledOrder);
  const scheduledForRef = useRef(scheduledFor);
  const startParamLocationRef = useRef(startParamLocation);
  const ordersRef = useRef<TrackedOrder[]>([]);
  const ordersLoadedOnceRef = useRef(false);
  const orphanMissCountsRef = useRef<Map<string, number>>(new Map());
  const prevRunningConfirmedRef = useRef(0);

  cartRef.current = cart;
  commentRef.current = comment;
  locationNoteRef.current = locationNote;
  isScheduledOrderRef.current = isScheduledOrder;
  scheduledForRef.current = scheduledFor;
  startParamLocationRef.current = startParamLocation;
  ordersRef.current = orders;

  const showOrdersLink = inTelegram || orders.length > 0;

  const cartTotal = useMemo(() => getCartTotal(cart), [cart]);
  const cartCount = useMemo(() => getCartCount(cart), [cart]);

  const cartQuantities = useMemo(() => {
    return cart.reduce<Record<string, number>>((acc, item) => {
      acc[item.id] = item.quantity;
      return acc;
    }, {});
  }, [cart]);

  const handleDismissCancelledOrder = useCallback((orderId: string) => {
    rememberDismissedOrderId(orderId);
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    setOrdersOpen(false);
  }, []);

  const refreshHouseBinding = useCallback(async () => {
    if (!isTelegramWebApp()) {
      setHouseBinding(null);
      return null;
    }

    try {
      const binding = await fetchHouseBinding();
      setHouseBinding(binding);

      if (binding) {
        setLocationNote(binding.cabinLabel);
      }

      return binding;
    } catch (error) {
      console.error("[house-binding] refresh failed", error);
      return null;
    }
  }, [setLocationNote]);

  const handleCheckoutClose = useCallback(() => {
    setCartOpen(false);
    if (orderJustSubmittedRef.current) {
      orderJustSubmittedRef.current = false;
      clearStoredCart();
      void refreshHouseBinding();
      setOrdersOpen(true);
    }
  }, [clearStoredCart, refreshHouseBinding]);

  const handleBack = useCallback(() => {
    if (ordersOpen) {
      setOrdersOpen(false);
      return;
    }
    if (cartOpen) {
      setCartOpen(false);
      return;
    }
    setSelectedDish(null);
  }, [cartOpen, ordersOpen]);

  useTelegramApp({
    backVisible: ordersOpen || cartOpen || Boolean(selectedDish),
    onBack: handleBack,
  });

  const syncOrders = useCallback(
    async (options?: {
      openPanel?: boolean;
      focusOrderId?: string;
      silent?: boolean;
    }) => {
      if (!window.Telegram?.WebApp?.initData) {
        setInTelegram(false);
        return;
      }

      setInTelegram(true);

      const silent = options?.silent ?? ordersLoadedOnceRef.current;

      if (!silent) {
        setOrdersLoading(true);
        setRunningTabLoading(true);
        setOrdersError(null);
      }

      try {
        const [allFetchedOrders, runningTabData] = await Promise.all([
          fetchActiveOrders(),
          fetchRunningTab(),
        ]);

        if (
          runningTabData &&
          runningTabData.confirmedTotal > prevRunningConfirmedRef.current &&
          prevRunningConfirmedRef.current > 0
        ) {
          triggerImpact("light");
        }

        prevRunningConfirmedRef.current = runningTabData?.confirmedTotal ?? 0;
        setRunningTab(runningTabData);

        if (runningTabData) {
          setHouseBinding({
            sessionId: runningTabData.sessionId,
            cabinNumber: runningTabData.cabinNumber,
            cabinLabel: runningTabData.cabinLabel,
          });
          setLocationNote(runningTabData.cabinLabel);
        } else {
          setHouseBinding(null);
        }
        const dismissedIds = readDismissedOrderIds();
        let activeOrders = allFetchedOrders.filter(
          (order) => !(order.status === "cancelled" && dismissedIds.has(order.id))
        );
        const activeById = new Map(activeOrders.map((o) => [o.id, o]));

        // Recover known orders missing from list (e.g. after reopening the app).
        const knownIds = readKnownOrderIds();
        const missingKnown = knownIds.filter(
          (id) => !activeById.has(id) && !dismissedIds.has(id)
        );
        if (missingKnown.length > 0) {
          const recovered = await Promise.all(
            missingKnown.slice(0, 8).map((id) => fetchOrderById(id))
          );
          for (const order of recovered) {
            if (order && !activeById.has(order.id)) {
              activeById.set(order.id, order);
            }
          }
          activeOrders = [...activeById.values()];
        }

        // If an in-progress order vanishes from the API repeatedly, treat as cancelled.
        const IN_PROGRESS_STATUSES = new Set(["pending", "accepted", "preparing"]);
        const trackedIds = new Set(ordersRef.current.map((o) => o.id));

        for (const id of trackedIds) {
          const order = ordersRef.current.find((o) => o.id === id);
          if (
            !order ||
            !IN_PROGRESS_STATUSES.has(order.status) ||
            activeById.has(id) ||
            dismissedIds.has(id)
          ) {
            orphanMissCountsRef.current.delete(id);
            continue;
          }

          orphanMissCountsRef.current.set(
            id,
            (orphanMissCountsRef.current.get(id) || 0) + 1
          );
        }

        const cancelledOrphans = ordersRef.current
          .filter(
            (o) =>
              IN_PROGRESS_STATUSES.has(o.status) &&
              !activeById.has(o.id) &&
              !dismissedIds.has(o.id) &&
              (orphanMissCountsRef.current.get(o.id) || 0) >=
                ORPHAN_CANCEL_THRESHOLD
          )
          .map((o) => ({ ...o, status: "cancelled" as const }));

        const nextOrders = [...activeOrders, ...cancelledOrphans];

        const previousById = new Map(
          ordersRef.current.map((order) => [order.id, order.status])
        );

        for (const order of nextOrders) {
          const previousStatus = previousById.get(order.id);
          if (!previousStatus || previousStatus === order.status) {
            continue;
          }

          const message = getStatusChangeMessage(
            previousStatus as OrderStatus,
            order.status
          );

          if (message) {
            setOrderToast(message);
            triggerSuccess();
          }
        }

        setOrders((prev) => {
          const prevById = new Map(prev.map((order) => [order.id, order]));
          const nextById = new Map(nextOrders.map((order) => [order.id, order]));

          const updatedNext = nextOrders.map((next) => {
            const existing = prevById.get(next.id);

            if (
              existing &&
              existing.status === next.status &&
              existing.updatedAt === next.updatedAt &&
              existing.readyAt === next.readyAt
            ) {
              return existing;
            }

            return next;
          });

          // Also keep already-known cancelled orders that didn't come back from
          // either the active list or the individual fetch (e.g. race condition).
          const survivingCancelled = prev.filter(
            (order) =>
              order.status === "cancelled" &&
              !nextById.has(order.id) &&
              !dismissedIds.has(order.id)
          );

          return [...updatedNext, ...survivingCancelled];
        });

        ordersLoadedOnceRef.current = true;

        setSelectedOrderId((current) => {
          if (options?.focusOrderId) {
            return options.focusOrderId;
          }

          if (current && nextOrders.some((order) => order.id === current)) {
            return current;
          }

          return nextOrders[0]?.id ?? null;
        });

        if (options?.openPanel) {
          setOrdersOpen(true);
        }
      } catch (error) {
        if (!silent || ordersRef.current.length === 0) {
          setOrdersError(
            error instanceof Error
              ? error.message
              : "Не вдалося завантажити статус замовлення"
          );
        }
      } finally {
        if (!silent) {
          setOrdersLoading(false);
          setRunningTabLoading(false);
        }
      }
    },
    []
  );

  const handleChangeHouse = useCallback(
    async (cabinNumber: number) => {
      setChangeHouseBusy(true);

      try {
        const nextTab = await changeGuestHouseRequest(cabinNumber);
        setRunningTab(nextTab);
        if (nextTab) {
          setHouseBinding({
            sessionId: nextTab.sessionId,
            cabinNumber: nextTab.cabinNumber,
            cabinLabel: nextTab.cabinLabel,
          });
          setLocationNote(nextTab.cabinLabel);
        }
        prevRunningConfirmedRef.current = nextTab?.confirmedTotal ?? 0;
        triggerSuccess();
        await syncOrders({ silent: true });
      } catch (error) {
        triggerError();
        const webApp = window.Telegram?.WebApp;
        webApp?.showAlert?.(
          error instanceof Error
            ? error.message
            : "Не вдалося змінити номер будинку"
        );
        throw error;
      } finally {
        setChangeHouseBusy(false);
      }
    },
    [setLocationNote, syncOrders]
  );

  const fetchData = refreshMenu;

  useEffect(() => {
    void refreshMenu();
  }, [refreshMenu]);

  useEffect(() => {
    if (!cartHydrated || !startParamReady) {
      return;
    }

    void (async () => {
      const binding = isTelegramWebApp() ? await fetchHouseBinding() : null;

      if (binding) {
        setHouseBinding(binding);
        setLocationNote(binding.cabinLabel);
        return;
      }

      setHouseBinding(null);

      if (startParamLocation?.type === "cabin") {
        setLocationNote(startParamLocation.label);
      }
    })();
  }, [cartHydrated, startParamReady, startParamLocation, setLocationNote]);

  useEffect(() => {
    if (!cartOpen || !inTelegram) {
      return;
    }

    void refreshHouseBinding();
  }, [cartOpen, inTelegram, refreshHouseBinding]);

  useEffect(() => {
    if (activeCategory !== "all" && !categories.includes(activeCategory)) {
      setActiveCategory("all");
    }
  }, [activeCategory, categories]);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const boot = async () => {
      if (cancelled) {
        return;
      }

      if (!window.Telegram?.WebApp?.initData && attempts < 20) {
        attempts += 1;
        window.setTimeout(boot, 250);
        return;
      }

      setInTelegram(isTelegramWebApp());

      if (window.location.hash === "#orders") {
        setOrdersOpen(true);
        window.history.replaceState(null, "", window.location.pathname);
      }

      await syncOrders();
    };

    boot();

    return () => {
      cancelled = true;
    };
  }, [syncOrders]);

  useEffect(() => {
    if (!isTelegramWebApp()) {
      return;
    }

    const intervalId = window.setInterval(() => {
      syncOrders({ silent: true });
    }, ORDER_POLL_MS);

    return () => window.clearInterval(intervalId);
  }, [syncOrders]);

  const submitOrder = useCallback(async () => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp || isSubmittingRef.current) {
      return;
    }

    const currentCart = cartRef.current;
    if (currentCart.length === 0) {
      return;
    }

    if (!webApp.initData) {
      webApp.showAlert("Відкрийте меню через Telegram-бота.");
      return;
    }

    const currentLocation = locationNoteRef.current.trim();
    if (!currentLocation) {
      webApp.showAlert("Вкажіть номер столика або будиночка.");
      return;
    }

    let scheduledPayload: string | undefined;

    if (isScheduledOrderRef.current) {
      if (!scheduledForRef.current.trim()) {
        webApp.showAlert("Оберіть час подачі замовлення.");
        return;
      }

      try {
        scheduledPayload = dateTimeLocalToIso(scheduledForRef.current);
      } catch (error) {
        webApp.showAlert(
          error instanceof Error
            ? error.message
            : "Невірний час подачі замовлення."
        );
        return;
      }
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const tgUser = webApp.initDataUnsafe?.user;

      const result = await createOrderRequest({
        initData: webApp.initData,
        cart: currentCart.map((item) => ({
          id: item.id,
          quantity: item.quantity,
        })),
        comment: commentRef.current.trim() || undefined,
        locationNote: currentLocation,
        tableNumber:
          startParamLocationRef.current?.type === "table"
            ? startParamLocationRef.current.label
            : undefined,
        paymentMethod: "cash",
        scheduledFor: scheduledPayload,
      });

      rememberOrderId(result.orderId);
      if (result.order) {
        setOrders((prev) => {
          const rest = prev.filter((order) => order.id !== result.order.id);
          return [result.order, ...rest];
        });
      }

      setSelectedDish(null);
      triggerSuccess();
      orderJustSubmittedRef.current = true;

      // Card capture + admin notify run in background — user sees success immediately.
      const cardPayload = {
        guestName: tgUser?.first_name || "Гість",
        house: formatOrderLocationDisplay(
          currentLocation,
          startParamLocationRef.current?.type === "table"
            ? startParamLocationRef.current.label
            : null
        ),
        items: currentCart.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total: getCartTotal(currentCart),
        scheduledFor: scheduledPayload || null,
        comment: commentRef.current.trim() || null,
      };
      const initData = webApp.initData;
      const orderId = result.orderId;

      void captureOrderCard(cardPayload)
        .then(async (card) => {
          if (!card) return;
          await attachOrderScreenshot({ initData, orderId, screenshot: card });
        })
        .catch((error) => {
          console.error("[submitOrder] background card attach failed", error);
        });

      await syncOrders({
        focusOrderId: result.orderId as string,
        silent: true,
      });
    } catch (error) {
      triggerError();
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Не вдалося відправити замовлення. Спробуйте ще раз.";
      console.error("[submitOrder] order submission failed", error);
      webApp.showAlert(message);
      throw error;
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [syncOrders]);

  useEffect(() => {
    if (!orderToast) return;
    const id = window.setTimeout(() => setOrderToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [orderToast]);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp?.MainButton) {
      return;
    }

    webApp.MainButton.hide();
  }, []);

  const showFloatingCart =
    cartTotal > 0 && !cartOpen && !isSubmitting && !selectedDish;

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      return activeCategory === "all" || item.category === activeCategory;
    });
  }, [items, activeCategory]);

  const isItemVisible = useCallback(
    (item: MenuItemRow) =>
      activeCategory === "all" || item.category === activeCategory,
    [activeCategory]
  );

  function updateCart(updater: (prev: CartItem[]) => CartItem[]) {
    setCart(updater);
  }

  function addToCart(item: MenuItemRow) {
    triggerImpact("light");

    updateCart((prev) => {
      const existing = prev.find((cartItem) => cartItem.id === item.id);

      if (existing) {
        return prev.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }

      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
        },
      ];
    });
  }

  function incrementItem(itemId: string) {
    triggerImpact("light");

    updateCart((prev) =>
      prev.map((cartItem) =>
        cartItem.id === itemId
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      )
    );
  }

  function decrementItem(itemId: string) {
    triggerImpact("light");

    updateCart((prev) => {
      const target = prev.find((cartItem) => cartItem.id === itemId);
      if (!target) {
        return prev;
      }

      if (target.quantity <= 1) {
        return prev.filter((cartItem) => cartItem.id !== itemId);
      }

      return prev.map((cartItem) =>
        cartItem.id === itemId
          ? { ...cartItem, quantity: cartItem.quantity - 1 }
          : cartItem
      );
    });
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden overscroll-none bg-brand-bg text-stone-100">
      {orderToast ? (
        <div className="animate-toast-in fixed left-4 right-4 top-4 z-[100] flex items-start justify-between gap-3 rounded-2xl border border-brand-accent/25 bg-brand-surface/95 px-4 py-3 shadow-xl backdrop-blur-md">
          <p className="text-sm font-medium text-stone-100">{orderToast}</p>
          <button
            type="button"
            onClick={() => setOrderToast(null)}
            className="shrink-0 text-sm text-brand-muted"
          >
            ✕
          </button>
        </div>
      ) : null}

      <div className="shrink-0">
        <MenuHeader
          logoUrl={logoUrl}
          cartCount={cartCount}
          ordersCount={orders.length}
          showAdminLink={showAdminLink}
          showOrdersLink={showOrdersLink}
          onOpenOrders={() => {
            setOrdersOpen(true);
            syncOrders({ silent: ordersLoadedOnceRef.current });
          }}
          onOpenCart={() => setCartOpen(true)}
        />

        <CategoryBar
          categories={categories}
          activeCategory={activeCategory}
          onChange={setActiveCategory}
        />
      </div>

      <main
        className={`min-h-0 flex-1 overflow-y-auto overscroll-none touch-pan-y mx-auto w-full max-w-3xl px-4 py-5 ${showFloatingCart ? "pb-28" : "pb-12"}`}
      >
        {loadError ? (
          <ErrorState onRetry={fetchData} />
        ) : items.length > 0 ? (
          <>
            {filteredItems.length === 0 ? (
              <div className="rounded-2xl border border-stone-700/35 bg-brand-surface px-6 py-12 text-center">
                <p className="text-base text-stone-300">
                  У цій категорії поки немає страв
                </p>
                <p className="mt-2 text-sm text-brand-muted">
                  Спробуйте обрати іншу категорію
                </p>
              </div>
            ) : null}

            <div
              className={`flex flex-col gap-4 ${
                filteredItems.length === 0 ? "hidden" : ""
              }`}
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  className={isItemVisible(item) ? undefined : "hidden"}
                  aria-hidden={!isItemVisible(item)}
                >
                  <DishCard
                    item={item}
                    quantity={cartQuantities[item.id] ?? 0}
                    onOpen={() => setSelectedDish(item)}
                    onAdd={() => addToCart(item)}
                    onIncrement={() => incrementItem(item.id)}
                    onDecrement={() => decrementItem(item.id)}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-stone-700/35 bg-brand-surface px-6 py-12 text-center">
            <p className="text-base text-stone-300">Меню поки порожнє</p>
          </div>
        )}
      </main>

      <DishModal
        item={selectedDish}
        quantity={selectedDish ? cartQuantities[selectedDish.id] ?? 0 : 0}
        onClose={() => setSelectedDish(null)}
        onAdd={() => selectedDish && addToCart(selectedDish)}
        onIncrement={() => selectedDish && incrementItem(selectedDish.id)}
        onDecrement={() => selectedDish && decrementItem(selectedDish.id)}
      />

      <PremiumCheckout
        open={cartOpen}
        onClose={handleCheckoutClose}
        cart={cart}
        comment={comment}
        locationNote={locationNote}
        boundHouseLabel={houseBinding?.cabinLabel ?? null}
        isScheduledOrder={isScheduledOrder}
        scheduledFor={scheduledFor}
        onCommentChange={setComment}
        onLocationNoteChange={setLocationNote}
        onIsScheduledOrderChange={setIsScheduledOrder}
        onScheduledForChange={setScheduledFor}
        onIncrement={incrementItem}
        onDecrement={decrementItem}
        onSubmit={submitOrder}
        isSubmitting={isSubmitting}
        total={cartTotal}
        startParamLocation={startParamLocation}
      />

      <FloatingCartBar
        total={cartTotal}
        visible={showFloatingCart}
        onOpenCheckout={() => setCartOpen(true)}
      />

      <OrdersPanel
        open={ordersOpen}
        onClose={() => setOrdersOpen(false)}
        orders={orders}
        selectedOrderId={selectedOrderId}
        onSelectOrder={setSelectedOrderId}
        onDismissCancelledOrder={handleDismissCancelledOrder}
        loading={ordersLoading}
        error={ordersError}
        onRetry={() => syncOrders({ silent: false })}
        runningTab={runningTab}
        runningTabLoading={runningTabLoading}
        onChangeHouse={handleChangeHouse}
        changeHouseBusy={changeHouseBusy}
      />
    </div>
  );
}
