"use client";

import AdminBottomSheet from "@/components/AdminBottomSheet";
import { adminRequest } from "@/lib/adminApi";
import { useFlipList } from "@/lib/useFlipList";
import { FormEvent, useEffect, useMemo, useState } from "react";

type CategoryRow = {
  id: string;
  name: string;
  sort_order: number;
  is_active?: boolean;
};

type Props = {
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
      aria-checked={checked}
      role="switch"
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

const inputCls =
  "w-full rounded-lg border border-white/10 bg-brand-input px-4 py-3 text-sm text-white outline-none transition focus:border-brand-accent focus:ring-1 focus:ring-brand-accent placeholder:text-white/25";

function sortCategories(list: CategoryRow[]) {
  return [...list].sort((a, b) => {
    const aActive = a.is_active !== false;
    const bActive = b.is_active !== false;
    if (aActive !== bActive) return aActive ? -1 : 1;
    return a.sort_order - b.sort_order;
  });
}

export default function AdminCategoriesTab({
  categories,
  onRefresh,
  onStatus,
}: Props) {
  const [localCategories, setLocalCategories] = useState(categories);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [formName, setFormName] = useState("");
  const [formSort, setFormSort] = useState("0");
  const [formActive, setFormActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const sorted = useMemo(
    () => sortCategories(localCategories),
    [localCategories]
  );
  const { setItemRef } = useFlipList(sorted);

  function openAdd() {
    setEditing(null);
    setFormName("");
    setFormSort(String(localCategories.length));
    setFormActive(true);
    setModalOpen(true);
  }

  function openEdit(cat: CategoryRow) {
    setEditing(cat);
    setFormName(cat.name);
    setFormSort(String(cat.sort_order));
    setFormActive(cat.is_active !== false);
    setModalOpen(true);
  }

  function closeModal() {
    if (busy) return;
    setModalOpen(false);
  }

  async function handleToggle(cat: CategoryRow) {
    if (togglingId) return;

    const nextActive = cat.is_active === false;
    setTogglingId(cat.id);
    setLocalCategories((prev) =>
      prev.map((c) =>
        c.id === cat.id ? { ...c, is_active: nextActive } : c
      )
    );

    try {
      await adminRequest("saveCategory", {
        id: cat.id,
        name: cat.name,
        sort_order: cat.sort_order,
        is_active: nextActive,
      });
    } catch (error) {
      setLocalCategories((prev) =>
        prev.map((c) =>
          c.id === cat.id ? { ...c, is_active: !nextActive } : c
        )
      );
      onStatus(error instanceof Error ? error.message : "Помилка оновлення");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setBusy(true);

    try {
      await adminRequest("saveCategory", {
        id: editing?.id ?? undefined,
        name: formName.trim(),
        sort_order: Number(formSort) || 0,
        is_active: formActive,
      });

      onStatus(editing ? "Категорію оновлено" : "Категорію додано");
      setModalOpen(false);
      await onRefresh();
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "Не вдалося зберегти");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    if (!window.confirm(`Видалити категорію «${editing.name}»?`)) return;

    setBusy(true);

    try {
      await adminRequest("deleteCategory", { id: editing.id });
      onStatus("Категорію видалено");
      setModalOpen(false);
      await onRefresh();
    } catch (error) {
      onStatus(
        error instanceof Error ? error.message : "Не вдалося видалити"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openAdd}
        className="mb-4 w-full rounded-xl border border-white/10 bg-brand-surface-elevated py-3 text-sm font-semibold text-brand-accent transition hover:bg-white/10 active:scale-[0.99]"
      >
        + Додати категорію
      </button>

      {sorted.length === 0 ? (
        <p className="py-8 text-center text-sm text-white/30">
          Категорій ще немає
        </p>
      ) : (
        <div className="space-y-2">
          {sorted.map((cat) => {
            const active = cat.is_active !== false;

            return (
              <div
                key={cat.id}
                ref={setItemRef(cat.id)}
                className={`admin-list-card flex items-center justify-between rounded-xl bg-brand-surface p-4 ${
                  active ? "" : "admin-list-card--inactive"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate font-medium transition-colors duration-300 ${
                      active ? "text-white" : "text-white/45"
                    }`}
                  >
                    {cat.name}
                    {!active && (
                      <span className="ml-2 text-xs font-normal text-red-400/80">
                        приховано
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-white/30">
                    Порядок: {cat.sort_order}
                  </p>
                </div>

                <div className="ml-4 flex items-center gap-3">
                  <Toggle
                    checked={active}
                    disabled={togglingId === cat.id}
                    onChange={() => handleToggle(cat)}
                  />
                  <button
                    type="button"
                    onClick={() => openEdit(cat)}
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
            );
          })}
        </div>
      )}

      <AdminBottomSheet
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Редагувати категорію" : "Нова категорія"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/35">
              Назва
            </span>
            <input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Наприклад: Сніданки"
              className={inputCls}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/35">
              Порядок сортування
            </span>
            <input
              type="number"
              value={formSort}
              onChange={(e) => setFormSort(e.target.value)}
              className={inputCls}
            />
          </label>

          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-brand-input px-4 py-3">
            <div>
              <p className="text-sm text-white">Показувати в меню</p>
              <p className="text-xs text-white/30">
                {formActive ? "Видима для гостей" : "Прихована від гостей"}
              </p>
            </div>
            <Toggle
              checked={formActive}
              onChange={() => setFormActive((v) => !v)}
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-brand-accent py-3 text-sm font-semibold text-brand-accent-text transition disabled:opacity-50 active:scale-[0.98]"
          >
            {busy ? "Збереження…" : editing ? "Зберегти зміни" : "Додати категорію"}
          </button>

          {editing && (
            <button
              type="button"
              disabled={busy}
              onClick={handleDelete}
              className="w-full rounded-xl border border-red-500/20 bg-red-500/10 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              Видалити категорію
            </button>
          )}
        </form>
      </AdminBottomSheet>
    </>
  );
}
