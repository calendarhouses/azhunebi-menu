"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { supabase, TENANT_ID, type MenuItemRow } from "@/lib/supabase";

const CATEGORIES = [
  "Сніданки",
  "Перші страви",
  "Другі страви",
  "Салати",
] as const;

type CategoryFilter = (typeof CATEGORIES)[number] | "all";

function formatPrice(price: number) {
  return `${price} ₴`;
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

function DishCard({
  item,
  onAdd,
}: {
  item: MenuItemRow;
  onAdd: (item: MenuItemRow) => void;
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-lg shadow-black/20 transition hover:border-amber-400/30 hover:bg-white/[0.06]">
      <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-950/80 to-[#0a120e] text-4xl">
            🍽
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a120e] via-transparent to-transparent" />
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

        <button
          type="button"
          onClick={() => onAdd(item)}
          className="mt-1 w-full rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-[#0a120e] transition active:scale-[0.98] hover:bg-amber-300"
        >
          Додати
        </button>
      </div>
    </article>
  );
}

export default function Home() {
  const [items, setItems] = useState<MenuItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");

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

  const filteredItems = useMemo(() => {
    if (activeCategory === "all") {
      return items;
    }

    return items.filter((item) => item.category === activeCategory);
  }, [items, activeCategory]);

  function handleAdd(item: MenuItemRow) {
    window.Telegram?.WebApp.HapticFeedback.impactOccurred("light");
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

      <main className="mx-auto max-w-3xl px-4 py-5 pb-10">
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
              <DishCard key={item.id} item={item} onAdd={handleAdd} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center">
            <p className="text-base text-white/70">У цій категорії поки немає страв</p>
            <p className="mt-2 text-sm text-white/40">
              Спробуйте обрати іншу категорію
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
