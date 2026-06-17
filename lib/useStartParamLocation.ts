"use client";

import {
  parseStartParamLocation,
  type StartParamLocation,
} from "@/lib/startParamLocation";
import { useEffect, useState } from "react";

export function useStartParamLocation() {
  const [location, setLocation] = useState<StartParamLocation | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let attempts = 0;

    const resolve = () => {
      const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
      setLocation(parseStartParamLocation(startParam));
      setReady(true);
    };

    const boot = () => {
      if (window.Telegram?.WebApp?.initDataUnsafe !== undefined) {
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
