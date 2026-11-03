"use client";

import { useState, useEffect } from "react";
import { X, Smartphone } from "lucide-react";

export default function AppBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("app-banner-dismissed");
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    localStorage.setItem("app-banner-dismissed", "1");
  }

  return (
    <div className="border-b border-primary/20 bg-primary/5 px-4 py-3">
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Smartphone className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Netify LGS</p>
          <p className="text-xs text-muted">
            iOS uygulamasıyla daha hızlı ve pratik kullan!
          </p>
        </div>
        <a
          href="https://apps.apple.com/app/netify-lgs/id000000000"
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          İndir
        </a>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-primary/10 hover:text-foreground"
          aria-label="Kapat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
