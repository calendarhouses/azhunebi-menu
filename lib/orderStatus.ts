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
  tableNumber: string | null;
  paymentMethod: string | null;
  scheduledFor: string | null;
  readyAt: string | null;
  createdAt: string;
  updatedAt: string;
  statusLabel: string;
  userFirstName?: string;
  telegramUserId?: number | null;
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

const SCHEDULED_MIN_LEAD_MS = 60 * 60 * 1000;
const SCHEDULED_PICKER_BUFFER_MS = 5 * 60 * 1000;
export const KITCHEN_ORDER_START_HOUR = 9;
export const KITCHEN_ORDER_END_HOUR = 21;

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function formatDateTimeLocalValue(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function roundUpToQuarterHour(date: Date) {
  const rounded = new Date(date);
  rounded.setSeconds(0, 0);
  const remainder = rounded.getMinutes() % 15;
  if (remainder !== 0) {
    rounded.setMinutes(rounded.getMinutes() + (15 - remainder));
  }
  return rounded;
}

function isWithinKitchenHours(date: Date) {
  const minutes = date.getHours() * 60 + date.getMinutes();
  return (
    minutes >= KITCHEN_ORDER_START_HOUR * 60 &&
    minutes <= KITCHEN_ORDER_END_HOUR * 60
  );
}

export function getNextKitchenSlot(from = new Date()) {
  const minLead = new Date(from.getTime() + SCHEDULED_MIN_LEAD_MS);
  let candidate = roundUpToQuarterHour(
    new Date(from.getTime() + SCHEDULED_MIN_LEAD_MS + SCHEDULED_PICKER_BUFFER_MS)
  );

  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (candidate.getTime() < minLead.getTime()) {
      candidate = roundUpToQuarterHour(
        new Date(candidate.getTime() + 15 * 60 * 1000)
      );
      continue;
    }

    if (!isWithinKitchenHours(candidate)) {
      if (candidate.getHours() >= KITCHEN_ORDER_END_HOUR) {
        candidate.setDate(candidate.getDate() + 1);
        candidate.setHours(KITCHEN_ORDER_START_HOUR, 0, 0, 0);
      } else {
        candidate.setHours(KITCHEN_ORDER_START_HOUR, 0, 0, 0);
      }
      continue;
    }

    return candidate;
  }

  return candidate;
}

export function minScheduledDateTimeLocal() {
  return formatDateTimeLocalValue(getNextKitchenSlot());
}

export function dateTimeLocalToIso(localValue: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(localValue.trim());

  if (!match) {
    throw new Error("Невірний формат часу подачі");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Невірний час подачі");
  }

  if (date.getTime() < Date.now() + SCHEDULED_MIN_LEAD_MS) {
    throw new Error("Час подачі має бути щонайменше через 1 годину від зараз");
  }

  const timeMinutes = hour * 60 + minute;
  const openMinutes = KITCHEN_ORDER_START_HOUR * 60;
  const closeMinutes = KITCHEN_ORDER_END_HOUR * 60;

  if (timeMinutes < openMinutes || timeMinutes > closeMinutes) {
    throw new Error("Замовлення можна запланувати лише з 9:00 до 21:00");
  }

  return date.toISOString();
}

export function validateScheduledDateTimeLocal(localValue: string) {
  dateTimeLocalToIso(localValue);
}
