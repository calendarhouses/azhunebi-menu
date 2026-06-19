"use client";

import Preloader from "@/components/Preloader";
import { checkAdminAccess } from "@/lib/adminApi";
import { resolveLogoUrl } from "@/lib/branding";
import { prefetchMenuImages } from "@/lib/prefetchMenuImages";
import { fetchMenuData } from "@/lib/menuData";
import { waitForTelegramWebApp } from "@/lib/waitForTelegramWebApp";
import type { MenuItemRow } from "@/lib/supabase";
import { usePathname } from "next/navigation";
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
  isFullyReady: boolean;
  headerActionsReady: boolean;
  setHeaderActionsReady: (ready: boolean) => void;
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
  const pathname = usePathname();
  const needsHeaderActions = pathname === "/";

  const [isAppReady, setIsAppReady] = useState(false);
  const [headerActionsReady, setHeaderActionsReady] = useState(
    !needsHeaderActions
  );
  const [items, setItems] = useState<MenuItemRow[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState(resolveLogoUrl());
  const [showAdminLink, setShowAdminLink] = useState(false);
  const [menuLoadError, setMenuLoadError] = useState(false);

  useEffect(() => {
    setHeaderActionsReady(!needsHeaderActions);
  }, [needsHeaderActions]);

  const isFullyReady =
    isAppReady && (!needsHeaderActions || headerActionsReady);

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

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshMenu();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refreshMenu]);

  const value = useMemo(
    () => ({
      isAppReady,
      isFullyReady,
      headerActionsReady,
      setHeaderActionsReady,
      items,
      categories,
      logoUrl,
      showAdminLink,
      menuLoadError,
      refreshMenu,
    }),
    [
      isAppReady,
      isFullyReady,
      headerActionsReady,
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
      <Preloader logoUrl={logoUrl} isAppReady={isFullyReady} />
    </AppReadyContext.Provider>
  );
}
