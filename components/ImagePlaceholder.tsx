import { memo } from "react";

export function formatPrice(price: number) {
  return `${price} ₴`;
}

type ImagePlaceholderProps = {
  large?: boolean;
  compact?: boolean;
};

function PlaceholderArt({ compact = false }: { compact?: boolean }) {
  const size = compact ? 24 : 44;

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      aria-hidden
      className="relative opacity-80"
    >
      <path
        d="M8 44c8-10 16-12 24-12s16 2 24 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-brand-accent/35"
      />
      <path
        d="M14 44 22 28l8 8 10-14 10 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        className="text-brand-accent/55"
      />
      <circle cx="48" cy="18" r="4" fill="currentColor" className="text-brand-accent/25" />
    </svg>
  );
}

function ImagePlaceholder({
  large = false,
  compact = false,
}: ImagePlaceholderProps) {
  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-brand-surface-elevated via-brand-input to-brand-bg ${
        large ? "min-h-[220px]" : ""
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,rgba(196,165,116,0.16),transparent_62%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.03),transparent_45%)]" />
      <div className="relative flex flex-col items-center gap-1.5 px-1">
        <PlaceholderArt compact={compact} />
        <span
          className={`font-medium uppercase tracking-[0.18em] text-brand-accent/60 ${
            compact ? "text-[8px] leading-tight" : "text-[10px]"
          }`}
        >
          Фото скоро
        </span>
      </div>
    </div>
  );
}

export default memo(ImagePlaceholder);
