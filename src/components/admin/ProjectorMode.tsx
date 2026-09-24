"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { formatAlgerianPhoneDisplay } from "@/lib/phone";
import { Trophy, Sparkles, ArrowLeft, Eye, RefreshCw } from "lucide-react";
import type { WinnerItem } from "./RaffleManager";

export interface ProjectorModeProps {
  winners: WinnerItem[];
  leadingTopicSlug: string;
}

export function ProjectorMode({
  winners,
  leadingTopicSlug,
}: ProjectorModeProps) {
  const t = useTranslations();
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [isRevealingAll, setIsRevealingAll] = useState(false);

  // Group winners by round
  const rounds = Array.from(new Set(winners.map((w) => w.draw_round))).sort(
    (a, b) => b - a
  );
  const [selectedRound, setSelectedRound] = useState<number>(
    rounds.length > 0 ? rounds[0] : 1
  );

  const currentWinners = winners.filter((w) => w.draw_round === selectedRound);

  // Format phone for public projection (showing first 4 and last 2 digits)
  const formatProjectorPhone = (phone: string) => {
    const formatted = formatAlgerianPhoneDisplay(phone);
    const parts = formatted.split(" ");
    if (parts.length === 4) {
      return `${parts[0]} •• •• ${parts[3]}`;
    }
    return formatted;
  };

  const revealAll = () => {
    setIsRevealingAll(true);
    let delay = 0;
    currentWinners.forEach((w) => {
      setTimeout(() => {
        setRevealedIds((prev) => new Set([...prev, w.id]));
      }, delay);
      delay += 350;
    });
    setTimeout(() => setIsRevealingAll(false), delay);
  };

  const toggleRevealOne = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetReveals = () => {
    setRevealedIds(new Set());
  };

  const leadingTopicTitle = t(`topics.${leadingTopicSlug}.title`);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-12 selection:bg-blue-600 selection:text-white">
      {/* Top Bar for Projector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 p-2 rounded bg-slate-900 border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{t("admin.projectorExit")}</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Live Stage Feed
            </span>
          </div>
        </div>

        {/* Round Filter & Reveal Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {rounds.length > 1 && (
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              {rounds.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setSelectedRound(r);
                    setRevealedIds(new Set());
                  }}
                  className={`px-3 py-1.5 rounded font-bold transition-colors ${
                    selectedRound === r
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Round {r}
                </button>
              ))}
            </div>
          )}

          <Button
            size="sm"
            onClick={revealAll}
            disabled={isRevealingAll || currentWinners.length === 0}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold gap-1.5 text-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Reveal All</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={resetReveals}
            className="text-slate-300 border-slate-700 hover:bg-slate-800 text-xs gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Hide</span>
          </Button>
        </div>
      </div>

      {/* Main Projector Stage */}
      <main className="flex-1 flex flex-col items-center justify-center my-8 text-center max-w-5xl mx-auto w-full">
        {/* Banner with Grand Prize & Course Winner */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-black uppercase tracking-widest mb-4">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>{t("admin.projectorTitle")}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
          {t("admin.projectorSubtitle")}
        </h1>

        <div className="my-6 px-6 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-200 flex items-center gap-3">
          <Trophy className="w-6 h-6 text-yellow-400 shrink-0" />
          <p className="text-base sm:text-xl font-bold">
            {t("admin.projectorWinningTopic", { topic: leadingTopicTitle })}
          </p>
        </div>

        {/* Winners Reveal Grid */}
        {currentWinners.length === 0 ? (
          <div className="py-16 text-slate-500 text-lg">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
            <p>{t("admin.noWinnersYet")}</p>
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {currentWinners.map((winner, index) => {
              const isRevealed = revealedIds.has(winner.id);

              return (
                <div
                  key={winner.id}
                  onClick={() => toggleRevealOne(winner.id)}
                  className={`relative p-6 sm:p-8 rounded-2xl border-2 transition-all duration-500 cursor-pointer select-none text-center ${
                    isRevealed
                      ? "bg-slate-900/90 border-blue-500 shadow-2xl shadow-blue-500/10 scale-100"
                      : "bg-slate-900/40 border-slate-800 hover:border-slate-700 opacity-90 scale-95"
                  }`}
                >
                  <div className="absolute top-4 start-4">
                    <span className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center border border-slate-700">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="py-4">
                    {isRevealed ? (
                      <div className="flex flex-col items-center gap-2 animate-in zoom-in-90 duration-300">
                        <Trophy className="w-10 h-10 text-yellow-400 mb-1" />
                        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                          {winner.full_name}
                        </h2>
                        <span
                          className="text-sm sm:text-base font-mono font-bold text-blue-400 mt-1"
                          dir="ltr"
                        >
                          {formatProjectorPhone(winner.phone)}
                        </span>
                        <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 mt-1">
                          Pass Confirmed
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center border border-slate-700">
                          <Sparkles className="w-6 h-6 text-slate-500" />
                        </div>
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                          Tap to Reveal Winner
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 pt-4 text-center text-xs text-slate-500">
        <p>Forma Tak 2026 • Trade Event Grand Prize Draw Stage</p>
      </footer>
    </div>
  );
}
