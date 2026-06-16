type EmptyStateScreenProps = {
  title: string;
  subtitle: string;
  onGoToMenu: () => void;
  actionLabel?: string;
};

export default function EmptyStateScreen({
  title,
  subtitle,
  onGoToMenu,
  actionLabel = "Перейти до меню",
}: EmptyStateScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <div
        className="relative flex h-48 w-48 items-center justify-center overflow-hidden rounded-3xl border border-zinc-800/60 bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 shadow-inner shadow-black/20"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(245,158,11,0.12),transparent_55%)]" />
      </div>

      <h3 className="mt-6 text-xl font-bold text-white">{title}</h3>
      <p className="mt-2 max-w-xs text-sm text-zinc-400">{subtitle}</p>

      <button
        type="button"
        onClick={onGoToMenu}
        className="mt-6 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-amber-950 transition hover:bg-amber-400 active:scale-[0.98]"
      >
        {actionLabel}
      </button>
    </div>
  );
}
