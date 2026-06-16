export default function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
      <div className="aspect-[4/3] bg-white/10" />
      <div className="space-y-3 p-4">
        <div className="flex justify-between gap-3">
          <div className="h-5 w-2/3 rounded-lg bg-white/10" />
          <div className="h-6 w-16 rounded-full bg-white/10" />
        </div>
        <div className="h-4 w-full rounded bg-white/10" />
        <div className="h-10 w-full rounded-xl bg-white/10" />
      </div>
    </div>
  );
}
