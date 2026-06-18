"use client";

import { useEffect, useRef, useState } from "react";

type AnimatedTotalProps = {
  value: number;
  className?: string;
};

export default function AnimatedTotal({ value, className }: AnimatedTotalProps) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;

    if (from === to) {
      return;
    }

    const duration = 480;
    const start = performance.now();
    let frame = 0;

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        prevRef.current = to;
      }
    }

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span className={className}>
      {display.toLocaleString("uk-UA")}
    </span>
  );
}
