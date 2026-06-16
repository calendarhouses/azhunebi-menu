import type { TrackedOrder } from "@/lib/orderStatus";

const ORDERS_API_URL = "https://azhunebi-bot.vercel.app/api/orders";

function getInitData() {
  return window.Telegram?.WebApp?.initData || "";
}

export async function fetchActiveOrders(): Promise<TrackedOrder[]> {
  const initData = getInitData();

  if (!initData) {
    return [];
  }

  const response = await fetch(ORDERS_API_URL, {
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

export async function fetchOrderById(orderId: string): Promise<TrackedOrder | null> {
  const initData = getInitData();

  if (!initData) {
    return null;
  }

  const response = await fetch(ORDERS_API_URL, {
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
