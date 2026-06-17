"use client";

import AdminCategoriesTab from "@/components/AdminCategoriesTab";
import AdminDishesTab from "@/components/AdminDishesTab";
import AdminPageSkeleton from "@/components/AdminPageSkeleton";
import {
  adminRequest,
  checkAdminAccess,
  loadAdminPanelData,
} from "@/lib/adminApi";
import { useTelegramApp } from "@/lib/useTelegramApp";
import type { MenuItemRow } from "@/lib/supabase";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Tab = "dishes" | "categories" | "access";

type CategoryRow = {
  id: string;
  name: string;
  sort_order: number;
};

type AdminRow = {
  telegram_username: string;
  created_at: string;
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
    return <AdminPageSkeleton />;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg px-4 text-white">
        <div className="w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-brand-surface p-8 text-center">
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
  ];

  if (canManageAdmins) {
    tabs.push(["access", "Доступ"]);
  }

  return (
    <div className="min-h-screen bg-brand-bg text-white">
      <header className="border-b border-white/10 bg-brand-surface">
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
        {/* iOS-style segmented control */}
        <div className="mb-6 inline-flex bg-zinc-900/50 p-1 rounded-xl">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                tab === id
                  ? "bg-zinc-800 text-amber-500 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
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
          <div className="max-w-lg">
            <AdminDishesTab
              dishes={dishes}
              categories={categories}
              onRefresh={loadAdminData}
              onStatus={setStatusMessage}
            />
          </div>
        )}

        {tab === "categories" && (
          <div className="max-w-lg">
            <AdminCategoriesTab
              categories={categories}
              onRefresh={loadAdminData}
              onStatus={setStatusMessage}
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
              className="space-y-3 rounded-2xl border border-white/10 bg-brand-surface p-5"
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
                className="w-full rounded-xl bg-amber-400 py-2.5 text-sm font-semibold text-amber-950"
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
