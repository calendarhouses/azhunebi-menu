"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  categories,
  menuItems,
  type CategoryId,
  type MenuItem,
} from "@/lib/menu-data";

function formatPrice(price: number) {
  return `${price} ₴`;
}

function DishCard({
  item,
  onAdd,
}: {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-lg shadow-black/20 transition hover:border-amber-400/30 hover:bg-white/[0.06]">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
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

        <p className="flex-1 text-sm leading-relaxed text-white/55">
          {item.description}
        </p>

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

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("breakfast");

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    webApp?.ready();
    webApp?.expand();
  }, []);

  const filteredItems = useMemo(
    () => menuItems.filter((item) => item.category === activeCategory),
    [activeCategory]
  );

  function handleAdd(item: MenuItem) {
    window.Telegram?.WebApp.HapticFeedback.impactOccurred("light");
  }

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
            {categories.map((category) => {
              const isActive = activeCategory === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-amber-400 text-[#0a120e]"
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-5 pb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-white">
            {categories.find((c) => c.id === activeCategory)?.label}
          </h2>
          <span className="text-sm text-white/40">
            {filteredItems.length} поз.
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filteredItems.map((item) => (
            <DishCard key={item.id} item={item} onAdd={handleAdd} />
          ))}
        </div>
      </main>
    </div>
  );
}
