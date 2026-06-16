"use client";

import Lottie from "lottie-react";
import { useEffect, useState } from "react";

const LOTTIE_BASE_PATH = "/azhunebi-menu";

type EmptyStateScreenProps = {
  title: string;
  subtitle: string;
  onGoToMenu: () => void;
  actionLabel?: string;
  variant?: "default" | "cart";
};

export default function EmptyStateScreen({
  title,
  subtitle,
  onGoToMenu,
  actionLabel = "Перейти до меню",
  variant = "default",
}: EmptyStateScreenProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const useLottie = variant === "cart";

  useEffect(() => {
    if (!useLottie) {
      return;
    }

    let cancelled = false;

    fetch(`${LOTTIE_BASE_PATH}/empty.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load Lottie animation");
        }
        return response.json();
      })
      .then((data) => {
        if (!cancelled) {
          setAnimationData(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAnimationData(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [useLottie]);

  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      {useLottie ? (
        animationData ? (
          <Lottie
            animationData={animationData}
            loop
            className="mx-auto mb-6 h-48 w-48 drop-shadow-2xl"
          />
        ) : (
          <div className="mx-auto mb-6 h-48 w-48 animate-pulse rounded-full bg-zinc-800/50" />
        )
      ) : (
        <div
          className="relative mb-6 flex h-48 w-48 items-center justify-center overflow-hidden rounded-3xl border border-zinc-800/60 bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 shadow-inner shadow-black/20"
          aria-hidden
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(245,158,11,0.12),transparent_55%)]" />
        </div>
      )}

      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="mt-2 max-w-xs text-sm text-zinc-400">{subtitle}</p>

      <button
        type="button"
        onClick={onGoToMenu}
        className="mt-6 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-amber-950 transition hover:bg-amber-400 active:scale-[0.98]"
      >
        {actionLabel}
      </button>
    </div>
  );
}
