"use client";

import React, { useState } from "react";
import { Station, FuelType } from "@/types/tankerkoenig";
import { getFuelPrice, formatFuelPrice, formatDistance, getBrandMeta, getNavigationUrl } from "@/lib/fuelUtils";
import {
  Sparkles,
  X,
  TrendingUp,
  TrendingDown,
  Navigation,
  Clock,
  Fuel,
  Info,
  Car,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";

interface AiDetourModalProps {
  cheapestStation: Station | null;
  nearestStation: Station | null;
  fuelType: FuelType;
  onClose: () => void;
  onOpenDetails: (station: Station) => void;
}

export const AiDetourModal: React.FC<AiDetourModalProps> = ({
  cheapestStation,
  nearestStation,
  fuelType,
  onClose,
  onOpenDetails,
}) => {
  const [tankLiters, setTankLiters] = useState<number>(50);
  const [consumption, setConsumption] = useState<number>(
    fuelType === "diesel" ? 5.8 : 6.8
  );

  if (!cheapestStation || !nearestStation) return null;

  const isSameStation = cheapestStation.id === nearestStation.id;

  const pCheap = getFuelPrice(cheapestStation, fuelType) ?? 0;
  const pNear = getFuelPrice(nearestStation, fuelType) ?? 0;
  const priceDiffPerLiter = pNear - pCheap; // positive means cheapest is cheaper

  const dCheap = cheapestStation.dist ?? 0;
  const dNear = nearestStation.dist ?? 0;
  const extraOneWayKm = Math.max(0, dCheap - dNear);
  const extraRoundTripKm = extraOneWayKm * 2;

  // Fuel calculation
  const grossSavings = tankLiters * priceDiffPerLiter;
  const fuelUsedDetour = (extraRoundTripKm * consumption) / 100;
  const detourCost = fuelUsedDetour * pCheap;
  const netSavings = grossSavings - detourCost;
  const extraTimeMinutes = Math.round(extraRoundTripKm * 1.6); // ca. 1.6 min per km urban/suburban

  const cheapMeta = getBrandMeta(cheapestStation.brand, cheapestStation.name);
  const nearMeta = getBrandMeta(nearestStation.brand, nearestStation.name);

  const cheapPriceFormatted = formatFuelPrice(pCheap);
  const nearPriceFormatted = formatFuelPrice(pNear);

  const getVerdict = () => {
    if (isSameStation) {
      return {
        type: "success" as const,
        badge: "Optimaler Treffer",
        title: "Kein Umweg nötig!",
        description:
          "Die günstigste Tankstelle ist gleichzeitig die nächstgelegene in deiner Umgebung. Du sparst maximal ohne jeden zusätzlichen Kilometer!",
      };
    }
    if (netSavings >= 1.0) {
      return {
        type: "success" as const,
        badge: "KI-Empfehlung: Umweg lohnt sich",
        title: `Du sparst ca. ${netSavings.toFixed(2).replace(".", ",")} € netto`,
        description: `Der Preisvorteil an der Zapfsäule (${grossSavings.toFixed(2).replace(".", ",")} €) übersteigt die zusätzlichen Spritkosten für den Umweg (${detourCost.toFixed(2).replace(".", ",")} €) deutlich.`,
      };
    }
    if (netSavings >= -0.2) {
      return {
        type: "neutral" as const,
        badge: "KI-Empfehlung: Kaum Unterschied",
        title: `Minimaler Vorteil: ±${Math.abs(netSavings).toFixed(2).replace(".", ",")} €`,
        description: `Die Spritersparnis wird durch die zusätzlichen Fahrkilometer fast genau aufgebraucht. Unter Berücksichtigung des Zeitaufwands (${extraTimeMinutes} Min) lohnt sich die Fahrt kaum. Fahre lieber zur nächsten Station.`,
      };
    }
    return {
      type: "danger" as const,
      badge: "KI-Empfehlung: Lohnt sich NICHT!",
      title: `Du zahlst ca. ${Math.abs(netSavings).toFixed(2).replace(".", ",")} € drauf`,
      description: `Der Umweg von ${extraRoundTripKm.toFixed(1).replace(".", ",")} km kostet dich mehr Sprit (${detourCost.toFixed(2).replace(".", ",")} €) als du durch den günstigeren Literpreis einsparst (${grossSavings.toFixed(2).replace(".", ",")} €).`,
    };
  };

  const verdict = getVerdict();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                KI-Umweg-Berater
              </h3>
              <p className="text-[11px] text-zinc-400">
                Kosten-Nutzen-Rechnung für Mehrkilometer
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Main Verdict Card */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              verdict.type === "success"
                ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                : verdict.type === "neutral"
                ? "bg-zinc-950 border-zinc-800 text-zinc-300"
                : "bg-rose-950/20 border-rose-500/30 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              {verdict.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : verdict.type === "neutral" ? (
                <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                {verdict.badge}
              </span>
            </div>

            <h4 className="text-lg font-bold text-zinc-100 tracking-tight mb-1 tabular-nums">
              {verdict.title}
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed">{verdict.description}</p>
          </div>

          {/* Direct Station Comparison */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Nearest Station */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-1.5">
              <span className="text-[10px] uppercase font-medium text-zinc-400 tracking-wider block">
                Nächste Station
              </span>
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase border ${nearMeta.bgClass} ${nearMeta.textClass} ${nearMeta.borderClass}`}
                >
                  <img src={nearMeta.logoUrl} alt={nearMeta.displayName} className="w-4 h-3.5 object-contain" />
                  <span>{nearMeta.displayName}</span>
                </span>
                <span className="text-xs font-medium text-zinc-200 truncate">
                  {nearestStation.name}
                </span>
              </div>
              <div className="text-xs text-zinc-400 tabular-nums">
                Entfernung: <span className="text-zinc-200 font-medium">{formatDistance(dNear)}</span>
              </div>
              <div className="text-lg font-semibold text-zinc-100 flex items-baseline gap-0.5 tabular-nums">
                <span>{nearPriceFormatted?.main ?? "—"}</span>
                <sup className="text-xs font-medium text-zinc-400">
                  {nearPriceFormatted?.sup ?? ""}
                </sup>
                <span className="text-xs text-zinc-400 ml-0.5">€</span>
              </div>
            </div>

            {/* Cheapest Station */}
            <div className="bg-zinc-950 border border-zinc-700/80 rounded-xl p-3 space-y-1.5 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-zinc-800 text-zinc-300 text-[9px] font-medium px-2 py-0.5 rounded-bl-md">
                Günstigste
              </div>
              <span className="text-[10px] uppercase font-medium text-emerald-400 tracking-wider block">
                Bester Preis
              </span>
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase border ${cheapMeta.bgClass} ${cheapMeta.textClass} ${cheapMeta.borderClass}`}
                >
                  <img src={cheapMeta.logoUrl} alt={cheapMeta.displayName} className="w-4 h-3.5 object-contain" />
                  <span>{cheapMeta.displayName}</span>
                </span>
                <span className="text-xs font-medium text-zinc-200 truncate">
                  {cheapestStation.name}
                </span>
              </div>
              <div className="text-xs text-zinc-400 tabular-nums">
                Entfernung: <span className="text-emerald-400 font-medium">{formatDistance(dCheap)}</span>
              </div>
              <div className="text-lg font-semibold text-emerald-400 flex items-baseline gap-0.5 tabular-nums">
                <span>{cheapPriceFormatted?.main ?? "—"}</span>
                <sup className="text-xs font-medium text-emerald-400/80">
                  {cheapPriceFormatted?.sup ?? ""}
                </sup>
                <span className="text-xs text-zinc-400 ml-0.5">€</span>
              </div>
            </div>
          </div>

          {/* Interactive Parameters: Tank volume & Consumption */}
          <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3.5 space-y-3">
            <span className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-zinc-400" />
              <span>Fahrzeugdaten anpassen:</span>
            </span>

            {/* Tank volume */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-zinc-300">
                <span className="text-zinc-400">Tankmenge:</span>
                <span className="font-medium text-zinc-100 tabular-nums">{tankLiters} Liter</span>
              </div>
              <div className="flex gap-1.5">
                {[30, 45, 55, 70].map((l) => (
                  <button
                    key={l}
                    onClick={() => setTankLiters(l)}
                    className={`flex-1 py-1 text-xs rounded-lg font-medium transition-all tabular-nums ${
                      tankLiters === l
                        ? "bg-zinc-100 text-zinc-950 font-semibold shadow-sm"
                        : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
                    }`}
                  >
                    {l} L
                  </button>
                ))}
              </div>
            </div>

            {/* Consumption */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-zinc-300">
                <span className="text-zinc-400">Durchschnittsverbrauch:</span>
                <span className="font-medium text-zinc-100 tabular-nums">{consumption.toFixed(1)} l / 100 km</span>
              </div>
              <div className="flex gap-1.5">
                {[
                  { label: "Sparsam", val: 5.0 },
                  { label: "Normal", val: 6.5 },
                  { label: "Kombi/SUV", val: 8.5 },
                ].map((c) => (
                  <button
                    key={c.val}
                    onClick={() => setConsumption(c.val)}
                    className={`flex-1 py-1 text-xs rounded-lg font-medium transition-all ${
                      consumption === c.val
                        ? "bg-zinc-100 text-zinc-950 font-semibold shadow-sm"
                        : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
                    }`}
                  >
                    {c.label} ({c.val}l)
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Calculation Breakdown */}
          {!isSameStation && (
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 text-xs space-y-1.5 divide-y divide-zinc-800/80 text-zinc-300">
              <div className="flex justify-between pb-1.5 tabular-nums">
                <span className="text-zinc-400">Mehrstrecke (Hin & Zurück):</span>
                <span className="font-medium text-zinc-100">
                  +{extraRoundTripKm.toFixed(1).replace(".", ",")} km (ca. {extraTimeMinutes} Min)
                </span>
              </div>
              <div className="flex justify-between py-1.5 tabular-nums">
                <span className="text-zinc-400">Preisvorteil Zapfsäule ({tankLiters} L):</span>
                <span className="font-medium text-emerald-400">
                  +{grossSavings.toFixed(2).replace(".", ",")} €
                </span>
              </div>
              <div className="flex justify-between py-1.5 tabular-nums">
                <span className="text-zinc-400">Spritkosten für Umweg:</span>
                <span className="font-medium text-rose-400">
                  -{detourCost.toFixed(2).replace(".", ",")} €
                </span>
              </div>
              <div className="flex justify-between pt-1.5 font-semibold text-sm tabular-nums">
                <span>Echter Reingewinn:</span>
                <span className={netSavings >= 0 ? "text-emerald-400" : "text-rose-400"}>
                  {netSavings >= 0 ? "+" : ""}
                  {netSavings.toFixed(2).replace(".", ",")} €
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/90 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
          >
            Schließen
          </button>

          <div className="flex items-center gap-2">
            {!isSameStation && (
              <a
                href={getNavigationUrl(
                  nearestStation.lat,
                  nearestStation.lng,
                  `${nearestStation.brand || nearestStation.name}, ${nearestStation.place}`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
              >
                <Navigation className="w-3.5 h-3.5 opacity-70" />
                <span>Zur nächsten ({nearMeta.displayName})</span>
              </a>
            )}

            <a
              href={getNavigationUrl(
                cheapestStation.lat,
                cheapestStation.lng,
                `${cheapestStation.brand || cheapestStation.name}, ${cheapestStation.place}`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs shadow-sm transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 fill-current" />
              <span>
                {isSameStation
                  ? "Navigation starten"
                  : `Zur günstigsten (${cheapMeta.displayName})`}
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
