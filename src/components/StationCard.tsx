"use client";

import React from "react";
import { Station, FuelType } from "@/types/tankerkoenig";
import {
  formatFuelPrice,
  getFuelPrice,
  formatDistance,
  getBrandMeta,
  getNavigationUrl,
} from "@/lib/fuelUtils";
import { Navigation, MapPin, ChevronRight, Clock } from "lucide-react";

interface StationCardProps {
  station: Station;
  fuelType: FuelType;
  onOpenDetails: (station: Station) => void;
  isCheapest?: boolean;
}

export const StationCard: React.FC<StationCardProps> = ({
  station,
  fuelType,
  onOpenDetails,
  isCheapest = false,
}) => {
  const currentPrice = getFuelPrice(station, fuelType);
  const formattedPrice = formatFuelPrice(currentPrice);
  const brandMeta = getBrandMeta(station.brand, station.name);

  const allSecondary: { type: FuelType; label: string; price: number | null }[] = [
    { type: "diesel", label: "Diesel", price: getFuelPrice(station, "diesel") },
    { type: "e5", label: "E5", price: getFuelPrice(station, "e5") },
    { type: "e10", label: "E10", price: getFuelPrice(station, "e10") },
  ];
  const secondaryPrices = allSecondary.filter((p) => p.type !== fuelType);

  const navUrl = getNavigationUrl(station.lat, station.lng, `${station.brand || station.name}, ${station.place}`);

  return (
    <div
      className={`group relative bg-slate-900/70 hover:bg-slate-900 border rounded-2xl p-4 transition-all duration-200 shadow-md hover:shadow-xl ${
        isCheapest
          ? "border-emerald-500/40 bg-slate-900/90"
          : "border-slate-800/80 hover:border-slate-700"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Side: Brand, Status, Name, Address */}
        <div
          onClick={() => onOpenDetails(station)}
          className="flex-1 cursor-pointer space-y-1.5 min-w-0"
        >
          {/* Header Row: Brand badge, distance, status */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide ${brandMeta.bgClass} ${brandMeta.textClass}`}
            >
              {brandMeta.displayName}
            </span>

            <span className="text-xs text-slate-400 font-medium">
              {formatDistance(station.dist)}
            </span>

            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                station.isOpen
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  station.isOpen ? "bg-emerald-400" : "bg-rose-400"
                }`}
              />
              {station.isOpen ? "Geöffnet" : "Geschlossen"}
            </span>

            {isCheapest && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Günstigste
              </span>
            )}
          </div>

          {/* Station Name */}
          <h4 className="text-base font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors truncate">
            {station.name}
          </h4>

          {/* Address */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">
              {station.street} {station.houseNumber || ""}, {station.postCode || ""} {station.place}
            </span>
          </div>

          {/* Secondary Prices */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {secondaryPrices.map((sec) => {
              const secFormatted = formatFuelPrice(sec.price);
              return (
                <div
                  key={sec.type}
                  className="px-2 py-0.5 rounded bg-slate-950/60 border border-slate-800 text-[10px] flex items-center gap-1 text-slate-400"
                >
                  <span>{sec.label}:</span>
                  {secFormatted ? (
                    <span className="font-semibold text-slate-300">
                      {secFormatted.main}
                      <sup className="text-[8px] -top-0.5 font-bold">{secFormatted.sup}</sup> €
                    </span>
                  ) : (
                    <span>—</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Primary Price & Navigation */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 shrink-0">
          <div
            onClick={() => onOpenDetails(station)}
            className="cursor-pointer text-left sm:text-right"
          >
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              {fuelType.toUpperCase()}
            </span>
            {formattedPrice ? (
              <div className="text-2xl font-black text-slate-100 tracking-tight flex items-baseline sm:justify-end gap-0.5">
                <span className={isCheapest ? "text-emerald-400" : ""}>{formattedPrice.main}</span>
                <sup className={`text-sm font-bold -top-1.5 ${isCheapest ? "text-emerald-400" : "text-slate-300"}`}>
                  {formattedPrice.sup}
                </sup>
                <span className="text-sm font-semibold text-slate-400 ml-0.5">€</span>
              </div>
            ) : (
              <span className="text-sm text-slate-400 font-bold">K.A.</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <a
              href={navUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
              title="Navigation in Google Maps öffnen"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Route</span>
            </a>

            <button
              onClick={() => onOpenDetails(station)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
              title="Öffnungszeiten und Details anzeigen"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
