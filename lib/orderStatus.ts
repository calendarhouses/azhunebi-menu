export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "cancelled";

export type OrderCartLine = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type TrackedOrder = {
  id: string;
  status: OrderStatus;
  total: number;
  cart: OrderCartLine[];
  comment: string | null;
  locationNote: string | null;
  paymentMethod: string | null;
  scheduledFor: string | null;
  readyAt: string | null;
  createdAt: string;
  updatedAt: string;
  statusLabel: string;
};

export const ORDER_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "pending", label: "Очікуємо підтвердження" },
  { key: "accepted", label: "Прийнято" },
  { key: "preparing", label: "Готуємо" },
  { key: "ready", label: "Готово" },
];

export function getStepIndex(status: OrderStatus) {
  if (status === "cancelled") {
    return -1;
  }

  const index = ORDER_STEPS.findIndex((step) => step.key === status);
  if (index >= 0) {
    return index;
  }

  // Legacy orders created before "accepted" existed.
  if (status === "preparing") {
    return 2;
  }

  return 0;
}

export function formatOrderDateTime(isoDate?: string | null) {
  if (!isoDate) {
    return "";
  }

  return new Date(isoDate).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function hasActiveOrders(orders: TrackedOrder[]) {
  return orders.some((order) => order.status !== "ready");
}

export function getStatusChangeMessage(
  previous: OrderStatus,
  next: OrderStatus
) {
  const labels: Record<OrderStatus, string> = {
    pending: "Очікуємо підтвердження",
    accepted: "Замовлення прийнято",
    preparing: "Готуємо для вас",
    ready: "Замовлення готове!",
    cancelled: "Замовлення скасовано",
  };

  if (previous === next) {
    return null;
  }

  return labels[next] || "Статус оновлено";
}

export function minScheduledDateTimeLocal() {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}
