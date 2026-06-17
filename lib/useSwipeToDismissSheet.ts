"use client";

import { useCallback, useRef, useState } from "react";
import type { TouchEvent } from "react";

const DISMISS_THRESHOLD_PX = 72;

export function useSwipeToDismissSheet(onClose: () => void) {
  const dragStartY = useRef(0);
  const isDraggingRef = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const resetDrag = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
    setDragOffset(0);
  }, []);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    dragStartY.current = event.touches[0]?.clientY ?? 0;
    isDraggingRef.current = true;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!isDraggingRef.current) {
      return;
    }

    const currentY = event.touches[0]?.clientY ?? 0;
    const delta = Math.max(0, currentY - dragStartY.current);
    setDragOffset(delta);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (dragOffset >= DISMISS_THRESHOLD_PX) {
      onClose();
    }

    resetDrag();
  }, [dragOffset, onClose, resetDrag]);

  return {
    dragOffset,
    isDragging,
    swipeAreaProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
