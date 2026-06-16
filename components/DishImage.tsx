"use client";

import ImagePlaceholder from "@/components/ImagePlaceholder";
import {
  isImageCached,
  isImageFailed,
  markImageCached,
  markImageFailed,
} from "@/lib/imageLoadCache";
import { memo, useEffect, useRef, useState } from "react";

type DishImageProps = {
  src: string;
  alt: string;
  className?: string;
  large?: boolean;
  compact?: boolean;
};

function DishImage({
  src,
  alt,
  className = "",
  large = false,
  compact = false,
}: DishImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(() => Boolean(src && isImageCached(src)));
  const [hasError, setHasError] = useState(() => Boolean(src && isImageFailed(src)));

  useEffect(() => {
    if (!src) {
      setLoaded(false);
      setHasError(false);
      return;
    }

    setLoaded(isImageCached(src));
    setHasError(isImageFailed(src));
  }, [src]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img || !src || hasError) {
      return;
    }

    if (img.complete && img.naturalWidth > 0) {
      markImageCached(src);
      setLoaded(true);
    }
  }, [hasError, src]);

  if (!src || hasError) {
    return (
      <div className={`relative h-full w-full overflow-hidden ${className}`}>
        <ImagePlaceholder large={large} compact={compact} />
      </div>
    );
  }

  const showImage = loaded;

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-brand-surface-elevated ${className}`}
    >
      {!showImage ? (
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
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
          showImage ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

export default memo(DishImage);
