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
      <div className="space-y-2.5 pt-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3.5 space-y-2.5"
          >
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <div className="h-4 w-14 bg-zinc-800 rounded" />
                <div className="h-4 w-10 bg-zinc-800 rounded" />
                <div className="h-4 w-16 bg-zinc-800 rounded-full" />
              </div>
              <div className="h-6 w-16 bg-zinc-800 rounded" />
            </div>
            <div className="h-4 w-2/3 bg-zinc-800 rounded" />
            <div className="h-3 w-1/2 bg-zinc-800/60 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (stations.length === 0) {
    return (
      <div className="text-center py-10 px-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-2.5">
        <div className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-zinc-400" />
        </div>
        <h4 className="text-sm font-medium text-zinc-200">
          Keine Tankstellen gefunden
        </h4>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto">
          Im Umkreis von {radius} km wurden keine Tankstellen gefunden, die den gewählten Kriterien entsprechen.
        </p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors mt-2"
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
    <div className="space-y-2.5 pt-1">
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <span className="tabular-nums">
          {stations.length} {stations.length === 1 ? "Tankstelle" : "Tankstellen"}
        </span>
        <span className="text-[11px] text-zinc-400">Preise inkl. MwSt.</span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
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
