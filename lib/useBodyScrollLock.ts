"use client";

import { useEffect } from "react";

const SCROLL_ROOT_SELECTOR = "[data-tg-scroll-root]";

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) {
      return;
    }

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    const scrollRoots = Array.from(
      document.querySelectorAll<HTMLElement>(SCROLL_ROOT_SELECTOR)
    );
    const previousRoots = scrollRoots.map((el) => ({
      el,
      overflow: el.style.overflow,
      touchAction: el.style.touchAction,
    }));

    for (const el of scrollRoots) {
      el.style.overflow = "hidden";
      el.style.touchAction = "none";
    }

    return () => {
      body.style.overflow = previousOverflow;
      for (const item of previousRoots) {
        item.el.style.overflow = item.overflow;
        item.el.style.touchAction = item.touchAction;
      }
    };
  }, [locked]);
}
