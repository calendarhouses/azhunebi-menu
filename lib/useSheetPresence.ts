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

export function scrollFieldIntoView(
  element: HTMLInputElement | HTMLTextAreaElement,
  container?: HTMLElement | null
) {
  window.setTimeout(() => {
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const overflow = elementRect.bottom - containerRect.bottom + 20;

      if (overflow > 0) {
        container.scrollBy({ top: overflow, behavior: "smooth" });
        return;
      }

      const underflow = containerRect.top + 80 - elementRect.top;
      if (underflow > 0) {
        container.scrollBy({ top: -underflow, behavior: "smooth" });
      }

      return;
    }

    element.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, 320);
}
