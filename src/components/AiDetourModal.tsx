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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-slate-950 shadow-md">
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                KI-Umweg-Berater
              </h3>
              <p className="text-[11px] text-slate-400">
                Smarte Kosten-Nutzen-Analyse für deine Fahrt
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Main Verdict Card */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              verdict.type === "success"
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                : verdict.type === "neutral"
                ? "bg-amber-950/40 border-amber-500/40 text-amber-200"
                : "bg-rose-950/40 border-rose-500/40 text-rose-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {verdict.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : verdict.type === "neutral" ? (
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span className="text-xs font-bold uppercase tracking-wider">
                {verdict.badge}
              </span>
            </div>

            <h4 className="text-xl font-black text-white tracking-tight mb-1.5">
              {verdict.title}
            </h4>
            <p className="text-xs opacity-90 leading-relaxed">{verdict.description}</p>
          </div>

          {/* Direct Station Comparison */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Nearest Station */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Nächste Station
              </span>
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${nearMeta.bgClass} ${nearMeta.textClass}`}
                >
                  {nearMeta.displayName}
                </span>
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {nearestStation.name}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Entfernung: <span className="text-slate-200 font-medium">{formatDistance(dNear)}</span>
              </div>
              <div className="text-lg font-bold text-white flex items-baseline gap-0.5">
                <span>{nearPriceFormatted?.main ?? "—"}</span>
                <sup className="text-xs font-bold text-slate-300">
                  {nearPriceFormatted?.sup ?? ""}
                </sup>
                <span className="text-xs text-slate-400 ml-0.5">€</span>
              </div>
            </div>

            {/* Cheapest Station */}
            <div className="bg-slate-950/60 border border-emerald-500/30 rounded-2xl p-3 space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
                Günstigste
              </div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
                Bester Preis
              </span>
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${cheapMeta.bgClass} ${cheapMeta.textClass}`}
                >
                  {cheapMeta.displayName}
                </span>
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {cheapestStation.name}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Entfernung: <span className="text-emerald-400 font-medium">{formatDistance(dCheap)}</span>
              </div>
              <div className="text-lg font-bold text-emerald-400 flex items-baseline gap-0.5">
                <span>{cheapPriceFormatted?.main ?? "—"}</span>
                <sup className="text-xs font-bold text-emerald-300">
                  {cheapPriceFormatted?.sup ?? ""}
                </sup>
                <span className="text-xs text-slate-400 ml-0.5">€</span>
              </div>
            </div>
          </div>

          {/* Interactive Parameters: Tank volume & Consumption */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-3.5 space-y-3">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-emerald-400" />
              <span>Deine Fahrzeugdaten anpassen:</span>
            </span>

            {/* Tank volume */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span className="text-slate-400">Tankmenge:</span>
                <span className="font-semibold text-white">{tankLiters} Liter</span>
              </div>
              <div className="flex gap-1.5">
                {[30, 45, 55, 70].map((l) => (
                  <button
                    key={l}
                    onClick={() => setTankLiters(l)}
                    className={`flex-1 py-1 text-xs rounded-lg font-medium transition-all ${
                      tankLiters === l
                        ? "bg-emerald-600 text-white font-bold shadow-sm"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    }`}
                  >
                    {l} L
                  </button>
                ))}
              </div>
            </div>

            {/* Consumption */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span className="text-slate-400">Durchschnittsverbrauch:</span>
                <span className="font-semibold text-white">{consumption.toFixed(1)} l / 100 km</span>
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
                        ? "bg-emerald-600 text-white font-bold shadow-sm"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300"
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
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 text-xs space-y-1.5 divide-y divide-slate-800/60 text-slate-300">
              <div className="flex justify-between pb-1.5">
                <span className="text-slate-400">Mehrstrecke (Hin & Zurück):</span>
                <span className="font-semibold text-slate-100">
                  +{extraRoundTripKm.toFixed(1).replace(".", ",")} km (ca. {extraTimeMinutes} Min)
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Preisvorteil Zapfsäule ({tankLiters} L):</span>
                <span className="font-semibold text-emerald-400">
                  +{grossSavings.toFixed(2).replace(".", ",")} €
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Spritkosten für Umweg:</span>
                <span className="font-semibold text-rose-400">
                  -{detourCost.toFixed(2).replace(".", ",")} €
                </span>
              </div>
              <div className="flex justify-between pt-1.5 font-bold text-sm">
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
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Schließen
          </button>

          <a
            href={getNavigationUrl(
              cheapestStation.lat,
              cheapestStation.lng,
              `${cheapestStation.brand || cheapestStation.name}, ${cheapestStation.place}`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-colors"
          >
            <Navigation className="w-3.5 h-3.5 fill-current" />
            <span>Zur günstigsten navigieren</span>
          </a>
        </div>
      </div>
    </div>
  );
};
