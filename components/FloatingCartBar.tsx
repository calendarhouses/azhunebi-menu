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
    <button
      type="button"
      onClick={handleClick}
      className="animate-cart-bar-up fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-4 right-4 z-50 flex items-center justify-between rounded-2xl bg-amber-500 p-4 text-amber-950 shadow-xl shadow-amber-500/20 transition active:scale-[0.99]"
      aria-label={`Відкрити кошик, ${formatPrice(total)}`}
    >
      <span className="text-lg font-bold">Кошик • {formatPrice(total)}</span>
      <span className="flex items-center gap-1 text-sm font-semibold">
        Оформити
        <span aria-hidden>→</span>
      </span>
    </button>
  );
}
