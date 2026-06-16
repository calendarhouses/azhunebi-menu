import MenuSkeleton from "@/components/MenuSkeleton";

export default function AdminPageSkeleton() {
  return (
    <div className="min-h-screen bg-brand-bg px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-brand-surface-elevated" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-10 w-24 animate-pulse rounded-full bg-brand-surface-elevated"
            />
          ))}
        </div>
        <MenuSkeleton count={2} />
      </div>
    </div>
  );
}
