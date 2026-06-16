export function formatPrice(price: number) {
  return `${price} ₴`;
}

export default function ImagePlaceholder({ large = false }: { large?: boolean }) {
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-zinc-800 via-[#141a16] to-[var(--brand-bg,#0a120e)] px-4 text-center ${large ? "min-h-[220px]" : ""}`}
    >
      <span className={large ? "text-5xl" : "text-3xl"} aria-hidden>
        🍽
      </span>
      <span className="text-xs font-medium uppercase tracking-[0.18em] text-amber-400/70">
        Аж у небі
      </span>
    </div>
  );
}
