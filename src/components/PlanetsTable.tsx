import React from 'react';
import { CanonicalChart } from '../engine/types.js';

interface PlanetsTableProps {
  chart: CanonicalChart;
}

export const PlanetsTable: React.FC<PlanetsTableProps> = ({ chart }) => {
  const planetList = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu', 'Lagna'];

  const getDignityBadge = (dignity: string) => {
    switch (dignity) {
      case 'Exalted':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Moolatrikona':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      case 'Own':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Grt.Friend':
      case 'Friend':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'Neutral':
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
      case 'Enemy':
      case 'Grt.Enemy':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Debilitated':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            Planetary State Engine (MOD-02 & MOD-05 to MOD-07)
          </h3>
          <p className="text-xs text-slate-400">Sidereal Lahiri standard positions with dignity, motion speed, and combustion status</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-800/60 text-slate-400 font-mono border-b border-slate-800">
              <th className="py-2.5 px-3">Body</th>
              <th className="py-2.5 px-3">Sign</th>
              <th className="py-2.5 px-3">Degree</th>
              <th className="py-2.5 px-3">Nakshatra & Pada</th>
              <th className="py-2.5 px-3">House</th>
              <th className="py-2.5 px-3">Motion</th>
              <th className="py-2.5 px-3">Combustion</th>
              <th className="py-2.5 px-3">Dignity</th>
              <th className="py-2.5 px-3 text-right">Shadbala Rank</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {planetList.map((name) => {
              const p = chart.PLANETS[name];
              if (!p) return null;
              const isLagna = name === 'Lagna';

              return (
                <tr key={name} className={`hover:bg-slate-800/40 transition-colors ${isLagna ? 'bg-amber-950/10' : ''}`}>
                  <td className="py-2.5 px-3 font-semibold text-slate-200 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isLagna ? 'bg-amber-400' : 'bg-slate-500'}`}></span>
                    {name}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-300">{p.sign}</td>
                  <td className="py-2.5 px-3 font-mono text-cyan-300">{p.degreeFormatted}</td>
                  <td className="py-2.5 px-3 text-slate-300">
                    <span className="font-medium">{p.nakshatra}</span>{' '}
                    <span className="text-[11px] text-slate-400 font-mono">({p.pada})</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-300">
                    H{p.house}{' '}
                    <span className="text-[10px] text-slate-500">
                      ({chart.HOUSES[String(p.house)]?.type.slice(0, 3)})
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {p.retrograde ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        RETRO (R)
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono text-emerald-400/80 bg-emerald-500/10">
                        DIRECT
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {p.combust === 'Y' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        COMBUST ({p.combustionDetails?.severity})
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono text-[11px]">No</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-medium ${getDignityBadge(p.dignity)}`}>
                      {p.dignity}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    {p.sb_rank ? (
                      <span className="px-2 py-0.5 bg-slate-800 rounded text-slate-300 font-medium">
                        #{p.sb_rank} <span className="text-[10px] text-slate-500">({p.sb_ratio})</span>
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
