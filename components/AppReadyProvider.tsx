"use client";

import Preloader from "@/components/Preloader";
import { checkAdminAccess } from "@/lib/adminApi";
import { resolveLogoUrl } from "@/lib/branding";
import { prefetchMenuImages } from "@/lib/prefetchMenuImages";
import { fetchMenuData } from "@/lib/menuData";
import { waitForTelegramWebApp } from "@/lib/waitForTelegramWebApp";
import type { MenuItemRow } from "@/lib/supabase";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AppReadyContextValue = {
  isAppReady: boolean;
  items: MenuItemRow[];
  categories: string[];
  logoUrl: string;
  showAdminLink: boolean;
  menuLoadError: boolean;
  refreshMenu: () => Promise<void>;
};

const AppReadyContext = createContext<AppReadyContextValue | null>(null);

export function useAppReady() {
  const context = useContext(AppReadyContext);
  if (!context) {
    throw new Error("useAppReady must be used within AppReadyProvider");
  }
  return context;
}

export default function AppReadyProvider({ children }: { children: ReactNode }) {
  const [isAppReady, setIsAppReady] = useState(false);
  const [items, setItems] = useState<MenuItemRow[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState(resolveLogoUrl());
  const [showAdminLink, setShowAdminLink] = useState(false);
  const [menuLoadError, setMenuLoadError] = useState(false);

  const refreshMenu = useCallback(async () => {
    const menuData = await fetchMenuData();
    setItems(menuData.items);
    setCategories(menuData.categories);
    setLogoUrl(menuData.logoUrl);
    setMenuLoadError(menuData.error);
    void prefetchMenuImages(menuData.items);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      await waitForTelegramWebApp();

      const [menuData, adminResult] = await Promise.all([
        fetchMenuData(),
        checkAdminAccess(),
      ]);

      if (cancelled) {
        return;
      }

      setItems(menuData.items);
      setCategories(menuData.categories);
      setLogoUrl(menuData.logoUrl);
      setMenuLoadError(menuData.error);
      setShowAdminLink(adminResult.isAdmin);
      setIsAppReady(true);

      // Prefetch photos in the background — never blocks the preloader for guests
      void prefetchMenuImages(menuData.items);
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      isAppReady,
      items,
      categories,
      logoUrl,
      showAdminLink,
      menuLoadError,
      refreshMenu,
    }),
    [
      isAppReady,
      items,
      categories,
      logoUrl,
      showAdminLink,
      menuLoadError,
      refreshMenu,
    ]
  );

  return (
    <AppReadyContext.Provider value={value}>
      {children}
      <Preloader logoUrl={logoUrl} isAppReady={isAppReady} />
    </AppReadyContext.Provider>
  );
}
