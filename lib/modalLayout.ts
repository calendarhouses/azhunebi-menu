import type { CSSProperties } from "react";

/** Locks modal overlay to Telegram stable viewport — ignores keyboard resize. */
export const MODAL_OVERLAY_STYLE: CSSProperties = {
  height: "var(--tg-viewport-stable-height, 100vh)",
  top: 0,
  left: 0,
  position: "fixed",
  width: "100%",
};

/** Scroll area for modal forms: ghost padding + smooth native scroll. */
export const MODAL_FORM_SCROLL_CLASS =
  "checkout-form-scroll min-h-0 flex-1 touch-pan-y overflow-y-auto scroll-smooth overscroll-contain pb-[60vh]";
