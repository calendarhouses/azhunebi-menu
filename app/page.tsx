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
  createOrderRequest,
  fetchActiveOrders,
  isTelegramWebApp,
} from "@/lib/ordersApi";
import { rememberOrderId } from "@/lib/orderStorage";
import {
  getStatusChangeMessage,
  dateTimeLocalToIso,
  type OrderStatus,
  type TrackedOrder,
} from "@/lib/orderStatus";
import { getCartCount, getCartTotal, type CartItem } from "@/lib/cart";
import { triggerError, triggerImpact, triggerSuccess } from "@/lib/haptic";
import { useCartStorage } from "@/lib/useCartStorage";
import { useTelegramApp } from "@/lib/useTelegramApp";
import type { MenuItemRow } from "@/lib/supabase";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const ORDER_POLL_MS = 5000;

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
  } = useCartStorage();

  const isSubmittingRef = useRef(false);
  const orderJustSubmittedRef = useRef(false);
  const cartRef = useRef(cart);
  const commentRef = useRef(comment);
  const locationNoteRef = useRef(locationNote);
  const isScheduledOrderRef = useRef(isScheduledOrder);
  const scheduledForRef = useRef(scheduledFor);
  const ordersRef = useRef<TrackedOrder[]>([]);
  const ordersLoadedOnceRef = useRef(false);

  cartRef.current = cart;
  commentRef.current = comment;
  locationNoteRef.current = locationNote;
  isScheduledOrderRef.current = isScheduledOrder;
  scheduledForRef.current = scheduledFor;
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

  const handleCheckoutClose = useCallback(() => {
    setCartOpen(false);
    if (orderJustSubmittedRef.current) {
      orderJustSubmittedRef.current = false;
      clearStoredCart();
      setOrdersOpen(true);
    }
  }, [clearStoredCart]);

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
        setOrdersError(null);
      }

      try {
        const nextOrders = await fetchActiveOrders();
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

          return nextOrders.map((next) => {
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
        }
      }
    },
    []
  );

  const fetchData = refreshMenu;

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
      const result = await createOrderRequest({
        initData: webApp.initData,
        cart: currentCart.map((item) => ({
          id: item.id,
          quantity: item.quantity,
        })),
        comment: commentRef.current.trim() || undefined,
        locationNote: currentLocation,
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
      setOrderToast("Замовлення відправлено — очікуємо підтвердження");
      orderJustSubmittedRef.current = true;
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
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [syncOrders]);

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
    <div
      className="bg-brand-bg text-stone-100"
      style={{ minHeight: "var(--tg-viewport-stable-height, 100vh)" }}
    >
      {orderToast && !ordersOpen ? (
        <div className="animate-toast-in fixed left-4 right-4 top-4 z-40 flex items-start justify-between gap-3 rounded-2xl border border-amber-500/20 bg-brand-surface/95 px-4 py-3 shadow-xl backdrop-blur-md">
          <p className="text-sm font-medium text-amber-200">{orderToast}</p>
          <button
            type="button"
            onClick={() => setOrderToast(null)}
            className="text-sm text-amber-100/70"
          >
            ✕
          </button>
        </div>
      ) : null}

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

      <main
        className={`mx-auto max-w-3xl px-4 py-5 ${showFloatingCart ? "pb-28" : "pb-12"}`}
      >
        {loadError ? (
          <ErrorState onRetry={fetchData} />
        ) : filteredItems.length > 0 ? (
          <div className="flex flex-col gap-4">
            {filteredItems.map((item) => (
              <DishCard
                key={item.id}
                item={item}
                quantity={cartQuantities[item.id] ?? 0}
                onOpen={() => setSelectedDish(item)}
                onAdd={() => addToCart(item)}
                onIncrement={() => incrementItem(item.id)}
                onDecrement={() => decrementItem(item.id)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-stone-700/35 bg-brand-surface px-6 py-12 text-center">
            <p className="text-base text-stone-300">
              У цій категорії поки немає страв
            </p>
            <p className="mt-2 text-sm text-brand-muted">
              Спробуйте обрати іншу категорію
            </p>
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
        toastMessage={orderToast}
        onDismissToast={() => setOrderToast(null)}
        loading={ordersLoading}
        error={ordersError}
        onRetry={() => syncOrders({ silent: false })}
      />
    </div>
  );
}
