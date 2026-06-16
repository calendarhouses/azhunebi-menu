import type { TrackedOrder } from "@/lib/orderStatus";

export const BOT_API_URL = "https://azhunebi-bot.vercel.app/api/order";

function getInitData() {
  return window.Telegram?.WebApp?.initData || "";
}

export function isTelegramWebApp() {
  return Boolean(getInitData());
}

async function orderRequest<T>(
  action: "list" | "get" | "create",
  payload: Record<string, unknown> = {}
): Promise<T> {
  const initData = getInitData();

  if (!initData && action !== "create") {
    throw new Error("Відкрийте меню через Telegram-бота.");
  }

  const response = await fetch(`${BOT_API_URL}?action=${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData, action, ...payload }),
  });

  let result: { ok?: boolean; error?: string; version?: string } & T;

  try {
    result = await response.json();
  } catch {
    throw new Error(`Сервер повернув некоректну відповідь (${response.status})`);
  }

  if (!response.ok || !result.ok) {
    throw new Error(result.error || `Помилка API (${response.status})`);
  }

  return result;
}

export async function fetchActiveOrders(): Promise<TrackedOrder[]> {
  if (!getInitData()) {
    return [];
  }

  const result = await orderRequest<{ orders: TrackedOrder[] }>("list");
  return result.orders || [];
}

export async function fetchOrderById(
  orderId: string
): Promise<TrackedOrder | null> {
  if (!getInitData()) {
    return null;
  }

  try {
    const result = await orderRequest<{ order: TrackedOrder }>("get", {
      orderId,
    });
    return result.order;
  } catch {
    return null;
  }
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
  return orderRequest<CreateOrderResponse>("create", payload);
}

export async function checkBotApiVersion() {
  const response = await fetch(`${BOT_API_URL}`, { method: "GET" });
  try {
    return await response.json();
  } catch {
    return null;
  }
}
