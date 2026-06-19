"use client";

import BrandLogo from "@/components/BrandLogo";
import { SettingsIcon } from "@/components/HeaderIcons";
import { ClipboardList, Receipt } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type MenuHeaderProps = {
  logoUrl: string;
  ordersCount?: number;
  showAdminLink?: boolean;
  showOrdersLink?: boolean;
  showBillLink?: boolean;
  actionsLoading?: boolean;
  skeletonCount?: number;
  onOpenOrders?: () => void;
  onOpenBill?: () => void;
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
  if (compact) {
    return (
      <button
        type="button"
        className={`group relative flex min-h-[4.75rem] flex-col items-center justify-center gap-2 rounded-[20px] border border-stone-600/20 bg-gradient-to-br from-brand-surface-elevated/95 to-brand-surface/70 p-2.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_28px_rgba(0,0,0,0.16)] transition hover:border-brand-accent/25 active:scale-[0.99] ${className}`}
        {...props}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-accent/12 text-brand-accent ring-1 ring-brand-accent/20 transition group-hover:bg-brand-accent/18">
          {children}
        </span>
        <span className="text-xs font-semibold leading-tight text-stone-50">
          {title}
        </span>
        <ActionBadge count={badge ?? 0} label={badgeLabel ?? title} />
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`group relative flex min-h-[5.5rem] min-w-0 flex-1 items-center gap-3.5 rounded-[22px] border border-stone-600/20 bg-gradient-to-br from-brand-surface-elevated/95 to-brand-surface/70 p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_28px_rgba(0,0,0,0.16)] transition hover:border-brand-accent/25 active:scale-[0.99] ${className}`}
      {...props}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-accent/12 text-brand-accent ring-1 ring-brand-accent/20 transition group-hover:bg-brand-accent/18">
        {children}
      </span>
      <span className="min-w-0 flex-1 pr-4">
        <span className="block text-[15px] font-semibold leading-tight text-stone-50">
          {title}
        </span>
        {hint ? (
          <span className="mt-0.5 block truncate text-xs text-brand-muted">
            {hint}
          </span>
        ) : null}
      </span>
      <ActionBadge count={badge ?? 0} label={badgeLabel ?? title} />
    </button>
  );
}

function ActionCardSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div
        className="flex min-h-[4.75rem] animate-pulse flex-col items-center justify-center gap-2 rounded-[20px] border border-stone-600/20 bg-gradient-to-br from-brand-surface-elevated/95 to-brand-surface/70 p-2.5"
        aria-hidden
      >
        <div className="h-10 w-10 rounded-2xl bg-stone-800/80" />
        <div className="h-3 w-16 rounded-full bg-stone-800/70" />
      </div>
    );
  }

  return (
    <div
      className="flex min-h-[5.5rem] min-w-0 flex-1 animate-pulse items-center gap-3.5 rounded-[22px] border border-stone-600/20 bg-gradient-to-br from-brand-surface-elevated/95 to-brand-surface/70 p-4"
      aria-hidden
    >
      <div className="h-12 w-12 shrink-0 rounded-2xl bg-stone-800/80" />
      <div className="min-w-0 flex-1 space-y-2 pr-4">
        <div className="h-4 w-24 rounded-full bg-stone-800/80" />
        <div className="h-3 w-32 rounded-full bg-stone-800/70" />
      </div>
    </div>
  );
}

