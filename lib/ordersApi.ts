import type { TrackedOrder } from "@/lib/orderStatus";

export const BOT_API_URL = "https://azhunebi-bot.vercel.app/api/order";

function getInitData() {
  return window.Telegram?.WebApp?.initData || "";
}

export function isTelegramWebApp() {
  return Boolean(getInitData());
}

type OrderAction = "list" | "get" | "create" | "attachScreenshot";

function buildRequestBody(
  action: OrderAction,
  payload: Record<string, unknown> = {}
) {
  const payloadInitData =
    typeof payload.initData === "string" ? payload.initData : "";

  const initData =
    (action === "create" || action === "attachScreenshot") && payloadInitData
      ? payloadInitData
      : getInitData();

  return { initData, action, ...payload };
}

async function orderRequest<T>(
  action: OrderAction,
  payload: Record<string, unknown> = {}
): Promise<T> {
  const requestBody = buildRequestBody(action, payload);
  const url = `${BOT_API_URL}?action=${action}`;

  if (
    !requestBody.initData &&
    action !== "create" &&
    action !== "attachScreenshot"
  ) {
    throw new Error("Відкрийте меню через Telegram-бота.");
  }

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
  } catch (error) {
    console.error("[order-api] fetch failed", {
      action,
      url,
      requestBody,
      error,
    });
    throw error instanceof Error
      ? error
      : new Error("Мережева помилка під час відправки запиту.");
  }

  const responseText = await response.text();

  let result: { ok?: boolean; error?: string; version?: string } & T;

  try {
    result = JSON.parse(responseText) as typeof result;
  } catch {
    console.error("[order-api] invalid JSON response", {
      action,
      status: response.status,
      responseText,
      requestBody,
    });
    throw new Error(
      responseText.trim() ||
        `Сервер повернув некоректну відповідь (${response.status})`
    );
  }

  if (!response.ok || !result.ok) {
    const backendError =
      result.error || `Помилка API (${response.status})`;

    console.error("[order-api] backend error", {
      action,
      status: response.status,
      responseText,
      requestBody,
      result,
    });

    throw new Error(backendError);
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
  console.info("[order-api] create order request", {
    url: `${BOT_API_URL}?action=create`,
    payload: { ...payload, initData: "[redacted]" },
  });

  return orderRequest<CreateOrderResponse>("create", payload);
}

/** Sends the rendered receipt card to admin after the order is already created. */
export async function attachOrderScreenshot(payload: {
  initData: string;
  orderId: string;
  screenshot: string;
}) {
  return orderRequest<{ ok: true }>("attachScreenshot", payload);
}

export async function checkBotApiVersion() {
  const response = await fetch(`${BOT_API_URL}`, { method: "GET" });
  const responseText = await response.text();

  try {
    return JSON.parse(responseText);
  } catch {
    console.error("[order-api] health check failed", {
      status: response.status,
      responseText,
    });
    return null;
  }
}
