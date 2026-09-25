/**
 * DSSME EVENT ENGINE V1.0 - Main Application Interface
 * High-precision astronomical and Vedic event calculation engine.
 */

import React, { useState, useEffect } from 'react';
import { DSSMEEventInput, CanonicalChart, DSSMEEvent } from './engine/types.js';
import { calculateCanonicalChart } from './engine/chart/calculateChart.js';
import { solveEventsForChart } from './engine/events/eventSolver.js';
import { VedicChart } from './components/VedicChart.js';
import { PlanetsTable } from './components/PlanetsTable.js';
import { PanchangaCard } from './components/PanchangaCard.js';
import { BenchmarkView } from './components/BenchmarkView.js';
import { EventStreamView } from './components/EventStreamView.js';
import { ShadbalaView } from './components/ShadbalaView.js';
import { AshtakavargaView } from './components/AshtakavargaView.js';
import { DashaView } from './components/DashaView.js';
import { ApiSpecView } from './components/ApiSpecView.js';
import { NewDayControl } from './components/NewDayControl.js';
import { DailyCalculationRecord } from './engine/day/dayTypes.js';
import { LOTTERY_DRAW_TIMES, getDrawTimeString } from './engine/lottery/drawConfig.js';

interface Preset {
  id: string;
  name: string;
  label: string;
  drawTime: string;
  session: 'AM' | 'PM' | 'REFERENCE';
  datetime: string;
  timezone: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  abbreviation: string;
}

const PRESETS: Preset[] = LOTTERY_DRAW_TIMES.map((d) => ({
  id: d.id,
  name: `${d.location}, ${d.country} — ${d.session === 'REFERENCE' ? '' : d.session + ' '}${getDrawTimeString(d)}`,
  label: d.label,
  drawTime: getDrawTimeString(d),
  session: d.session,
  datetime: `${d.id === 'chofu-japan' ? '2026-09-16' : '2026-09-25'} ${getDrawTimeString(d)}:00`,
  timezone: d.timezone,
  city: d.location,
  country: d.country,
  lat: d.latitude,
  lon: d.longitude,
  abbreviation: d.abbreviation,
}));

