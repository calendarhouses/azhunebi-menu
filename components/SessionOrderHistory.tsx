"use client";

import { formatPrice } from "@/components/ImagePlaceholder";
import { formatOrderLocationDisplay } from "@/lib/startParamLocation";
import { formatOrderDateTime, type TrackedOrder } from "@/lib/orderStatus";

type SessionOrderHistoryProps = {
  orders: TrackedOrder[];
};

function dayKey(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
  });
}

function statusTone(status: TrackedOrder["status"]) {
  if (status === "pending") {
    return "text-brand-muted";
  }
  if (status === "cancelled") {
    return "text-red-400/80";
  }
  if (status === "ready") {
    return "text-emerald-400/90";
  }
  return "text-stone-300";
}

export default function SessionOrderHistory({ orders }: SessionOrderHistoryProps) {
  if (orders.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-brand-muted">
        Замовлень у рахунку ще немає
      </p>
    );
  }

  const groups = new Map<string, TrackedOrder[]>();

  for (const order of orders) {
    const key = dayKey(order.createdAt);
    const bucket = groups.get(key) || [];
    bucket.push(order);
    groups.set(key, bucket);
  }

  return (
    <div className="space-y-5">
      {[...groups.entries()].map(([day, dayOrders]) => (
        <section key={day}>
          <p className="mb-3 text-center text-xs uppercase tracking-[0.2em] text-brand-muted/80">
            {day}
          </p>

          <div className="space-y-3">
            {dayOrders.map((order) => (
              <article
                key={order.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-brand-input/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              >
                <div className="h-0.5 bg-gradient-to-r from-brand-accent to-brand-accent-hover" />

                <div className="space-y-2 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-100">
                        {formatOrderDateTime(order.createdAt)}
                      </p>
                      <p className="text-xs text-brand-accent/90">
                        {order.userFirstName || "Гість"}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-brand-accent">
                      {formatPrice(order.total)}
                    </p>
                  </div>

                  <div className="space-y-1 border-t border-dashed border-white/10 pt-2">
                    {order.cart.map((line) => (
                      <div
                        key={`${order.id}-${line.id}`}
                        className="flex items-center justify-between gap-3 text-sm text-stone-300"
                      >
                        <span className="min-w-0 truncate">
                          <span className="text-brand-muted/80">
                            {order.userFirstName || "Гість"} ·{" "}
                          </span>
                          {line.name}{" "}
                          <span className="text-brand-muted">×{line.quantity}</span>
                        </span>
                        <span className="shrink-0 text-brand-muted">
                          {formatPrice(line.price * line.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className={`text-xs ${statusTone(order.status)}`}>
                    {order.statusLabel}
                    {order.locationNote || order.tableNumber
                      ? ` · ${formatOrderLocationDisplay(
                          order.locationNote,
                          order.tableNumber
                        )}`
                      : ""}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
