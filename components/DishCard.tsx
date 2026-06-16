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

  const subtitle = [item.description, formatWeight(item.weight_g)]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="flex gap-4 rounded-2xl border border-zinc-800/50 bg-zinc-900 p-4 transition hover:border-zinc-700/60 hover:bg-zinc-900/90">
      <div className="flex min-w-0 flex-1 flex-col">
        <button type="button" onClick={handleOpen} className="text-left">
          <h3 className="font-semibold leading-snug text-zinc-100">
            {item.name}
          </h3>
          {subtitle ? (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-400">
              {subtitle}
            </p>
          ) : null}
        </button>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="font-medium text-white">{formatPrice(item.price)}</span>
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
        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-zinc-800"
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
