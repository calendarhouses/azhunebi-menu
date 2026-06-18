export type StartParamLocation =
  | { type: "cabin"; number: string; label: string }
  | { type: "table"; number: string; label: string };

/** Parses Telegram start_param from QR (c1–c12 cabins, t1–t12 tables). */
export function parseStartParamLocation(
  raw?: string | null
): StartParamLocation | null {
  if (!raw || typeof raw !== "string") {
    return null;
  }

  const match = /^([ct])(\d{1,2})$/i.exec(raw.trim());
  if (!match) {
    return null;
  }

  const kind = match[1].toLowerCase();
  const number = parseInt(match[2], 10);

  if (!Number.isFinite(number) || number < 1 || number > 12) {
    return null;
  }

  const num = String(number);

  if (kind === "c") {
    return { type: "cabin", number: num, label: `Будинок ${num}` };
  }

  if (kind === "t") {
    return { type: "table", number: num, label: `Столик №${num}` };
  }

  return null;
}

export function readStartParamLocation(): StartParamLocation | null {
  if (typeof window === "undefined") {
    return null;
  }

  return parseStartParamLocation(
    window.Telegram?.WebApp?.initDataUnsafe?.start_param
  );
}

export function formatOrderLocationDisplay(
  cabin: string | null | undefined,
  tableNumber: string | null | undefined
): string {
  const cabinLabel = cabin?.trim() || "";
  const tableLabel = tableNumber?.trim() || "";

  if (cabinLabel && tableLabel) {
    return `${cabinLabel} | ${tableLabel}`;
  }

  return cabinLabel || tableLabel || "—";
}

/** Checkout badge copy for table QR links. */
export function formatTableOrderBadge(number: string): string {
  return `Замовлення за столик №${number}`;
}
