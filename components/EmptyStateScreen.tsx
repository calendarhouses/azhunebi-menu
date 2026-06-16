"use client";

import Lottie from "lottie-react";
import { useEffect, useState } from "react";

const LOTTIE_BASE_PATH = "/azhunebi-menu";

type EmptyStateScreenProps = {
  title: string;
  subtitle: string;
  onGoToMenu: () => void;
  actionLabel?: string;
};

export default function EmptyStateScreen({
  title,
  subtitle,
  onGoToMenu,
  actionLabel = "Перейти до меню",
}: EmptyStateScreenProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
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
  }, []);

  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      {animationData ? (
        <Lottie
          animationData={animationData}
          loop
          className="mx-auto mb-6 h-48 w-48 drop-shadow-2xl"
        />
      ) : (
        <div className="mx-auto mb-6 h-48 w-48 animate-pulse rounded-full bg-zinc-800/50" />
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
