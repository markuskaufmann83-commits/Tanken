"use client";

import React, { useEffect, useState } from "react";
import { Station, StationDetail, FuelType } from "@/types/tankerkoenig";
import {
  formatFuelPrice,
  formatDistance,
  getBrandMeta,
  getNavigationUrl,
} from "@/lib/fuelUtils";
import {
  X,
  Navigation,
  MapPin,
  Clock,
  Check,
  Copy,
  Fuel,
  Calendar,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface StationDetailModalProps {
  station: Station | null;
  selectedFuelType: FuelType;
  onClose: () => void;
}

export const StationDetailModal: React.FC<StationDetailModalProps> = ({
  station,
  selectedFuelType,
  onClose,
}) => {
  const [detail, setDetail] = useState<StationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!station) {
      setDetail(null);
      return;
    }

    let isCancelled = false;
    setLoading(true);

    fetch(`/api/detail?id=${encodeURIComponent(station.id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.ok && data.station) {
          setDetail(data.station);
        }
      })
      .catch((err) => console.error("Error loading station detail", err))
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [station]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!station) return null;

  const brandMeta = getBrandMeta(station.brand, station.name);
  const navUrl = getNavigationUrl(
    station.lat,
    station.lng,
    `${station.brand || station.name}, ${station.place}`
  );

  const fullAddress = `${station.street || ""} ${station.houseNumber || ""}, ${station.postCode || ""} ${station.place || ""}`.trim();

  const handleCopyAddress = () => {
    if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(fullAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fuels = [
    { type: "diesel" as FuelType, label: "Diesel", sub: "B7", price: station.diesel },
    { type: "e5" as FuelType, label: "Super E5", sub: "95 ROZ", price: station.e5 },
    { type: "e10" as FuelType, label: "Super E10", sub: "95 ROZ", price: station.e10 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-start justify-between gap-3 bg-zinc-900/90">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide border ${brandMeta.bgClass} ${brandMeta.textClass} ${brandMeta.borderClass}`}
              >
                {brandMeta.displayName}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    station.isOpen ? "bg-emerald-400" : "bg-zinc-600"
                  }`}
                />
                {station.isOpen ? "Geöffnet" : "Geschlossen"}
              </span>
            </div>
            <h3 className="text-base font-semibold text-zinc-100 leading-snug">{station.name}</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Address & Navigation bar */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-start gap-2.5 text-xs text-zinc-300">
              <MapPin className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-zinc-100">{fullAddress}</p>
                <p className="text-zinc-400 text-[11px] mt-0.5 tabular-nums">
                  Entfernung: {formatDistance(station.dist)} (Luftlinie)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/80">
              <a
                href={navUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-colors shadow-sm"
              >
                <Navigation className="w-3.5 h-3.5 fill-current" />
                <span>Google Maps Route</span>
              </a>

              <button
                onClick={handleCopyAddress}
                className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                <span>{copied ? "Kopiert" : "Kopieren"}</span>
              </button>
            </div>
          </div>

          {/* Current Fuel Prices */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5 text-zinc-400" />
              <span>Kraftstoffpreise</span>
            </h4>

            <div className="grid grid-cols-3 gap-2">
              {fuels.map((f) => {
                const formatted = formatFuelPrice(f.price);
                const isSelected = f.type === selectedFuelType;
                return (
                  <div
                    key={f.type}
                    className={`rounded-xl p-2.5 border text-center transition-all ${
                      isSelected
                        ? "bg-zinc-800 border-zinc-700 shadow-sm"
                        : "bg-zinc-950 border-zinc-800"
                    }`}
                  >
                    <div className="text-xs font-medium text-zinc-200">{f.label}</div>
                    <div className="text-[10px] text-zinc-400 mb-1">({f.sub})</div>
                    {formatted ? (
                      <div className="text-base sm:text-lg font-semibold text-zinc-100 flex items-baseline justify-center tabular-nums">
                        <span className={isSelected ? "text-emerald-400 font-bold" : ""}>{formatted.main}</span>
                        <sup className={`text-xs font-bold -top-0.5 ${isSelected ? "text-emerald-400" : "text-zinc-400"}`}>
                          {formatted.sup}
                        </sup>
                        <span className="text-xs text-zinc-400 ml-0.5">€</span>
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-400 font-medium py-1">K.A.</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Opening Hours */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Öffnungszeiten</span>
            </h4>

            {loading ? (
              <div className="flex items-center justify-center py-6 gap-2 text-xs text-zinc-400 bg-zinc-950 rounded-xl border border-zinc-800">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                <span>Lade Öffnungszeiten...</span>
              </div>
            ) : detail?.wholeDay ? (
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-medium flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Diese Tankstelle hat durchgehend 24 Stunden geöffnet (24/7).</span>
              </div>
            ) : detail?.openingTimes && detail.openingTimes.length > 0 ? (
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl divide-y divide-zinc-800/80 overflow-hidden text-xs">
                {detail.openingTimes.map((item, idx) => {
                  const startRaw = item?.start || item?.from;
                  const endRaw = item?.end || item?.to;
                  const fromTime = startRaw ? String(startRaw).slice(0, 5) : "";
                  const toTime = endRaw ? String(endRaw).slice(0, 5) : "";
                  const timeText =
                    fromTime && toTime
                      ? `${fromTime} - ${toTime} Uhr`
                      : startRaw || endRaw || (item?.text?.toLowerCase().includes("geschlossen") ? "Geschlossen" : "Geöffnet");

                  return (
                    <div key={idx} className="flex justify-between items-center px-3 py-2 text-zinc-300 tabular-nums">
                      <span className="font-normal text-zinc-400">{item?.text || "Öffnungszeit"}</span>
                      <span className="font-medium text-zinc-100">{timeText}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400">
                Keine detaillierten Wochen-Öffnungszeiten verfügbar. Status aktuell:{" "}
                <span className="font-medium text-zinc-200">
                  {station.isOpen ? "Geöffnet" : "Geschlossen"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