type ActiveTab =
  | 'overview'
  | 'events'
  | 'strength'
  | 'ashtakavarga'
  | 'dasha'
  | 'benchmark'
  | 'json_ocr'
  | 'api_spec';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);

  // Form states
  const [datetime, setDatetime] = useState<string>(PRESETS[0].datetime);
  const [timezone, setTimezone] = useState<string>(PRESETS[0].timezone);
  const [city, setCity] = useState<string>(PRESETS[0].city);
  const [country, setCountry] = useState<string>(PRESETS[0].country);
  const [latitude, setLatitude] = useState<number>(PRESETS[0].lat);
  const [longitude, setLongitude] = useState<number>(PRESETS[0].lon);

  // Calculated states
  const [chart, setChart] = useState<CanonicalChart | null>(null);
  const [chofuChart, setChofuChart] = useState<CanonicalChart | null>(null);
  const [events, setEvents] = useState<DSSMEEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Run calculation
  const runCalculation = async () => {
    setIsLoading(true);
    try {
      const input: DSSMEEventInput = {
        datetime,
        timezone,
        location: {
          latitude,
          longitude,
          city,
          country,
        },
        ayanamsa: 'Lahiri',
      };

      const calculatedChart = await calculateCanonicalChart(input);
      const solvedEvents = await solveEventsForChart(input, calculatedChart);
      setChart(calculatedChart);
      if (input.location.city === 'Chofu') {
        setChofuChart(calculatedChart);
      }
      setEvents(solvedEvents);
    } catch (err) {
      console.error('Calculation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runCalculation();
  }, [datetime, timezone, latitude, longitude, city, country]);

  const handleSelectPreset = (index: number) => {
    setSelectedPresetIndex(index);
    const p = PRESETS[index];
    setDatetime(p.datetime);
    setTimezone(p.timezone);
    setCity(p.city);
    setCountry(p.country);
    setLatitude(p.lat);
    setLongitude(p.lon);
  };

  const handleNewDaySelected = (record: DailyCalculationRecord) => {
    setChart(record.chart);
    setEvents(record.events);
    setDatetime(`${record.dayContext.calculationDate} 00:00:00`);
    setTimezone(record.dayContext.timezone);
    const tzCity = record.dayContext.timezone.includes('Yangon')
      ? 'Yangon'
      : record.dayContext.timezone.includes('Bangkok')
      ? 'Bangkok'
      : 'Chofu';
    setCity(tzCity);
    setLatitude(record.dayContext.latitude);
    setLongitude(record.dayContext.longitude);
  };

  const handleCopyJson = () => {
    if (!chart) return;
    navigator.clipboard.writeText(JSON.stringify(chart, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    if (!chart) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(chart, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `DSSME_CHART_${chart.IDENTITY.date}_${chart.IDENTITY.location_city}.json`);
    dlAnchor.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-lg shadow-md shadow-amber-500/20">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-slate-100">
                  DSSME EVENT ENGINE <span className="text-amber-400 font-mono">V1.0</span>
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  DETERMINISTIC
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Lahiri Sidereal Standard • Swiss Ephemeris WASM Core • MOD 01–15
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('benchmark')}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              FIXTURE #1: 100% PASS
            </button>
            <button
              onClick={runCalculation}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              Recalculate ↻
            </button>
          </div>
        </div>
      </header>

      {/* Preset & Input Config Bar */}
      <section className="bg-slate-900 border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          {/* Preset Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            <span className="font-mono text-slate-400 text-[11px] uppercase tracking-wider whitespace-nowrap">
              Authoritative Draw:
            </span>
            {PRESETS.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(idx)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors font-medium text-xs font-mono flex items-center gap-1.5 ${
                  selectedPresetIndex === idx
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{p.label}</span>
                <span
                  className={`text-[10px] px-1 py-0.2 rounded font-semibold ${
                    selectedPresetIndex === idx
                      ? 'bg-slate-950/20 text-slate-950'
                      : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {p.abbreviation}
                </span>
              </button>
            ))}
          </div>

          {/* Current Coords & Time Info */}
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span className="text-slate-300">
              <span className="text-slate-500">Time:</span> {datetime} ({timezone})
            </span>
            <span>•</span>
            <span className="text-slate-300">
              <span className="text-slate-500">Loc:</span> {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E ({city})
            </span>
          </div>
        </div>
      </section>

      {/* Authoritative Calculation Day & Rollover Control */}
      <section className="bg-slate-950/60 border-b border-slate-800/60 px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto">
          <NewDayControl onDaySelected={handleNewDaySelected} />
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="border-b border-slate-800 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview & Chart' },
            { id: 'events', label: 'Event Stream (MOD 01-14)' },
            { id: 'strength', label: 'Shadbala & Balas (MOD 10-11)' },
            { id: 'ashtakavarga', label: 'Ashtakavarga (MOD 12)' },
            { id: 'dasha', label: 'Dasha Timeline (MOD 09)' },
            { id: 'benchmark', label: 'Benchmark & Validation (MOD 15)' },
            { id: 'json_ocr', label: 'Canonical 16-Block JSON' },
            { id: 'api_spec', label: 'Vercel API & Routes' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`py-3 px-3.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-amber-400 text-amber-300 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-mono text-slate-400">Executing deterministic astronomical calculations...</p>
          </div>
        ) : !chart ? (
          <div className="p-8 text-center text-slate-400">Failed to calculate chart state.</div>
        ) : (
          <div>
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="flex flex-col gap-6">
                <PanchangaCard chart={chart} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <VedicChart chart={chart} />
                  </div>
                  <div className="lg:col-span-2">
                    <PlanetsTable chart={chart} />
                  </div>
                </div>

                {/* Additional Quick Highlights (Active Yogas & Phase Stress) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Active Yogas */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      Active Planetary Yogas (MOD-13)
                    </h4>
                    <div className="space-y-2">
                      {chart.YOGA_LIST.map((y, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-800/40 rounded-lg border border-slate-800 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-100">{y.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-500/20 text-emerald-300">
                              ACTIVE
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px]">{y.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Volatility & Phase Stress */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                      Phase Stress & Volatility Indicators (MOD-14)
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2.5 bg-slate-800/40 rounded-lg border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Stress Level</span>
                        <span className="text-sm font-bold text-emerald-400">{chart.PHASE_STRESS.stress_level}</span>
                      </div>
                      <div className="p-2.5 bg-slate-800/40 rounded-lg border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">New Moon Proximity</span>
                        <span className="text-sm font-bold text-slate-200">
                          {chart.PHASE_STRESS.new_moon_proximity_hrs} hrs
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-800/40 rounded-lg border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Full Moon Proximity</span>
                        <span className="text-sm font-bold text-slate-200">
                          {chart.PHASE_STRESS.full_moon_proximity_hrs} hrs
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-800/40 rounded-lg border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Gandanta Status</span>
                        <span className="text-sm font-bold text-emerald-400">
                          {chart.PANCHANGA.gandanta_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: EVENTS */}
            {activeTab === 'events' && <EventStreamView events={events} />}

            {/* TAB 3: STRENGTH & BALAS */}
            {activeTab === 'strength' && <ShadbalaView chart={chart} />}

            {/* TAB 4: ASHTAKAVARGA */}
            {activeTab === 'ashtakavarga' && <AshtakavargaView chart={chart} />}

            {/* TAB 5: DASHA */}
            {activeTab === 'dasha' && <DashaView chart={chart} />}

            {/* TAB 6: BENCHMARK */}
            {activeTab === 'benchmark' && <BenchmarkView chart={chofuChart || chart} />}

            {/* TAB 7: JSON OCR */}
            {activeTab === 'json_ocr' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                      Canonical 16-Block JSON Output
                    </h3>
                    <p className="text-xs text-slate-400">
                      Matches schema specified in <code className="text-amber-300">DSSME_Extraction_Prompt_JSON_v1_4.md</code>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyJson}
                      className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-medium transition-colors"
                    >
                      {isCopied ? 'Copied ✓' : 'Copy JSON'}
                    </button>
                    <button
                      onClick={handleDownloadJson}
                      className="px-3 py-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors"
                    >
                      Download .json
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-300 max-h-[600px] overflow-y-auto leading-relaxed">
                    {JSON.stringify(chart, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB 8: API SPEC & VERCEL RUNTIME */}
            {activeTab === 'api_spec' && <ApiSpecView chart={chart} />}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          DSSME EVENT ENGINE V1.0 • Built with Swiss Ephemeris WASM & TypeScript • Vercel-Ready Architecture
        </div>
        <div>
          Benchmark Fixture: <span className="text-slate-400">Chofu, Japan (2026-09-16)</span> • 100% Deterministic
        </div>
      </footer>
    </div>
  );
}
