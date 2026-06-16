"use client";

import { resolveLogoUrl } from "@/lib/branding";
import {
  adminRequest,
  checkAdminAccess,
  loadAdminPanelData,
  uploadAdminLogo,
} from "@/lib/adminApi";
import { useTelegramApp } from "@/lib/useTelegramApp";
import type { MenuItemRow } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Tab = "dishes" | "categories" | "brand" | "access";

type CategoryRow = {
  id: string;
  name: string;
  sort_order: number;
};

type AdminRow = {
  telegram_username: string;
  created_at: string;
};

const emptyDishForm = {
  name: "",
  price: "",
  category: "",
  description: "",
  image_url: "",
  allergens: "",
  weight_g: "",
  is_available: true,
};

export default function AdminPage() {
  const [sessionReady, setSessionReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canManageAdmins, setCanManageAdmins] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState<string | null>(null);
  const [accessError, setAccessError] = useState("");
  const [tab, setTab] = useState<Tab>("dishes");
  const [dishes, setDishes] = useState<MenuItemRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [logoUrl, setLogoUrl] = useState(resolveLogoUrl());
  const [dishForm, setDishForm] = useState(emptyDishForm);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categorySort, setCategorySort] = useState("0");
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useTelegramApp({ backVisible: true, onBack: () => window.history.back() });

  const loadAdminData = useCallback(async () => {
    const data = await loadAdminPanelData();
    setDishes((data.dishes || []) as MenuItemRow[]);
    setCategories((data.categories || []) as CategoryRow[]);
    setAdmins((data.admins || []) as AdminRow[]);
    setCanManageAdmins(Boolean(data.canManageAdmins));
    setTelegramUsername(data.username || null);
    setLogoUrl(resolveLogoUrl(data.settings));
  }, []);

  const verifyAccess = useCallback(async () => {
    setAccessError("");

    if (!window.Telegram?.WebApp?.initData) {
      setIsAdmin(false);
      setSessionReady(true);
      setAccessError("Відкрийте адмін-панель через Telegram-бота.");
      return;
    }

    const access = await checkAdminAccess();
    setIsAdmin(access.isAdmin);
    setCanManageAdmins(access.canManageAdmins);
    setTelegramUsername(access.username);
    setSessionReady(true);

    if (!access.isAdmin) {
      setAccessError("У вас немає доступу. Зверніться до власника комплексу.");
      return;
    }

    if (!access.username) {
      setAccessError(
        "У вашому Telegram-профілі немає @username. Додайте його в налаштуваннях Telegram."
      );
      setIsAdmin(false);
      return;
    }

    await loadAdminData();
  }, [loadAdminData]);

  useEffect(() => {
    verifyAccess();
  }, [verifyAccess]);

  function resetDishForm() {
    setDishForm(emptyDishForm);
    setEditingDishId(null);
  }

  function startEditDish(item: MenuItemRow) {
    setEditingDishId(item.id);
    setDishForm({
      name: item.name,
      price: String(item.price),
      category: item.category || "",
      description: item.description || "",
      image_url: item.image_url || "",
      allergens: item.allergens || "",
      weight_g: item.weight_g ? String(item.weight_g) : "",
      is_available: item.is_available,
    });
    setTab("dishes");
  }

  async function saveDish(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatusMessage("");

    try {
      await adminRequest("saveDish", {
        id: editingDishId || undefined,
        name: dishForm.name.trim(),
        price: Number(dishForm.price),
        category: dishForm.category.trim() || null,
        description: dishForm.description.trim() || null,
        image_url: dishForm.image_url.trim() || null,
        allergens: dishForm.allergens.trim() || null,
        weight_g: dishForm.weight_g ? Number(dishForm.weight_g) : null,
        is_available: dishForm.is_available,
      });

      setStatusMessage(editingDishId ? "Страву оновлено" : "Страву додано");
      resetDishForm();
      await loadAdminData();
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Не вдалося зберегти страву"
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteDish(id: string) {
    if (!window.confirm("Видалити цю страву?")) {
      return;
    }

    try {
      await adminRequest("deleteDish", { id });
      setStatusMessage("Страву видалено");
      await loadAdminData();
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Не вдалося видалити страву"
      );
    }
  }

  async function saveCategory(event: FormEvent) {
    event.preventDefault();
    setBusy(true);

    try {
      await adminRequest("saveCategory", {
        name: categoryName.trim(),
        sort_order: Number(categorySort) || 0,
      });

      setCategoryName("");
      setCategorySort("0");
      setStatusMessage("Категорію додано");
      await loadAdminData();
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Не вдалося додати категорію"
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteCategory(id: string) {
    if (!window.confirm("Видалити категорію?")) {
      return;
    }

    try {
      await adminRequest("deleteCategory", { id });
      setStatusMessage("Категорію видалено");
      await loadAdminData();
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Не вдалося видалити категорію"
      );
    }
  }

  async function uploadLogo(file: File) {
    setBusy(true);
    setStatusMessage("");

    try {
      const result = await uploadAdminLogo(file);
      setLogoUrl(result.logoUrl);
      setStatusMessage("Лого оновлено");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Не вдалося завантажити лого"
      );
    } finally {
      setBusy(false);
    }
  }

  async function addAdmin(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatusMessage("");

    try {
      await adminRequest("addAdmin", { username: newAdminUsername.trim() });
      setNewAdminUsername("");
      setStatusMessage("Адміна додано");
      await loadAdminData();
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Не вдалося додати адміна"
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeAdmin(username: string) {
    if (!window.confirm(`Прибрати доступ у @${username}?`)) {
      return;
    }

    try {
      await adminRequest("removeAdmin", { username });
      setStatusMessage("Доступ забрано");
      await loadAdminData();
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Не вдалося прибрати доступ"
      );
    }
  }

  if (!sessionReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a120e] text-white">
        Завантаження...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a120e] px-4 text-white">
        <div className="w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-[#101812] p-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-400/70">
            Аж у небі
          </p>
          <h1 className="text-2xl font-semibold">Адмін-панель</h1>
          <p className="text-sm text-white/55">{accessError}</p>
          <Link
            href="/"
            className="inline-flex rounded-xl bg-white/10 px-4 py-2 text-sm"
          >
            Назад до меню
          </Link>
        </div>
      </div>
    );
  }

  const tabs: [Tab, string][] = [
    ["dishes", "Страви"],
    ["categories", "Категорії"],
    ["brand", "Бренд"],
  ];

  if (canManageAdmins) {
    tabs.push(["access", "Доступ"]);
  }

  return (
    <div className="min-h-screen bg-[#0a120e] text-white">
      <header className="border-b border-white/10 bg-[#101812]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-400/70">
              Admin
            </p>
            <h1 className="text-xl font-semibold">Аж у небі — панель</h1>
            {telegramUsername ? (
              <p className="text-sm text-white/45">@{telegramUsername}</p>
            ) : null}
          </div>
          <Link
            href="/"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm"
          >
            До меню
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-full px-4 py-2 text-sm ${
                tab === id
                  ? "bg-amber-400 text-[#0a120e]"
                  : "border border-white/10 bg-white/[0.04]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {statusMessage ? (
          <p className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            {statusMessage}
          </p>
        ) : null}

        {tab === "dishes" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-3">
              {dishes.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{item.name}</h3>
                      {!item.is_available ? (
                        <span className="rounded-full bg-red-400/15 px-2 py-0.5 text-xs text-red-200">
                          приховано
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-white/50">
                      {item.category || "Без категорії"} • {item.price} ₴
                      {item.weight_g ? ` • ${item.weight_g} г` : ""}
                    </p>
                    {item.allergens ? (
                      <p className="mt-1 text-xs text-amber-100/70">
                        Алергени: {item.allergens}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEditDish(item)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-sm"
                    >
                      Редагувати
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteDish(item.id)}
                      className="rounded-lg border border-red-400/20 px-3 py-1.5 text-sm text-red-200"
                    >
                      Видалити
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={saveDish}
              className="space-y-3 rounded-2xl border border-white/10 bg-[#101812] p-5"
            >
              <h2 className="text-lg font-medium">
                {editingDishId ? "Редагувати страву" : "Нова страва"}
              </h2>

              {(
                [
                  ["name", "Назва", "text"],
                  ["price", "Ціна (₴)", "number"],
                  ["category", "Категорія", "text"],
                  ["image_url", "URL фото", "text"],
                  ["weight_g", "Вага (г)", "number"],
                  ["allergens", "Алергени", "text"],
                ] as const
              ).map(([field, label, type]) => (
                <label key={field} className="block">
                  <span className="mb-1 block text-xs text-white/45">{label}</span>
                  <input
                    type={type}
                    value={dishForm[field]}
                    onChange={(event) =>
                      setDishForm((prev) => ({
                        ...prev,
                        [field]: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm outline-none focus:border-amber-400/40"
                    required={field === "name" || field === "price"}
                  />
                </label>
              ))}

              <label className="block">
                <span className="mb-1 block text-xs text-white/45">Опис</span>
                <textarea
                  value={dishForm.description}
                  onChange={(event) =>
                    setDishForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm outline-none focus:border-amber-400/40"
                />
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={dishForm.is_available}
                  onChange={(event) =>
                    setDishForm((prev) => ({
                      ...prev,
                      is_available: event.target.checked,
                    }))
                  }
                />
                Показувати в меню
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 rounded-xl bg-amber-400 py-2.5 text-sm font-semibold text-[#0a120e]"
                >
                  {editingDishId ? "Зберегти" : "Додати"}
                </button>
                {editingDishId ? (
                  <button
                    type="button"
                    onClick={resetDishForm}
                    className="rounded-xl border border-white/10 px-4 py-2.5 text-sm"
                  >
                    Скасувати
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        )}

        {tab === "categories" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-sm text-white/45">
                      Порядок: {category.sort_order}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteCategory(category.id)}
                    className="rounded-lg border border-red-400/20 px-3 py-1.5 text-sm text-red-200"
                  >
                    Видалити
                  </button>
                </div>
              ))}
            </div>

            <form
              onSubmit={saveCategory}
              className="space-y-3 rounded-2xl border border-white/10 bg-[#101812] p-5"
            >
              <h2 className="text-lg font-medium">Нова категорія</h2>
              <label className="block">
                <span className="mb-1 block text-xs text-white/45">Назва</span>
                <input
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm outline-none"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-white/45">Порядок</span>
                <input
                  type="number"
                  value={categorySort}
                  onChange={(event) => setCategorySort(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm outline-none"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-amber-400 py-2.5 text-sm font-semibold text-[#0a120e]"
              >
                Додати категорію
              </button>
            </form>
          </div>
        )}

        {tab === "brand" && (
          <div className="max-w-lg space-y-5 rounded-2xl border border-white/10 bg-[#101812] p-6">
            <h2 className="text-lg font-medium">Лого бренду</h2>
            <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-2xl border border-white/10">
              <Image
                src={logoUrl}
                alt="Logo"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <p className="text-sm text-white/45">
              Завантажте PNG/JPG. Файл збережеться в Supabase Storage.
            </p>
            <input
              type="file"
              accept="image/*"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  uploadLogo(file);
                }
              }}
              className="block w-full text-sm text-white/60 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#0a120e]"
            />
          </div>
        )}

        {tab === "access" && canManageAdmins && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <p className="text-sm text-white/45">
                Лише ці Telegram-нікнейми бачать кнопку ⚙️ і можуть керувати
                меню.
              </p>
              {admins.map((admin) => (
                <div
                  key={admin.telegram_username}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div>
                    <p className="font-medium">@{admin.telegram_username}</p>
                    <p className="text-xs text-white/40">
                      Додано:{" "}
                      {new Date(admin.created_at).toLocaleDateString("uk-UA")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAdmin(admin.telegram_username)}
                    className="rounded-lg border border-red-400/20 px-3 py-1.5 text-sm text-red-200"
                  >
                    Прибрати
                  </button>
                </div>
              ))}
            </div>

            <form
              onSubmit={addAdmin}
              className="space-y-3 rounded-2xl border border-white/10 bg-[#101812] p-5"
            >
              <h2 className="text-lg font-medium">Додати адміна</h2>
              <label className="block">
                <span className="mb-1 block text-xs text-white/45">
                  Telegram @username
                </span>
                <input
                  value={newAdminUsername}
                  onChange={(event) => setNewAdminUsername(event.target.value)}
                  placeholder="наприклад: ivan_petrenko"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm outline-none"
                  required
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-amber-400 py-2.5 text-sm font-semibold text-[#0a120e]"
              >
                Додати доступ
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
