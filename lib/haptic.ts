export function triggerImpact(style: "light" | "medium" = "light") {
  window.Telegram?.WebApp.HapticFeedback.impactOccurred(style);
}

export function triggerSuccess() {
  window.Telegram?.WebApp.HapticFeedback.notificationOccurred("success");
}

export function triggerError() {
  window.Telegram?.WebApp.HapticFeedback.notificationOccurred("error");
}
