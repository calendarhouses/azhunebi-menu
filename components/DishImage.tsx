"use client";

import ImagePlaceholder from "@/components/ImagePlaceholder";
import { useEffect, useRef, useState } from "react";

type DishImageProps = {
  src: string;
  alt: string;
  className?: string;
  large?: boolean;
  compact?: boolean;
};

export default function DishImage({
  src,
  alt,
  className = "",
  large = false,
  compact = false,
}: DishImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setHasError(false);
  }, [src]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img || !src) {
      return;
    }

    if (img.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src]);

  if (!src || hasError) {
    return (
      <div className={`relative h-full w-full overflow-hidden ${className}`}>
        <ImagePlaceholder large={large} compact={compact} />
      </div>
    );
  }

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-zinc-800 ${className}`}
    >
      <div
        className={`absolute inset-0 bg-zinc-800 transition-opacity duration-500 ${
          loaded ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setHasError(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
