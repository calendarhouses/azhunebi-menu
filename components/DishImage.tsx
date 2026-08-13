"use client";

import ImagePlaceholder from "@/components/ImagePlaceholder";
import {
  isImageCached,
  isImageFailed,
  markImageCached,
  markImageFailed,
} from "@/lib/imageLoadCache";
import { memo, useLayoutEffect, useRef, useState } from "react";

type DishImageProps = {
  src: string;
  alt: string;
  className?: string;
  large?: boolean;
  compact?: boolean;
  fit?: "contain" | "cover";
  /** Eager only for above-the-fold / selected dish; default lazy to cut Storage egress */
  priority?: boolean;
};

function DishImage({
  src,
  alt,
  className = "",
  large = false,
  compact = false,
  fit = "contain",
  priority = false,
}: DishImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(() => {
    if (!src) return false;
    if (isImageFailed(src)) return false;
    return isImageCached(src);
  });
  const [hasError, setHasError] = useState(() =>
    Boolean(src && isImageFailed(src))
  );

  useLayoutEffect(() => {
    if (!src) {
      setLoaded(false);
      setHasError(false);
      return;
    }

    if (isImageFailed(src)) {
      setHasError(true);
      setLoaded(false);
      return;
    }

    if (isImageCached(src)) {
      setHasError(false);
      setLoaded(true);
      return;
    }

    setHasError(false);
    setLoaded(false);
  }, [src]);

  useLayoutEffect(() => {
    const img = imgRef.current;
    if (!img || !src || hasError || loaded) return;

    if (img.complete && img.naturalWidth > 0) {
      markImageCached(src);
      setLoaded(true);
    }
  }, [hasError, loaded, src]);

  if (!src || hasError) {
    return (
      <div className={`relative h-full w-full overflow-hidden ${className}`}>
        <ImagePlaceholder large={large} compact={compact} />
      </div>
    );
  }

  const objectFitClass = fit === "cover" ? "object-cover" : "object-contain";

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-brand-surface-elevated ${className}`}
    >
      {!loaded ? (
        <div className="absolute inset-0" aria-hidden>
          <ImagePlaceholder large={large} compact={compact} />
        </div>
      ) : null}

      {/* Single <img> only — blur duplicate doubled Storage downloads on cache miss */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        decoding="async"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        onLoad={() => {
          markImageCached(src);
          setLoaded(true);
        }}
        onError={() => {
          markImageFailed(src);
          setHasError(true);
          setLoaded(false);
        }}
        className={`relative z-10 h-full w-full ${objectFitClass} transition-opacity duration-200 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

export default memo(DishImage);
