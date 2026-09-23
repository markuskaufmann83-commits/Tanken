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

  const fullAddress = `${station.street} ${station.houseNumber || ""}, ${station.postCode || ""} ${station.place}`;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(fullAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fuels = [
    { type: "diesel" as FuelType, label: "Diesel", sub: "B7", price: station.diesel },
    { type: "e5" as FuelType, label: "Super E5", sub: "95 ROZ", price: station.e5 },
    { type: "e10" as FuelType, label: "Super E10", sub: "95 ROZ", price: station.e10 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-start justify-between gap-3 bg-slate-900/90">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${brandMeta.bgClass} ${brandMeta.textClass}`}
              >
                {brandMeta.displayName}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  station.isOpen
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    station.isOpen ? "bg-emerald-400" : "bg-rose-400"
                  }`}
                />
                {station.isOpen ? "Jetzt geöffnet" : "Geschlossen"}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white leading-snug">{station.name}</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Address & Navigation bar */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-start gap-2.5 text-xs text-slate-300">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-slate-100">{fullAddress}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Entfernung: {formatDistance(station.dist)} (Luftlinie)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
              <a
                href={navUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-colors"
              >
                <Navigation className="w-3.5 h-3.5 fill-current" />
                <span>Navigation in Google Maps</span>
              </a>

              <button
                onClick={handleCopyAddress}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Kopiert!" : "Kopieren"}</span>
              </button>
            </div>
          </div>

          {/* Current Fuel Prices */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5 text-emerald-400" />
              <span>Kraftstoffpreise</span>
            </h4>

            <div className="grid grid-cols-3 gap-2.5">
              {fuels.map((f) => {
                const formatted = formatFuelPrice(f.price);
                const isSelected = f.type === selectedFuelType;
                return (
                  <div
                    key={f.type}
                    className={`rounded-2xl p-3 border text-center transition-all ${
                      isSelected
                        ? "bg-emerald-950/30 border-emerald-500/50 shadow-md"
                        : "bg-slate-950/40 border-slate-800"
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-300">{f.label}</div>
                    <div className="text-[10px] text-slate-400 mb-1">{f.sub}</div>
                    {formatted ? (
                      <div className="text-lg sm:text-xl font-black text-white flex items-baseline justify-center">
                        <span className={isSelected ? "text-emerald-400" : ""}>{formatted.main}</span>
                        <sup className={`text-xs font-bold -top-1 ${isSelected ? "text-emerald-400" : "text-slate-300"}`}>
                          {formatted.sup}
                        </sup>
                        <span className="text-xs text-slate-400 ml-0.5">€</span>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400 font-semibold py-1">K.A.</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Opening Hours */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Öffnungszeiten</span>
            </h4>

            {loading ? (
              <div className="flex items-center justify-center py-6 gap-2 text-xs text-slate-400 bg-slate-950/40 rounded-2xl border border-slate-800">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Lade Öffnungszeiten...</span>
              </div>
            ) : detail?.wholeDay ? (
              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Diese Tankstelle hat durchgehend 24 Stunden geöffnet (24/7).</span>
              </div>
            ) : detail?.openingTimes && detail.openingTimes.length > 0 ? (
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden text-xs">
                {detail.openingTimes.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center px-3.5 py-2 text-slate-300">
                    <span className="font-medium text-slate-400">{item.text}</span>
                    <span className="font-semibold text-slate-100">
                      {item.from.substring(0, 5)} - {item.to.substring(0, 5)} Uhr
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400">
                Keine detaillierten Wochen-Öffnungszeiten verfügbar. Status aktuell:{" "}
                <span className="font-semibold text-slate-200">
                  {station.isOpen ? "Geöffnet" : "Geschlossen"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
