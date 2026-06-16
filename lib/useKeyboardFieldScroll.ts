"use client";

import { useEffect, useState } from "react";

function measureKeyboardInset() {
  const viewport = window.visualViewport;

  if (!viewport) {
    return { inset: 0, visibleHeight: window.innerHeight };
  }

  const inset = Math.max(
    0,
    window.innerHeight - viewport.height - viewport.offsetTop
  );

  return {
    inset,
    visibleHeight: Math.round(viewport.height),
  };
}

export function useKeyboardFieldScroll(active: boolean) {
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [visibleHeight, setVisibleHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!active) {
      setKeyboardInset(0);
      setVisibleHeight(null);
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }

    const updateViewport = () => {
      const { inset, visibleHeight: height } = measureKeyboardInset();
      setKeyboardInset(inset);
      setVisibleHeight(height);
    };

    updateViewport();
    viewport.addEventListener("resize", updateViewport);

    return () => {
      viewport.removeEventListener("resize", updateViewport);
    };
  }, [active]);

  return {
    keyboardInset,
    visibleHeight,
  };
}
