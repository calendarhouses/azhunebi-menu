import { TENANT_ID } from "@/lib/supabase";

const KEY = `azhunebi-known-orders-${TENANT_ID}`;

export function readKnownOrderIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function rememberOrderId(orderId: string) {
  if (typeof window === "undefined" || !orderId) {
    return;
  }

  const current = readKnownOrderIds();
  const next = [orderId, ...current.filter((id) => id !== orderId)].slice(0, 20);
  window.localStorage.setItem(KEY, JSON.stringify(next));
}
