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
  useRef,
  useState,
  type ReactNode,
} from "react";

const MENU_VISIBILITY_REFRESH_MS = 5 * 60 * 1000;

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
  const lastMenuFetchAtRef = useRef(0);

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
    // Home shows action skeletons via headerActionsReady; do not hide the whole
    // app again when coming back from admin / settlements.
    if (!needsHeaderActions) {
      setHeaderActionsReady(true);
    }
  }, [needsHeaderActions]);

  // Logo preloader only for the first cold boot — never again on in-app navigation.
  const isFullyReady = isAppReady;

  const refreshMenu = useCallback(async (options?: { force?: boolean }) => {
    const now = Date.now();
    if (
      !options?.force &&
      lastMenuFetchAtRef.current > 0 &&
      now - lastMenuFetchAtRef.current < MENU_VISIBILITY_REFRESH_MS
    ) {
      return;
    }

    const menuData = await fetchMenuData();
    lastMenuFetchAtRef.current = Date.now();
    setItems(menuData.items);
    setCategories(menuData.categories);
    setLogoUrl(menuData.logoUrl);
    setMenuLoadError(menuData.error);
    // Only warm first screen of photos — rest load lazily via DishImage
    void prefetchMenuImages(menuData.items, { limit: 8, timeoutMs: 2500 });
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

      lastMenuFetchAtRef.current = Date.now();
      setItems(menuData.items);
      setCategories(menuData.categories);
      setLogoUrl(menuData.logoUrl);
      setMenuLoadError(menuData.error);
      setShowAdminLink(adminResult.isAdmin);
      setIsAppReady(true);

      void prefetchMenuImages(menuData.items, { limit: 8, timeoutMs: 2500 });
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
      refreshMenu: () => refreshMenu({ force: true }),
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
