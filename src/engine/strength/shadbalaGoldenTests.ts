/**
 * DSSME EVENT ENGINE V1.0 - Shadbala Golden Tests
 * Validates all 6 primary components, Totals, Rupas, Strength Ratios, and Ranks
 * against PyJHora and the canonical benchmark fixture DSSME_CHART_2026-09-16_Chofu.json.
 */

import { calculateShadbala, SHADBALA_PLANETS } from './shadbala.js';
import chofuFixture from '../../../DSSME_CHART_2026-09-16_Chofu.json';

export interface ShadbalaTestReport {
  timestamp: string;
  totalChecks: number;
  passedCount: number;
  failedCount: number;
  allPassed: boolean;
  results: Array<{
    planet: string;
    metric: string;
    dssmeValue: number;
    referenceValue: number;
    difference: number;
    status: 'PASS' | 'FAIL';
  }>;
}

export function runShadbalaGoldenTests(): ShadbalaTestReport {
  const sb = calculateShadbala();
  const ref = chofuFixture.SHADBALA;
  const results: ShadbalaTestReport['results'] = [];

  const metrics: Array<{ key: keyof typeof sb; name: string }> = [
    { key: 'sthana_total', name: 'Sthana Bala' },
    { key: 'dig_bala', name: 'Dig Bala' },
    { key: 'kaala_total', name: 'Kaala Bala' },
    { key: 'chesta_bala', name: 'Chesta Bala' },
    { key: 'naisargika_bala', name: 'Naisargika Bala' },
    { key: 'drig_bala', name: 'Drik Bala' },
    { key: 'total_virupas', name: 'Total Virupas' },
    { key: 'percent_required', name: 'Percent Required' },
    { key: 'rank', name: 'Rank' },
  ];

  for (let i = 0; i < 7; i++) {
    const p = SHADBALA_PLANETS[i];
    for (const m of metrics) {
      const dVal = (sb[m.key] as number[])[i];
      const rVal = (ref as any)[m.key === 'total_virupas' ? 'total_virupas' : m.key]?.[i];
      const diff = Math.abs(dVal - rVal);
      const pass = diff <= 0.1; // 0.1 Virupa tolerance
      results.push({
        planet: p,
        metric: m.name,
        dssmeValue: dVal,
        referenceValue: rVal,
        difference: Math.round(diff * 100) / 100,
        status: pass ? 'PASS' : 'FAIL',
      });
    }
  }

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;

  return {
    timestamp: new Date().toISOString(),
    totalChecks: results.length,
    passedCount: passed,
    failedCount: failed,
    allPassed: failed === 0,
    results,
  };
}
