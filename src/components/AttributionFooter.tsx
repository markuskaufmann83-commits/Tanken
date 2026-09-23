"use client";

import React from "react";
import { ShieldCheck, ExternalLink, Heart } from "lucide-react";

export const AttributionFooter: React.FC = () => {
  return (
    <footer className="mt-12 border-t border-slate-800/80 bg-slate-950/80 text-slate-400 text-xs py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-4 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="font-medium text-slate-300">
              Spritpreis-Daten bereitgestellt durch{" "}
              <a
                href="https://creativecommons.tankerkoenig.de"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 inline-flex items-center gap-0.5"
              >
                <span>Tankerkönig</span>
                <ExternalLink className="w-3 h-3" />
              </a>{" "}
              unter{" "}
              <a
                href="https://creativecommons.org/licenses/by/4.0/deed.de"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
              >
                CC BY 4.0
              </a>{" "}
              / MTS-K.
            </p>
            <p className="text-[11px] text-slate-400">
              Geodaten & Adresssuche ©{" "}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:underline"
              >
                OpenStreetMap
              </a>{" "}
              Mitwirkende (ODbL).
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Azure Static Web Apps</span>
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <p>SpritRadar Deutschland • PWA Edition</p>
          <p className="flex items-center gap-1">
            Alle Angaben ohne Gewähr • Verbindlich sind die Preise an der Zapfsäule
          </p>
        </div>
      </div>
    </footer>
  );
};
