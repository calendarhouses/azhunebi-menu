"use client";

import BrandLogo from "@/components/BrandLogo";
import { CartIcon, OrdersIcon, SettingsIcon } from "@/components/HeaderIcons";
import Link from "next/link";
import type { ComponentProps } from "react";

type MenuHeaderProps = {
  logoUrl: string;
  cartCount: number;
  ordersCount?: number;
  showAdminLink?: boolean;
  showOrdersLink?: boolean;
  onOpenOrders?: () => void;
  onOpenCart: () => void;
};

function HeaderActionButton({
  children,
  badge,
  badgeLabel,
  className = "",
  ...props
}: ComponentProps<"button"> & {
  badge?: number;
  badgeLabel?: string;
}) {
  return (
    <button
      type="button"
      className={`relative flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-700/40 bg-brand-surface-elevated/80 text-stone-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-amber-500/25 hover:text-amber-100 active:scale-95 ${className}`}
      {...props}
    >
      {children}
      {badge && badge > 0 ? (
        <span
          className="absolute -right-1 -top-1 flex h-5 min-w-5 animate-badge-pop items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-amber-950"
          aria-label={badgeLabel}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </button>
  );
}

export default function MenuHeader({
  logoUrl,
  cartCount,
  ordersCount = 0,
  showAdminLink = false,
  showOrdersLink = false,
  onOpenOrders,
  onOpenCart,
}: MenuHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-700/30 bg-brand-bg/90 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.07),transparent_55%)]" />

      <div className="relative mx-auto max-w-3xl px-4 pb-5 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-stone-700/40 bg-brand-surface shadow-lg shadow-black/25">
                <BrandLogo src={logoUrl} />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-stone-50 sm:text-3xl">
                Аж у небі
              </h1>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-stone-400">
              Оберіть страви та оформіть замовлення за кілька кроків.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {showOrdersLink ? (
              <HeaderActionButton
                onClick={onOpenOrders}
                badge={ordersCount}
                badgeLabel={`Активних замовлень: ${ordersCount}`}
                aria-label="Мої замовлення"
              >
                <OrdersIcon />
              </HeaderActionButton>
            ) : null}

            {showAdminLink ? (
              <Link
                href="/admin"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-700/40 bg-brand-surface-elevated/80 text-stone-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-amber-500/25 hover:text-amber-100 active:scale-95"
                aria-label="Адмін-панель"
              >
                <SettingsIcon />
              </Link>
            ) : null}

            <HeaderActionButton
              onClick={onOpenCart}
              badge={cartCount}
              badgeLabel={`Позицій у кошику: ${cartCount}`}
              aria-label="Відкрити кошик"
              className="hover:border-amber-500/35"
            >
              <CartIcon />
            </HeaderActionButton>
          </div>
        </div>
      </div>
    </header>
  );
}
