"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

const FOOTER_RESERVE_PX = 96;
const HEADER_RESERVE_PX = 72;

function getVisibleBounds() {
  const viewport = window.visualViewport;

  if (!viewport) {
    return {
      top: HEADER_RESERVE_PX,
      bottom: window.innerHeight - FOOTER_RESERVE_PX,
    };
  }

  return {
    top: viewport.offsetTop + HEADER_RESERVE_PX,
    bottom: viewport.offsetTop + viewport.height - 20,
  };
}

function scrollFocusedField(
  element: HTMLInputElement | HTMLTextAreaElement,
  container: HTMLElement | null
) {
  if (!container) {
    return;
  }

  const { top, bottom } = getVisibleBounds();
  const rect = element.getBoundingClientRect();

  if (rect.bottom > bottom) {
    container.scrollBy({
      top: rect.bottom - bottom + 12,
      behavior: "smooth",
    });
    return;
  }

  if (rect.top < top) {
    container.scrollBy({
      top: rect.top - top,
      behavior: "smooth",
    });
  }
}

export function useKeyboardFieldScroll(
  active: boolean,
  containerRef: RefObject<HTMLElement | null>
) {
  const focusedFieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(
    null
  );
  const [keyboardInset, setKeyboardInset] = useState(0);

  const syncFocusedField = useCallback(() => {
    const field = focusedFieldRef.current;
    const container = containerRef.current;

    if (!field || !container) {
      return;
    }

    scrollFocusedField(field, container);
  }, [containerRef]);

  useEffect(() => {
    if (!active) {
      focusedFieldRef.current = null;
      setKeyboardInset(0);
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }

    const updateViewport = () => {
      const inset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop
      );
      setKeyboardInset(inset);
      syncFocusedField();
    };

    updateViewport();
    viewport.addEventListener("resize", updateViewport);
    viewport.addEventListener("scroll", updateViewport);

    return () => {
      viewport.removeEventListener("resize", updateViewport);
      viewport.removeEventListener("scroll", updateViewport);
    };
  }, [active, syncFocusedField]);

  const handleFieldFocus = useCallback(
    (element: HTMLInputElement | HTMLTextAreaElement) => {
      focusedFieldRef.current = element;

      window.setTimeout(() => syncFocusedField(), 120);
      window.setTimeout(() => syncFocusedField(), 320);
      window.setTimeout(() => syncFocusedField(), 520);
    },
    [syncFocusedField]
  );

  const handleFieldBlur = useCallback(() => {
    window.setTimeout(() => {
      if (document.activeElement instanceof HTMLInputElement) {
        return;
      }
      if (document.activeElement instanceof HTMLTextAreaElement) {
        return;
      }

      focusedFieldRef.current = null;
    }, 0);
  }, []);

  return {
    keyboardInset,
    handleFieldFocus,
    handleFieldBlur,
  };
}
