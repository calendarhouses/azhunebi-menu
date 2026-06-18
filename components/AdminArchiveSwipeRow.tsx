"use client";

import { triggerImpact } from "@/lib/haptic";
import { Trash2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent,
} from "react";

const ACTION_WIDTH = 80;
const OPEN_OFFSET = -ACTION_WIDTH;
const SNAP_THRESHOLD = ACTION_WIDTH / 2;

type AdminArchiveSwipeRowProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPress: () => void;
  onDelete: () => void;
  children: ReactNode;
};

export default function AdminArchiveSwipeRow({
  open,
  onOpenChange,
  onPress,
  onDelete,
  children,
}: AdminArchiveSwipeRowProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartX = useRef(0);
  const offsetStart = useRef(0);

  useEffect(() => {
    if (!dragging) {
      setOffsetX(open ? OPEN_OFFSET : 0);
    }
  }, [open, dragging]);

  const snapTo = useCallback(
    (shouldOpen: boolean) => {
      setOffsetX(shouldOpen ? OPEN_OFFSET : 0);
      onOpenChange(shouldOpen);
    },
    [onOpenChange]
  );

  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      dragStartX.current = event.touches[0]?.clientX ?? 0;
      offsetStart.current = offsetX;
      setDragging(true);
    },
    [offsetX]
  );

  const handleTouchMove = useCallback((event: TouchEvent) => {
    const currentX = event.touches[0]?.clientX ?? 0;
    const delta = currentX - dragStartX.current;
    const next = Math.min(0, Math.max(OPEN_OFFSET, offsetStart.current + delta));
    setOffsetX(next);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
    snapTo(offsetX <= -SNAP_THRESHOLD);
  }, [offsetX, snapTo]);

  function handleRowPress() {
    if (offsetX < -8) {
      snapTo(false);
      return;
    }

    onPress();
  }

  function handleDeletePress() {
    triggerImpact("medium");
    onDelete();
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div
        className="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-red-500/90"
        aria-hidden={!open}
      >
        <button
          type="button"
          onClick={handleDeletePress}
          className="flex h-full w-full items-center justify-center text-white transition active:bg-red-600"
          aria-label="Видалити архівний рахунок"
        >
          <Trash2 className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>

      <div
        className={`relative touch-pan-y bg-brand-surface ${
          dragging ? "" : "transition-transform duration-200 ease-out"
        }`}
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <button
          type="button"
          onClick={handleRowPress}
          className="flex w-full items-center justify-between gap-3 border border-white/10 px-4 py-3 text-left transition hover:border-brand-accent/25"
        >
          {children}
        </button>
      </div>
    </div>
  );
}
