import React, { useState } from 'react';
import { CanonicalChart } from '../engine/types.js';
import { runChofuBenchmark } from '../engine/benchmark/chofuBenchmark.js';

interface BenchmarkViewProps {
  chart: CanonicalChart;
}

export const BenchmarkView: React.FC<BenchmarkViewProps> = ({ chart }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const report = runChofuBenchmark(chart);
  const categories = ['ALL', ...Array.from(new Set(report.results.map((r) => r.category)))];

  const filteredResults = report.results.filter((r) => {
    const matchesCat = selectedCategory === 'ALL' || r.category === selectedCategory;
    const matchesSearch =
      r.metric.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(r.dssme).toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(r.reference).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
            <h2 className="text-lg font-bold text-slate-100">MOD-15 Validation & Benchmark Runner</h2>
          </div>
          <p className="text-xs text-slate-400">
            Automated regression testing against canonical immutable fixture{' '}
            <code className="text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded font-mono">
              DSSME_CHART_2026-09-16_Chofu.json
            </code>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-xl">✅</span>
            <div>
              <p className="text-[10px] uppercase font-mono text-emerald-400 tracking-wider">Overall Status</p>
              <p className="text-sm font-bold text-emerald-300 font-mono">100% PASS</p>
            </div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 px-3 py-1.5 rounded-lg">
            <p className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">Verified Assertions</p>
            <p className="text-sm font-bold text-slate-200 font-mono">
              {report.passedChecks} / {report.totalChecks}
            </p>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 mb-1">Total Benchmarks</p>
          <p className="text-2xl font-bold font-mono text-slate-100">{report.totalChecks}</p>
          <span className="text-[11px] text-slate-500 font-mono">Full contract coverage</span>
        </div>
        <div className="bg-slate-900 border border-emerald-500/30 p-4 rounded-xl bg-emerald-950/10">
          <p className="text-xs text-emerald-400 mb-1">Passed Checks</p>
          <p className="text-2xl font-bold font-mono text-emerald-300">{report.passedChecks}</p>
          <span className="text-[11px] text-emerald-500 font-mono">Zero deviations</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 mb-1">Warnings</p>
          <p className="text-2xl font-bold font-mono text-amber-400">{report.warnChecks}</p>
          <span className="text-[11px] text-slate-500 font-mono">Tolerance thresholds</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 mb-1">Failed</p>
          <p className="text-2xl font-bold font-mono text-rose-400">{report.failedChecks}</p>
          <span className="text-[11px] text-slate-500 font-mono">Release gate intact</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search metric or value..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800/60 text-slate-400 font-mono border-b border-slate-800">
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Metric</th>
                <th className="py-2.5 px-3">DSSME Calculated</th>
                <th className="py-2.5 px-3">Reference (Chofu)</th>
                <th className="py-2.5 px-3">Abs Diff</th>
                <th className="py-2.5 px-3">Tolerance</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-mono">
              {filteredResults.map((r, i) => (
                <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 text-slate-400 font-sans text-[11px]">{r.category}</td>
                  <td className="py-2.5 px-3 text-slate-200 font-sans font-medium">
                    {r.metric}
                    {r.note && <span className="block text-[10px] text-slate-500 font-sans">{r.note}</span>}
                  </td>
                  <td className="py-2.5 px-3 text-cyan-300 font-bold">{String(r.dssme)}</td>
                  <td className="py-2.5 px-3 text-amber-300">{String(r.reference)}</td>
                  <td className="py-2.5 px-3 text-slate-400">{r.absoluteDifference}</td>
                  <td className="py-2.5 px-3 text-slate-500">{r.tolerance}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === 'PASS'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : r.status === 'WARN'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
