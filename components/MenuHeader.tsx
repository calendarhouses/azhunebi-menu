"use client";

import BrandLogo from "@/components/BrandLogo";
import { CartIcon, OrdersIcon, SettingsIcon } from "@/components/HeaderIcons";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type MenuHeaderProps = {
  logoUrl: string;
  cartCount: number;
  ordersCount?: number;
  showAdminLink?: boolean;
  showOrdersLink?: boolean;
  onOpenOrders?: () => void;
  onOpenCart: () => void;
};

function ActionTile({
  children,
  label,
  badge,
  badgeLabel,
  className = "",
  ...props
}: ComponentProps<"button"> & {
  label: string;
  badge?: number;
  badgeLabel?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`group relative flex flex-col items-center gap-2 rounded-2xl px-2 py-3 transition hover:bg-white/[0.04] active:scale-[0.98] ${className}`}
      {...props}
    >
      <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-600/25 bg-brand-surface-elevated/70 text-stone-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition group-hover:border-amber-500/30 group-hover:text-amber-100">
        {children}
        {badge && badge > 0 ? (
          <span
            className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 animate-badge-pop items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-amber-950"
            aria-label={badgeLabel}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </span>
      <span className="text-[11px] font-medium tracking-wide text-stone-400 group-hover:text-stone-200">
        {label}
      </span>
    </button>
  );
}

function AdminTile() {
  return (
    <Link
      href="/admin"
      className="group flex flex-col items-center gap-2 rounded-2xl px-2 py-3 transition hover:bg-white/[0.04] active:scale-[0.98]"
      aria-label="Адмін-панель"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-600/25 bg-brand-surface-elevated/70 text-stone-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition group-hover:border-amber-500/30 group-hover:text-amber-100">
        <SettingsIcon />
      </span>
      <span className="text-[11px] font-medium tracking-wide text-stone-400 group-hover:text-stone-200">
        Адмін
      </span>
    </Link>
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
  const actionCount =
    (showOrdersLink ? 1 : 0) + (showAdminLink ? 1 : 0) + 1;

  return (
    <header className="relative border-b border-stone-600/20 bg-brand-bg">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_60%)]" />

      <div className="relative mx-auto max-w-3xl px-4 pb-4 pt-5">
        <div className="flex items-center gap-4">
          <BrandLogo
            src={logoUrl}
            className="h-[4.5rem] w-[4.5rem] shrink-0 object-contain drop-shadow-lg"
          />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-stone-50 sm:text-[1.75rem]">
              Аж у небі
            </h1>
            <p className="mt-1 max-w-xs text-sm leading-relaxed text-brand-muted">
              Оберіть страви та оформіть замовлення за кілька кроків.
            </p>
          </div>
        </div>

        <div
          className={`mt-5 grid gap-1 rounded-[22px] border border-stone-600/20 bg-brand-surface/55 p-1.5 backdrop-blur-sm ${
            actionCount === 3
              ? "grid-cols-3"
              : actionCount === 2
                ? "grid-cols-2"
                : "grid-cols-1"
          }`}
        >
          {showOrdersLink ? (
            <ActionTile
              onClick={onOpenOrders}
              label="Замовлення"
              badge={ordersCount}
              badgeLabel={`Активних замовлень: ${ordersCount}`}
              aria-label="Мої замовлення"
            >
              <OrdersIcon />
            </ActionTile>
          ) : null}

          {showAdminLink ? <AdminTile /> : null}

          <ActionTile
            onClick={onOpenCart}
            label="Кошик"
            badge={cartCount}
            badgeLabel={`Позицій у кошику: ${cartCount}`}
            aria-label="Відкрити кошик"
          >
            <CartIcon />
          </ActionTile>
        </div>
      </div>
    </header>
  );
}
