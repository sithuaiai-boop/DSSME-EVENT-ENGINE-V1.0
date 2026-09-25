import React from 'react';
import { CanonicalChart } from '../engine/types.js';

interface DashaViewProps {
  chart: CanonicalChart;
}

export const DashaView: React.FC<DashaViewProps> = ({ chart }) => {
  const dasha = chart.DASHA;

  return (
    <div className="flex flex-col gap-5">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <h2 className="text-lg font-bold text-slate-100">MOD-09 Vimshottari Dasha Engine</h2>
          </div>
          <p className="text-xs text-slate-400">
            120-year cycle computed from natal Moon Nakshatra (Vishakha-4, Jupiter ruler)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-mono font-medium">
            Active: {dasha.dasha_string}
          </span>
        </div>
      </div>

      {/* 3 Active Levels Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-amber-500/30 p-4 rounded-xl bg-amber-950/10">
          <p className="text-xs uppercase font-mono text-amber-400 tracking-wider mb-1">Mahadasha (MD)</p>
          <p className="text-2xl font-bold text-slate-100">{dasha.mahadasha_planet}</p>
          <span className="text-[11px] text-slate-400 font-mono">Next MD: {dasha.next_mahadasha_planet}</span>
        </div>

        <div className="bg-slate-900 border border-cyan-500/30 p-4 rounded-xl bg-cyan-950/10">
          <p className="text-xs uppercase font-mono text-cyan-400 tracking-wider mb-1">Antardasha (AD)</p>
          <p className="text-2xl font-bold text-slate-100">{dasha.antardasha_planet}</p>
          <span className="text-[11px] text-slate-400 font-mono">Current sub-period</span>
        </div>

        <div className="bg-slate-900 border border-purple-500/30 p-4 rounded-xl bg-purple-950/10">
          <p className="text-xs uppercase font-mono text-purple-400 tracking-wider mb-1">Pratyantardasha (PD)</p>
          <p className="text-2xl font-bold text-slate-100">{dasha.pratyantara}</p>
          <span className="text-[11px] text-slate-400 font-mono">Sub-sub period</span>
        </div>
      </div>

      {/* Upcoming Antardashas Timetable */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Upcoming Antardasha Schedule</h3>
            <p className="text-xs text-slate-400">Timetable of sub-periods in current Jupiter Mahadasha</p>
          </div>
          <span className="text-xs font-mono text-slate-500">{dasha.upcoming_ad.length} Periods</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800/60 text-slate-400 font-mono border-b border-slate-800">
                <th className="py-2.5 px-3">Sub-Period (AD)</th>
                <th className="py-2.5 px-3">Start Date</th>
                <th className="py-2.5 px-3">End Date</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-mono">
              {dasha.upcoming_ad.map((ad, idx) => {
                const isCurrent = ad.planet === dasha.antardasha_planet;
                return (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isCurrent ? 'bg-amber-950/20' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-200 flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isCurrent ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'
                        }`}
                      ></span>
                      {ad.planet} Antardasha
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{ad.start}</td>
                    <td className="py-2.5 px-3 text-slate-300">{ad.end}</td>
                    <td className="py-2.5 px-3 text-right">
                      {isCurrent ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          ACTIVE NOW
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Upcoming</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
