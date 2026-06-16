"use client";

import {
  formatDateTimeLocalValue,
  KITCHEN_ORDER_END_HOUR,
  KITCHEN_ORDER_START_HOUR,
  minScheduledDateTimeLocal,
} from "@/lib/orderStatus";
import { useMemo } from "react";

type ScheduledDateTimePickerProps = {
  value: string;
  onChange: (value: string) => void;
};

function parseDateTimeLocal(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    0,
    0
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateChip(date: Date) {
  const weekday = date.toLocaleDateString("uk-UA", { weekday: "short" }).replace(".", "");
  const dayMonth = date.toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "short",
  });

  return `${weekday}, ${dayMonth.replace(".", "")}`;
}

function formatTimeChip(date: Date) {
  return date.toLocaleTimeString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dateKey(date: Date) {
  return formatDateTimeLocalValue(date).slice(0, 10);
}

function buildTimeSlots(day: Date, minAllowed: Date) {
  const slots: Date[] = [];
  const start = new Date(day);
  start.setHours(KITCHEN_ORDER_START_HOUR, 0, 0, 0);

  const end = new Date(day);
  end.setHours(KITCHEN_ORDER_END_HOUR, 0, 0, 0);

  for (
    let cursor = new Date(start);
    cursor <= end;
    cursor.setMinutes(cursor.getMinutes() + 15)
  ) {
    const slot = new Date(cursor);
    if (slot.getTime() >= minAllowed.getTime()) {
      slots.push(slot);
    }
  }

  return slots;
}

const chipBase =
  "shrink-0 rounded-2xl border px-4 py-2.5 text-sm font-medium transition active:scale-[0.98]";
const chipInactive =
  "border-stone-600/25 bg-brand-input text-brand-muted hover:border-stone-500/35 hover:text-stone-200";
const chipActive =
  "border-brand-accent/50 bg-brand-accent/15 text-stone-50 shadow-[inset_0_0_0_1px_rgba(201,165,116,0.25)]";

export default function ScheduledDateTimePicker({
  value,
  onChange,
}: ScheduledDateTimePickerProps) {
  const minAllowed = useMemo(
    () => parseDateTimeLocal(minScheduledDateTimeLocal()) ?? new Date(),
    []
  );

  const dateOptions = useMemo(() => {
    const options: Date[] = [];
    const cursor = new Date(minAllowed);
    cursor.setHours(0, 0, 0, 0);

    for (let index = 0; index < 21; index += 1) {
      const day = new Date(cursor);
      day.setDate(cursor.getDate() + index);

      const slots = buildTimeSlots(day, minAllowed);
      if (slots.length > 0) {
        options.push(day);
      }
    }

    return options;
  }, [minAllowed]);

  const selectedDate =
    parseDateTimeLocal(value) ??
    parseDateTimeLocal(minScheduledDateTimeLocal()) ??
    minAllowed;

  const selectedDateKey = dateKey(selectedDate);

  const timeOptions = useMemo(() => {
    const day = dateOptions.find((option) => dateKey(option) === selectedDateKey);
    if (!day) {
      return buildTimeSlots(selectedDate, minAllowed);
    }

    return buildTimeSlots(day, minAllowed);
  }, [dateOptions, minAllowed, selectedDate, selectedDateKey]);

  const selectedTimeKey = formatDateTimeLocalValue(selectedDate).slice(11, 16);

  function selectDate(day: Date) {
    const slots = buildTimeSlots(day, minAllowed);
    const next = slots[0] ?? day;
    onChange(formatDateTimeLocalValue(next));
  }

  function selectTime(slot: Date) {
    onChange(formatDateTimeLocalValue(slot));
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-brand-muted">
          Дата
        </p>
        <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {dateOptions.map((day) => {
            const active = dateKey(day) === selectedDateKey;

            return (
              <button
                key={dateKey(day)}
                type="button"
                onClick={() => selectDate(day)}
                className={`${chipBase} ${active ? chipActive : chipInactive}`}
              >
                {formatDateChip(day)}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-brand-muted">
          Час
        </p>
        <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {timeOptions.map((slot) => {
            const timeKey = formatDateTimeLocalValue(slot).slice(11, 16);
            const active = timeKey === selectedTimeKey;

            return (
              <button
                key={timeKey}
                type="button"
                onClick={() => selectTime(slot)}
                className={`${chipBase} tabular-nums ${active ? chipActive : chipInactive}`}
              >
                {formatTimeChip(slot)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
