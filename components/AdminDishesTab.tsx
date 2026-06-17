"use client";

import AdminDishForm from "@/components/AdminDishForm";
import { adminRequest } from "@/lib/adminApi";
import type { MenuItemRow } from "@/lib/supabase";
import { useState } from "react";

type CategoryRow = { id: string; name: string; sort_order: number };

type Props = {
  dishes: MenuItemRow[];
  categories: CategoryRow[];
  onRefresh: () => Promise<void>;
  onStatus: (msg: string) => void;
};

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? "bg-amber-500" : "bg-zinc-700"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function DishThumb({ src, name }: { src: string | null; name: string }) {
  const [err, setErr] = useState(false);

  if (!src || err) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-lg">
        🍽
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className="h-12 w-12 shrink-0 rounded-lg object-cover"
      onError={() => setErr(true)}
    />
  );
}

export default function AdminDishesTab({
  dishes,
  categories,
  onRefresh,
  onStatus,
}: Props) {
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  // null = add mode, MenuItemRow = edit mode
  const [editingDish, setEditingDish] = useState<MenuItemRow | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const categoryNames = Array.from(
    new Set(dishes.map((d) => d.category).filter(Boolean))
  ) as string[];

  const filtered =
    filterCategory === "all"
      ? dishes
      : dishes.filter((d) => d.category === filterCategory);

  function openAdd() {
    setEditingDish(null);
    setModalOpen(true);
  }

  function openEdit(dish: MenuItemRow) {
    setEditingDish(dish);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  async function handleToggleAvailable(dish: MenuItemRow) {
    if (togglingId) return;
    setTogglingId(dish.id);

    try {
      await adminRequest("saveDish", {
        id: dish.id,
        name: dish.name,
        price: dish.price,
        category: dish.category,
        description: dish.description,
        image_url: dish.image_url,
        allergens: dish.allergens,
        weight_g: dish.weight_g,
        is_available: !dish.is_available,
      });
      await onRefresh();
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "Помилка оновлення");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleSaved() {
    onStatus(editingDish ? "Страву оновлено" : "Страву додано");
    setModalOpen(false);
    await onRefresh();
  }

  async function handleDeleted() {
    onStatus("Страву видалено");
    setModalOpen(false);
    await onRefresh();
  }

  return (
    <>
      {/* Add button */}
      <button
        type="button"
        onClick={openAdd}
        className="mb-4 w-full rounded-xl border border-zinc-700/50 bg-zinc-800 py-3 text-sm font-semibold text-amber-500 transition hover:bg-zinc-700/80 active:scale-[0.99]"
      >
        + Додати нову страву
      </button>

      {/* Category filter pills */}
      {categoryNames.length > 0 && (
        <div className="scrollbar-hide -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <button
            type="button"
            onClick={() => setFilterCategory("all")}
            className={`shrink-0 rounded-xl border px-4 py-1.5 text-sm font-medium transition ${
              filterCategory === "all"
                ? "border-amber-500/50 bg-amber-500/15 text-amber-400"
                : "border-zinc-700 bg-zinc-900 text-zinc-400"
            }`}
          >
            Усі
          </button>
          {categoryNames.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`shrink-0 rounded-xl border px-4 py-1.5 text-sm font-medium transition ${
                filterCategory === cat
                  ? "border-amber-500/50 bg-amber-500/15 text-amber-400"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Dish list */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          {filterCategory === "all"
            ? "Страв ще немає"
            : "У цій категорії немає страв"}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((dish) => (
            <div
              key={dish.id}
              className="flex items-center gap-3 rounded-xl bg-zinc-900 p-3"
            >
              <DishThumb src={dish.image_url} name={dish.name} />

              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-semibold ${
                    dish.is_available ? "text-white" : "text-zinc-500"
                  }`}
                >
                  {dish.name}
                  {!dish.is_available && (
                    <span className="ml-2 text-xs font-normal text-red-400">
                      стоп
                    </span>
                  )}
                </p>
                <p className="text-xs text-zinc-500">
                  {dish.price} ₴
                  {dish.weight_g ? ` • ${dish.weight_g} г` : ""}
                  {dish.category ? ` • ${dish.category}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Toggle
                  checked={dish.is_available}
                  onChange={() => handleToggleAvailable(dish)}
                />
                <button
                  type="button"
                  onClick={() => openEdit(dish)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-400 transition hover:text-amber-400"
                  aria-label="Редагувати"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                    <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom sheet modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <button
            type="button"
            aria-label="Закрити"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />

          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-zinc-900 px-5 pb-safe pt-5 shadow-2xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-700" />

            <h2 className="mb-5 text-base font-semibold text-white">
              {editingDish ? "Редагувати страву" : "Нова страва"}
            </h2>

            <AdminDishForm
              dish={editingDish}
              categories={categories}
              onSaved={handleSaved}
              onDeleted={handleDeleted}
              onClose={closeModal}
            />

            <div className="h-4" />
          </div>
        </div>
      )}
    </>
  );
}
