"use client";

import PremiumCheckout, { type PaymentMethod } from "@/components/PremiumCheckout";
import CategoryBar from "@/components/CategoryBar";
import DishCard from "@/components/DishCard";
import DishModal from "@/components/DishModal";
import ErrorState from "@/components/ErrorState";
import MenuHeader from "@/components/MenuHeader";
import SearchBar from "@/components/SearchBar";
import SkeletonCard from "@/components/SkeletonCard";
import { resolveLogoUrl, type TenantSettings } from "@/lib/branding";
import { checkAdminAccess } from "@/lib/adminApi";
import { getCartCount, getCartTotal, type CartItem } from "@/lib/cart";
import { triggerError, triggerImpact, triggerSuccess } from "@/lib/haptic";
import { useCartStorage } from "@/lib/useCartStorage";
import { useTelegramApp } from "@/lib/useTelegramApp";
import { supabase, TENANT_ID, type MenuItemRow } from "@/lib/supabase";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const ORDER_API_URL = "https://azhunebi-bot.vercel.app/api/order";

type CategoryFilter = string | "all";

export default function Home() {
  const [items, setItems] = useState<MenuItemRow[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState(resolveLogoUrl());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<MenuItemRow | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdminLink, setShowAdminLink] = useState(false);

  const {
    cart,
    setCart,
    comment,
    setComment,
    locationNote,
    setLocationNote,
    paymentMethod,
    setPaymentMethod,
    clearStoredCart,
  } = useCartStorage();

  const isSubmittingRef = useRef(false);
  const cartRef = useRef(cart);
  const commentRef = useRef(comment);
  const locationNoteRef = useRef(locationNote);
  const paymentMethodRef = useRef(paymentMethod);

  cartRef.current = cart;
  commentRef.current = comment;
  locationNoteRef.current = locationNote;
  paymentMethodRef.current = paymentMethod;

  const cartTotal = useMemo(() => getCartTotal(cart), [cart]);
  const cartCount = useMemo(() => getCartCount(cart), [cart]);

  const cartQuantities = useMemo(() => {
    return cart.reduce<Record<string, number>>((acc, item) => {
      acc[item.id] = item.quantity;
      return acc;
    }, {});
  }, [cart]);

  const handleBack = useCallback(() => {
    if (cartOpen) {
      setCartOpen(false);
      return;
    }
    setSelectedDish(null);
  }, [cartOpen]);

  useTelegramApp({
    backVisible: cartOpen || Boolean(selectedDish),
    onBack: handleBack,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);

    const [menuResult, categoriesResult, settingsResult] = await Promise.all([
      supabase
        .from("menu_items")
        .select("*")
        .eq("tenant_id", TENANT_ID)
        .eq("is_available", true)
        .order("created_at", { ascending: true }),
      supabase
        .from("categories")
        .select("name, sort_order")
        .eq("tenant_id", TENANT_ID)
        .order("sort_order", { ascending: true }),
      supabase
        .from("tenant_settings")
        .select("tenant_id, logo_url")
        .eq("tenant_id", TENANT_ID)
        .maybeSingle(),
    ]);

    if (menuResult.error) {
      setLoadError(true);
      setLoading(false);
      return;
    }

    const menuItems = (menuResult.data || []) as MenuItemRow[];
    setItems(menuItems);

    if (!categoriesResult.error && categoriesResult.data?.length) {
      setCategories(categoriesResult.data.map((row) => row.name));
    } else {
      setCategories([
        ...new Set(
          menuItems
            .map((item) => item.category)
            .filter((value): value is string => Boolean(value))
        ),
      ]);
    }

    if (!settingsResult.error && settingsResult.data) {
      setLogoUrl(resolveLogoUrl(settingsResult.data as TenantSettings));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    checkAdminAccess().then(({ isAdmin }) => {
      setShowAdminLink(isAdmin);
    });
  }, []);

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

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const response = await fetch(ORDER_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData: webApp.initData,
          cart: currentCart.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
          comment: commentRef.current.trim() || undefined,
          locationNote: currentLocation,
          paymentMethod: paymentMethodRef.current,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Order request failed");
      }

      clearStoredCart();
      setCartOpen(false);
      setSelectedDish(null);
      triggerSuccess();
      webApp.showAlert(
        "Замовлення успішно відправлено! Статус можна переглянути в боті — /orders"
      );
    } catch {
      triggerError();
      webApp.showAlert("Не вдалося відправити замовлення. Спробуйте ще раз.");
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [clearStoredCart]);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) {
      return;
    }

    if (cartTotal > 0 || isSubmitting) {
      webApp.MainButton.setParams({
        text: isSubmitting
          ? "Відправка..."
          : `ОФОРМИТИ ЗАМОВЛЕННЯ • ${cartTotal} ₴`,
        color: "#fbbf24",
        text_color: "#0a120e",
        is_active: !isSubmitting,
        is_visible: true,
      });
      webApp.MainButton.show();
    } else {
      webApp.MainButton.hide();
    }
  }, [cartTotal, isSubmitting]);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) {
      return;
    }

    const handleMainButtonClick = () => {
      if (cartRef.current.length === 0) {
        return;
      }
      setCartOpen(true);
    };

    webApp.onEvent("mainButtonClicked", handleMainButtonClick);

    return () => {
      webApp.offEvent("mainButtonClicked", handleMainButtonClick);
    };
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = `${item.name} ${item.description || ""} ${item.category || ""} ${item.allergens || ""}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [items, activeCategory, searchQuery]);

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

  const sectionTitle =
    activeCategory === "all" ? "Усе меню" : activeCategory;

  return (
    <div className="min-h-full bg-[var(--brand-bg,#0a120e)] text-white">
      <MenuHeader
        logoUrl={logoUrl}
        cartCount={cartCount}
        showAdminLink={showAdminLink}
        onOpenCart={() => setCartOpen(true)}
      />

      <div className="mx-auto max-w-3xl px-4 pt-4">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      <CategoryBar
        categories={categories}
        activeCategory={activeCategory}
        onChange={setActiveCategory}
      />

      <main
        className={`mx-auto max-w-3xl px-4 py-5 ${cartTotal > 0 ? "pb-28" : "pb-10"}`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-white">{sectionTitle}</h2>
          {!loading && !loadError && (
            <span className="text-sm text-white/40">
              {filteredItems.length} поз.
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : loadError ? (
          <ErrorState onRetry={fetchData} />
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center">
            <p className="text-base text-white/70">
              {searchQuery.trim()
                ? "За вашим запитом нічого не знайдено"
                : "У цій категорії поки немає страв"}
            </p>
            <p className="mt-2 text-sm text-white/40">
              {searchQuery.trim()
                ? "Спробуйте інший пошук або категорію"
                : "Спробуйте обрати іншу категорію"}
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
        onClose={() => setCartOpen(false)}
        cart={cart}
        comment={comment}
        locationNote={locationNote}
        paymentMethod={paymentMethod}
        onCommentChange={setComment}
        onLocationNoteChange={setLocationNote}
        onPaymentMethodChange={setPaymentMethod}
        onIncrement={incrementItem}
        onDecrement={decrementItem}
        onSubmit={submitOrder}
        isSubmitting={isSubmitting}
        total={cartTotal}
      />
    </div>
  );
}
