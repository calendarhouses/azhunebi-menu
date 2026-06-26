import { listAdminCabinNumbers } from "@/lib/cabins";

export default function AdminSessionsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-hidden>
      {listAdminCabinNumbers().map((cabinNumber) => (
        <div
          key={cabinNumber}
          className="animate-pulse rounded-2xl border border-white/10 bg-brand-surface p-4"
        >
          <div className="mb-3 h-4 w-20 rounded bg-brand-surface-elevated" />
          <div className="mb-2 h-8 w-24 rounded bg-brand-surface-elevated" />
          <div className="h-3 w-16 rounded bg-brand-surface-elevated/70" />
        </div>
      ))}
    </div>
  );
}
