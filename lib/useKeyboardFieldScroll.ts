"use client";

import { scrollFieldIntoView } from "@/lib/useSheetPresence";
import { useCallback, useEffect, useState, type RefObject } from "react";

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

export function useKeyboardFieldScroll(
  active: boolean,
  containerRef: RefObject<HTMLElement | null>
) {
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

  const handleFieldFocus = useCallback(
    (element: HTMLInputElement | HTMLTextAreaElement) => {
      const scroll = () =>
        scrollFieldIntoView(element, containerRef.current, "smooth");

      window.requestAnimationFrame(scroll);
      window.setTimeout(scroll, 120);
      window.setTimeout(scroll, 320);
    },
    [containerRef]
  );

  const handleFieldBlur = useCallback(() => {}, []);

  return {
    keyboardInset,
    visibleHeight,
    handleFieldFocus,
    handleFieldBlur,
  };
}
