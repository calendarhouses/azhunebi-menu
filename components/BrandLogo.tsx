"use client";

import { useState } from "react";

type BrandLogoProps = {
  src: string;
  alt?: string;
  className?: string;
};

export default function BrandLogo({
  src,
  alt = "Аж у небі",
  className = "h-full w-full object-cover",
}: BrandLogoProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-800 via-stone-900 to-stone-950">
        <span className="text-lg font-semibold tracking-tight text-amber-500/90">
          Аж
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
