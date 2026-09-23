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
import { Navigation, ChevronRight, Sparkles, MapPin } from "lucide-react";

interface BestPriceHeroProps {
  station: Station | null;
  fuelType: FuelType;
  onOpenDetails: (station: Station) => void;
  onOpenAiDetour?: () => void;
}

export const BestPriceHero: React.FC<BestPriceHeroProps> = ({
  station,
  fuelType,
  onOpenDetails,
  onOpenAiDetour,
}) => {
  if (!station) return null;

  const currentPrice = getFuelPrice(station, fuelType);
  const formattedPrice = formatFuelPrice(currentPrice);
  const brandMeta = getBrandMeta(station.brand, station.name);

  // Other fuel prices for secondary info
  const allSecondary: { type: FuelType; label: string; price: number | null }[] = [
    { type: "diesel", label: "Diesel", price: getFuelPrice(station, "diesel") },
    { type: "e5", label: "Super E5", price: getFuelPrice(station, "e5") },
    { type: "e10", label: "Super E10", price: getFuelPrice(station, "e10") },
  ];
  const secondaryPrices = allSecondary.filter((p) => p.type !== fuelType);

  const navUrl = getNavigationUrl(station.lat, station.lng, `${station.brand || station.name}, ${station.place}`);

  return (
    <div className="relative rounded-2xl bg-zinc-900/80 border border-zinc-800 p-4 sm:p-5 shadow-sm">
      {/* Top Tag Row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/60 text-zinc-300 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Bester Preis in der Umgebung</span>
        </div>

        <span className="text-[11px] font-medium text-emerald-400">
          Geöffnet
        </span>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Left Side: Brand, Name & Address */}
        <div className="md:col-span-7 space-y-1.5">
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase border ${brandMeta.bgClass} ${brandMeta.textClass} ${brandMeta.borderClass}`}
            >
              <img src={brandMeta.logoUrl} alt={brandMeta.displayName} className="w-5 h-3.5 object-contain" />
              <span>{brandMeta.displayName}</span>
            </span>
            <span className="text-xs text-zinc-400 font-medium tabular-nums">
              {formatDistance(station.dist)}
            </span>
          </div>

          <h3
            onClick={() => onOpenDetails(station)}
            className="text-base sm:text-lg font-semibold text-zinc-100 hover:text-zinc-300 cursor-pointer transition-colors leading-snug line-clamp-1"
          >
            {station.name}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">
              {station.street} {station.houseNumber || ""}, {station.postCode || ""} {station.place}
            </span>
          </div>

          {/* Secondary Fuel Prices */}
          <div className="flex items-center gap-1.5 pt-1 flex-wrap">
            {secondaryPrices.map((sec) => {
              const secFormatted = formatFuelPrice(sec.price);
              return (
                <div
                  key={sec.type}
                  className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800/80 text-[11px] flex items-center gap-1 text-zinc-400 tabular-nums"
                >
                  <span className="text-zinc-400">{sec.label}:</span>
                  {secFormatted ? (
                    <span className="font-medium text-zinc-200">
                      {secFormatted.main}
                      <sup className="text-[9px] -top-0.5">{secFormatted.sup}</sup> €
                    </span>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Big Price & Action Buttons */}
        <div className="md:col-span-5 flex flex-col sm:items-end justify-center border-t md:border-t-0 border-zinc-800/80 pt-3 md:pt-0">
          <div className="text-left sm:text-right">
            <span className="text-[11px] text-zinc-400 block font-medium">
              {fuelType === "diesel" ? "Diesel" : fuelType === "e5" ? "Super E5" : "Super E10"}
            </span>
            {formattedPrice ? (
              <div className="text-3xl sm:text-4xl font-semibold text-zinc-100 tracking-tight flex items-baseline sm:justify-end gap-0.5 tabular-nums">
                <span className="text-emerald-400 font-bold">{formattedPrice.main}</span>
                <sup className="text-lg font-bold text-emerald-400 -top-1.5">
                  {formattedPrice.sup}
                </sup>
                <span className="text-sm text-zinc-400 font-normal ml-0.5">€</span>
              </div>
            ) : (
              <span className="text-xl text-zinc-400 font-medium">K.A.</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-3 w-full sm:w-auto">
            <a
              href={navUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-colors shadow-sm"
            >
              <Navigation className="w-3.5 h-3.5 fill-current" />
              <span>Route</span>
            </a>

            {onOpenAiDetour && (
              <button
                onClick={onOpenAiDetour}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 text-xs font-medium transition-colors"
                title="KI-Check: Berechne, ob sich der Umweg finanziell lohnt"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>KI-Check</span>
              </button>
            )}

            <button
              onClick={() => onOpenDetails(station)}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-medium transition-colors"
              title="Details & Öffnungszeiten ansehen"
            >
              <span>Details</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
