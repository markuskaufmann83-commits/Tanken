"use client";

import React, { useEffect, useState } from "react";
import { Fuel, RefreshCw, Download, Sparkles, CheckCircle2 } from "lucide-react";

interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  lastUpdated: Date | null;
  isDemo?: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  isLoading,
  lastUpdated,
  isDemo = false,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800/80 transition-colors">
      <div className="max-w-4xl mx-auto px-4 py-2.5 sm:px-6 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 shadow-sm">
            <Fuel className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-zinc-100 flex items-center gap-1">
                Tank<span className="text-zinc-400 font-normal">Pilot</span>
              </h1>
              <span className="text-[10px] uppercase font-medium px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                Live
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* PWA Install Button */}
          {deferredPrompt && !isInstalled && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 shadow-sm transition-all"
              title="Als App installieren"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">App installieren</span>
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-zinc-300 border border-zinc-800 transition-all disabled:opacity-50"
            title="Preise aktualisieren"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-zinc-400 ${isLoading ? "animate-spin" : ""}`}
            />
            <span className="tabular-nums">
              {isLoading ? "Lädt..." : mounted && lastUpdated ? formatLastUpdated(lastUpdated) : "Aktualisieren"}
            </span>
          </button>
        </div>
      </div>

      {/* Demo Mode Notice Banner if active */}
      {isDemo && (
        <div className="bg-zinc-900 border-t border-b border-zinc-800 px-4 py-1.5 text-center text-xs text-zinc-400 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Demo-Modus aktiv: Beispieldaten</span>
        </div>
      )}
    </header>
  );
};
