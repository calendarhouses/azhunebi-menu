"use client";

import BrandLogo from "@/components/BrandLogo";
import { useEffect, useState } from "react";

type PreloaderProps = {
  logoUrl: string;
  isAppReady: boolean;
};

export default function Preloader({ logoUrl, isAppReady }: PreloaderProps) {
  const [mounted, setMounted] = useState(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!isAppReady) {
      return;
    }

    setVisible(false);
    const timeoutId = window.setTimeout(() => setMounted(false), 500);
    return () => window.clearTimeout(timeoutId);
  }, [isAppReady]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950 transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <BrandLogo
        src={logoUrl}
        alt="Аж у небі"
        className="h-32 w-32 animate-pulse rounded-full object-cover shadow-[0_0_30px_rgba(245,158,11,0.15)]"
      />
    </div>
  );
}
