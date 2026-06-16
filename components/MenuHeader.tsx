"use client";

import Image from "next/image";
import Link from "next/link";

type MenuHeaderProps = {
  logoUrl: string;
  cartCount: number;
  showAdminLink?: boolean;
  showOrdersLink?: boolean;
  onOpenOrders?: () => void;
  onOpenCart: () => void;
};

export default function MenuHeader({
  logoUrl,
  cartCount,
  showAdminLink = false,
  showOrdersLink = false,
  onOpenOrders,
  onOpenCart,
}: MenuHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-800/50 bg-zinc-950/90 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_50%)]" />

      <div className="relative mx-auto max-w-3xl px-4 pb-5 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900 shadow-lg shadow-black/20">
                <Image
                  src={logoUrl}
                  alt="Аж у небі"
                  fill
                  sizes="56px"
                  className="object-cover"
                  priority
                />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-amber-500/80">
                  Гірський комплекс
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
                  Аж у небі
                </h1>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
              Преміальне меню серед лісу та неба. Оберіть страви та оформіть замовлення за кілька дотиків.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {showOrdersLink ? (
              <button
                type="button"
                onClick={onOpenOrders}
                className="mt-1 flex h-11 min-w-11 items-center justify-center rounded-2xl border border-zinc-800/50 bg-zinc-900 text-zinc-200 transition hover:border-zinc-700 active:scale-95"
                aria-label="Мої замовлення"
              >
                <span className="text-lg">📋</span>
              </button>
            ) : null}

            {showAdminLink ? (
              <Link
                href="/admin"
                className="mt-1 flex h-11 min-w-11 items-center justify-center rounded-2xl border border-zinc-800/50 bg-zinc-900 text-zinc-200 transition hover:border-zinc-700 active:scale-95"
                aria-label="Адмін-панель"
              >
                <span className="text-lg">⚙️</span>
              </Link>
            ) : null}

            <button
              type="button"
              onClick={onOpenCart}
              className="relative mt-1 flex h-11 min-w-11 items-center justify-center rounded-2xl border border-zinc-800/50 bg-zinc-900 text-zinc-200 transition hover:border-amber-500/30 active:scale-95"
              aria-label="Відкрити кошик"
            >
              <span className="text-lg">🛒</span>
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 animate-badge-pop items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-amber-950">
                  {cartCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
