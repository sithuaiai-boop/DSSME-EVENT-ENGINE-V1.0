import React from 'react';
import { CanonicalChart } from '../engine/types.js';

interface AshtakavargaViewProps {
  chart: CanonicalChart;
}

const DEFAULT_SIGNS: string[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer',
  'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

export const AshtakavargaView: React.FC<AshtakavargaViewProps> = ({ chart }) => {
  const signs: string[] = Array.isArray(chart.BAV._signs) && typeof chart.BAV._signs[0] === 'string'
    ? (chart.BAV._signs as unknown as string[])
    : DEFAULT_SIGNS;
  const bav = chart.BAV;
  const sav = chart.SAV;
  const currentSignBav = chart.BAV_CURRENT_SIGN;

  const planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Lagna'];

  return (
    <div className="flex flex-col gap-5">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
            <h2 className="text-lg font-bold text-slate-100">MOD-12 Ashtakavarga Engine</h2>
          </div>
          <p className="text-xs text-slate-400">
            Strict Aries→Pisces ordering. SAV derived from 7 classical planets (Lagna excluded).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-teal-500/10 border border-teal-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <div>
              <p className="text-[10px] uppercase font-mono text-teal-400 tracking-wider">SAV Grand Total</p>
              <p className="text-base font-bold text-teal-300 font-mono">{sav.grand_total} (Exact 337)</p>
            </div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 px-3 py-1.5 rounded-lg">
            <p className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">Spec Sum (H2, H5, H8, H11)</p>
            <p className="text-base font-bold text-amber-300 font-mono">{sav.spec_sum}</p>
          </div>
        </div>
      </div>

      {/* SAV 12 Signs Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <span>Sarvashtakavarga (SAV) 12-Sign Distribution</span>
          <span className="text-xs font-mono text-slate-500">(Average: ~28.08 bindus)</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {signs.map((sName, sIdx) => {
            const val = sav.values[sIdx];
            const isHigh = val >= 30;
            const isLow = val < 25;
            return (
              <div
                key={sName}
                className={`p-3 rounded-lg border flex flex-col justify-between ${
                  isHigh
                    ? 'bg-teal-950/20 border-teal-500/30'
                    : isLow
                    ? 'bg-rose-950/10 border-rose-500/20'
                    : 'bg-slate-800/30 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono text-slate-400 text-[11px]">{sIdx + 1}. {sName.slice(0, 3)}</span>
                  {val >= 35 && <span className="text-[10px] font-bold text-amber-400">PEAK</span>}
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono text-slate-100">{val}</span>
                  <span className="text-[10px] text-slate-500 font-mono">bindus</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 8 BAV Bindu Tables */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-200">
            Bhinnashtakavarga (BAV) Matrix (Aries → Pisces Standard Order)
          </h3>
          <p className="text-xs text-slate-400">Bindu counts per planet across all 12 zodiac signs</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800/60 text-slate-400 font-mono border-b border-slate-800">
                <th className="py-2.5 px-3">Planet</th>
                {signs.map((s) => (
                  <th key={s} className="py-2.5 px-2 text-center">
                    {s.slice(0, 3)}
                  </th>
                ))}
                <th className="py-2.5 px-3 text-right">Sum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-mono">
              {planets.map((p) => {
                const row = bav[p];
                if (!row) return null;
                const isLagna = p === 'Lagna';
                const rowSum = row.reduce((a, b) => a + b, 0);

                return (
                  <tr key={p} className={`hover:bg-slate-800/40 transition-colors ${isLagna ? 'bg-amber-950/10' : ''}`}>
                    <td className="py-2 px-3 font-sans font-semibold text-slate-200 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isLagna ? 'bg-amber-400' : 'bg-slate-500'}`}></span>
                      {p}
                    </td>
                    {row.map((count, sIdx) => {
                      const cur = currentSignBav[p];
                      const isCurrentSign = cur && signs[sIdx] === cur.sign;
                      return (
                        <td
                          key={sIdx}
                          className={`py-2 px-2 text-center ${
                            isCurrentSign
                              ? 'bg-amber-500/20 text-amber-300 font-bold'
                              : count >= 5
                              ? 'text-teal-300 font-semibold'
                              : count <= 2
                              ? 'text-slate-500'
                              : 'text-slate-300'
                          }`}
                        >
                          {count}
                        </td>
                      );
                    })}
                    <td className="py-2 px-3 text-right font-bold text-slate-300">
                      {Math.round(rowSum * 10) / 10}
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
