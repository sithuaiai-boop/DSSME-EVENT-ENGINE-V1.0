/**
 * DSSME EVENT ENGINE V1.0 - Draw Countdown & Status Notification Header
 * Live UTC-synchronized indicator for authoritative lottery draws.
 * Displays "Draw Approaching", "Draw In Progress", "Results Finalized", or "Draw Scheduled".
 */

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertTriangle, Radio, ChevronDown, Sparkles } from 'lucide-react';
import {
  LotteryDrawTimeConfig,
  LOTTERY_DRAW_TIMES,
  getDrawTimeString,
  getDrawUtcInstant,
} from '../engine/lottery/drawConfig.js';

interface DrawCountdownHeaderProps {
  selectedDraw: LotteryDrawTimeConfig;
  targetDate: string;
  onSelectDraw?: (index: number) => void;
}

export type DrawStateCategory = 'APPROACHING' | 'IN_PROGRESS' | 'FINALIZED' | 'SCHEDULED';

export function getDrawStatusCategory(diffSeconds: number): DrawStateCategory {
  if (diffSeconds < -900) return 'FINALIZED';
  if (diffSeconds <= 0) return 'IN_PROGRESS';
  if (diffSeconds <= 3600) return 'APPROACHING';
  return 'SCHEDULED';
}

export function formatCountdown(totalSec: number): string {
  const abs = Math.abs(totalSec);
  const hours = Math.floor(abs / 3600);
  const minutes = Math.floor((abs % 3600) / 60);
  const seconds = abs % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  }
  return `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

export const DrawCountdownHeader: React.FC<DrawCountdownHeaderProps> = ({
  selectedDraw,
  targetDate,
  onSelectDraw,
}) => {
  const [nowUtc, setNowUtc] = useState<Date>(new Date());
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  // Update every second with high precision
  useEffect(() => {
    const timer = setInterval(() => {
      setNowUtc(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute selected draw difference
  const drawUtcInstant = getDrawUtcInstant(selectedDraw, targetDate);
  const drawTimeMs = new Date(drawUtcInstant).getTime();
  const diffSeconds = Math.floor((drawTimeMs - nowUtc.getTime()) / 1000);
  const statusCategory = getDrawStatusCategory(diffSeconds);

  // Current UTC time string
  const currentUtcStr = nowUtc.toISOString().slice(11, 19);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Main Status Capsule */}
        <div
          onClick={() => setShowDropdown((prev) => !prev)}
          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer select-none shadow-sm ${
            statusCategory === 'APPROACHING'
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 hover:border-amber-400'
              : statusCategory === 'IN_PROGRESS'
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-300 hover:border-rose-400'
              : statusCategory === 'FINALIZED'
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 hover:border-emerald-400'
              : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:border-slate-600'
          }`}
          title="Click to view all 4 authoritative draw statuses"
        >
          {/* Status Icon */}
          <div className="flex items-center">
            {statusCategory === 'APPROACHING' && (
              <span className="relative flex h-2.5 w-2.5 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
            )}
            {statusCategory === 'IN_PROGRESS' && (
              <span className="relative flex h-2.5 w-2.5 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            )}
            {statusCategory === 'FINALIZED' && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mr-1 flex-shrink-0" />
            )}
            {statusCategory === 'SCHEDULED' && (
              <Clock className="w-3.5 h-3.5 text-slate-400 mr-1 flex-shrink-0" />
            )}
          </div>

          {/* Status Label & Countdown */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 leading-tight">
            <span className="font-bold flex items-center gap-1.5">
              <span>{selectedDraw.label}</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-black/30 font-semibold opacity-90">
                {selectedDraw.abbreviation}
              </span>
            </span>

            <span className="text-[11px] opacity-90 flex items-center gap-1">
              {statusCategory === 'APPROACHING' && (
                <span className="font-extrabold text-amber-300">
                  Draw Approaching (T-{formatCountdown(diffSeconds)})
                </span>
              )}
              {statusCategory === 'IN_PROGRESS' && (
                <span className="font-extrabold text-rose-300 animate-pulse">
                  Draw In Progress
                </span>
              )}
              {statusCategory === 'FINALIZED' && (
                <span className="text-emerald-400 font-semibold">
                  Results Finalized
                </span>
              )}
              {statusCategory === 'SCHEDULED' && (
                <span className="text-slate-400">
                  T-{formatCountdown(diffSeconds)}
                </span>
              )}
            </span>
          </div>

          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform text-slate-400 ml-0.5 ${
              showDropdown ? 'rotate-180' : ''
            }`}
          />
        </div>

        {/* Live UTC Clock Reference */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 shadow-sm">
          <span className="text-slate-500">UTC:</span>
          <span className="text-slate-200 font-bold tracking-wider">{currentUtcStr}</span>
        </div>
      </div>

      {/* Dropdown: Status across all 4 Authoritative Draws */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-3 font-mono text-xs animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px]">
            <span className="text-slate-200 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              AUTHORITATIVE DRAWS ({targetDate})
            </span>
            <span className="text-slate-500">{currentUtcStr} UTC</span>
          </div>

          <div className="space-y-1.5 pt-2">
            {LOTTERY_DRAW_TIMES.map((draw, idx) => {
              const dUtc = getDrawUtcInstant(draw, targetDate);
              const dTime = new Date(dUtc).getTime();
              const dDiff = Math.floor((dTime - nowUtc.getTime()) / 1000);
              const cat = getDrawStatusCategory(dDiff);
              const isSelected = draw.id === selectedDraw.id;

              return (
                <button
                  key={draw.id}
                  onClick={() => {
                    if (onSelectDraw) onSelectDraw(idx);
                    setShowDropdown(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/40 text-slate-200'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>{draw.label}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                        {draw.abbreviation}
                      </span>
                      {isSelected && (
                        <span className="text-[9px] text-amber-400 font-semibold">• ACTIVE</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      UTC {dUtc.slice(11, 16)} • {draw.timezone}
                    </div>
                  </div>

                  <div className="text-right">
                    {cat === 'APPROACHING' && (
                      <span className="text-[10px] font-bold text-amber-400 block animate-pulse">
                        T-{formatCountdown(dDiff)}
                      </span>
                    )}
                    {cat === 'IN_PROGRESS' && (
                      <span className="text-[10px] font-bold text-rose-400 block animate-pulse">
                        LIVE
                      </span>
                    )}
                    {cat === 'FINALIZED' && (
                      <span className="text-[10px] font-semibold text-emerald-400 block">
                        Finalized
                      </span>
                    )}
                    {cat === 'SCHEDULED' && (
                      <span className="text-[10px] text-slate-400 block">
                        T-{formatCountdown(dDiff)}
                      </span>
                    )}
                    <span className="text-[9px] text-slate-500 uppercase">{cat}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
            <span>Authoritative Civil Times</span>
            <span>Independent of Browser TZ</span>
          </div>
        </div>
      )}
    </div>
  );
};
