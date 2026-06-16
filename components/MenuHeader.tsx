"use client";

import Image from "next/image";
import Link from "next/link";

type MenuHeaderProps = {
  logoUrl: string;
  cartCount: number;
  showAdminLink?: boolean;
  onOpenCart: () => void;
};

export default function MenuHeader({
  logoUrl,
  cartCount,
  showAdminLink = false,
  onOpenCart,
}: MenuHeaderProps) {
  return (
    <header className="sticky top-0 z-20 overflow-hidden border-b border-white/10 bg-[var(--brand-bg,#0a120e)]/90 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.12),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_40%)]" />

      <div className="relative mx-auto max-w-3xl px-4 pb-4 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-emerald-400/20 bg-[#0f2d1f] shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
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
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-amber-400/80">
                  Гірський комплекс
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Аж у небі
                </h1>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-white/50">
              Преміальне меню серед лісу та неба. Оберіть страви та оформіть замовлення за кілька дотиків.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {showAdminLink ? (
              <Link
                href="/admin"
                className="mt-1 flex h-12 min-w-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 text-white transition hover:border-emerald-400/40 active:scale-95"
                aria-label="Адмін-панель"
              >
                <span className="text-lg">⚙️</span>
              </Link>
            ) : null}

            <button
              type="button"
              onClick={onOpenCart}
              className="relative mt-1 flex h-12 min-w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-3 text-white transition hover:border-amber-400/30 hover:bg-white/[0.08] active:scale-95"
              aria-label="Відкрити кошик"
            >
              <span className="text-lg">🛒</span>
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 animate-badge-pop items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-[#0a120e]">
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
