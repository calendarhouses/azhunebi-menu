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
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

type Tab = "dishes" | "categories" | "access";

type CategoryRow = {
  id: string;
  name: string;
  sort_order: number;
  is_active?: boolean;
};

type AdminRow = {
  telegram_username: string;
  created_at: string;
};

const inputCls =
  "w-full rounded-lg border border-white/10 bg-brand-input px-4 py-3 text-sm text-white outline-none transition focus:border-brand-accent focus:ring-1 focus:ring-brand-accent placeholder:text-white/25";

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
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ----- toast -----
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  useTelegramApp({ backVisible: true, onBack: () => window.history.back() });

  const loadAdminData = useCallback(async () => {
    setLoadError(null);

    try {
      const data = await loadAdminPanelData();
      setDishes((data.dishes || []) as MenuItemRow[]);
      setCategories((data.categories || []) as CategoryRow[]);
      setAdmins((data.admins || []) as AdminRow[]);
      setCanManageAdmins(Boolean(data.canManageAdmins));
      setTelegramUsername(data.username || null);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Не вдалося завантажити дані"
      );
    }
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

    try {
      await adminRequest("addAdmin", { username: newAdminUsername.trim() });
      setNewAdminUsername("");
      showToast("Адміна додано");
      await loadAdminData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Не вдалося додати адміна");
    } finally {
      setBusy(false);
    }
  }

  async function removeAdmin(username: string) {
    if (!window.confirm(`Прибрати доступ у @${username}?`)) return;

    try {
      await adminRequest("removeAdmin", { username });
      showToast("Доступ забрано");
      await loadAdminData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Не вдалося прибрати доступ");
    }
  }

  if (!sessionReady) return <AdminPageSkeleton />;

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg px-4 text-white">
        <div className="w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-brand-surface p-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-accent/70">
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

  const tabs: [Tab, string][] = [["dishes", "Страви"], ["categories", "Категорії"]];
  if (canManageAdmins) tabs.push(["access", "Доступ"]);

  return (
    <div className="min-h-screen bg-brand-bg text-white">
      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed left-0 right-0 top-4 z-[200] flex justify-center px-4">
          <div className="animate-toast-in pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl border border-white/10 bg-brand-surface-elevated px-5 py-3 shadow-2xl">
            <span className="text-brand-accent">✓</span>
            <span className="text-sm text-white">{toast}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-1 text-white/40 hover:text-white"
              aria-label="Закрити"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-white/10 bg-brand-surface">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-4 px-4 py-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold uppercase tracking-[0.2em] text-brand-accent/70">
              Адмін панель
            </h1>
            {telegramUsername && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-brand-surface-elevated px-4 py-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-accent/15 text-xs font-semibold text-brand-accent">
                  {telegramUsername.charAt(0).toUpperCase()}
                </span>
                <span className="text-sm text-white/70">@{telegramUsername}</span>
              </div>
            )}
          </div>
          <Link
            href="/"
            className="mt-1 shrink-0 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:text-white"
          >
            До меню
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* iOS-style segmented control */}
        <div className="mb-6 inline-flex rounded-xl bg-white/5 p-1">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition-all duration-300 ${
                tab === id
                  ? "bg-brand-surface-elevated text-brand-accent shadow-sm"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Load error banner with retry */}
        {loadError && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-400">{loadError}</p>
            <button
              type="button"
              onClick={loadAdminData}
              className="ml-4 shrink-0 rounded-lg bg-red-500/20 px-3 py-1 text-xs text-red-300 transition hover:bg-red-500/30"
            >
              Повторити
            </button>
          </div>
        )}

        {tab === "dishes" && (
          <div className="max-w-lg">
            <AdminDishesTab
              dishes={dishes}
              categories={categories}
              onRefresh={loadAdminData}
              onStatus={showToast}
            />
          </div>
        )}

        {tab === "categories" && (
          <div className="max-w-lg">
            <AdminCategoriesTab
              categories={categories}
              onRefresh={loadAdminData}
              onStatus={showToast}
            />
          </div>
        )}

        {tab === "access" && canManageAdmins && (
          <div className="mx-auto flex max-w-lg flex-col gap-6">
            <form
              onSubmit={addAdmin}
              className="space-y-3 rounded-2xl border border-white/10 bg-brand-surface p-5"
            >
              <h2 className="text-lg font-medium">Додати адміна</h2>
              <p className="text-sm text-white/40">
                Лише ці Telegram-нікнейми бачать кнопку ⚙️ і можуть керувати
                меню.
              </p>
              <label className="block">
                <span className="mb-1 block text-xs text-white/40">
                  Telegram @username
                </span>
                <input
                  value={newAdminUsername}
                  onChange={(e) => setNewAdminUsername(e.target.value)}
                  placeholder="наприклад: ivan_petrenko"
                  className={inputCls}
                  required
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-brand-accent py-2.5 text-sm font-semibold text-brand-accent-text disabled:opacity-50"
              >
                {busy ? "Збереження…" : "Додати доступ"}
              </button>
            </form>

            <div className="space-y-3">
              {admins.map((admin) => (
                <div
                  key={admin.telegram_username}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-brand-surface p-4"
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
                    className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-500/20"
                  >
                    Прибрати
                  </button>
                </div>
              ))}

              {admins.length === 0 && (
                <p className="py-4 text-center text-sm text-white/30">
                  Адмінів ще немає
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
