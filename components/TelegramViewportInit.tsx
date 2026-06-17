"use client";

import { useEffect } from "react";

export default function TelegramViewportInit() {
  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) {
      return;
    }

    const syncStableViewport = () => {
      const stableHeight = webApp.viewportStableHeight || window.innerHeight;
      document.documentElement.style.setProperty(
        "--tg-viewport-stable-height",
        `${stableHeight}px`
      );
    };

    webApp.ready();
    webApp.expand();
    webApp.disableVerticalSwipes?.();
    syncStableViewport();

    const onViewportChanged = () => {
      syncStableViewport();
    };

    webApp.onEvent("viewportChanged", onViewportChanged);

    return () => {
      webApp.offEvent("viewportChanged", onViewportChanged);
    };
  }, []);

  return null;
}
