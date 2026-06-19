"use client";

import AdminBottomSheet from "@/components/AdminBottomSheet";
import AdminDishForm from "@/components/AdminDishForm";
import DishImage from "@/components/DishImage";
import { adminRequest } from "@/lib/adminApi";
import { prefetchMenuImages } from "@/lib/prefetchMenuImages";
import type { MenuItemRow } from "@/lib/supabase";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      role="switch"
      aria-checked={checked}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none disabled:opacity-50 ${
        checked ? "bg-brand-accent" : "bg-white/15"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function sortDishes(list: MenuItemRow[]) {
  return [...list].sort((a, b) => a.name.localeCompare(b.name, "uk"));
}

export default function AdminDishesTab({
  dishes,
  categories,
  onRefresh,
  onStatus,
}: Props) {
  const [localDishes, setLocalDishes] = useState(dishes);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<MenuItemRow | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    setLocalDishes(dishes);
    void prefetchMenuImages(dishes);
  }, [dishes]);

  const categoryNames = Array.from(
    new Set(localDishes.map((d) => d.category).filter(Boolean))
  ) as string[];

  const sorted = useMemo(() => sortDishes(localDishes), [localDishes]);

  const visibleDishes = useMemo(() => {
    if (filterCategory === "all") return sorted;
    return sorted.filter((d) => d.category === filterCategory);
  }, [sorted, filterCategory]);

  const isDishVisible = useCallback(
    (dish: MenuItemRow) =>
      filterCategory === "all" || dish.category === filterCategory,
    [filterCategory]
  );

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

    const nextAvailable = !dish.is_available;
    setTogglingId(dish.id);
    setLocalDishes((prev) =>
      prev.map((d) =>
        d.id === dish.id ? { ...d, is_available: nextAvailable } : d
      )
    );

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
        is_available: nextAvailable,
      });
    } catch (error) {
      setLocalDishes((prev) =>
        prev.map((d) =>
          d.id === dish.id ? { ...d, is_available: !nextAvailable } : d
        )
      );
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
      <button
        type="button"
        onClick={openAdd}
        className="mb-4 w-full rounded-xl border border-white/10 bg-brand-surface-elevated py-3 text-sm font-semibold text-brand-accent transition hover:bg-white/10 active:scale-[0.99]"
      >
        + Додати нову страву
      </button>

      {categoryNames.length > 0 && (
        <div className="scrollbar-hide -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <button
            type="button"
            onClick={() => setFilterCategory("all")}
            className={`shrink-0 rounded-xl border px-4 py-1.5 text-sm font-medium transition ${
              filterCategory === "all"
                ? "border-brand-accent/50 bg-brand-accent/15 text-brand-accent"
                : "border-white/10 bg-brand-surface text-white/50"
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
                  ? "border-brand-accent/50 bg-brand-accent/15 text-brand-accent"
                  : "border-white/10 bg-brand-surface text-white/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {localDishes.length === 0 ? (
        <p className="py-8 text-center text-sm text-white/30">Страв ще немає</p>
      ) : (
        <>
          {visibleDishes.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/30">
              У цій категорії немає страв
            </p>
          ) : null}

          <div
            className={`space-y-2 ${visibleDishes.length === 0 ? "hidden" : ""}`}
          >
            {sorted.map((dish) => (
              <div
                key={dish.id}
                className={`admin-list-card flex items-center gap-3 rounded-xl bg-brand-surface p-3 ${
                  dish.is_available ? "" : "admin-list-card--inactive"
                } ${isDishVisible(dish) ? "" : "hidden"}`}
                aria-hidden={!isDishVisible(dish)}
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                  <DishImage
                    src={dish.image_url || ""}
                    alt={dish.name}
                    compact
                    className="h-full w-full"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm font-semibold transition-colors duration-300 ${
                      dish.is_available ? "text-white" : "text-white/45"
                    }`}
                  >
                    {dish.name}
                    {!dish.is_available && (
                      <span className="ml-2 text-xs font-normal text-red-400/80">
                        стоп
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-white/35">
                    {dish.price} ₴
                    {dish.weight_g ? ` • ${dish.weight_g} г` : ""}
                    {dish.category ? ` • ${dish.category}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <Toggle
                    checked={dish.is_available}
                    disabled={togglingId === dish.id}
                    onChange={() => handleToggleAvailable(dish)}
                  />
                  <button
                    type="button"
                    onClick={() => openEdit(dish)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-brand-surface-elevated text-white/40 transition hover:text-brand-accent"
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
        </>
      )}

      <AdminBottomSheet
        open={modalOpen}
        onClose={closeModal}
        title={editingDish ? "Редагувати страву" : "Нова страва"}
      >
        <AdminDishForm
          key={editingDish?.id ?? "new"}
          dish={editingDish}
          categories={categories}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
          onClose={closeModal}
        />
      </AdminBottomSheet>
    </>
  );
}
