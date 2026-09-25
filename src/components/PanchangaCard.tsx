import React from 'react';
import { CanonicalChart } from '../engine/types.js';

interface PanchangaCardProps {
  chart: CanonicalChart;
}

export const PanchangaCard: React.FC<PanchangaCardProps> = ({ chart }) => {
  const pan = chart.PANCHANGA;
  const hora = chart.HORA;
  const stress = chart.PHASE_STRESS;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            Panchanga & Time Events (MOD-01)
          </h3>
          <p className="text-xs text-slate-400">5-fold Vedic calendar elements with solar transitions</p>
        </div>
        <span className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
          {pan.paksha} Paksha
        </span>
      </div>

      {/* Grid of 5 Panchanga Pillars */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-lg">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">1. Tithi (Lunar Day)</span>
          <p className="text-sm font-bold text-slate-100">{pan.tithi_name}</p>
          <span className="text-xs text-emerald-400 font-mono">{pan.tithi_at_birth}</span>
        </div>

        <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-lg">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">2. Nakshatra</span>
          <p className="text-sm font-bold text-slate-100">{pan.nakshatra_name}</p>
          <span className="text-xs text-cyan-400 font-mono">Pada {pan.nakshatra_pada} ({pan.nak_at_birth})</span>
        </div>

        <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-lg">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">3. Yoga</span>
          <p className="text-sm font-bold text-slate-100">{pan.yoga_name}</p>
          <span className="text-xs text-slate-400 font-mono">Index {pan.yoga_number} of 27</span>
        </div>

        <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-lg">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">4. Karana (Half-Tithi)</span>
          <p className="text-sm font-bold text-slate-100">{pan.karana_name}</p>
          <span className="text-xs text-slate-400 font-mono">Index {pan.karana_number} of 60</span>
        </div>

        <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-lg">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">5. Vara (Weekday)</span>
          <p className="text-sm font-bold text-slate-100">{chart.IDENTITY.day}</p>
          <span className="text-xs text-amber-400 font-mono">Lord: {pan.weekday_lord}</span>
        </div>
      </div>

      {/* Sun Times & Hora Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* Sun times */}
        <div className="bg-slate-800/30 border border-slate-800/80 p-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-500/10 text-amber-400 rounded-md text-sm">☀️</span>
            <div>
              <p className="text-xs font-semibold text-slate-200">Sunrise & Sunset (Chofu)</p>
              <p className="text-[11px] text-slate-400">Topocentric disk refraction</p>
            </div>
          </div>
          <div className="text-right font-mono text-xs">
            <p className="text-slate-300">Rise: <span className="text-amber-300 font-bold">{pan.sunrise_time}</span></p>
            <p className="text-slate-300">Set: <span className="text-amber-400/90 font-bold">{pan.sunset_time}</span></p>
          </div>
        </div>

        {/* Hora */}
        <div className="bg-slate-800/30 border border-slate-800/80 p-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-purple-500/10 text-purple-400 rounded-md text-sm">⏳</span>
            <div>
              <p className="text-xs font-semibold text-slate-200">Active Hora Ruler</p>
              <p className="text-[11px] text-slate-400">Hora #{hora.hora_number} • Chaldean Sequence</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {hora.planet}
            </span>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{hora.start_time} - {hora.end_time}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
