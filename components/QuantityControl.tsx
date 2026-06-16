"use client";

import type { MouseEvent } from "react";

type QuantityControlProps = {
  quantity: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  addLabel?: string;
  stopPropagation?: boolean;
  hideAdd?: boolean;
  className?: string;
};

const STEPPER_WIDTH = "w-[6.5rem]";

const stepperButtonClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-surface-elevated text-lg leading-none text-brand-accent transition-all duration-200 hover:bg-brand-surface active:scale-95";

function Stepper({
  quantity,
  onIncrement,
  onDecrement,
  stopPropagation,
  visible = true,
}: {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  stopPropagation?: boolean;
  visible?: boolean;
}) {
  function wrapClick(handler: () => void) {
    return (event: MouseEvent) => {
      if (stopPropagation) {
        event.stopPropagation();
      }
      handler();
    };
  }

  return (
    <div
      className={`flex h-9 items-center transition-all duration-200 ${
        visible ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
      }`}
      onClick={stopPropagation ? (event) => event.stopPropagation() : undefined}
    >
      <button
        type="button"
        onClick={wrapClick(onDecrement)}
        aria-label="Зменшити кількість"
        tabIndex={visible ? 0 : -1}
        className={stepperButtonClass}
      >
        −
      </button>
      <span className="w-8 shrink-0 text-center text-sm font-medium tabular-nums text-stone-100">
        {quantity}
      </span>
      <button
        type="button"
        onClick={wrapClick(onIncrement)}
        aria-label="Збільшити кількість"
        tabIndex={visible ? 0 : -1}
        className={stepperButtonClass}
      >
        +
      </button>
    </div>
  );
}

export default function QuantityControl({
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
  addLabel = "Додати",
  stopPropagation = false,
  hideAdd = false,
  className = "",
}: QuantityControlProps) {
  function wrapClick(handler: () => void) {
    return (event: MouseEvent) => {
      if (stopPropagation) {
        event.stopPropagation();
      }
      handler();
    };
  }

  if (hideAdd) {
    return (
      <div className={`${STEPPER_WIDTH} ${className}`}>
        <Stepper
          quantity={quantity}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
          stopPropagation={stopPropagation}
        />
      </div>
    );
  }

  const showStepper = quantity > 0;

  return (
    <div className={`relative h-9 ${STEPPER_WIDTH} ${className}`}>
      <div className="grid h-9 place-items-center">
        <button
          type="button"
          onClick={wrapClick(onAdd)}
          aria-hidden={showStepper}
          tabIndex={showStepper ? -1 : 0}
          className={`col-start-1 row-start-1 inline-flex h-9 w-full items-center justify-center rounded-xl bg-brand-accent text-xs font-semibold text-brand-accent-text transition-all duration-200 hover:bg-brand-accent-hover active:scale-[0.98] ${
            showStepper
              ? "pointer-events-none scale-95 opacity-0"
              : "scale-100 opacity-100"
          }`}
        >
          {addLabel}
        </button>

        <div
          className={`col-start-1 row-start-1 ${showStepper ? "" : "pointer-events-none"}`}
        >
          <Stepper
            quantity={quantity}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
            stopPropagation={stopPropagation}
            visible={showStepper}
          />
        </div>
      </div>
    </div>
  );
}
