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
    return { type: "cabin", number: num, label: `Будиночок ${num}` };
  }

  if (kind === "t") {
    return { type: "table", number: num, label: `За столиком №${num}` };
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

/** Normalizes stored cabin text to guest-facing «Будиночок N». */
export function formatCabinDisplay(
  cabin: string | null | undefined,
  cabinNumber?: number | string | null
): string {
  if (cabinNumber != null && cabinNumber !== "") {
    return `Будиночок ${cabinNumber}`;
  }

  const raw = cabin?.trim() || "";
  if (!raw) {
    return "";
  }

  const match = /(\d{1,2})/.exec(raw);
  if (match) {
    return `Будиночок ${match[1]}`;
  }

  return raw;
}

/** @deprecated Use formatCabinDisplay */
export function formatResidenceLabel(cabin: string | null | undefined): string {
  return formatCabinDisplay(cabin);
}

function extractTableNumber(tableLabel: string): string | null {
  const match = /№\s*(\d{1,2})/.exec(tableLabel.trim());
  return match ? match[1] : null;
}

/** Guest/kitchen copy: table delivery line. */
export function formatTableDeliveryLabel(number: string | number): string {
  return `За столиком №${number}`;
}

/** @deprecated Use formatTableDeliveryLabel */
export function formatTableOrderBadge(number: string): string {
  return formatTableDeliveryLabel(number);
}

/** Table + cabin, table-only, or cabin-only location for UI and notifications. */
export function formatOrderLocationDisplay(
  cabin: string | null | undefined,
  tableNumber: string | null | undefined
): string {
  const cabinLabel = cabin?.trim() || "";
  const tableLabel = tableNumber?.trim() || "";

  if (tableLabel && cabinLabel) {
    const tableNum = extractTableNumber(tableLabel);
    const tableLine = tableNum
      ? formatTableDeliveryLabel(tableNum)
      : tableLabel;
    return `${tableLine} (${formatCabinDisplay(cabinLabel)})`;
  }

  if (tableLabel) {
    const tableNum = extractTableNumber(tableLabel);
    return tableNum ? formatTableDeliveryLabel(tableNum) : tableLabel;
  }

  return formatCabinDisplay(cabinLabel) || "—";
}
