"use client";

import BrandLogo from "@/components/BrandLogo";
import { CartIcon, OrdersIcon, SettingsIcon } from "@/components/HeaderIcons";
import { formatPositionLabel } from "@/lib/plural";
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

function ActionBadge({ count, label }: { count: number; label: string }) {
  if (count <= 0) {
    return null;
  }

  return (
    <span
      className="absolute right-2 top-2 flex h-5 min-w-5 animate-badge-pop items-center justify-center rounded-full bg-brand-accent px-1 text-[10px] font-bold text-brand-accent-text"
      aria-label={label}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function PremiumActionCard({
  children,
  title,
  hint,
  badge,
  badgeLabel,
  compact = false,
  className = "",
  ...props
}: ComponentProps<"button"> & {
  title: string;
  hint?: string;
  badge?: number;
  badgeLabel?: string;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`group relative flex min-w-0 items-center rounded-[22px] border border-stone-600/20 bg-gradient-to-br from-brand-surface-elevated/95 to-brand-surface/70 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_28px_rgba(0,0,0,0.16)] transition hover:border-brand-accent/25 active:scale-[0.99] ${
        compact
          ? "min-h-[5rem] flex-col justify-center gap-2 p-2.5 text-center"
          : "min-h-[5.5rem] flex-1 gap-3.5 p-4"
      } ${className}`}
      {...props}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-2xl bg-brand-accent/12 text-brand-accent ring-1 ring-brand-accent/20 transition group-hover:bg-brand-accent/18 ${
          compact ? "h-10 w-10" : "h-12 w-12"
        }`}
      >
        {children}
      </span>
      <span className={`min-w-0 ${compact ? "w-full px-1" : "flex-1 pr-4"}`}>
        <span
          className={`block font-semibold leading-tight text-stone-50 ${
            compact ? "text-xs" : "text-[15px]"
          }`}
        >
          {title}
        </span>
        {hint ? (
          <span
            className={`mt-0.5 block text-brand-muted ${
              compact ? "truncate text-[10px] leading-snug" : "text-xs"
            }`}
          >
            {hint}
          </span>
        ) : null}
      </span>
      <ActionBadge count={badge ?? 0} label={badgeLabel ?? title} />
    </button>
  );
}

function AdminActionCard({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/admin"
      className={`group relative flex min-w-0 items-center rounded-[22px] border border-stone-600/20 bg-gradient-to-br from-brand-surface-elevated/95 to-brand-surface/70 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_28px_rgba(0,0,0,0.16)] transition hover:border-brand-accent/25 active:scale-[0.99] ${
        compact
          ? "min-h-[5rem] flex-col justify-center gap-2 p-2.5 text-center"
          : "min-h-[5.5rem] flex-1 gap-3.5 p-4"
      }`}
      aria-label="Адмін-панель"
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-2xl bg-brand-accent/12 text-brand-accent ring-1 ring-brand-accent/20 transition group-hover:bg-brand-accent/18 ${
          compact ? "h-10 w-10" : "h-12 w-12"
        }`}
      >
        <SettingsIcon className={compact ? "h-5 w-5" : "h-6 w-6"} />
      </span>
      <span className={`min-w-0 ${compact ? "w-full px-1" : "flex-1"}`}>
        <span
          className={`block font-semibold leading-tight text-stone-50 ${
            compact ? "text-xs" : "text-[15px]"
          }`}
        >
          Адмін
        </span>
        <span
          className={`mt-0.5 block text-brand-muted ${
            compact ? "truncate text-[10px] leading-snug" : "text-xs"
          }`}
        >
          Керування меню
        </span>
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
  const compactActions = actionCount >= 3;

  return (
    <header className="relative border-b border-stone-600/20 bg-brand-bg">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(196,165,116,0.08),transparent_60%)]" />

      <div className="relative mx-auto max-w-3xl px-4 pb-4 pt-5">
        <div className="flex items-center gap-4">
          <BrandLogo
            src={logoUrl}
            className="h-[5.25rem] w-[5.25rem] shrink-0 object-contain drop-shadow-lg"
          />
          <p className="min-w-0 flex-1 text-[15px] leading-snug text-stone-300 sm:text-base sm:leading-relaxed">
            Оберіть страви та оформіть замовлення за кілька кроків.
          </p>
        </div>

        <div
          className={
            compactActions
              ? "mt-5 grid grid-cols-3 gap-2"
              : "mt-5 flex gap-3"
          }
        >
          {showOrdersLink ? (
            <PremiumActionCard
              onClick={onOpenOrders}
              title="Замовлення"
              hint="Статус подачі"
              badge={ordersCount}
              badgeLabel={`Активних замовлень: ${ordersCount}`}
              compact={compactActions}
              aria-label="Мої замовлення"
            >
              <OrdersIcon className={compactActions ? "h-5 w-5" : "h-6 w-6"} />
            </PremiumActionCard>
          ) : null}

          {showAdminLink ? <AdminActionCard compact={compactActions} /> : null}

          <PremiumActionCard
            onClick={onOpenCart}
            title="Кошик"
            hint={formatPositionLabel(cartCount)}
            badge={cartCount}
            badgeLabel={`Позицій у кошику: ${cartCount}`}
            compact={compactActions}
            aria-label="Відкрити кошик"
          >
            <CartIcon className={compactActions ? "h-5 w-5" : "h-6 w-6"} />
          </PremiumActionCard>
        </div>
      </div>
    </header>
  );
}
