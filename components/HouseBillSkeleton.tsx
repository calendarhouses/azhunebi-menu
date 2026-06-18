export default function HouseBillSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse overflow-hidden rounded-[22px] border border-stone-600/15 bg-brand-surface/60 ${className}`}
      aria-hidden
    >
      <div className="h-0.5 bg-white/5" />
      <div className="flex items-start gap-3 p-4">
        <div className="h-11 w-11 shrink-0 rounded-2xl bg-white/8" />
        <div className="flex-1 space-y-2.5 pt-0.5">
          <div className="h-2.5 w-36 rounded-full bg-white/8" />
          <div className="h-4 w-28 rounded-full bg-white/10" />
          <div className="h-7 w-24 rounded-full bg-white/10" />
        </div>
        <div className="h-9 w-9 shrink-0 rounded-xl bg-white/8" />
      </div>
    </div>
  );
}
