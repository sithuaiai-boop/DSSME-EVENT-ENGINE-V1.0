/**
 * DSSME EVENT ENGINE V1.0 - Section 20 & 21: Real Chart Shadbala Golden Test
 *
 * Evaluates the live calculateCanonicalChart() -> calculateShadbala(context)
 * execution pipeline for Chofu, Japan (2026-09-16 18:50:00 JST).
 * Compares against DSSME_CHART_2026-09-16_Chofu.json benchmark fixture.
 *
 * NOTE: Never compares fixture vs itself. Real chart calculations are run
 * dynamically through the full astronomical engine.
 */

import { calculateCanonicalChart } from '../chart/calculateChart.js';
import { DSSMEEventInput } from '../types.js';
import { SHADBALA_PLANETS, MINIMUM_VIRUPAS } from './shadbala.js';
import chofuFixture from '../../../DSSME_CHART_2026-09-16_Chofu.json';

export interface ShadbalaMetricComparison {
  planet: string;
  metric: string;
  dssmeValue: number;
  referenceValue: number;
  difference: number;
  status: 'EXACT' | 'CLOSE' | 'DIFF';
}

export interface ShadbalaGoldenReport {
  timestamp: string;
  totalChecks: number;
  exactCount: number;
  closeCount: number;
  diffCount: number;
  results: ShadbalaMetricComparison[];
}

export async function runShadbalaGoldenTests(): Promise<ShadbalaGoldenReport> {
  const chofuInput: DSSMEEventInput = {
    datetime: '2026-09-16 18:50:00',
    timezone: 'Asia/Tokyo',
    location: {
      latitude: 35.6528,
      longitude: 139.5447,
      city: 'Chofu',
      country: 'Japan',
    },
    ayanamsa: 'Lahiri',
  };

  const chart = await calculateCanonicalChart(chofuInput);
  const sb = chart.SHADBALA;
  const ref = chofuFixture.SHADBALA;
  const results: ShadbalaMetricComparison[] = [];

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

      let status: 'EXACT' | 'CLOSE' | 'DIFF' = 'DIFF';
      if (diff <= 0.05) status = 'EXACT';
      else if (diff <= 0.5) status = 'CLOSE';

      results.push({
        planet: p,
        metric: m.name,
        dssmeValue: dVal,
        referenceValue: rVal,
        difference: Math.round(diff * 100) / 100,
        status,
      });
    }
  }

  const exactCount = results.filter((r) => r.status === 'EXACT').length;
  const closeCount = results.filter((r) => r.status === 'CLOSE').length;
  const diffCount = results.filter((r) => r.status === 'DIFF').length;

  return {
    timestamp: new Date().toISOString(),
    totalChecks: results.length,
    exactCount,
    closeCount,
    diffCount,
    results,
  };
}
