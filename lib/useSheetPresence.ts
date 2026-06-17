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

    // Snapshot the viewport height while the keyboard is still closed.
    // On iOS/Telegram (WKWebView) opening the keyboard shrinks BOTH
    // window.innerHeight and visualViewport.height, so comparing them to each
    // other yields ~0 and no compensation happens. Comparing the current
    // height against this baseline gives the real keyboard height instead.
    const baseline = Math.max(
      window.innerHeight,
      viewport?.height ?? 0
    );

    const update = () => {
      const current = Math.min(
        window.innerHeight,
        viewport?.height ?? window.innerHeight
      );
      const next = Math.max(0, Math.round(baseline - current));
      setOffset(next);

      // Undo any document scroll iOS performs to reveal a focused field.
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    };

    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);

    return () => {
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
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
