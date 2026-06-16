"use client";

import { formatPrice } from "@/components/ImagePlaceholder";
import DishImage from "@/components/DishImage";
import QuantityControl from "@/components/QuantityControl";
import { formatWeight } from "@/lib/branding";
import type { MenuItemRow } from "@/lib/supabase";
import { triggerImpact } from "@/lib/haptic";

type DishCardProps = {
  item: MenuItemRow;
  quantity: number;
  onOpen: () => void;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
};

export default function DishCard({
  item,
  quantity,
  onOpen,
  onAdd,
  onIncrement,
  onDecrement,
}: DishCardProps) {
  function handleOpen() {
    triggerImpact("light");
    onOpen();
  }

  const weightLabel = formatWeight(item.weight_g);

  return (
    <article className="flex gap-3 overflow-hidden rounded-[20px] border border-stone-700/35 bg-gradient-to-br from-brand-surface via-brand-surface to-brand-surface-elevated/70 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_24px_rgba(0,0,0,0.18)] transition hover:border-stone-600/40">
      <div className="flex min-w-0 flex-1 flex-col">
        <button type="button" onClick={handleOpen} className="text-left">
          <div className="flex items-start justify-between gap-3">
            <h3 className="min-w-0 flex-1 font-semibold leading-snug text-stone-50">
              {item.name}
            </h3>
            {weightLabel ? (
              <span className="shrink-0 rounded-full border border-stone-600/30 bg-stone-900/50 px-2 py-0.5 text-[11px] font-medium tabular-nums text-stone-400">
                {weightLabel}
              </span>
            ) : null}
          </div>
        </button>

        <p className="mt-2 text-base font-semibold tracking-tight text-amber-400">
          {formatPrice(item.price)}
        </p>

        <div className="mt-3">
          <QuantityControl
            quantity={quantity}
            onAdd={onAdd}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
            stopPropagation
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleOpen}
        className="relative h-[7.5rem] w-[7.5rem] shrink-0 overflow-hidden rounded-2xl border border-stone-700/30 bg-brand-surface-elevated shadow-inner shadow-black/20"
        aria-label={`Відкрити ${item.name}`}
      >
        <DishImage
          src={item.image_url || ""}
          alt={item.name}
          compact
          className="h-full w-full object-cover"
        />
      </button>
    </article>
  );
}
