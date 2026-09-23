"use client";

import React from "react";
import { Station, FuelType } from "@/types/tankerkoenig";
import { StationCard } from "./StationCard";
import { Fuel, AlertCircle, RefreshCw } from "lucide-react";

interface StationListProps {
  stations: Station[];
  isLoading: boolean;
  fuelType: FuelType;
  onOpenDetails: (station: Station) => void;
  onResetFilters?: () => void;
  radius: number;
}

export const StationList: React.FC<StationListProps> = ({
  stations,
  isLoading,
  fuelType,
  onOpenDetails,
  onResetFilters,
  radius,
}) => {
  if (isLoading && stations.length === 0) {
    return (
      <div className="space-y-3 pt-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-slate-800 rounded" />
                <div className="h-5 w-12 bg-slate-800 rounded" />
                <div className="h-5 w-20 bg-slate-800 rounded-full" />
              </div>
              <div className="h-7 w-20 bg-slate-800 rounded" />
            </div>
            <div className="h-5 w-2/3 bg-slate-800 rounded" />
            <div className="h-4 w-1/2 bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (stations.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-slate-900/40 border border-slate-800/80 rounded-3xl space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-400 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold text-slate-200">
          Keine Tankstellen gefunden
        </h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Im Umkreis von {radius} km wurden keine Tankstellen gefunden, die den gewählten Kriterien entsprechen.
        </p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors mt-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Filter zurücksetzen / Radius vergrößern</span>
          </button>
        )}
      </div>
    );
  }

  // Find the cheapest station ID to highlight
  let cheapestId: string | null = null;
  let minPrice = Infinity;
  for (const s of stations) {
    if (s.isOpen) {
      const p = s[fuelType];
      if (typeof p === "number" && p > 0 && p < minPrice) {
        minPrice = p;
        cheapestId = s.id;
      }
    }
  }

  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          {stations.length} {stations.length === 1 ? "Tankstelle" : "Tankstellen"} gefunden
        </span>
        <span className="text-[11px] text-slate-400">Preise inkl. MwSt.</span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {stations.map((station) => (
          <StationCard
            key={station.id}
            station={station}
            fuelType={fuelType}
            onOpenDetails={onOpenDetails}
            isCheapest={station.id === cheapestId}
          />
        ))}
      </div>
    </div>
  );
};
