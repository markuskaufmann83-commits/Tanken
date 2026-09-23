import { FuelType, Station, StationDetail } from "@/types/tankerkoenig";

export interface FormattedPrice {
  main: string;    // e.g. "1,68"
  sup: string;     // e.g. "9"
  full: string;    // e.g. "1,689 €"
  numeric: number;
}

/**
 * Formats a fuel price (e.g. 1.689) into German format with superscript third decimal digit
 */
export function formatFuelPrice(price: number | false | null | undefined): FormattedPrice | null {
  if (typeof price !== "number" || price <= 0 || isNaN(price)) {
    return null;
  }

  // Round to 3 decimal places
  const priceStr = price.toFixed(3);
  const [intPart, decPart] = priceStr.split(".");
  const firstTwoDec = decPart ? decPart.substring(0, 2) : "00";
  const thirdDec = decPart && decPart.length >= 3 ? decPart[2] : "0";

  return {
    main: `${intPart},${firstTwoDec}`,
    sup: thirdDec,
    full: `${intPart},${firstTwoDec}${thirdDec} €`,
    numeric: price,
  };
}

/**
 * Gets the numeric price for the selected fuel type from a station
 */
export function getFuelPrice(station: Station | StationDetail, fuelType: FuelType): number | null {
  const price = station[fuelType];
  if (typeof price === "number" && price > 0) {
    return price;
  }
  return null;
}

/**
 * Formats distance in km or m
 */
export function formatDistance(distKm: number): string {
  if (typeof distKm !== "number" || isNaN(distKm)) return "—";
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m`;
  }
  return `${distKm.toFixed(1).replace(".", ",")} km`;
}

/**
 * Generates navigation URL for Google Maps and Apple Maps compatible intent
 */
export function getNavigationUrl(lat: number, lng: number, name?: string): string {
  if (name) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${name}, ${lat},${lng}`)}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/**
 * Brand visual configuration
 */
export interface BrandMeta {
  displayName: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  short: string;
  logoUrl: string;
}

export function getBrandMeta(brandRaw: string | undefined, nameRaw: string | undefined): BrandMeta {
  const brand = (brandRaw || nameRaw || "").toUpperCase();

  if (brand.includes("ARAL")) {
    return { displayName: "Aral", bgClass: "bg-blue-500/15", textClass: "text-blue-400", borderClass: "border-blue-500/30", short: "ARAL", logoUrl: "/brands/aral.svg" };
  }
  if (brand.includes("SHELL")) {
    return { displayName: "Shell", bgClass: "bg-amber-500/15", textClass: "text-amber-400", borderClass: "border-amber-500/30", short: "SHELL", logoUrl: "/brands/shell.svg" };
  }
  if (brand.includes("TOTAL")) {
    return { displayName: "TotalEnergies", bgClass: "bg-red-500/15", textClass: "text-red-400", borderClass: "border-red-500/30", short: "TOTAL", logoUrl: "/brands/total.svg" };
  }
  if (brand.includes("JET")) {
    return { displayName: "JET", bgClass: "bg-yellow-500/15", textClass: "text-yellow-400", borderClass: "border-yellow-500/30", short: "JET", logoUrl: "/brands/jet.svg" };
  }
  if (brand.includes("HEM")) {
    return { displayName: "HEM", bgClass: "bg-emerald-500/15", textClass: "text-emerald-400", borderClass: "border-emerald-500/30", short: "HEM", logoUrl: "/brands/hem.svg" };
  }
  if (brand.includes("ESSO")) {
    return { displayName: "Esso", bgClass: "bg-red-500/15", textClass: "text-red-400", borderClass: "border-red-500/30", short: "ESSO", logoUrl: "/brands/esso.svg" };
  }
  if (brand.includes("AVIA")) {
    return { displayName: "AVIA", bgClass: "bg-rose-500/15", textClass: "text-rose-400", borderClass: "border-rose-500/30", short: "AVIA", logoUrl: "/brands/avia.svg" };
  }
  if (brand.includes("STAR")) {
    return { displayName: "star", bgClass: "bg-red-500/15", textClass: "text-red-400", borderClass: "border-red-500/30", short: "STAR", logoUrl: "/brands/star.svg" };
  }
  if (brand.includes("ENI") || brand.includes("AGIP")) {
    return { displayName: "Eni / Agip", bgClass: "bg-amber-500/15", textClass: "text-amber-400", borderClass: "border-amber-500/30", short: "ENI", logoUrl: "/brands/generic.svg" };
  }
  if (brand.includes("OMV")) {
    return { displayName: "OMV", bgClass: "bg-cyan-500/15", textClass: "text-cyan-400", borderClass: "border-cyan-500/30", short: "OMV", logoUrl: "/brands/generic.svg" };
  }

  // Fallback for independent / other stations
  const display = brandRaw?.trim() || nameRaw?.trim() || "Freie Tankstelle";
  return {
    displayName: display.length > 18 ? display.substring(0, 16) + "…" : display,
    bgClass: "bg-zinc-800/80",
    textClass: "text-zinc-300",
    borderClass: "border-zinc-700/60",
    short: display.substring(0, 4).toUpperCase(),
    logoUrl: "/brands/generic.svg",
  };
}

/**
 * 2-minute client-side in-memory & local cache
 */
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

export function getCachedData<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCachedData<T>(key: string, data: T): void {
  memoryCache.set(key, {
    timestamp: Date.now(),
    data,
  });
}

export function clearClientCache(): void {
  memoryCache.clear();
}
