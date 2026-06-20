"use client";

import OrdersPanel from "@/components/OrdersPanel";
import FloatingCartBar from "@/components/FloatingCartBar";
import HouseBillPanel from "@/components/HouseBillPanel";
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
  mergeTrackedOrder,
  dateTimeLocalToIso,
  type OrderStatus,
  type TrackedOrder,
} from "@/lib/orderStatus";
import { getCartCount, getCartTotal, type CartItem } from "@/lib/cart";
import { captureOrderCard } from "@/lib/orderCardCapture";
import {
  formatCabinDisplay,
  formatOrderLocationDisplay,
} from "@/lib/startParamLocation";
import { triggerError, triggerImpact, triggerSuccess } from "@/lib/haptic";
import { useCartStorage } from "@/lib/useCartStorage";
import { useStartParamLocation } from "@/lib/useStartParamLocation";
import { useTelegramApp } from "@/lib/useTelegramApp";
import type { HouseBinding, RunningTabData } from "@/lib/runningTab";
import type { MenuItemRow } from "@/lib/supabase";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const ORDER_POLL_MS = 5000;
const ORDER_POLL_OPEN_MS = 2000;
const RECENT_ORDER_GRACE_MS = 90_000;
const MISSING_ORDER_GRACE_MS = 45_000;

type CategoryFilter = string | "all";

type HeaderActionConfig = {
  showOrders: boolean;
  showBill: boolean;
};

type SyncOrdersResult = {
  inTelegram: boolean;
  hasRunningTab: boolean;
  orderCount: number;
};

