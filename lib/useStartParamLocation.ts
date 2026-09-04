"use client";

import {
  parseStartParamLocation,
  type StartParamLocation,
} from "@/lib/startParamLocation";
import { useEffect, useState } from "react";

function readStartParamFromTelegram(): string | null {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) {
    return null;
  }

  const fromUnsafe = webApp.initDataUnsafe?.start_param;
  if (fromUnsafe) {
    return fromUnsafe;
  }

  // Some clients fill start_param only inside signed initData.
  try {
    return new URLSearchParams(webApp.initData || "").get("start_param");
  } catch {
    return null;
  }
}

export function useStartParamLocation() {
  const [location, setLocation] = useState<StartParamLocation | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let attempts = 0;

    const resolve = () => {
      setLocation(parseStartParamLocation(readStartParamFromTelegram()));
      setReady(true);
    };

    const boot = () => {
      const webApp = window.Telegram?.WebApp;
      const hasInitData =
        Boolean(webApp?.initData) ||
        webApp?.initDataUnsafe !== undefined;

      if (hasInitData) {
        // Give Telegram a brief moment to attach start_param on cold open.
        if (
          !readStartParamFromTelegram() &&
          attempts < 8
        ) {
          attempts += 1;
          window.setTimeout(boot, 150);
          return;
        }
        resolve();
        return;
      }

      if (attempts < 20) {
        attempts += 1;
        window.setTimeout(boot, 250);
        return;
      }

      resolve();
    };

    boot();
  }, []);

  return { startParamLocation: location, startParamReady: ready };
}
