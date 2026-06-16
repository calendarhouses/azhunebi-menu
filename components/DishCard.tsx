"use client";

import { formatPrice } from "@/components/ImagePlaceholder";
import DishImage from "@/components/DishImage";
import { formatWeight } from "@/lib/branding";
import type { MenuItemRow } from "@/lib/supabase";
import { triggerImpact } from "@/lib/haptic";

type CartControlsProps = {
  quantity: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
};

function CartControls({
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
}: CartControlsProps) {
  if (quantity === 0) {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onAdd();
        }}
        className="mt-1 w-full rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-[#0a120e] transition active:scale-[0.98] hover:bg-amber-300"
      >
        Додати
      </button>
    );
  }

  return (
    <div
      className="mt-1 flex items-center justify-between rounded-xl border border-amber-400/30 bg-amber-400/10 p-1"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        onClick={onDecrement}
        aria-label="Зменшити кількість"
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0a120e]/40 text-lg font-semibold text-amber-300 transition active:scale-95"
      >
        −
      </button>
      <span className="min-w-8 text-center text-sm font-semibold text-white">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        aria-label="Збільшити кількість"
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400 text-lg font-semibold text-[#0a120e] transition active:scale-95"
      >
        +
      </button>
    </div>
  );
}

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

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-lg shadow-black/20 transition hover:border-amber-400/30 hover:bg-white/[0.06]">
      <button
        type="button"
        onClick={handleOpen}
        className="block w-full text-left"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
          {item.image_url ? (
            <DishImage
              src={item.image_url}
              alt={item.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <DishImage src="" alt={item.name} className="h-full w-full" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a120e] via-transparent to-transparent" />
          {item.category ? (
            <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-white/80 backdrop-blur-sm">
              {item.category}
            </span>
          ) : null}
        </div>

        <div className="space-y-2 p-4 pb-0">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold leading-snug text-white">
              {item.name}
            </h3>
            <span className="shrink-0 rounded-full bg-amber-400/15 px-2.5 py-1 text-sm font-medium text-amber-300">
              {formatPrice(item.price)}
            </span>
          </div>

          {item.description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-white/55">
              {item.description}
            </p>
          ) : null}

          {formatWeight(item.weight_g) ? (
            <p className="text-xs text-white/35">⚖ {formatWeight(item.weight_g)}</p>
          ) : null}
        </div>
      </button>

      <div className="p-4 pt-3">
        <CartControls
          quantity={quantity}
          onAdd={onAdd}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
        />
      </div>
    </article>
  );
}
