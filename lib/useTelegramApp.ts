"use client";

import { useEffect } from "react";

const BRAND_BG = "#0a120e";
const BRAND_ACCENT = "#fbbf24";

export function useTelegramApp(options?: {
  backVisible?: boolean;
  onBack?: () => void;
}) {
  const backVisible = options?.backVisible ?? false;
  const onBack = options?.onBack;

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) {
      return;
    }

    webApp.ready();
    webApp.expand();
    webApp.disableVerticalSwipes?.();
    webApp.setHeaderColor(BRAND_BG);
    webApp.setBackgroundColor(BRAND_BG);

    const root = document.documentElement;
    root.style.setProperty("--brand-bg", BRAND_BG);
    root.style.setProperty("--brand-accent", BRAND_ACCENT);

    const theme = webApp.themeParams;
    if (theme.bg_color) {
      root.style.setProperty("--tg-bg", theme.bg_color);
    }
    if (theme.text_color) {
      root.style.setProperty("--tg-text", theme.text_color);
    }
    if (theme.hint_color) {
      root.style.setProperty("--tg-hint", theme.hint_color);
    }
    if (theme.button_color) {
      root.style.setProperty("--tg-button", theme.button_color);
    }
  }, []);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp?.BackButton) {
      return;
    }

    if (backVisible && onBack) {
      webApp.BackButton.show();

      const handleBack = () => {
        onBack();
      };

      webApp.onEvent("backButtonClicked", handleBack);

      return () => {
        webApp.offEvent("backButtonClicked", handleBack);
        webApp.BackButton.hide();
      };
    }

    webApp.BackButton.hide();
  }, [backVisible, onBack]);
}
