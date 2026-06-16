"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, TENANT_ID, type MenuItemRow } from "@/lib/supabase";

const CATEGORIES = [
  "Сніданки",
  "Перші страви",
  "Другі страви",
  "Салати",
] as const;

type CategoryFilter = (typeof CATEGORIES)[number] | "all";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

function formatPrice(price: number) {
  return `${price} ₴`;
}

function triggerHaptic() {
  window.Telegram?.WebApp.HapticFeedback.impactOccurred("light");
}

function getCartTotal(cart: CartItem[]) {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function ImagePlaceholder() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-zinc-800 via-[#141a16] to-[#0a120e] px-4 text-center">
      <span className="text-3xl" aria-hidden>
        🍽
      </span>
      <span className="text-xs font-medium uppercase tracking-[0.18em] text-amber-400/70">
        Аж у небі
      </span>
    </div>
  );
}

function DishImage({ src, alt }: { src: string; alt: string }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return <ImagePlaceholder />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      onError={() => setHasError(true)}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
      <div className="aspect-[4/3] bg-white/10" />
      <div className="space-y-3 p-4">
        <div className="flex justify-between gap-3">
          <div className="h-5 w-2/3 rounded-lg bg-white/10" />
          <div className="h-6 w-16 rounded-full bg-white/10" />
        </div>
        <div className="h-4 w-full rounded bg-white/10" />
        <div className="h-10 w-full rounded-xl bg-white/10" />
      </div>
    </div>
  );
}

function CartControls({
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
}: {
  quantity: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  if (quantity === 0) {
    return (
      <button
        type="button"
        onClick={onAdd}
        className="mt-1 w-full rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-[#0a120e] transition active:scale-[0.98] hover:bg-amber-300"
      >
        Додати
      </button>
    );
  }

  return (
    <div className="mt-1 flex items-center justify-between rounded-xl border border-amber-400/30 bg-amber-400/10 p-1">
      <button
        type="button"
        onClick={onDecrement}
        aria-label="Зменшити кількість"
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0a120e]/40 text-lg font-semibold text-amber-300 transition active:scale-95 hover:bg-[#0a120e]/60"
      >
        −
      </button>
      <span className="min-w-8 text-center text-sm font-semibold text-white">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        aria-label="Збільшити кількість"
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400 text-lg font-semibold text-[#0a120e] transition active:scale-95 hover:bg-amber-300"
      >
        +
      </button>
    </div>
  );
}

function DishCard({
  item,
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
}: {
  item: MenuItemRow;
  quantity: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-lg shadow-black/20 transition hover:border-amber-400/30 hover:bg-white/[0.06]">
      <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
        {item.image_url ? (
          <DishImage src={item.image_url} alt={item.name} />
        ) : (
          <ImagePlaceholder />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a120e] via-transparent to-transparent pointer-events-none" />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold leading-snug text-white">
            {item.name}
          </h3>
          <span className="shrink-0 rounded-full bg-amber-400/15 px-2.5 py-1 text-sm font-medium text-amber-300">
            {formatPrice(item.price)}
          </span>
        </div>

        {item.description ? (
          <p className="flex-1 text-sm leading-relaxed text-white/55">
            {item.description}
          </p>
        ) : (
          <div className="flex-1" />
        )}

        <CartControls
          quantity={quantity}
          onAdd={onAdd}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
        />
      </div>
    </article>
  );
}

export default function Home() {
  const [items, setItems] = useState<MenuItemRow[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");

  const cartTotal = useMemo(() => getCartTotal(cart), [cart]);

  const cartQuantities = useMemo(() => {
    return cart.reduce<Record<string, number>>((acc, item) => {
      acc[item.id] = item.quantity;
      return acc;
    }, {});
  }, [cart]);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    webApp?.ready();
    webApp?.expand();
  }, []);

  useEffect(() => {
    async function fetchMenuItems() {
      setLoading(true);

      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("tenant_id", TENANT_ID)
        .eq("is_available", true)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setItems(data as MenuItemRow[]);
      }

      setLoading(false);
    }

    fetchMenuItems();
  }, []);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) {
      return;
    }

    if (cartTotal > 0) {
      webApp.MainButton.setParams({
        text: `ОФОРМИТИ ЗАМОВЛЕННЯ • ${cartTotal} ₴`,
        color: "#fbbf24",
        text_color: "#0a120e",
        is_active: true,
        is_visible: true,
      });
      webApp.MainButton.show();
    } else {
      webApp.MainButton.hide();
    }
  }, [cartTotal]);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) {
      return;
    }

    const handleMainButtonClick = () => {
      const _user = webApp.initDataUnsafe?.user;
      const total = getCartTotal(cart);

      alert(
        `Дані готові! Сума: ${total} ₴. Кошик: ${JSON.stringify(cart)}`
      );
    };

    webApp.onEvent("mainButtonClicked", handleMainButtonClick);

    return () => {
      webApp.offEvent("mainButtonClicked", handleMainButtonClick);
    };
  }, [cart]);

  const filteredItems = useMemo(() => {
    if (activeCategory === "all") {
      return items;
    }

    return items.filter((item) => item.category === activeCategory);
  }, [items, activeCategory]);

  function addToCart(item: MenuItemRow) {
    triggerHaptic();

    setCart((prev) => {
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
    triggerHaptic();

    setCart((prev) =>
      prev.map((cartItem) =>
        cartItem.id === itemId
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      )
    );
  }

  function decrementItem(itemId: string) {
    triggerHaptic();

    setCart((prev) => {
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
    <div className="min-h-full bg-[#0a120e] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0a120e]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 pb-4 pt-5">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-lg" aria-hidden>
              🌲
            </span>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-400/80">
              Комплекс
            </p>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Аж у небі
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Меню ресторану серед гір і лісу
          </p>
        </div>
      </header>

      <div className="sticky top-[108px] z-10 border-b border-white/5 bg-[#0a120e]/95 backdrop-blur-xl sm:top-[116px]">
        <div className="mx-auto max-w-3xl">
          <div className="flex gap-2 overflow-x-auto px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                activeCategory === "all"
                  ? "bg-amber-400 text-[#0a120e]"
                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              Усе меню
            </button>

            {CATEGORIES.map((category) => {
              const isActive = activeCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-amber-400 text-[#0a120e]"
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main
        className={`mx-auto max-w-3xl px-4 py-5 ${cartTotal > 0 ? "pb-28" : "pb-10"}`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-white">{sectionTitle}</h2>
          {!loading && (
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
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filteredItems.map((item) => (
              <DishCard
                key={item.id}
                item={item}
                quantity={cartQuantities[item.id] ?? 0}
                onAdd={() => addToCart(item)}
                onIncrement={() => incrementItem(item.id)}
                onDecrement={() => decrementItem(item.id)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center">
            <p className="text-base text-white/70">
              У цій категорії поки немає страв
            </p>
            <p className="mt-2 text-sm text-white/40">
              Спробуйте обрати іншу категорію
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
