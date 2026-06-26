/** Owner-only house (QR / startapp=c0). Guest picker shows 1–12 only. */
export const OWNER_CABIN_NUMBER = 0;

export const MIN_CABIN_NUMBER = 0;
export const MAX_CABIN_NUMBER = 12;
export const MIN_GUEST_CABIN_NUMBER = 1;

export function isValidCabinNumber(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= MIN_CABIN_NUMBER &&
    value <= MAX_CABIN_NUMBER
  );
}

export function isGuestSelectableCabinNumber(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= MIN_GUEST_CABIN_NUMBER &&
    value <= MAX_CABIN_NUMBER
  );
}

export function listAdminCabinNumbers(): number[] {
  return Array.from(
    { length: MAX_CABIN_NUMBER - MIN_CABIN_NUMBER + 1 },
    (_, index) => MIN_CABIN_NUMBER + index
  );
}

export function cabinPickerLabel(cabinNumber: number): string {
  return `Будиночок ${cabinNumber}`;
}

export const GUEST_CABIN_PICKER_OPTIONS = Array.from(
  { length: MAX_CABIN_NUMBER },
  (_, index) => cabinPickerLabel(index + MIN_GUEST_CABIN_NUMBER)
);
