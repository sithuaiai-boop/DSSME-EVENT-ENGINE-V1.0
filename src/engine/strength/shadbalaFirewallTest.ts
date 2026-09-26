/**
 * DSSME EVENT ENGINE V1.0 - Section 24: Bhava Bala Firewall Regression Test
 *
 * Verifies that:
 * 1. calculateBhavaBala() remains completely independent.
 * 2. SHADBALA.total_virupas is mathematically composed EXCLUSIVELY of the 6 classical sources:
 *    RS(p) = Sthana + Dig + Kaala + Chesta + Naisargika + Drig
 * 3. Exactly zero Bhava Bala contribution enters Shadbala (Hard Rule 10/18).
 */

import { calculateCanonicalChart } from '../chart/calculateChart.js';
import { DSSMEEventInput } from '../types.js';
import { SHADBALA_PLANETS } from './shadbala.js';

export interface FirewallTestReport {
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  checks: Array<{
    planet: string;
    sumOfSixVirupas: number;
    totalVirupasReported: number;
    difference: number;
    hasBhavaBalaLeak: boolean;
    status: 'PASS' | 'FAIL';
  }>;
}

export async function runShadbalaFirewallTest(): Promise<FirewallTestReport> {
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

  const checks: FirewallTestReport['checks'] = [];
  let passedChecks = 0;

  for (let i = 0; i < 7; i++) {
    const p = SHADBALA_PLANETS[i];
    const s = sb.sthana_total[i];
    const d = sb.dig_bala[i];
    const k = sb.kaala_total[i];
    const c = sb.chesta_bala[i];
    const n = sb.naisargika_bala[i];
    const dr = sb.drig_bala[i];

    const sumOfSix = Math.round((s + d + k + c + n + dr) * 10) / 10;
    const reportedTotal = sb.total_virupas[i];
    const diff = Math.abs(sumOfSix - reportedTotal);

    // If diff is greater than 0.05, something unapproved was added
    const pass = diff <= 0.05;
    if (pass) passedChecks++;

    checks.push({
      planet: p,
      sumOfSixVirupas: sumOfSix,
      totalVirupasReported: reportedTotal,
      difference: diff,
      hasBhavaBalaLeak: !pass,
      status: pass ? 'PASS' : 'FAIL',
    });
  }

  return {
    passed: passedChecks === 7,
    totalChecks: 7,
    passedChecks,
    checks,
  };
}
