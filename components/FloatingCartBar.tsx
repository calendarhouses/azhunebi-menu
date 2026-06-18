"use client";

import { formatPrice } from "@/components/ImagePlaceholder";
import { triggerImpact } from "@/lib/haptic";
import { ChevronRight, ShoppingBag } from "lucide-react";

type FloatingCartBarProps = {
  total: number;
  itemCount: number;
  visible: boolean;
  onOpenCheckout: () => void;
};

export default function FloatingCartBar({
  total,
  itemCount,
  visible,
  onOpenCheckout,
}: FloatingCartBarProps) {
  if (!visible) {
    return null;
  }

  function handleClick() {
    triggerImpact("light");
    onOpenCheckout();
  }

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-24 bg-gradient-to-t from-brand-bg via-brand-bg/80 to-transparent"
        aria-hidden
      />

      <button
        type="button"
        onClick={handleClick}
        className="animate-cart-bar-up fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 z-50 flex items-center gap-3 rounded-[22px] border border-stone-600/20 bg-gradient-to-br from-brand-accent to-brand-accent-hover p-3.5 pl-4 text-brand-accent-text shadow-[0_16px_48px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.2)] transition active:scale-[0.99]"
        aria-label={`Відкрити кошик, ${formatPrice(total)}`}
      >
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black/10 ring-1 ring-black/10">
          <ShoppingBag className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          {itemCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-surface px-1 text-[10px] font-bold text-brand-accent">
              {itemCount > 99 ? "99+" : itemCount}
            </span>
          ) : null}
        </span>

        <span className="min-w-0 flex-1 text-left">
          <span className="block text-xs font-medium uppercase tracking-[0.14em] text-brand-accent-text/75">
            Кошик
          </span>
          <span className="block text-lg font-bold leading-tight">
            {formatPrice(total)}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-1 rounded-xl bg-black/10 px-3 py-2 text-sm font-semibold ring-1 ring-black/10">
          Оформити
          <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
        </span>
      </button>
    </>
  );
}

