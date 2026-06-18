export default function RunningTabSkeleton() {
  return (
    <div
      className="animate-pulse rounded-[22px] border border-white/10 bg-brand-surface/80 p-4 backdrop-blur-xl"
      aria-hidden
    >
      <div className="mb-3 h-3 w-28 rounded bg-brand-surface-elevated" />
      <div className="mb-2 h-10 w-40 rounded bg-brand-surface-elevated" />
      <div className="h-3 w-32 rounded bg-brand-surface-elevated/70" />
    </div>
  );
}
