"use client";

import { formatPrice } from "@/components/ImagePlaceholder";
import DishImage from "@/components/DishImage";
import { formatAllergens, formatWeight } from "@/lib/branding";
import type { MenuItemRow } from "@/lib/supabase";
import { triggerImpact } from "@/lib/haptic";

type DishModalProps = {
  item: MenuItemRow | null;
  quantity: number;
  onClose: () => void;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
};

export default function DishModal({
  item,
  quantity,
  onClose,
  onAdd,
  onIncrement,
  onDecrement,
}: DishModalProps) {
  if (!item) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Закрити"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="animate-sheet-up relative max-h-[92vh] overflow-hidden rounded-t-[28px] border border-white/10 bg-[#101812] shadow-2xl">
        <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-white/20" />

        <div className="relative aspect-[16/10] overflow-hidden">
          {item.image_url ? (
            <DishImage
              src={item.image_url}
              alt={item.name}
              large
              className="h-full w-full object-cover"
            />
          ) : (
            <DishImage src="" alt={item.name} large className="h-full w-full" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#101812] via-[#101812]/20 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-black/45 px-3 py-1 text-sm text-white backdrop-blur-sm"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 px-5 pb-8 pt-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              {item.category ? (
                <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-amber-400/75">
                  {item.category}
                </p>
              ) : null}
              <h2 className="text-2xl font-semibold text-white">{item.name}</h2>
            </div>
            <span className="rounded-full bg-amber-400/15 px-3 py-1.5 text-base font-semibold text-amber-300">
              {formatPrice(item.price)}
            </span>
          </div>

          {item.description ? (
            <p className="text-sm leading-7 text-white/60">{item.description}</p>
          ) : (
            <p className="text-sm text-white/40">Смачна страва від нашого шеф-кухаря</p>
          )}

          <div className="flex flex-wrap gap-2">
            {formatWeight(item.weight_g) ? (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/65">
                ⚖ {formatWeight(item.weight_g)}
              </span>
            ) : null}
            {formatAllergens(item.allergens) ? (
              <span className="rounded-full border border-amber-400/15 bg-amber-400/5 px-3 py-1 text-xs text-amber-100/80">
                ⚠ {formatAllergens(item.allergens)}
              </span>
            ) : null}
          </div>

          {quantity === 0 ? (
            <button
              type="button"
              onClick={() => {
                triggerImpact("medium");
                onAdd();
              }}
              className="w-full rounded-2xl bg-amber-400 px-4 py-3.5 text-sm font-semibold text-[#0a120e] transition active:scale-[0.98]"
            >
              Додати до замовлення
            </button>
          ) : (
            <div className="flex items-center justify-between rounded-2xl border border-amber-400/30 bg-amber-400/10 p-2">
              <button
                type="button"
                onClick={() => {
                  triggerImpact("light");
                  onDecrement();
                }}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0a120e]/40 text-xl font-semibold text-amber-300"
              >
                −
              </button>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wide text-white/45">У кошику</p>
                <p className="text-lg font-semibold text-white">{quantity}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerImpact("light");
                  onIncrement();
                }}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400 text-xl font-semibold text-[#0a120e]"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
