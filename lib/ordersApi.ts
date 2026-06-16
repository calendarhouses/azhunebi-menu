import type { TrackedOrder } from "@/lib/orderStatus";

export const BOT_API_URL = "https://azhunebi-bot.vercel.app/api/order";

function getInitData() {
  return window.Telegram?.WebApp?.initData || "";
}

export function isTelegramWebApp() {
  return Boolean(getInitData());
}

export async function fetchActiveOrders(): Promise<TrackedOrder[]> {
  const initData = getInitData();

  if (!initData) {
    return [];
  }

  const response = await fetch(BOT_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData, action: "list" }),
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(result.error || "Failed to load orders");
  }

  return (result.orders || []) as TrackedOrder[];
}

export async function fetchOrderById(
  orderId: string
): Promise<TrackedOrder | null> {
  const initData = getInitData();

  if (!initData) {
    return null;
  }

  const response = await fetch(BOT_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData, action: "get", orderId }),
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    return null;
  }

  return result.order as TrackedOrder;
}

export type CreateOrderResponse = {
  ok: true;
  orderId: string;
  order: TrackedOrder;
};

export async function createOrderRequest(payload: {
  initData: string;
  cart: { id: string; quantity: number }[];
  comment?: string;
  locationNote: string;
  paymentMethod: string;
  scheduledFor?: string;
}) {
  const response = await fetch(BOT_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(result.error || "Order request failed");
  }

  return result as CreateOrderResponse;
}