function AdminActionCard({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <Link
        href="/admin"
        className="group relative flex min-h-[4.75rem] flex-col items-center justify-center gap-2 rounded-[20px] border border-stone-600/20 bg-gradient-to-br from-brand-surface-elevated/95 to-brand-surface/70 p-2.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_28px_rgba(0,0,0,0.16)] transition hover:border-brand-accent/25 active:scale-[0.99]"
        aria-label="Адмін-панель"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-accent/12 text-brand-accent ring-1 ring-brand-accent/20 transition group-hover:bg-brand-accent/18">
          <SettingsIcon className="h-5 w-5" />
        </span>
        <span className="text-xs font-semibold leading-tight text-stone-50">
          Адмін
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/admin"
      className="group relative flex min-h-[5.5rem] min-w-0 flex-1 items-center gap-3.5 rounded-[22px] border border-stone-600/20 bg-gradient-to-br from-brand-surface-elevated/95 to-brand-surface/70 p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_28px_rgba(0,0,0,0.16)] transition hover:border-brand-accent/25 active:scale-[0.99]"
      aria-label="Адмін-панель"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-accent/12 text-brand-accent ring-1 ring-brand-accent/20 transition group-hover:bg-brand-accent/18">
        <SettingsIcon className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-tight text-stone-50">
          Адмін
        </span>
        <span className="mt-0.5 block text-xs text-brand-muted">Керування меню</span>
      </span>
    </Link>
  );
}

export default function MenuHeader({
  logoUrl,
  ordersCount = 0,
  showAdminLink = false,
  showOrdersLink = false,
  showBillLink = false,
  actionsLoading = false,
  skeletonCount,
  onOpenOrders,
  onOpenBill,
}: MenuHeaderProps) {
  const actionCount =
    (showOrdersLink ? 1 : 0) + (showBillLink ? 1 : 0) + (showAdminLink ? 1 : 0);
  const placeholderCount = skeletonCount ?? (showAdminLink ? 3 : 2);
  const compactActions = actionsLoading
    ? placeholderCount >= 2
    : actionCount >= 2;

  const gridClass =
    actionsLoading && placeholderCount >= 3
      ? "grid grid-cols-3 gap-2"
      : actionsLoading && placeholderCount === 2
        ? "grid grid-cols-2 gap-2"
        : actionCount >= 3
          ? "grid grid-cols-3 gap-2"
          : compactActions
            ? "grid grid-cols-2 gap-2"
            : "flex gap-3";

  const showActionsRow = actionsLoading || actionCount > 0;

  return (
    <header className="relative border-b border-stone-600/20 bg-brand-bg">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(196,165,116,0.08),transparent_60%)]" />

      <div className="relative mx-auto max-w-3xl px-4 pb-4 pt-5">
        <div className="mb-6 flex items-center gap-4">
          <div className="animate-logo-ring-pulse flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-accent/40">
            <BrandLogo
              src={logoUrl}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex min-w-0 flex-col">
            <h1 className="text-xl font-bold tracking-wide text-zinc-100">АЖ У НЕБІ</h1>
            <p className="text-sm text-zinc-400">Замовлення смачних страв</p>
          </div>
        </div>

        {showActionsRow ? (
          <div
            className={gridClass}
            aria-busy={actionsLoading}
            aria-label={actionsLoading ? "Завантаження кнопок" : undefined}
          >
            {actionsLoading ? (
              Array.from({ length: placeholderCount }).map((_, index) => (
                <ActionCardSkeleton
                  key={index}
                  compact={compactActions}
                />
              ))
            ) : (
              <>
                {showOrdersLink ? (
                  <PremiumActionCard
                    onClick={onOpenOrders}
                    title="Замовлення"
                    hint={compactActions ? undefined : "Статус подачі"}
                    badge={ordersCount}
                    badgeLabel={`Активних замовлень: ${ordersCount}`}
                    compact={compactActions}
                    aria-label="Мої замовлення"
                  >
                    <ClipboardList
                      className={compactActions ? "h-5 w-5" : "h-6 w-6"}
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </PremiumActionCard>
                ) : null}

                {showBillLink ? (
                  <PremiumActionCard
                    onClick={onOpenBill}
                    title="Рахунок"
                    hint={compactActions ? undefined : "Відкритий рахунок"}
                    compact={compactActions}
                    aria-label="Рахунок будинку"
                  >
                    <Receipt
                      className={compactActions ? "h-5 w-5" : "h-6 w-6"}
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </PremiumActionCard>
                ) : null}

                {showAdminLink ? <AdminActionCard compact={compactActions} /> : null}
              </>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
}
