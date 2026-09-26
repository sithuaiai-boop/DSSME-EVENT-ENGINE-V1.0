import React, { useState } from 'react';
import { DSSMEEvent } from '../engine/types.js';

interface EventStreamViewProps {
  events: DSSMEEvent[];
}

export const EventStreamView: React.FC<EventStreamViewProps> = ({ events }) => {
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [selectedTrigger, setSelectedTrigger] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const modules = ['ALL', ...Array.from(new Set(events.map((e) => e.module)))];
  const triggers = ['ALL', ...Array.from(new Set(events.map((e) => e.triggerType)))];

  const filteredEvents = events.filter((e) => {
    const matchMod = selectedModule === 'ALL' || e.module === selectedModule;
    const matchTrig = selectedTrigger === 'ALL' || e.triggerType === selectedTrigger;
    const matchSearch =
      e.eventCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.object && e.object.toLowerCase().includes(searchQuery.toLowerCase())) ||
      JSON.stringify(e.newState).toLowerCase().includes(searchQuery.toLowerCase());
    return matchMod && matchTrig && matchSearch;
  });

  const exportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredEvents, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `dssme_events_${Date.now()}.json`);
    dlAnchor.click();
  };

  const exportCsv = () => {
    const headers = ['id', 'module', 'eventCode', 'timestampLocal', 'object', 'triggerType', 'newState'];
    const rows = filteredEvents.map((e) => [
      e.id,
      e.module,
      e.eventCode,
      e.timestampLocal,
      e.object || '',
      e.triggerType,
      typeof e.newState === 'object' ? JSON.stringify(e.newState).replace(/"/g, '""') : String(e.newState || ''),
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', encodeURI(csvContent));
    dlAnchor.setAttribute('download', `dssme_events_${Date.now()}.csv`);
    dlAnchor.click();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <h2 className="text-lg font-bold text-slate-100">Deterministic Event Stream (MOD-01 to MOD-14)</h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time solved transitions, ingress points, stations, and aspect activations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportJson}
            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-medium transition-colors"
          >
            Export JSON
          </button>
          <button
            onClick={exportCsv}
            className="px-3 py-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1">
            <span className="text-[11px] font-mono text-slate-400 mr-1">Module:</span>
            {modules.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedModule(m)}
                className={`px-2.5 py-1 text-xs rounded-md font-mono whitespace-nowrap transition-colors ${
                  selectedModule === m
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] font-mono text-slate-400 mr-1">Trigger:</span>
            <select
              value={selectedTrigger}
              onChange={(e) => setSelectedTrigger(e.target.value)}
              className="px-2 py-1 text-xs bg-slate-900 border border-slate-800 rounded-md text-slate-300 font-mono focus:outline-none"
            >
              {triggers.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-full lg:w-64">
          <input
            type="text"
            placeholder="Search code, object, details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Event Stream List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-3 border-b border-slate-800 bg-slate-800/40 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Displaying {filteredEvents.length} Events</span>
          <span>Engine v1.0 • Swiss Ephemeris WASM</span>
        </div>

        <div className="divide-y divide-slate-800/70 max-h-[600px] overflow-y-auto">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No events match the selected filters.</div>
          ) : (
            filteredEvents.map((ev, evIdx) => (
              <div key={ev.id ? `${ev.id}-${evIdx}` : `event-${evIdx}`} className="p-3 hover:bg-slate-800/40 transition-colors flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                      {ev.module}
                    </span>
                    <span className="font-mono font-bold text-slate-100">{ev.eventCode}</span>
                    {ev.object && (
                      <span className="text-slate-400">
                        • <span className="text-amber-300 font-medium">{ev.object}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                    <span className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">{ev.triggerType}</span>
                    <span>{ev.timestampLocal}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300 font-mono bg-slate-950/40 px-3 py-1.5 rounded border border-slate-800/50">
                  <div className="truncate max-w-xl">
                    <span className="text-slate-500 mr-2">State:</span>
                    <span className="text-emerald-300 font-semibold">
                      {typeof ev.newState === 'object' ? JSON.stringify(ev.newState) : String(ev.newState)}
                    </span>
                  </div>
                  {ev.speed !== undefined && (
                    <span className="text-slate-400 text-[11px] whitespace-nowrap ml-4">
                      Speed: {ev.speed.toFixed(4)}°/day
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
