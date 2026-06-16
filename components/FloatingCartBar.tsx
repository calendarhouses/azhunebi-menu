"use client";

import { formatPrice } from "@/components/ImagePlaceholder";
import { triggerImpact } from "@/lib/haptic";

type FloatingCartBarProps = {
  total: number;
  visible: boolean;
  onOpenCheckout: () => void;
};

export default function FloatingCartBar({
  total,
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
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-20 bg-gradient-to-t from-brand-bg/95 via-brand-bg/55 to-transparent backdrop-blur-[2px]"
        aria-hidden
      />

      <button
        type="button"
        onClick={handleClick}
        className="animate-cart-bar-up fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-4 right-4 z-50 flex items-center justify-between rounded-2xl border border-white/10 bg-brand-accent/92 p-4 text-brand-accent-text shadow-[0_12px_40px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-xl transition active:scale-[0.99]"
        aria-label={`Відкрити кошик, ${formatPrice(total)}`}
      >
        <span className="text-lg font-bold">Кошик • {formatPrice(total)}</span>
        <span className="flex items-center gap-1 text-sm font-semibold">
          Оформити
          <span aria-hidden>→</span>
        </span>
      </button>
    </>
  );
}
