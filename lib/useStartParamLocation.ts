"use client";

import {
  parseStartParamLocation,
  type StartParamLocation,
} from "@/lib/startParamLocation";
import { useEffect, useState } from "react";

const START_PARAM_STORAGE_KEY = "azhunebi_tg_start_param";

function persistStartParam(value: string | null | undefined) {
  if (typeof window === "undefined" || !value?.trim()) {
    return;
  }
  try {
    window.sessionStorage.setItem(START_PARAM_STORAGE_KEY, value.trim());
  } catch {
    // ignore quota / private mode
  }
}

function readStoredStartParam(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.sessionStorage.getItem(START_PARAM_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Telegram may expose the QR start value in several places depending on client:
 * - initDataUnsafe.start_param
 * - signed initData start_param
 * - URL query tgWebAppStartParam (Direct Link startapp)
 * - hash launch params
 * - sessionStorage (survives trailing-slash redirects that drop the hash)
 */
export function readTelegramStartParam(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const webApp = window.Telegram?.WebApp;
  const candidates: Array<string | null | undefined> = [];

  if (webApp?.initDataUnsafe?.start_param) {
    candidates.push(webApp.initDataUnsafe.start_param);
  }

  try {
    if (webApp?.initData) {
      candidates.push(new URLSearchParams(webApp.initData).get("start_param"));
    }
  } catch {
    // ignore
  }

  try {
    const query = new URLSearchParams(window.location.search);
    candidates.push(query.get("tgWebAppStartParam"));
    candidates.push(query.get("startapp"));
    candidates.push(query.get("start_param"));
  } catch {
    // ignore
  }

  try {
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    if (hash) {
      const hashParams = new URLSearchParams(hash);
      candidates.push(hashParams.get("tgWebAppStartParam"));
      candidates.push(hashParams.get("startapp"));
      candidates.push(hashParams.get("start_param"));
    }
  } catch {
    // ignore
  }

  candidates.push(readStoredStartParam());

  for (const value of candidates) {
    if (value && value.trim()) {
      const trimmed = value.trim();
      persistStartParam(trimmed);
      return trimmed;
    }
  }

  return null;
}

export function useStartParamLocation() {
  const [location, setLocation] = useState<StartParamLocation | null>(null);
  const [ready, setReady] = useState(false);
  const [startParam, setStartParam] = useState<string | null>(null);

  useEffect(() => {
    let attempts = 0;
    let cancelled = false;

    const resolve = (value: string | null) => {
      if (cancelled) return;
      persistStartParam(value);
      setStartParam(value);
      setLocation(parseStartParamLocation(value));
      setReady(true);
    };

    const boot = () => {
      if (cancelled) return;

      const value = readTelegramStartParam();
      const webApp = window.Telegram?.WebApp;
      const hasTelegramContext =
        Boolean(webApp?.initData) || webApp?.initDataUnsafe !== undefined;

      if (value) {
        resolve(value);
        return;
      }

      // Wait longer for cold startapp launches before giving up.
      if (attempts < 30) {
        attempts += 1;
        window.setTimeout(boot, hasTelegramContext ? 100 : 200);
        return;
      }

      resolve(null);
    };

    boot();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    startParamLocation: location,
    startParamReady: ready,
    startParam,
  };
}
