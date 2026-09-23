"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Station, FuelType, SortOrder, TankerkoenigListResponse } from "@/types/tankerkoenig";
import { Header } from "@/components/Header";
import { LocationBar } from "@/components/LocationBar";
import { FilterBar } from "@/components/FilterBar";
import { BestPriceHero } from "@/components/BestPriceHero";
import { StationList } from "@/components/StationList";
import { StationDetailModal } from "@/components/StationDetailModal";
import { AttributionFooter } from "@/components/AttributionFooter";
import { getCachedData, setCachedData, getFuelPrice } from "@/lib/fuelUtils";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Coords {
  lat: number;
  lng: number;
}

const DEFAULT_COORDS: Coords = { lat: 52.5200, lng: 13.4050 }; // Berlin Mitte
const DEFAULT_LOCATION_NAME = "Berlin Mitte";

export default function Home() {
  const [coords, setCoords] = useState<Coords>(DEFAULT_COORDS);
  const [locationName, setLocationName] = useState<string>(DEFAULT_LOCATION_NAME);
  const [radius, setRadius] = useState<number>(5);
  const [fuelType, setFuelType] = useState<FuelType>("e10");
  const [onlyOpen, setOnlyOpen] = useState<boolean>(true);
  const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<SortOrder>("price");

  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  // Fetch stations from /api/stations
  const fetchStations = useCallback(
    async (forceRefresh = false) => {
      setIsLoading(true);
      setErrorMsg(null);

      const cacheKey = `stations_${coords.lat.toFixed(3)}_${coords.lng.toFixed(3)}_${radius}`;

      if (!forceRefresh) {
        const cached = getCachedData<TankerkoenigListResponse>(cacheKey);
        if (cached && cached.stations) {
          setStations(cached.stations);
          setIsDemo(cached.status === "demo" || !!cached.license?.includes("Demo"));
          setIsLoading(false);
          setLastUpdated(new Date());
          return;
        }
      }

      try {
        const params = new URLSearchParams({
          lat: coords.lat.toString(),
          lng: coords.lng.toString(),
          rad: radius.toString(),
          sort: "dist",
          type: "all",
        });

        const res = await fetch(`/api/stations?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`API Fehler ${res.status}`);
        }

        const data: TankerkoenigListResponse = await res.json();

        if (data.ok && Array.isArray(data.stations)) {
          setStations(data.stations);
          setIsDemo(data.status === "demo" || data.status === "fallback");
          setCachedData(cacheKey, data);
          setLastUpdated(new Date());
        } else {
          setErrorMsg(data.message || "Keine Daten empfangen");
        }
      } catch (err) {
        console.error("Fetch stations error:", err);
        setErrorMsg("Fehler beim Laden der Tankstellendaten. Bitte erneut versuchen.");
      } finally {
        setIsLoading(false);
      }
    },
    [coords, radius]
  );

  // HTML5 Geolocation
  const handleRequestGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Standorterkennung wird von deinem Browser nicht unterstützt.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setCoords(newCoords);
        setLocationName("Mein Standort (GPS)");
        setIsLocating(false);
      },
      (err) => {
        console.warn("Geolocation denied or failed:", err.message);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  // Request location once on initial mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setLocationName("Mein Standort (GPS)");
        },
        () => {
          // Keep default Berlin
        },
        { timeout: 6000 }
      );
    }
  }, []);

  // Re-fetch when coords or radius change
  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  // Extract unique brands for brand filter pills
  const availableBrands = useMemo(() => {
    const brandSet = new Set<string>();
    stations.forEach((s) => {
      const b = (s.brand || s.name || "").trim().toUpperCase();
      if (b.includes("ARAL")) brandSet.add("Aral");
      else if (b.includes("SHELL")) brandSet.add("Shell");
      else if (b.includes("TOTAL")) brandSet.add("Total");
      else if (b.includes("JET")) brandSet.add("JET");
      else if (b.includes("HEM")) brandSet.add("HEM");
      else if (b.includes("ESSO")) brandSet.add("Esso");
      else if (b.includes("AVIA")) brandSet.add("Avia");
      else if (b.includes("STAR")) brandSet.add("star");
    });
    return Array.from(brandSet).sort();
  }, [stations]);

  // Filtered & Sorted Stations
  const filteredStations = useMemo(() => {
    return stations
      .filter((s) => {
        // Only open filter
        if (onlyOpen && !s.isOpen) return false;

        // Brand filter
        if (selectedBrand !== "ALL") {
          const brandUpper = (s.brand || s.name || "").toUpperCase();
          if (!brandUpper.includes(selectedBrand.toUpperCase())) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = getFuelPrice(a, fuelType);
        const priceB = getFuelPrice(b, fuelType);

        if (sortBy === "price") {
          // If a station has no price, sort it to the end
          if (priceA === null && priceB === null) return a.dist - b.dist;
          if (priceA === null) return 1;
          if (priceB === null) return -1;
          if (priceA !== priceB) return priceA - priceB;
          return a.dist - b.dist;
        } else {
          // Sort by distance
          return a.dist - b.dist;
        }
      });
  }, [stations, onlyOpen, selectedBrand, sortBy, fuelType]);

  // Find the cheapest open station with a valid price
  const cheapestOpenStation = useMemo(() => {
    const openWithPrice = stations.filter(
      (s) => s.isOpen && getFuelPrice(s, fuelType) !== null
    );
    if (openWithPrice.length === 0) return null;

    return openWithPrice.reduce((cheapest, current) => {
      const priceCurrent = getFuelPrice(current, fuelType)!;
      const priceCheapest = getFuelPrice(cheapest, fuelType)!;
      return priceCurrent < priceCheapest ? current : cheapest;
    }, openWithPrice[0]);
  }, [stations, fuelType]);

  const handleSelectCoords = (lat: number, lng: number, name: string) => {
    setCoords({ lat, lng });
    setLocationName(name);
  };

  const handleResetFilters = () => {
    setOnlyOpen(false);
    setSelectedBrand("ALL");
    setRadius(15);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Header */}
      <Header
        onRefresh={() => fetchStations(true)}
        isLoading={isLoading}
        lastUpdated={lastUpdated}
        isDemo={isDemo}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-5 sm:px-6 space-y-4">
        {/* Error notification if any */}
        {errorMsg && (
          <div className="bg-rose-950/60 border border-rose-800/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-rose-300 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => fetchStations(true)}
              className="px-2.5 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-900 text-white font-medium shrink-0 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Erneut versuchen</span>
            </button>
          </div>
        )}

        {/* Location & Radius Control */}
        <LocationBar
          currentLocationName={locationName}
          onSelectCoords={handleSelectCoords}
          onRequestGeolocation={handleRequestGeolocation}
          isLocating={isLocating}
          selectedRadius={radius}
          onRadiusChange={setRadius}
        />

        {/* Fuel & Secondary Filters */}
        <FilterBar
          fuelType={fuelType}
          onFuelTypeChange={setFuelType}
          onlyOpen={onlyOpen}
          onToggleOnlyOpen={() => setOnlyOpen(!onlyOpen)}
          selectedBrand={selectedBrand}
          onBrandChange={setSelectedBrand}
          availableBrands={availableBrands}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          totalCount={stations.length}
        />

        {/* Best Price Hero Banner */}
        {cheapestOpenStation && (
          <BestPriceHero
            station={cheapestOpenStation}
            fuelType={fuelType}
            onOpenDetails={setSelectedStation}
          />
        )}

        {/* Station List */}
        <StationList
          stations={filteredStations}
          isLoading={isLoading}
          fuelType={fuelType}
          onOpenDetails={setSelectedStation}
          onResetFilters={handleResetFilters}
          radius={radius}
        />
      </main>

      {/* Detail Modal */}
      {selectedStation && (
        <StationDetailModal
          station={selectedStation}
          selectedFuelType={fuelType}
          onClose={() => setSelectedStation(null)}
        />
      )}

      {/* Attribution Footer */}
      <AttributionFooter />
    </div>
  );
}
