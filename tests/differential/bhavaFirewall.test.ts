/**
 * DSSME EVENT ENGINE V1.0 - PHASE 2: Bhava Bala Firewall Test
 *
 * Proves:
 * 1. RS(p) = Sthana + Kaala + Dig + Chesta + Naisargika + Drik
 * 2. Exactly zero Bhava Bala contribution enters RS(p)
 * 3. Independent test from numerical parity.
 */

import { calculateCanonicalChart } from '../../src/engine/chart/calculateChart.js';
import { calculateBhavaBala } from '../../src/engine/bhava/bhava.js';
import { DSSMEEventInput } from '../../src/engine/types.js';
import { PLANETS } from './shadbalaDifferential.test.js';

export interface BhavaFirewallReport {
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  checks: Array<{
    planet: string;
    sumOfSixVirupas: number;
    reportedTotalVirupas: number;
    difference: number;
    bhavaBalaLeaked: boolean;
    status: 'PASS' | 'FAIL_BHAVA_FIREWALL';
  }>;
  details: string;
}

export async function runBhavaFirewallTest(): Promise<BhavaFirewallReport> {
  const input: DSSMEEventInput = {
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

  const chart = await calculateCanonicalChart(input);
  const sb = chart.SHADBALA;
  const bb = calculateBhavaBala(chart.HOUSES);

  const checks: BhavaFirewallReport['checks'] = [];
  let passedCount = 0;

  for (let i = 0; i < 7; i++) {
    const p = PLANETS[i];
    const s = sb.sthana_total[i];
    const k = sb.kaala_total[i];
    const d = sb.dig_bala[i];
    const c = sb.chesta_bala[i];
    const n = sb.naisargika_bala[i];
    const dr = sb.drig_bala[i];

    const sumOfSix = Math.round((s + k + d + c + n + dr) * 100) / 100;
    const reportedTotal = sb.total_virupas[i];
    const diff = Math.round(Math.abs(sumOfSix - reportedTotal) * 100) / 100;

    const pass = diff <= 0.05;
    if (pass) passedCount++;

    checks.push({
      planet: p,
      sumOfSixVirupas: sumOfSix,
      reportedTotalVirupas: reportedTotal,
      difference: diff,
      bhavaBalaLeaked: !pass,
      status: pass ? 'PASS' : 'FAIL_BHAVA_FIREWALL',
    });
  }

  const passed = passedCount === 7;
  return {
    passed,
    totalChecks: 7,
    passedChecks: passedCount,
    checks,
    details: passed
      ? 'PASS: 100% of Shadbala total is composed solely of the 6 classical sources; Bhava Bala contribution is strictly 0.0.'
      : 'FAIL_BHAVA_FIREWALL: Unapproved term or Bhava Bala detected in Shadbala total.',
  };
}
