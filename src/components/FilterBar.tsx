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
    <div className="space-y-2.5">
      {/* Fuel Type Segmented Control */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-900/80 border border-zinc-800 rounded-xl">
        {FUEL_TYPES.map((f) => {
          const isActive = fuelType === f.id;
          return (
            <button
              key={f.id}
              onClick={() => onFuelTypeChange(f.id)}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs transition-all ${
                isActive
                  ? "bg-zinc-100 text-zinc-950 font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 font-medium"
              }`}
            >
              <span>{f.label}</span>
              <span className={`text-[10px] ${isActive ? "text-zinc-500 font-normal" : "text-zinc-400 font-normal"}`}>
                ({f.sub})
              </span>
            </button>
          );
        })}
      </div>

      {/* Secondary Controls: Only Open, Sort, and Brands */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-2.5 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Only Open Toggle */}
          <button
            onClick={onToggleOnlyOpen}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
              onlyOpen
                ? "bg-zinc-800 border-zinc-700 text-zinc-100"
                : "bg-transparent border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                onlyOpen
                  ? "bg-emerald-500 border-emerald-400 text-zinc-950"
                  : "border-zinc-600 bg-transparent"
              }`}
            >
              {onlyOpen && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
            <span>Nur geöffnete Tankstellen</span>
          </button>

          {/* Sort By Toggle */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-400 text-[11px] flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-zinc-400" />
              <span>Sortierung:</span>
            </span>
            <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg p-0.5">
              <button
                onClick={() => onSortByChange("price")}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                  sortBy === "price"
                    ? "bg-zinc-800 text-zinc-100 font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Günstigste
              </button>
              <button
                onClick={() => onSortByChange("dist")}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                  sortBy === "dist"
                    ? "bg-zinc-800 text-zinc-100 font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Entfernung
              </button>
            </div>
          </div>
        </div>

        {/* Brand Filter Pills */}
        {availableBrands.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1 scrollbar-none text-xs">
            <span className="text-zinc-400 flex items-center gap-1 shrink-0 text-[11px]">
              <Filter className="w-3 h-3 text-zinc-400" />
              <span>Marke:</span>
            </span>
            <button
              onClick={() => onBrandChange("ALL")}
              className={`px-2 py-0.5 rounded-md shrink-0 text-[11px] font-medium transition-all ${
                selectedBrand === "ALL"
                  ? "bg-zinc-100 text-zinc-950 font-semibold"
                  : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              Alle ({totalCount})
            </button>
            {availableBrands.map((b) => (
              <button
                key={b}
                onClick={() => onBrandChange(b)}
                className={`px-2 py-0.5 rounded-md shrink-0 text-[11px] font-medium transition-all ${
                  selectedBrand === b
                    ? "bg-zinc-100 text-zinc-950 font-semibold shadow-sm"
                    : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
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
