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
  container?: HTMLElement | null,
  behavior: ScrollBehavior = "smooth"
) {
  if (!container) {
    element.scrollIntoView({ block: "nearest", behavior });
    return;
  }

  const viewport = window.visualViewport;
  const elementRect = element.getBoundingClientRect();
  const visibleTop = viewport ? viewport.offsetTop + 72 : 72;
  const visibleBottom = viewport
    ? viewport.offsetTop + viewport.height - 16
    : window.innerHeight - 16;

  if (elementRect.bottom > visibleBottom) {
    container.scrollBy({
      top: elementRect.bottom - visibleBottom + 12,
      behavior,
    });
    return;
  }

  if (elementRect.top < visibleTop) {
    container.scrollBy({
      top: elementRect.top - visibleTop,
      behavior,
    });
  }
}
