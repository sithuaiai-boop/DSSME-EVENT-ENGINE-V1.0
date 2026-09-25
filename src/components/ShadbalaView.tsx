import React from 'react';
import { CanonicalChart } from '../engine/types.js';

interface ShadbalaViewProps {
  chart: CanonicalChart;
}

export const ShadbalaView: React.FC<ShadbalaViewProps> = ({ chart }) => {
  const sb = chart.SHADBALA;
  const bb = chart.BHAVA_BALA;

  return (
    <div className="flex flex-col gap-5">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
            <h2 className="text-lg font-bold text-slate-100">MOD-10 Shadbala & MOD-11 Bhava Bala</h2>
          </div>
          <p className="text-xs text-slate-400">
            Six-fold planetary strength in Virupas & 12-Bhava distribution (kept strictly decoupled)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-mono font-medium">
            Virupa Precision: 0.1
          </span>
        </div>
      </div>

      {/* 7 Planets Shadbala Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {sb._columns.map((pName, i) => {
          const tot = sb.total_virupas[i];
          const min = sb.minimum_required[i];
          const pct = sb.percent_required[i];
          const rank = sb.rank[i];
          const isRank1 = rank === 1;

          return (
            <div
              key={pName}
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                isRank1
                  ? 'bg-purple-950/20 border-purple-500/50 shadow-md shadow-purple-500/10'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-200 text-sm">{pName}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                      isRank1
                        ? 'bg-purple-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    #{rank}
                  </span>
                </div>

                <div className="mb-3">
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-2xl font-bold font-mono text-slate-100">{tot}</p>
                    <span className="text-xs text-purple-300 font-mono font-medium">
                      {(tot / 60).toFixed(2)} R
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Req: {min} ({pct}%) • Ratio: {(tot / min).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Component breakdown */}
              <div className="space-y-1 text-[10px] font-mono text-slate-400 border-t border-slate-800 pt-2">
                <div className="flex justify-between">
                  <span>Sthana:</span>
                  <span className="text-slate-300">{sb.sthana_total[i]}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dig:</span>
                  <span className="text-slate-300">{sb.dig_bala[i]}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kaala:</span>
                  <span className="text-slate-300">{sb.kaala_total[i]}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cheshta:</span>
                  <span className="text-slate-300">{sb.chesta_bala[i]}</span>
                </div>
                <div className="flex justify-between">
                  <span>Naisargika:</span>
                  <span className="text-slate-300">{sb.naisargika_bala[i]}</span>
                </div>
                <div className="flex justify-between">
                  <span>Drik:</span>
                  <span className={sb.drig_bala[i] < 0 ? 'text-rose-400' : 'text-slate-300'}>
                    {sb.drig_bala[i]}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bhava Bala 12 Houses */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h3 className="text-base font-semibold text-slate-100 mb-1 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
          MOD-11 Bhava Bala (House Strengths 1 to 12)
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Independent house strengths combining Bhavadhipati, Bhava Drishti, and Digbala.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }, (_, idx) => idx + 1).map((h) => {
            const item = bb[String(h)];
            const hInfo = chart.HOUSES[String(h)];
            return (
              <div key={h} className="bg-slate-800/40 border border-slate-800 p-3 rounded-lg">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono font-bold text-slate-400">House {h}</span>
                  <span className="text-[11px] text-blue-300 font-medium">{item?.sign}</span>
                </div>
                <p className="text-lg font-bold font-mono text-slate-100">{item?.total}</p>
                <span className="text-[10px] text-slate-500 font-mono">
                  Lord: {hInfo?.lord} • {hInfo?.type.slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
