const BRAND_BG = "#221f1c";
const BRAND_ACCENT = "#c4a574";

export function waitForTelegramWebApp(
  maxAttempts = 20,
  delayMs = 250
): Promise<void> {
  return new Promise((resolve) => {
    let attempts = 0;

    const tryInit = () => {
      const webApp = window.Telegram?.WebApp;

      if (webApp) {
        webApp.ready();
        webApp.expand();
        webApp.disableVerticalSwipes?.();
        webApp.setHeaderColor(BRAND_BG);
        webApp.setBackgroundColor(BRAND_BG);

        const root = document.documentElement;
        root.style.setProperty("--brand-bg", BRAND_BG);
        root.style.setProperty("--brand-accent", BRAND_ACCENT);
        root.style.setProperty(
          "--tg-viewport-stable-height",
          `${webApp.viewportStableHeight || window.innerHeight}px`
        );

        const theme = webApp.themeParams;
        if (theme.bg_color) {
          root.style.setProperty("--tg-bg", theme.bg_color);
        }
        if (theme.text_color) {
          root.style.setProperty("--tg-text", theme.text_color);
        }
        if (theme.hint_color) {
          root.style.setProperty("--tg-hint", theme.hint_color);
        }
        if (theme.button_color) {
          root.style.setProperty("--tg-button", theme.button_color);
        }

        resolve();
        return;
      }

      if (attempts >= maxAttempts) {
        resolve();
        return;
      }

      attempts += 1;
      window.setTimeout(tryInit, delayMs);
    };

    tryInit();
  });
}
