function MenuSkeletonItem() {
  return (
    <div className="flex gap-4 rounded-2xl border border-zinc-800/50 bg-zinc-900 p-4">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="space-y-2">
          <div className="h-5 w-3/4 animate-pulse rounded-lg bg-zinc-800" />
          <div className="h-4 w-1/2 animate-pulse rounded-lg bg-zinc-800" />
        </div>
        <div className="h-5 w-1/4 animate-pulse rounded-lg bg-zinc-800" />
      </div>
      <div className="h-24 w-24 shrink-0 animate-pulse rounded-lg bg-zinc-800" />
    </div>
  );
}

type MenuSkeletonProps = {
  count?: number;
};

export default function MenuSkeleton({ count = 5 }: MenuSkeletonProps) {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <MenuSkeletonItem key={index} />
      ))}
    </div>
  );
}
