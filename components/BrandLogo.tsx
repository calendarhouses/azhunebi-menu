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
  className = "h-full w-full object-contain",
}: BrandLogoProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <span className="text-xl font-semibold tracking-tight text-amber-500/90">
        Аж
      </span>
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
