export function formatPrice(price: number) {
  return `${price} ₴`;
}

type ImagePlaceholderProps = {
  large?: boolean;
  compact?: boolean;
};

export default function ImagePlaceholder({
  large = false,
  compact = false,
}: ImagePlaceholderProps) {
  if (compact) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 text-center">
        <span className="text-lg" aria-hidden>
          🍽
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-center gap-2 overflow-hidden bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 px-4 text-center ${large ? "min-h-[220px]" : ""}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.1),transparent_55%)]" />
      <span className={`relative ${large ? "text-5xl" : "text-3xl"}`} aria-hidden>
        🍽
      </span>
      <span className="relative text-xs font-medium uppercase tracking-[0.18em] text-amber-500/70">
        Аж у небі
      </span>
    </div>
  );
}