export default function Home() {
  const {
    items,
    categories,
    logoUrl,
    showAdminLink,
    menuLoadError: loadError,
    refreshMenu,
    headerActionsReady,
    setHeaderActionsReady,
  } = useAppReady();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<MenuItemRow | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderToast, setOrderToast] = useState<string | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [inTelegram, setInTelegram] = useState(false);
  const [runningTab, setRunningTab] = useState<RunningTabData | null>(null);
  const [headerActionConfig, setHeaderActionConfig] =
    useState<HeaderActionConfig | null>(null);
  const [runningTabLoading, setRunningTabLoading] = useState(false);
  const [houseBinding, setHouseBinding] = useState<HouseBinding | null>(null);
  const [houseBindingLoading, setHouseBindingLoading] = useState(false);

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
    clearLocationNote,
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
  const prevRunningConfirmedRef = useRef(0);
  const prevRunningTabSessionRef = useRef<string | null>(null);
  const houseBindingRef = useRef<HouseBinding | null>(null);
  const houseBindingRequestRef = useRef(0);
  const recentlySubmittedOrdersRef = useRef<Map<string, number>>(new Map());
  const syncInFlightRef = useRef(false);
  const syncPromiseRef = useRef<Promise<SyncOrdersResult> | null>(null);
  const runningTabRef = useRef<RunningTabData | null>(null);
  const cabinQrSwitchPromiseRef = useRef<Promise<void> | null>(null);
  const cartHydratedRef = useRef(false);
  const startParamReadyRef = useRef(false);

  cartRef.current = cart;
  commentRef.current = comment;
  locationNoteRef.current = locationNote;
  isScheduledOrderRef.current = isScheduledOrder;
  scheduledForRef.current = scheduledFor;
  startParamLocationRef.current = startParamLocation;
  ordersRef.current = orders;
  houseBindingRef.current = houseBinding;
  runningTabRef.current = runningTab;
  cartHydratedRef.current = cartHydrated;
  startParamReadyRef.current = startParamReady;
  startParamLocationRef.current = startParamLocation;

  const showOrdersLink = Boolean(headerActionConfig?.showOrders);
  const showBillLink = Boolean(
    headerActionConfig?.showBill || (inTelegram && runningTab)
  );

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
      setHouseBindingLoading(false);
      return null;
    }

    if (
      houseBindingRef.current ||
      locationNoteRef.current.trim() ||
      runningTab
    ) {
      return houseBindingRef.current;
    }

    const requestId = ++houseBindingRequestRef.current;
    setHouseBindingLoading(true);

    try {
      const binding = await fetchHouseBinding();
      if (requestId !== houseBindingRequestRef.current) {
        return binding;
      }

      setHouseBinding(binding);
      houseBindingRef.current = binding;

      if (binding) {
        setLocationNote(
          formatCabinDisplay(binding.cabinLabel, binding.cabinNumber)
        );
      }

      return binding;
    } catch (error) {
      console.error("[house-binding] refresh failed", error);
      return null;
    } finally {
      if (requestId === houseBindingRequestRef.current) {
        setHouseBindingLoading(false);
      }
    }
  }, [runningTab, setLocationNote]);

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
    if (billOpen) {
      setBillOpen(false);
      return;
    }
    if (cartOpen) {
      setCartOpen(false);
      return;
    }
    setSelectedDish(null);
  }, [billOpen, cartOpen, ordersOpen]);

  useTelegramApp({
    backVisible: ordersOpen || billOpen || cartOpen || Boolean(selectedDish),
    onBack: handleBack,
  });

  const resetGuestHouseSelection = useCallback(() => {
    if (startParamLocationRef.current?.type === "cabin") {
      setLocationNote(startParamLocationRef.current.label);
      return;
    }

    clearLocationNote();
  }, [clearLocationNote, setLocationNote]);

  const ensureCabinQrHouseApplied = useCallback(async () => {
    const cabinQr = startParamLocationRef.current;
    if (cabinQr?.type !== "cabin" || !isTelegramWebApp()) {
      return;
    }

    if (cabinQrSwitchPromiseRef.current) {
      return cabinQrSwitchPromiseRef.current;
    }

    const task = (async () => {
      const qrCabinNumber = Number(cabinQr.number);
      if (!Number.isFinite(qrCabinNumber) || qrCabinNumber < 1 || qrCabinNumber > 12) {
        return;
      }

      try {
        const binding = await fetchHouseBinding();

        if (binding?.cabinNumber === qrCabinNumber) {
          setHouseBinding(binding);
          houseBindingRef.current = binding;
          setLocationNote(
            formatCabinDisplay(binding.cabinLabel, binding.cabinNumber)
          );
          return;
        }

        await changeGuestHouseRequest(qrCabinNumber);

        const updated = await fetchHouseBinding();
        if (updated) {
          setHouseBinding(updated);
          houseBindingRef.current = updated;
          setLocationNote(
            formatCabinDisplay(updated.cabinLabel, updated.cabinNumber)
          );
        } else {
          setHouseBinding(null);
          houseBindingRef.current = null;
          setLocationNote(cabinQr.label);
        }

        const tab = await fetchRunningTab();
        setRunningTab(tab);
        runningTabRef.current = tab;
      } catch (error) {
        console.error("[cabin-qr] failed to switch house", error);
        setLocationNote(cabinQr.label);
      }
    })();

    cabinQrSwitchPromiseRef.current = task;
    return task;
  }, [setLocationNote]);

  const syncOrders = useCallback(
    async (options?: {
      openPanel?: boolean;
      focusOrderId?: string;
      silent?: boolean;
    }): Promise<SyncOrdersResult> => {
      if (!window.Telegram?.WebApp?.initData) {
        setInTelegram(false);
        return {
          inTelegram: false,
          hasRunningTab: Boolean(runningTabRef.current),
          orderCount: ordersRef.current.length,
        };
      }

      if (syncInFlightRef.current && syncPromiseRef.current) {
        return syncPromiseRef.current;
      }

      const task = (async (): Promise<SyncOrdersResult> => {
        syncInFlightRef.current = true;
        setInTelegram(true);

        const silent = options?.silent ?? ordersLoadedOnceRef.current;
        let hasRunningTab = Boolean(runningTabRef.current);
        let orderCount = ordersRef.current.length;

        if (!silent) {
          setOrdersLoading(true);
          setRunningTabLoading(true);
          setOrdersError(null);
        }

        try {
          const IN_PROGRESS_STATUSES = new Set([
            "pending",
            "accepted",
            "preparing",
          ]);

          const [allFetchedOrders, runningTabData] = await Promise.all([
            fetchActiveOrders(),
            fetchRunningTab(),
          ]);

          hasRunningTab = Boolean(runningTabData);

          const sessionEnded =
            prevRunningTabSessionRef.current !== null && !runningTabData;

          if (
            runningTabData &&
            runningTabData.confirmedTotal > prevRunningConfirmedRef.current &&
            prevRunningConfirmedRef.current > 0
          ) {
            triggerImpact("light");
          }

          prevRunningConfirmedRef.current = runningTabData?.confirmedTotal ?? 0;
          prevRunningTabSessionRef.current = runningTabData?.sessionId ?? null;

          const cabinQr = startParamLocationRef.current;
          const cabinQrMismatch =
            cabinQr?.type === "cabin" &&
            runningTabData &&
            runningTabData.cabinNumber !== Number(cabinQr.number);

          if (runningTabData && !cabinQrMismatch) {
            setRunningTab(runningTabData);
            runningTabRef.current = runningTabData;
            setHouseBinding({
              sessionId: runningTabData.sessionId,
              cabinNumber: runningTabData.cabinNumber,
              cabinLabel: runningTabData.cabinLabel,
            });
            setLocationNote(
              formatCabinDisplay(
                runningTabData.cabinLabel,
                runningTabData.cabinNumber
              )
            );
          } else if (runningTabData && cabinQrMismatch) {
            hasRunningTab = Boolean(runningTabRef.current);
          } else {
            setRunningTab(runningTabData);
            runningTabRef.current = runningTabData;
          }

          if (!runningTabData && sessionEnded) {
            setHouseBinding(null);
            resetGuestHouseSelection();
          }

          const dismissedIds = readDismissedOrderIds();
          let activeOrders = allFetchedOrders.filter(
            (order) => !(order.status === "cancelled" && dismissedIds.has(order.id))
          );

          if (sessionEnded) {
            prevRunningConfirmedRef.current = 0;
          }

          const activeById = new Map(activeOrders.map((o) => [o.id, o]));

          // Recover missing orders only on explicit load — not every silent poll.
          if (!silent) {
            const knownIds = readKnownOrderIds();
            const missingKnown = knownIds.filter(
              (id) =>
                !activeById.has(id) &&
                !dismissedIds.has(id) &&
                (recentlySubmittedOrdersRef.current.has(id) ||
                  ordersRef.current.some((order) => order.id === id))
            );

            if (missingKnown.length > 0) {
              const recovered = await Promise.all(
                missingKnown.slice(0, 4).map((id) => fetchOrderById(id))
              );
              for (const order of recovered) {
                if (order && !activeById.has(order.id)) {
                  activeById.set(order.id, order);
                }
              }
              activeOrders = [...activeById.values()];
            }
          }

          // Keep last-known orders briefly when the list API misses them (no fake cancel).
          for (const prevOrder of ordersRef.current) {
            if (activeById.has(prevOrder.id) || dismissedIds.has(prevOrder.id)) {
              continue;
            }

            const submittedAt = recentlySubmittedOrdersRef.current.get(prevOrder.id);
            const recentlySubmitted =
              submittedAt != null &&
              Date.now() - submittedAt < RECENT_ORDER_GRACE_MS;
            const recentlyUpdated =
              Date.now() - new Date(prevOrder.updatedAt).getTime() <
              MISSING_ORDER_GRACE_MS;

            const keepVisible =
              prevOrder.status === "ready" ||
              IN_PROGRESS_STATUSES.has(prevOrder.status);

            if (keepVisible && (recentlySubmitted || recentlyUpdated)) {
              activeById.set(prevOrder.id, prevOrder);
            }
          }

          activeOrders = [...activeById.values()].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          const nextOrders = activeOrders;
          orderCount = nextOrders.length;

          const previousById = new Map(
            ordersRef.current.map((order) => [order.id, order])
          );

          for (const order of nextOrders) {
            const previous = previousById.get(order.id);
            if (!previous || previous.status === order.status) {
              continue;
            }

            const message = getStatusChangeMessage(
              previous.status as OrderStatus,
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
              return existing ? mergeTrackedOrder(existing, next) : next;
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

          return {
            inTelegram: true,
            hasRunningTab,
            orderCount,
          };
        } catch (error) {
          if (!silent || ordersRef.current.length === 0) {
            setOrdersError(
              error instanceof Error
                ? error.message
                : "Не вдалося завантажити статус замовлення"
            );
          }

          return {
            inTelegram: true,
            hasRunningTab,
            orderCount,
          };
        } finally {
          syncInFlightRef.current = false;
          syncPromiseRef.current = null;
          if (!silent) {
            setOrdersLoading(false);
            setRunningTabLoading(false);
          }
        }
      })();

      syncPromiseRef.current = task;
      return task;
    },
    [resetGuestHouseSelection]
  );

  const fetchData = refreshMenu;

  useEffect(() => {
    void refreshMenu();
  }, [refreshMenu]);

  useEffect(() => {
    if (!cartHydrated || !startParamReady) {
      return;
    }

    if (!isTelegramWebApp()) {
      setHouseBindingLoading(false);
      if (startParamLocation?.type === "cabin") {
        setLocationNote(startParamLocation.label);
      }
      return;
    }

    if (startParamLocation?.type === "cabin") {
      let cancelled = false;
      setHouseBindingLoading(true);

      void (async () => {
        try {
          await ensureCabinQrHouseApplied();
        } finally {
          if (!cancelled) {
            setHouseBindingLoading(false);
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    let cancelled = false;
    const hasKnownLocation = Boolean(locationNote.trim());

    if (!hasKnownLocation) {
      setHouseBindingLoading(true);
    }

    void (async () => {
      try {
        const binding = await fetchHouseBinding();
        if (cancelled) {
          return;
        }

        if (binding) {
          setHouseBinding(binding);
          houseBindingRef.current = binding;
          setLocationNote(
            formatCabinDisplay(binding.cabinLabel, binding.cabinNumber)
          );
          return;
        }

        setHouseBinding(null);
        houseBindingRef.current = null;
      } finally {
        if (!cancelled) {
          setHouseBindingLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    cartHydrated,
    startParamReady,
    startParamLocation,
    locationNote,
    setLocationNote,
    ensureCabinQrHouseApplied,
  ]);

  useEffect(() => {
    if (!cartOpen || !inTelegram) {
      return;
    }

    if (
      houseBindingRef.current ||
      locationNoteRef.current.trim() ||
      runningTab
    ) {
      return;
    }

    void refreshHouseBinding();
  }, [cartOpen, inTelegram, refreshHouseBinding, runningTab]);

  useEffect(() => {
    if (activeCategory !== "all" && !categories.includes(activeCategory)) {
      setActiveCategory("all");
    }
  }, [activeCategory, categories]);

  useEffect(() => {
    setHeaderActionsReady(false);
    setHeaderActionConfig(null);
  }, [setHeaderActionsReady]);

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

      const inTelegramApp = isTelegramWebApp();
      setInTelegram(inTelegramApp);

      if (window.location.hash === "#orders") {
        setOrdersOpen(true);
        window.history.replaceState(null, "", window.location.pathname);
      }

      const guestContextDeadline = Date.now() + 5000;
      while (
        (!cartHydratedRef.current || !startParamReadyRef.current) &&
        Date.now() < guestContextDeadline
      ) {
        await new Promise((resolve) => window.setTimeout(resolve, 50));
      }

      await ensureCabinQrHouseApplied();

      const syncResult = await syncOrders();
      if (cancelled) {
        return;
      }

      const nextHeaderConfig: HeaderActionConfig = {
        showOrders: syncResult.inTelegram || syncResult.orderCount > 0,
        showBill: syncResult.inTelegram && syncResult.hasRunningTab,
      };

      setHeaderActionConfig(nextHeaderConfig);
      setHeaderActionsReady(true);
    };

    boot();

    return () => {
      cancelled = true;
    };
  }, [syncOrders, setHeaderActionsReady, ensureCabinQrHouseApplied]);

  useEffect(() => {
    if (!headerActionsReady || !isTelegramWebApp()) {
      return;
    }

    const pollMs = ordersOpen ? ORDER_POLL_OPEN_MS : ORDER_POLL_MS;

    void syncOrders({ silent: true });

    const intervalId = window.setInterval(() => {
      void syncOrders({ silent: true });
    }, pollMs);

    return () => window.clearInterval(intervalId);
  }, [headerActionsReady, syncOrders, ordersOpen]);

  const submitOrder = useCallback(async (): Promise<boolean> => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp || isSubmittingRef.current) {
      return false;
    }

    const currentCart = cartRef.current;
    if (currentCart.length === 0) {
      return false;
    }

    if (!webApp.initData) {
      webApp.showAlert("Відкрийте меню через Telegram-бота.");
      return false;
    }

    const bindingLocation = houseBindingRef.current
      ? formatCabinDisplay(
          houseBindingRef.current.cabinLabel,
          houseBindingRef.current.cabinNumber
        )
      : "";
    const currentLocation =
      locationNoteRef.current.trim() || bindingLocation;
    const tableDelivery =
      startParamLocationRef.current?.type === "table"
        ? startParamLocationRef.current.label
        : undefined;

    if (!currentLocation) {
      webApp.showAlert("Вкажіть номер столика або будиночка.");
      return false;
    }

    let scheduledPayload: string | undefined;

    if (isScheduledOrderRef.current) {
      if (!scheduledForRef.current.trim()) {
        webApp.showAlert("Оберіть час подачі замовлення.");
        return false;
      }

      try {
        scheduledPayload = dateTimeLocalToIso(scheduledForRef.current);
      } catch (error) {
        webApp.showAlert(
          error instanceof Error
            ? error.message
            : "Невірний час подачі замовлення."
        );
        return false;
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
        tableNumber: tableDelivery,
        paymentMethod: "cash",
        scheduledFor: scheduledPayload,
      });

      rememberOrderId(result.orderId);
      recentlySubmittedOrdersRef.current.set(result.orderId, Date.now());
      setSelectedOrderId(result.orderId);

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
        house: formatOrderLocationDisplay(currentLocation, tableDelivery),
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

      void syncOrders({
        focusOrderId: result.orderId as string,
        silent: true,
      });

      return true;
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

  const headerSkeletonCount = headerActionConfig
    ? (headerActionConfig.showOrders ? 1 : 0) +
      (headerActionConfig.showBill ? 1 : 0) +
      (showAdminLink ? 1 : 0)
    : showAdminLink
      ? 3
      : 2;

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
          ordersCount={orders.length}
          showAdminLink={showAdminLink}
          showOrdersLink={showOrdersLink}
          showBillLink={showBillLink}
          actionsLoading={!headerActionsReady}
          skeletonCount={headerSkeletonCount}
          onOpenOrders={() => {
            setOrdersOpen(true);
            syncOrders({ silent: ordersLoadedOnceRef.current });
          }}
          onOpenBill={() => {
            setBillOpen(true);
            syncOrders({ silent: ordersLoadedOnceRef.current });
          }}
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
        boundHouseLabel={
          houseBinding
            ? formatCabinDisplay(
                houseBinding.cabinLabel,
                houseBinding.cabinNumber
              )
            : null
        }
        houseBindingLoading={houseBindingLoading}
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
        itemCount={cartCount}
        visible={showFloatingCart}
        onOpenCheckout={() => setCartOpen(true)}
      />

      <HouseBillPanel
        open={billOpen}
        onClose={() => setBillOpen(false)}
        runningTab={runningTab}
        loading={runningTabLoading}
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
      />
    </div>
  );
}
