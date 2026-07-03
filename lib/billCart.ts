import type { OrderCartLine } from "@/lib/orderStatus";

export function normalizeCartLine(line: OrderCartLine): OrderCartLine {
  const quantity = Math.max(0, Math.floor(Number(line.quantity) || 0));
  const price = Number(line.price) || 0;
  const settledQuantity = Math.min(
    quantity,
    Math.max(0, Math.floor(Number(line.settledQuantity) || 0))
  );

  const normalized: OrderCartLine = {
    id: String(line.id || ""),
    name: String(line.name || "Страва"),
    price,
    quantity,
  };

  if (settledQuantity > 0) {
    normalized.settledQuantity = settledQuantity;
  }

  return normalized;
}

export function normalizeCart(cart: OrderCartLine[]): OrderCartLine[] {
  return cart.map(normalizeCartLine).filter((line) => line.quantity > 0);
}

export function getLineOpenQuantity(line: OrderCartLine): number {
  const quantity = Math.max(0, Number(line.quantity) || 0);
  const settled = Math.min(
    quantity,
    Math.max(0, Number(line.settledQuantity) || 0)
  );
  return Math.max(0, quantity - settled);
}

export function getLineOpenTotal(line: OrderCartLine): number {
  return getLineOpenQuantity(line) * (Number(line.price) || 0);
}

export function getOrderOpenTotal(cart: OrderCartLine[]): number {
  return normalizeCart(cart).reduce(
    (sum, line) => sum + getLineOpenTotal(line),
    0
  );
}

export function getOrderFullTotal(cart: OrderCartLine[]): number {
  return normalizeCart(cart).reduce(
    (sum, line) => sum + line.quantity * line.price,
    0
  );
}

export function isOrderFullySettled(cart: OrderCartLine[]): boolean {
  const lines = normalizeCart(cart);
  if (lines.length === 0) {
    return true;
  }

  return lines.every((line) => getLineOpenQuantity(line) === 0);
}
