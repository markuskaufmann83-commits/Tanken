"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    try {
      if ("caches" in window) {
        caches.keys().then((keys) => {
          keys.forEach((k) => caches.delete(k));
        });
      }
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn("Error clearing cache", e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Anwendungsfehler aufgetreten</h2>
              <p className="text-xs text-slate-400">
                Die Seite konnte aufgrund eines zwischengespeicherten Datenzustands nicht geladen werden.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="bg-slate-950 rounded-xl p-3 text-left font-mono text-[11px] text-rose-300 border border-slate-800/80 overflow-x-auto max-h-28">
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-lg shadow-emerald-950/40"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Cache leeren & Seite neu laden</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
