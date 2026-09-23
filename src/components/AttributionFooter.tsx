"use client";

import React from "react";
import { ShieldCheck, ExternalLink, Heart } from "lucide-react";

export const AttributionFooter: React.FC = () => {
  return (
    <footer className="mt-12 border-t border-zinc-800/80 bg-zinc-950 text-zinc-400 text-xs py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="font-normal text-zinc-400">
              Spritpreis-Daten bereitgestellt durch{" "}
              <a
                href="https://creativecommons.tankerkoenig.de"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-200 hover:text-white underline underline-offset-2 inline-flex items-center gap-0.5"
              >
                <span>Tankerkönig</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </a>{" "}
              unter{" "}
              <a
                href="https://creativecommons.org/licenses/by/4.0/deed.de"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-300 hover:text-white underline underline-offset-2"
              >
                CC BY 4.0
              </a>{" "}
              / MTS-K.
            </p>
            <p className="text-[11px] text-zinc-400">
              Geodaten & Adresssuche ©{" "}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-zinc-200 hover:underline"
              >
                OpenStreetMap
              </a>{" "}
              Mitwirkende (ODbL).
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400">
              <ShieldCheck className="w-3 h-3 text-zinc-400" />
              <span>Azure Static Web Apps</span>
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-400">
          <p>TankPilot Deutschland • PWA</p>
          <p>
            Verbindlich sind immer die Preise an der Zapfsäule.
          </p>
        </div>
      </div>
    </footer>
  );
};
