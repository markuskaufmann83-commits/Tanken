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
    <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-3.5 space-y-3 shadow-sm">
      {/* Top row: Current location + Geolocation button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
          <div className="truncate">
            <span className="text-[11px] text-zinc-400 block font-normal">Aktueller Suchort</span>
            <span className="text-sm font-medium text-zinc-100 truncate block">
              {currentLocationName}
            </span>
          </div>
        </div>

        <button
          onClick={onRequestGeolocation}
          disabled={isLocating}
          className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700/80 active:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition-all shrink-0 self-start sm:self-auto"
        >
          {isLocating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
          ) : (
            <Navigation className="w-3.5 h-3.5 text-zinc-400" />
          )}
          <span>{isLocating ? "Ortung..." : "Mein Standort"}</span>
        </button>
      </div>

      {/* Middle row: Search Bar */}
      <div className="relative" ref={dropdownRef}>
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ort, PLZ oder Adresse in Deutschland suchen..."
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg pl-9 pr-8 py-2 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-3.5 py-2 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition-all disabled:opacity-40 flex items-center gap-1.5 shrink-0"
          >
            {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Suchen"}
          </button>
        </form>

        {/* Search Results Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-30 max-h-60 overflow-y-auto divide-y divide-zinc-800">
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSuggestion(item)}
                className="w-full text-left px-3 py-2.5 hover:bg-zinc-800/60 transition-colors flex items-start gap-2.5"
              >
                <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-medium text-zinc-100">
                    {item.city} {item.postcode ? `(${item.postcode})` : ""}
                  </div>
                  <div className="text-zinc-400 text-[11px] line-clamp-1">{item.displayName}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {showDropdown && !isSearching && searchQuery && suggestions.length === 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-xl z-30 text-xs text-zinc-400 text-center">
            Keine Orte gefunden für &quot;{searchQuery}&quot;.
          </div>
        )}
      </div>

      {/* Quick city presets + Radius in a clean row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-zinc-800/70">
        {/* Quick city presets */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-zinc-400 text-[11px]">Schnellwahl:</span>
          {POPULAR_CITIES.map((c) => {
            const isActive = currentLocationName.includes(c.name);
            return (
              <button
                key={c.name}
                onClick={() => onSelectCoords(c.lat, c.lng, c.name)}
                className={`px-2 py-0.5 rounded-md transition-all text-[11px] font-medium ${
                  isActive
                    ? "bg-zinc-100 text-zinc-900 font-semibold shadow-sm"
                    : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800/80"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>

        {/* Radius Selection as clean segmented control */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400">Radius:</span>
          <div className="inline-flex bg-zinc-950 border border-zinc-800 p-0.5 rounded-lg">
            {RADII.map((r) => (
              <button
                key={r}
                onClick={() => onRadiusChange(r)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                  selectedRadius === r
                    ? "bg-zinc-800 text-zinc-100 font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
