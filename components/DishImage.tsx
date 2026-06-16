"use client";

import { useState } from "react";
import ImagePlaceholder from "@/components/ImagePlaceholder";

type DishImageProps = {
  src: string;
  alt: string;
  className?: string;
  large?: boolean;
};

export default function DishImage({
  src,
  alt,
  className = "",
  large = false,
}: DishImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return <ImagePlaceholder large={large} />;
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
