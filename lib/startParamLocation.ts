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

/** Guest copy: house residence line. */
export function formatResidenceLabel(cabin: string | null | undefined): string {
  const cabinLabel = cabin?.trim() || "";
  return cabinLabel ? `Проживання: ${cabinLabel}` : "";
}

function extractTableNumber(tableLabel: string): string | null {
  const match = /№\s*(\d{1,2})/.exec(tableLabel.trim());
  return match ? match[1] : null;
}

/** Guest copy: table delivery order line. */
export function formatTableOrderBadge(number: string): string {
  return `Замовлення: За столиком №${number}`;
}

/** Kitchen/admin copy: table delivery with house bill, or single location. */
export function formatOrderLocationDisplay(
  cabin: string | null | undefined,
  tableNumber: string | null | undefined
): string {
  const cabinLabel = cabin?.trim() || "";
  const tableLabel = tableNumber?.trim() || "";

  if (tableLabel && cabinLabel) {
    const tableNum = extractTableNumber(tableLabel);
    const deliveryLine = tableNum
      ? `Доставка — ${formatTableOrderBadge(tableNum)}`
      : `Доставка — ${tableLabel}`;
    return `${deliveryLine} (${formatResidenceLabel(cabinLabel)})`;
  }

  if (tableLabel) {
    const tableNum = extractTableNumber(tableLabel);
    return tableNum
      ? `Доставка — ${formatTableOrderBadge(tableNum)}`
      : tableLabel;
  }

  return formatResidenceLabel(cabinLabel) || cabinLabel || "—";
}
