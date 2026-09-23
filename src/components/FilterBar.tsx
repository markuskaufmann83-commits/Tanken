"use client";

import React from "react";
import { FuelType, SortOrder } from "@/types/tankerkoenig";
import { ArrowUpDown, Check, Filter } from "lucide-react";

interface FilterBarProps {
  fuelType: FuelType;
  onFuelTypeChange: (type: FuelType) => void;
  onlyOpen: boolean;
  onToggleOnlyOpen: () => void;
  selectedBrand: string;
  onBrandChange: (brand: string) => void;
  availableBrands: string[];
  sortBy: SortOrder;
  onSortByChange: (sort: SortOrder) => void;
  totalCount: number;
}

const FUEL_TYPES: { id: FuelType; label: string; sub: string; color: string }[] = [
  { id: "diesel", label: "Diesel", sub: "B7", color: "from-blue-600 to-indigo-600" },
  { id: "e5", label: "Super E5", sub: "95 ROZ", color: "from-emerald-600 to-teal-600" },
  { id: "e10", label: "Super E10", sub: "95 ROZ", color: "from-amber-600 to-orange-600" },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  fuelType,
  onFuelTypeChange,
  onlyOpen,
  onToggleOnlyOpen,
  selectedBrand,
  onBrandChange,
  availableBrands,
  sortBy,
  onSortByChange,
  totalCount,
}) => {
  return (
    <div className="space-y-3">
      {/* Fuel Type Pills */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl">
        {FUEL_TYPES.map((f) => {
          const isActive = fuelType === f.id;
          return (
            <button
              key={f.id}
              onClick={() => onFuelTypeChange(f.id)}
              className={`relative flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all ${
                isActive
                  ? `bg-gradient-to-r ${f.color} text-white shadow-lg`
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <span className="text-sm font-bold tracking-tight">{f.label}</span>
              <span className={`text-[10px] font-medium ${isActive ? "text-white/80" : "text-slate-400"}`}>
                {f.sub}
              </span>
            </button>
          );
        })}
      </div>

      {/* Secondary Controls: Only Open, Sort, and Brands */}
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-3 space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Only Open Toggle */}
          <button
            onClick={onToggleOnlyOpen}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              onlyOpen
                ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-400"
                : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200"
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                onlyOpen
                  ? "bg-emerald-500 border-emerald-400 text-slate-950"
                  : "border-slate-500 bg-transparent"
              }`}
            >
              {onlyOpen && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
            <span>Nur geöffnete anzeigen</span>
          </button>

          {/* Sort By Toggle */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Sortierung:</span>
            </span>
            <div className="flex bg-slate-950/80 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => onSortByChange("price")}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  sortBy === "price"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Günstigste
              </button>
              <button
                onClick={() => onSortByChange("dist")}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  sortBy === "dist"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Nähe
              </button>
            </div>
          </div>
        </div>

        {/* Brand Filter Pills */}
        {availableBrands.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
            <span className="text-slate-400 flex items-center gap-1 shrink-0 text-[11px]">
              <Filter className="w-3 h-3 text-slate-400" />
              <span>Marke:</span>
            </span>
            <button
              onClick={() => onBrandChange("ALL")}
              className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-all ${
                selectedBrand === "ALL"
                  ? "bg-slate-200 text-slate-900 font-semibold"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Alle ({totalCount})
            </button>
            {availableBrands.map((b) => (
              <button
                key={b}
                onClick={() => onBrandChange(b)}
                className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-all ${
                  selectedBrand === b
                    ? "bg-emerald-500 text-slate-950 font-semibold shadow-sm"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
