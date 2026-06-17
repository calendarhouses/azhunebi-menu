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
};

function probeBrowserCache(src: string): boolean {
  const probe = new Image();
  probe.src = src;
  return probe.complete && probe.naturalWidth > 0;
}

function DishImage({
  src,
  alt,
  className = "",
  large = false,
  compact = false,
}: DishImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(() => {
    if (!src) return false;
    if (isImageFailed(src)) return false;
    if (isImageCached(src)) return true;
    return probeBrowserCache(src);
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

    if (isImageCached(src) || probeBrowserCache(src)) {
      markImageCached(src);
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

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-brand-surface-elevated ${className}`}
    >
      {!loaded ? (
        <div className="absolute inset-0" aria-hidden>
          <ImagePlaceholder large={large} compact={compact} />
        </div>
      ) : null}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        decoding="async"
        onLoad={() => {
          markImageCached(src);
          setLoaded(true);
        }}
        onError={() => {
          markImageFailed(src);
          setHasError(true);
          setLoaded(false);
        }}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

export default memo(DishImage);
