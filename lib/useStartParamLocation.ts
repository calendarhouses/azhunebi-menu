"use client";

import {
  parseStartParamLocation,
  type StartParamLocation,
} from "@/lib/startParamLocation";
import { useEffect, useState } from "react";

const START_PARAM_STORAGE_KEY = "azhunebi_tg_start_param";
const ACCESS_GRANTED_KEY = "azhunebi_guest_access_granted_at";
const ACCESS_GRANTED_TTL_MS = 18 * 60 * 60 * 1000;

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

export function markGuestAccessGranted() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACCESS_GRANTED_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export function clearGuestAccessGranted() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ACCESS_GRANTED_KEY);
  } catch {
    // ignore
  }
}

export function hasRememberedGuestAccess() {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(ACCESS_GRANTED_KEY);
    const at = Number(raw || 0);
    if (!Number.isFinite(at) || at <= 0) return false;
    return Date.now() - at < ACCESS_GRANTED_TTL_MS;
  } catch {
    return false;
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
      const hasInitData = Boolean(webApp?.initData);

      if (value) {
        resolve(value);
        return;
      }

      // Button re-open has initData but no startapp — don't wait ~3s.
      // Cold Direct Link may need a short moment for start_param to appear.
      const maxAttempts = hasInitData ? 6 : 24;
      if (attempts < maxAttempts) {
        attempts += 1;
        window.setTimeout(boot, hasInitData ? 80 : 150);
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
