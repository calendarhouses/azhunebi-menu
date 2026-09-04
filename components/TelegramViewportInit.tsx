"use client";

import { useEffect } from "react";

const MIN_REASONABLE_VIEWPORT = 320;

let bestStableHeight: number | null = null;

function collectViewportCandidates(): number[] {
  const webApp = window.Telegram?.WebApp;
  return [
    webApp?.viewportHeight,
    webApp?.viewportStableHeight,
    window.visualViewport?.height,
    window.innerHeight,
  ].filter(
    (value): value is number =>
      typeof value === "number" && Number.isFinite(value) && value > 0
  );
}

/** Tallest sane viewport reading — Android often reports a tiny height before expand. */
export function readTelegramViewportHeight(): number {
  const candidates = collectViewportCandidates();
  const tallest = candidates.length > 0 ? Math.max(...candidates) : 0;
  if (tallest >= MIN_REASONABLE_VIEWPORT) {
    return Math.round(tallest);
  }
  return Math.round(window.innerHeight || 600);
}

export function applyTelegramViewportCssVar(height?: number): number {
  const px = height ?? readTelegramViewportHeight();
  document.documentElement.style.setProperty(
    "--tg-viewport-stable-height",
    `${px}px`
  );
  return px;
}

/**
 * Height for sheets/keyboard math. Keeps the best (largest) stable value seen
 * so a collapsed Android reading never permanently shrinks the UI.
 */
export function getFrozenStableViewportHeight(): number {
  const current = readTelegramViewportHeight();
  if (bestStableHeight === null || current > bestStableHeight) {
    bestStableHeight = current;
  }
  return bestStableHeight;
}

export default function TelegramViewportInit() {
  useEffect(() => {
    const webApp = window.Telegram?.WebApp;

    const sync = () => {
      const height = applyTelegramViewportCssVar();
      if (bestStableHeight === null || height > bestStableHeight) {
        bestStableHeight = height;
      }
    };

    if (webApp) {
      webApp.ready();
      webApp.expand();
      webApp.disableVerticalSwipes?.();
    }

    sync();

    // Android often expands a moment later with a real height.
    const delayed = window.setTimeout(sync, 300);
    const delayedAgain = window.setTimeout(sync, 1000);

    webApp?.onEvent("viewportChanged", sync);
    window.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("resize", sync);

    return () => {
      window.clearTimeout(delayed);
      window.clearTimeout(delayedAgain);
      webApp?.offEvent("viewportChanged", sync);
      window.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("resize", sync);
    };
  }, []);

  return null;
}
