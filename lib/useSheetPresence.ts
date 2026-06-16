"use client";

import { useEffect, useState } from "react";

const SHEET_EXIT_MS = 620;

export function useSheetPresence(open: boolean) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setVisible(true);
        });
      });
      return () => window.cancelAnimationFrame(frame);
    }

    setVisible(false);
    const timeoutId = window.setTimeout(() => {
      setMounted(false);
    }, SHEET_EXIT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [open]);

  return { mounted, visible };
}

export function useStableSheetHeight(active: boolean) {
  const [maxHeight, setMaxHeight] = useState<number>();

  useEffect(() => {
    if (!active) {
      return;
    }

    const webApp = window.Telegram?.WebApp;
    const height = webApp?.viewportStableHeight || window.innerHeight;
    setMaxHeight(Math.round(height * 0.92));
  }, [active]);

  return maxHeight;
}
