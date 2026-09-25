import React from 'react';
import { CanonicalChart } from '../engine/types.js';

interface VedicChartProps {
  chart: CanonicalChart;
}

export const VedicChart: React.FC<VedicChartProps> = ({ chart }) => {
  const houses = chart.HOUSES;
  const lagnaSign = chart.IDENTITY.lagna_sign;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            Rashi Chakra (D1 Natal Chart)
          </h3>
          <p className="text-xs text-slate-400">
            Lagna: <span className="text-amber-300 font-medium">{lagnaSign} ({chart.IDENTITY.lagna_degree})</span> • Whole Sign System
          </p>
        </div>
        <div className="text-right">
          <span className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
            9-Body Standard
          </span>
        </div>
      </div>

      {/* 12-House Grid (Vedic Houses layout) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((hNum) => {
          const h = houses[String(hNum)];
          if (!h) return null;
          const isLagna = hNum === 1;
          const isKendra = h.type === 'Angular';
          const isTrikona = hNum === 1 || hNum === 5 || hNum === 9;

          return (
            <div
              key={hNum}
              className={`p-3 rounded-lg border transition-all ${
                isLagna
                  ? 'bg-amber-950/20 border-amber-500/40 shadow-sm shadow-amber-500/10'
                  : isKendra
                  ? 'bg-slate-800/40 border-slate-700'
                  : 'bg-slate-900/60 border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-mono font-bold text-slate-400">
                  H{hNum}{' '}
                  {isLagna && (
                    <span className="ml-1 text-[10px] text-amber-400 bg-amber-400/10 px-1 py-0.5 rounded font-sans font-semibold">
                      LAGNA
                    </span>
                  )}
                </span>
                <span className={`text-[11px] font-medium ${isLagna ? 'text-amber-300 font-bold' : 'text-slate-300'}`}>
                  {h.sign}
                </span>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center justify-between mb-2">
                <span>Lord: {h.lord}</span>
                <span className="text-[10px] px-1 py-0.2 bg-slate-800 rounded text-slate-400 font-mono">
                  {h.type.slice(0, 3)}
                </span>
              </div>

              {/* Occupants */}
              <div className="min-h-[32px] flex flex-wrap gap-1">
                {h.occupants.length === 0 ? (
                  <span className="text-[11px] text-slate-600 italic">Empty</span>
                ) : (
                  h.occupants.map((occ) => {
                    const pState = chart.PLANETS[occ];
                    return (
                      <span
                        key={occ}
                        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded ${
                          occ === 'Sun'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : occ === 'Moon'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : occ === 'Saturn'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : occ === 'Jupiter'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : occ === 'Mars'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : occ === 'Venus'
                            ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                            : occ === 'Mercury'
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                            : 'bg-slate-700 text-slate-200'
                        }`}
                        title={`${occ} in ${pState?.degreeFormatted || ''} (${pState?.dignity || ''})`}
                      >
                        {occ}
                        {pState?.retrograde && <span className="text-[9px] text-rose-400 font-bold">R</span>}
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
