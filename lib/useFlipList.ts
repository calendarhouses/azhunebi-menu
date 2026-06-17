"use client";

import { useLayoutEffect, useRef } from "react";

const FLIP_TRANSITION =
  "transform 0.48s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.32s ease, filter 0.32s ease";

/**
 * Animates list item reorder after state changes (FLIP technique).
 * Attach returned ref to each list item wrapper keyed by stable id.
 */
export function useFlipList<T extends { id: string }>(items: T[]) {
  const positionsRef = useRef<Map<string, DOMRect>>(new Map());
  const nodesRef = useRef<Map<string, HTMLElement>>(new Map());

  function setItemRef(id: string) {
    return (node: HTMLElement | null) => {
      if (node) nodesRef.current.set(id, node);
      else nodesRef.current.delete(id);
    };
  }

  useLayoutEffect(() => {
    const prev = positionsRef.current;
    const next = new Map<string, DOMRect>();

    nodesRef.current.forEach((node, id) => {
      next.set(id, node.getBoundingClientRect());
    });

    nodesRef.current.forEach((node, id) => {
      const before = prev.get(id);
      const after = next.get(id);
      if (!before || !after) return;

      const dy = before.top - after.top;
      if (Math.abs(dy) < 2) return;

      node.style.transition = "none";
      node.style.transform = `translateY(${dy}px)`;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          node.style.transition = FLIP_TRANSITION;
          node.style.transform = "";
        });
      });
    });

    positionsRef.current = next;
  }, [items]);

  return { setItemRef };
}
