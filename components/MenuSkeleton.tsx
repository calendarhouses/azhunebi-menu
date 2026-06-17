function MenuSkeletonItem() {
  return (
    <div className="flex gap-3 rounded-[20px] border border-stone-700/35 bg-brand-surface p-3.5">
      <div className="h-[7.5rem] w-[7.5rem] shrink-0 animate-pulse rounded-2xl bg-stone-800/80" />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="h-5 w-3/5 animate-pulse rounded-lg bg-stone-800/80" />
          <div className="h-5 w-12 animate-pulse rounded-full bg-stone-800/80" />
        </div>
        <div className="h-5 w-16 animate-pulse rounded-lg bg-stone-800/80" />
        <div className="h-9 w-[6.5rem] animate-pulse self-end rounded-xl bg-stone-800/80" />
      </div>
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
