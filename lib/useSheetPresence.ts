"use client";

import type { CSSProperties } from "react";
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

export function useKeyboardLayoutOffset(active: boolean) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!active) {
      setOffset(0);
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }

    const update = () => {
      const inset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop
      );
      setOffset(inset);
    };

    const onViewportScroll = () => {
      update();
      if (viewport.offsetTop !== 0) {
        window.scrollTo(0, 0);
      }
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", onViewportScroll);

    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", onViewportScroll);
    };
  }, [active]);

  return offset;
}

export function buildSheetPanelTransform(
  keyboardOffset: number,
  dragOffset: number,
  isDragging: boolean
): Pick<CSSProperties, "transform" | "transition"> | undefined {
  const total = keyboardOffset + dragOffset;
  if (total <= 0) {
    return undefined;
  }

  return {
    transform: `translateY(${total}px)`,
    transition: isDragging
      ? "none"
      : "transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
  };
}
