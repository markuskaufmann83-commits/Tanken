"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Search, X, Loader2 } from "lucide-react";
import { GeocodeResult } from "@/types/tankerkoenig";

interface LocationBarProps {
  currentLocationName: string;
  onSelectCoords: (lat: number, lng: number, name: string) => void;
  onRequestGeolocation: () => void;
  isLocating: boolean;
  selectedRadius: number;
  onRadiusChange: (rad: number) => void;
}

const POPULAR_CITIES = [
  { name: "Berlin", lat: 52.5200, lng: 13.4050 },
  { name: "Hamburg", lat: 53.5511, lng: 9.9937 },
  { name: "München", lat: 48.1351, lng: 11.5820 },
  { name: "Köln", lat: 50.9375, lng: 6.9603 },
  { name: "Frankfurt", lat: 50.1109, lng: 8.6821 },
];

const RADII = [2, 5, 10, 15, 25];

export const LocationBar: React.FC<LocationBarProps> = ({
  currentLocationName,
  onSelectCoords,
  onRequestGeolocation,
  isLocating,
  selectedRadius,
  onRadiusChange,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || searchQuery.length < 2) return;

    setIsSearching(true);
    setShowDropdown(true);

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.results) && data.results.length > 0) {
        setSuggestions(data.results);
        if (e) {
          // Select top match immediately on form submission (Enter key)
          const first = data.results[0];
          const label = first.city || first.displayName.split(",")[0];
          onSelectCoords(first.lat, first.lng, label);
          setSearchQuery("");
          setShowDropdown(false);
        }
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error("Geocode error", err);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSuggestion = (item: GeocodeResult) => {
    const label = item.city || item.displayName.split(",")[0];
    onSelectCoords(item.lat, item.lng, label);
    setSearchQuery("");
    setShowDropdown(false);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xl backdrop-blur-sm space-y-3.5">
      {/* Top row: Current location + Geolocation button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 overflow-hidden">
          <MapPin className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="truncate">
            <span className="text-xs text-slate-400 block">Aktueller Suchort:</span>
            <span className="text-sm font-semibold text-slate-100 truncate block">
              {currentLocationName}
            </span>
          </div>
        </div>

        <button
          onClick={onRequestGeolocation}
          disabled={isLocating}
          className="flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 active:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-all shrink-0"
        >
          {isLocating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5" />
          )}
          <span>{isLocating ? "Ortung läuft..." : "Mein Standort"}</span>
        </button>
      </div>

      {/* Middle row: Search Bar */}
      <div className="relative" ref={dropdownRef}>
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ort, Postleitzahl oder Adresse in Deutschland suchen..."
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-9 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-100 border border-slate-700 transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Suchen"}
          </button>
        </form>

        {/* Search Results Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 max-h-60 overflow-y-auto divide-y divide-slate-800">
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSuggestion(item)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-slate-800/80 transition-colors flex items-start gap-2.5"
              >
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-medium text-slate-100">
                    {item.city} {item.postcode ? `(${item.postcode})` : ""}
                  </div>
                  <div className="text-slate-400 line-clamp-1">{item.displayName}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {showDropdown && !isSearching && searchQuery && suggestions.length === 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl z-30 text-xs text-slate-400 text-center">
            Keine Orte gefunden für &quot;{searchQuery}&quot;.
          </div>
        )}
      </div>

      {/* Quick city presets */}
      <div className="flex items-center gap-1.5 flex-wrap text-xs">
        <span className="text-slate-400 font-medium mr-1 text-[11px]">Schnellauswahl:</span>
        {POPULAR_CITIES.map((c) => {
          const isActive = currentLocationName.includes(c.name);
          return (
            <button
              key={c.name}
              onClick={() => onSelectCoords(c.lat, c.lng, c.name)}
              className={`px-2.5 py-1 rounded-lg transition-all text-[11px] font-medium ${
                isActive
                  ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/40"
                  : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60"
              }`}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      {/* Radius Selection */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 flex-wrap gap-2">
        <span className="text-xs text-slate-400 font-medium">Suchradius:</span>
        <div className="flex items-center gap-1.5">
          {RADII.map((r) => (
            <button
              key={r}
              onClick={() => onRadiusChange(r)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedRadius === r
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
              }`}
            >
              {r} km
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
