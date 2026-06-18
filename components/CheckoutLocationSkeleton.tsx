export default function CheckoutLocationSkeleton() {
  return (
    <div className="animate-pulse space-y-3" aria-busy="true" aria-label="Завантаження локації">
      <div className="h-3 w-40 rounded-full bg-white/10" />
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="h-10 rounded-2xl border border-white/8 bg-brand-input/60"
          />
        ))}
      </div>
    </div>
  );
}
