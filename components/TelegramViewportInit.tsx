"use client";

import { useEffect } from "react";

let frozenStableHeight: number | null = null;

export function getFrozenStableViewportHeight(): number {
  if (frozenStableHeight !== null) {
    return frozenStableHeight;
  }

  const webApp = window.Telegram?.WebApp;
  frozenStableHeight = webApp?.viewportStableHeight || window.innerHeight;
  return frozenStableHeight;
}

export default function TelegramViewportInit() {
  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) {
      return;
    }

    webApp.ready();
    webApp.expand();
    webApp.disableVerticalSwipes?.();

    const stableHeight = getFrozenStableViewportHeight();
    document.documentElement.style.setProperty(
      "--tg-viewport-stable-height",
      `${stableHeight}px`
    );
  }, []);

  return null;
}
