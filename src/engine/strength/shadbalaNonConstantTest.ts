/**
 * DSSME EVENT ENGINE V1.0 - Section 23: Two-Chart Non-Constant Regression Test
 *
 * Proves conclusively that calculateShadbala() is genuinely chart-dependent
 * and does NOT return identical or hard-coded fixture values across different
 * astronomical charts.
 */

import { calculateCanonicalChart } from '../chart/calculateChart.js';
import { DSSMEEventInput } from '../types.js';

export interface NonConstantTestReport {
  passed: boolean;
  chartA: {
    name: string;
    totalVirupas: number[];
    ranks: number[];
  };
  chartB: {
    name: string;
    totalVirupas: number[];
    ranks: number[];
  };
  componentDifferences: {
    sthanaDiffers: boolean;
    digDiffers: boolean;
    kaalaDiffers: boolean;
    chestaDiffers: boolean;
    drigDiffers: boolean;
    naisargikaIdentical: boolean;
  };
  details: string;
}

export async function runShadbalaNonConstantTest(): Promise<NonConstantTestReport> {
  // Chart A: Chofu, Japan (2026-09-16 18:50:00 JST)
  const inputA: DSSMEEventInput = {
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

  // Chart B: Yangon, Myanmar (2026-09-25 12:01:00 MMT)
  const inputB: DSSMEEventInput = {
    datetime: '2026-09-25 12:01:00',
    timezone: 'Asia/Yangon',
    location: {
      latitude: 16.8661,
      longitude: 96.1951,
      city: 'Yangon',
      country: 'Myanmar',
    },
    ayanamsa: 'Lahiri',
  };

  const chartA = await calculateCanonicalChart(inputA);
  const chartB = await calculateCanonicalChart(inputB);

  const sbA = chartA.SHADBALA;
  const sbB = chartB.SHADBALA;

  // Check chart-dependent components
  const sthanaDiffers = sbA.sthana_total.some((v, i) => Math.abs(v - sbB.sthana_total[i]) > 0.1);
  const digDiffers = sbA.dig_bala.some((v, i) => Math.abs(v - sbB.dig_bala[i]) > 0.1);
  const kaalaDiffers = sbA.kaala_total.some((v, i) => Math.abs(v - sbB.kaala_total[i]) > 0.1);
  const chestaDiffers = sbA.chesta_bala.some((v, i) => Math.abs(v - sbB.chesta_bala[i]) > 0.1);
  const drigDiffers = sbA.drig_bala.some((v, i) => Math.abs(v - sbB.drig_bala[i]) > 0.1);

  // Naisargika Bala MUST remain identical across all charts (universal constants)
  const naisargikaIdentical = sbA.naisargika_bala.every((v, i) => Math.abs(v - sbB.naisargika_bala[i]) < 0.001);

  const passed =
    sthanaDiffers &&
    digDiffers &&
    kaalaDiffers &&
    chestaDiffers &&
    drigDiffers &&
    naisargikaIdentical;

  return {
    passed,
    chartA: {
      name: 'Chofu, Japan (2026-09-16 18:50:00 JST)',
      totalVirupas: sbA.total_virupas,
      ranks: sbA.rank,
    },
    chartB: {
      name: 'Yangon, Myanmar (2026-09-25 12:01:00 MMT)',
      totalVirupas: sbB.total_virupas,
      ranks: sbB.rank,
    },
    componentDifferences: {
      sthanaDiffers,
      digDiffers,
      kaalaDiffers,
      chestaDiffers,
      drigDiffers,
      naisargikaIdentical,
    },
    details: passed
      ? 'PASS: Sthana, Dig, Kaala, Chesta, and Drik all vary dynamically with chart inputs; Naisargika remains invariant.'
      : 'FAIL: One or more chart-dependent components failed to vary between charts.',
  };
}
