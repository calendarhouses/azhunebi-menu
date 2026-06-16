"use client";

import type { CartItem } from "@/lib/cart";

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  comment: string;
  locationNote: string;
  onCommentChange: (value: string) => void;
  onLocationNoteChange: (value: string) => void;
  onIncrement: (itemId: string) => void;
  onDecrement: (itemId: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  total: number;
};

function formatPrice(price: number) {
  return `${price} ₴`;
}

export default function CartDrawer({
  open,
  onClose,
  cart,
  comment,
  locationNote,
  onCommentChange,
  onLocationNoteChange,
  onIncrement,
  onDecrement,
  onSubmit,
  isSubmitting,
  total,
}: CartDrawerProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Закрити кошик"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="animate-sheet-up relative max-h-[85vh] overflow-hidden rounded-t-3xl border border-white/10 bg-[#101812] shadow-2xl">
        <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-white/20" />

        <div className="flex items-center justify-between px-5 pb-3 pt-4">
          <h2 className="text-lg font-semibold text-white">Ваше замовлення</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/70"
          >
            Закрити
          </button>
        </div>

        <div className="max-h-[45vh] overflow-y-auto px-5">
          {cart.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/50">
              Кошик порожній
            </p>
          ) : (
            <ul className="space-y-3">
              {cart.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {item.name}
                    </p>
                    <p className="text-xs text-white/45">
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onDecrement(item.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white"
                    >
                      −
                    </button>
                    <span className="min-w-5 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onIncrement(item.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-[#0a120e]"
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3 border-t border-white/10 px-5 py-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/45">
              Номер столика / будиночка
            </span>
            <input
              type="text"
              value={locationNote}
              onChange={(event) => onLocationNoteChange(event.target.value)}
              placeholder="Наприклад: Столик 5"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-400/40"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/45">
              Коментар до замовлення
            </span>
            <textarea
              value={comment}
              onChange={(event) => onCommentChange(event.target.value)}
              placeholder="Поб побажання, алергії..."
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-400/40"
            />
          </label>

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm text-white/55">Разом</span>
            <span className="text-lg font-semibold text-amber-300">
              {formatPrice(total)}
            </span>
          </div>

          <button
            type="button"
            disabled={cart.length === 0 || isSubmitting}
            onClick={onSubmit}
            className="w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-semibold text-[#0a120e] transition enabled:hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Відправка..." : "Оформити замовлення"}
          </button>
        </div>
      </div>
    </div>
  );
}
