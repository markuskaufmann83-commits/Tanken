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
      className={`group relative border rounded-xl p-3.5 transition-all duration-150 shadow-sm ${
        isCheapest
          ? "bg-zinc-900/90 border-zinc-700 shadow-md"
          : "bg-zinc-900/40 hover:bg-zinc-900/80 border-zinc-800/80 hover:border-zinc-700"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Side: Brand, Status, Name, Address */}
        <div
          onClick={() => onOpenDetails(station)}
          className="flex-1 cursor-pointer space-y-1 min-w-0"
        >
          {/* Header Row: Brand badge, distance, status */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide border ${brandMeta.bgClass} ${brandMeta.textClass} ${brandMeta.borderClass}`}
            >
              <img src={brandMeta.logoUrl} alt={brandMeta.displayName} className="w-5 h-4 object-contain" />
              <span>{brandMeta.displayName}</span>
            </span>

            <span className="text-xs text-zinc-400 font-medium tabular-nums">
              {formatDistance(station.dist)}
            </span>

            <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  station.isOpen ? "bg-emerald-400" : "bg-zinc-600"
                }`}
              />
              {station.isOpen ? "Geöffnet" : "Geschlossen"}
            </span>

            {isCheapest && (
              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                Günstigste
              </span>
            )}
          </div>

          {/* Station Name */}
          <h4 className="text-sm sm:text-base font-medium text-zinc-100 group-hover:text-white transition-colors truncate">
            {station.name}
          </h4>

          {/* Address */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 truncate">
            <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">
              {station.street} {station.houseNumber || ""}, {station.postCode || ""} {station.place}
            </span>
          </div>

          {/* Secondary Prices */}
          <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
            {secondaryPrices.map((sec) => {
              const secFormatted = formatFuelPrice(sec.price);
              return (
                <div
                  key={sec.type}
                  className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[10px] flex items-center gap-1 text-zinc-400 tabular-nums"
                >
                  <span className="text-zinc-400">{sec.label}:</span>
                  {secFormatted ? (
                    <span className="font-medium text-zinc-300">
                      {secFormatted.main}
                      <sup className="text-[8px] -top-0.5">{secFormatted.sup}</sup> €
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
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/80 shrink-0">
          <div
            onClick={() => onOpenDetails(station)}
            className="cursor-pointer text-left sm:text-right"
          >
            <span className="text-[10px] text-zinc-400 block font-medium">
              {fuelType.toUpperCase()}
            </span>
            {formattedPrice ? (
              <div className="text-2xl font-semibold text-zinc-100 tracking-tight flex items-baseline sm:justify-end gap-0.5 tabular-nums">
                <span className={isCheapest ? "text-emerald-400 font-bold" : "font-semibold"}>{formattedPrice.main}</span>
                <sup className={`text-sm font-bold -top-1 ${isCheapest ? "text-emerald-400" : "text-zinc-400"}`}>
                  {formattedPrice.sup}
                </sup>
                <span className="text-sm font-normal text-zinc-400 ml-0.5">€</span>
              </div>
            ) : (
              <span className="text-sm text-zinc-400 font-medium">K.A.</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <a
              href={navUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 text-xs font-medium transition-colors"
              title="Navigation in Google Maps öffnen"
            >
              <Navigation className="w-3.5 h-3.5 text-zinc-400" />
              <span>Route</span>
            </a>

            <button
              onClick={() => onOpenDetails(station)}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
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
