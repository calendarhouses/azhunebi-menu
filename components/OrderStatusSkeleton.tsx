export default function OrderStatusSkeleton() {
  return (
    <div className="space-y-5" aria-hidden>
      <div className="rounded-[24px] border border-zinc-800/50 bg-zinc-900 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="h-3 w-28 animate-pulse rounded bg-zinc-800" />
            <div className="h-6 w-40 animate-pulse rounded-lg bg-zinc-800" />
          </div>
          <div className="h-7 w-12 animate-pulse rounded-full bg-zinc-800" />
        </div>

        <div className="mb-5 h-2 animate-pulse rounded-full bg-zinc-800" />

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-zinc-800/50 bg-zinc-950 p-3"
            >
              <div className="mb-2 h-7 w-7 animate-pulse rounded-full bg-zinc-800" />
              <div className="h-3 w-full animate-pulse rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[24px] border border-zinc-800/50 bg-zinc-900 p-5">
        <div className="mb-3 h-3 w-16 animate-pulse rounded bg-zinc-800" />
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-zinc-800" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-800" />
        </div>
        <div className="mt-4 space-y-2 border-t border-zinc-800/50 pt-4">
          <div className="h-4 w-full animate-pulse rounded bg-zinc-800" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}
