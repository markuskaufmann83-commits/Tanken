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
import { Navigation, Trophy, ChevronRight, Fuel, Sparkles, MapPin } from "lucide-react";

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
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border-2 border-emerald-500/40 p-4 sm:p-5 shadow-2xl shadow-emerald-950/50">
      {/* Glow decorative effects */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Tag */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold tracking-wide">
          <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>GÜNSTIGSTE TANKSTELLE</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Geöffnet
          </span>
        </div>
      </div>

      {/* Station Name & Main Price */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Left Side: Brand, Name & Address */}
        <div className="md:col-span-7 space-y-2">
          <div className="flex items-center gap-2.5">
            <span
              className={`px-2.5 py-0.5 rounded-lg text-xs font-black tracking-wider uppercase ${brandMeta.bgClass} ${brandMeta.textClass} shadow-sm`}
            >
              {brandMeta.displayName}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {formatDistance(station.dist)} entfernt
            </span>
          </div>

          <h3
            onClick={() => onOpenDetails(station)}
            className="text-lg sm:text-xl font-bold text-white hover:text-emerald-400 cursor-pointer transition-colors leading-tight line-clamp-1"
          >
            {station.name}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {station.street} {station.houseNumber || ""}, {station.postCode || ""} {station.place}
            </span>
          </div>

          {/* Secondary Fuel Prices */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {secondaryPrices.map((sec) => {
              const secFormatted = formatFuelPrice(sec.price);
              return (
                <div
                  key={sec.type}
                  className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-[11px] flex items-center gap-1.5 text-slate-300"
                >
                  <span className="text-slate-400">{sec.label}:</span>
                  {secFormatted ? (
                    <span className="font-semibold text-slate-200">
                      {secFormatted.main}
                      <sup className="text-[9px] -top-1 font-bold">{secFormatted.sup}</sup> €
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Big Price & Action Buttons */}
        <div className="md:col-span-5 flex flex-col sm:items-end justify-center border-t md:border-t-0 border-slate-800/80 pt-3 md:pt-0">
          <div className="text-left sm:text-right">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              {fuelType === "diesel" ? "Diesel" : fuelType === "e5" ? "Super E5" : "Super E10"} Bestpreis
            </span>
            {formattedPrice ? (
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-baseline sm:justify-end gap-0.5">
                <span className="text-emerald-400">{formattedPrice.main}</span>
                <sup className="text-lg sm:text-xl text-emerald-400 font-bold -top-2">
                  {formattedPrice.sup}
                </sup>
                <span className="text-lg text-slate-300 font-semibold ml-1">€</span>
              </div>
            ) : (
              <span className="text-xl text-slate-400 font-bold">K.A.</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-3 w-full sm:w-auto">
            <a
              href={navUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/50 transition-all"
            >
              <Navigation className="w-3.5 h-3.5 fill-current" />
              <span>Navigation starten</span>
            </a>

            {onOpenAiDetour && (
              <button
                onClick={onOpenAiDetour}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 active:scale-95 text-amber-300 border border-amber-500/40 text-xs font-semibold shadow-sm transition-all"
                title="KI-Umweg-Berater: Berechne, ob sich die Mehrkilometer finanziell lohnen"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>KI-Check</span>
              </button>
            )}

            <button
              onClick={() => onOpenDetails(station)}
              className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
              title="Details & Öffnungszeiten ansehen"
            >
              <span>Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
