/**
 * DSSME EVENT ENGINE V1.0 - PHASE 2: PyJHora Numerical Oracle Differential Test
 *
 * Compares current DSSME engine output against independent PyJHora Oracle fixtures (F01..F18).
 * Expected = PyJHora Oracle
 * Actual = DSSME Engine
 * Delta = Actual - Expected
 *
 * NOTE: Does NOT perform auto-correction or modify the engine. Pure diagnostic & parity audit.
 */

import fs from 'fs';
import path from 'path';
import { calculateCanonicalChart } from '../../src/engine/chart/calculateChart.js';
import { DSSMEEventInput } from '../../src/engine/types.js';

export const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const;
export type PlanetName = typeof PLANETS[number];

export type ComponentFailureType =
  | 'PASS'
  | 'FAIL_STHANA'
  | 'FAIL_KAALA'
  | 'FAIL_DIG'
  | 'FAIL_CHESTA'
  | 'FAIL_NAISARGIKA'
  | 'FAIL_DRIK'
  | 'FAIL_TOTAL'
  | 'FAIL_RUPA'
  | 'FAIL_STRENGTH_RATIO'
  | 'FAIL_AGGREGATION';

export interface ComponentComparison {
  component: string;
  expected: number;
  actual: number;
  delta: number;
  status: 'PASS' | 'FAIL';
  failureType?: ComponentFailureType;
}

export interface PlanetComparison {
  planet: PlanetName;
  components: Record<string, ComponentComparison>;
  totalVirupas: ComponentComparison;
  rupa: ComponentComparison;
  strengthRatio: ComponentComparison;
  planetStatus: 'PASS' | 'FAIL';
  failureTypes: ComponentFailureType[];
}

export interface FixtureDifferentialResult {
  fixtureId: string;
  name: string;
  purpose: string;
  location: string;
  datetime: string;
  status: 'PASS' | 'FAIL';
  componentSummary: {
    sthana: { pass: number; fail: number };
    kaala: { pass: number; fail: number };
    dig: { pass: number; fail: number };
    chesta: { pass: number; fail: number };
    naisargika: { pass: number; fail: number };
    drik: { pass: number; fail: number };
    totalVirupas: { pass: number; fail: number };
    rupa: { pass: number; fail: number };
    strengthRatio: { pass: number; fail: number };
  };
  planets: Record<PlanetName, PlanetComparison>;
  rootCause: string;
}

export interface DifferentialSuiteReport {
  timestamp: string;
  oracleEngine: string;
  pinnedCommit: string;
  fixtureCount: number;
  passedFixtures: number;
  failedFixtures: number;
  componentTotals: {
    sthana: { pass: number; fail: number };
    kaala: { pass: number; fail: number };
    dig: { pass: number; fail: number };
    chesta: { pass: number; fail: number };
    naisargika: { pass: number; fail: number };
    drik: { pass: number; fail: number };
    totalVirupas: { pass: number; fail: number };
    rupa: { pass: number; fail: number };
    strengthRatio: { pass: number; fail: number };
  };
  overallStatus: 'PASS' | 'PASS_WITH_FINDINGS' | 'BLOCKED';
  fixtures: FixtureDifferentialResult[];
}

export async function runDifferentialTestSuite(): Promise<DifferentialSuiteReport> {
  const oracleDir = path.resolve(process.cwd(), 'tests/oracle/pyjhora');
  const manifestPath = path.resolve(process.cwd(), 'tests/oracle-manifest.json');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const fixtureResults: FixtureDifferentialResult[] = [];

  const totals = {
    sthana: { pass: 0, fail: 0 },
    kaala: { pass: 0, fail: 0 },
    dig: { pass: 0, fail: 0 },
    chesta: { pass: 0, fail: 0 },
    naisargika: { pass: 0, fail: 0 },
    drik: { pass: 0, fail: 0 },
    totalVirupas: { pass: 0, fail: 0 },
    rupa: { pass: 0, fail: 0 },
    strengthRatio: { pass: 0, fail: 0 },
  };

  for (const f of manifest.fixtures) {
    const fixturePath = path.resolve(process.cwd(), f.file);
    const fixtureData = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

    // Construct Canonical DSSME Input
    const dssmeInput: DSSMEEventInput = {
      datetime: `${fixtureData.input.date} ${fixtureData.input.time}`,
      timezone: 'UTC', // Offset handled in ephemeris
      location: {
        latitude: fixtureData.input.latitude,
        longitude: fixtureData.input.longitude,
        city: fixtureData.input.location_name.split(',')[0].trim(),
        country: fixtureData.input.location_name.split(',')[1]?.trim() || 'Global',
      },
      ayanamsa: fixtureData.input.ayanamsa,
    };

    // Calculate DSSME Result
    const chart = await calculateCanonicalChart(dssmeInput);
    const dssmeSb = chart.SHADBALA;
    const oracle = fixtureData.oracle;

    const compSummary = {
      sthana: { pass: 0, fail: 0 },
      kaala: { pass: 0, fail: 0 },
      dig: { pass: 0, fail: 0 },
      chesta: { pass: 0, fail: 0 },
      naisargika: { pass: 0, fail: 0 },
      drik: { pass: 0, fail: 0 },
      totalVirupas: { pass: 0, fail: 0 },
      rupa: { pass: 0, fail: 0 },
      strengthRatio: { pass: 0, fail: 0 },
    };

    const planetsRecord: Partial<Record<PlanetName, PlanetComparison>> = {};
    let fixturePassed = true;

    for (let i = 0; i < 7; i++) {
      const p = PLANETS[i];
      const pFailures: ComponentFailureType[] = [];

      // Sthana
      const sExp = oracle.sthana[p];
      const sAct = dssmeSb.sthana_total[i];
      const sDelta = Math.round((sAct - sExp) * 100) / 100;
      const sPass = Math.abs(sDelta) <= 0.05;
      if (sPass) compSummary.sthana.pass++;
      else { compSummary.sthana.fail++; pFailures.push('FAIL_STHANA'); }

      // Kaala
      const kExp = oracle.kaala[p];
      const kAct = dssmeSb.kaala_total[i];
      const kDelta = Math.round((kAct - kExp) * 100) / 100;
      const kPass = Math.abs(kDelta) <= 0.05;
      if (kPass) compSummary.kaala.pass++;
      else { compSummary.kaala.fail++; pFailures.push('FAIL_KAALA'); }

      // Dig
      const dExp = oracle.dig[p];
      const dAct = dssmeSb.dig_bala[i];
      const dDelta = Math.round((dAct - dExp) * 100) / 100;
      const dPass = Math.abs(dDelta) <= 0.05;
      if (dPass) compSummary.dig.pass++;
      else { compSummary.dig.fail++; pFailures.push('FAIL_DIG'); }

      // Chesta
      const cExp = oracle.chesta[p];
      const cAct = dssmeSb.chesta_bala[i];
      const cDelta = Math.round((cAct - cExp) * 100) / 100;
      const cPass = Math.abs(cDelta) <= 0.05;
      if (cPass) compSummary.chesta.pass++;
      else { compSummary.chesta.fail++; pFailures.push('FAIL_CHESTA'); }

      // Naisargika
      const nExp = oracle.naisargika[p];
      const nAct = dssmeSb.naisargika_bala[i];
      const nDelta = Math.round((nAct - nExp) * 100) / 100;
      const nPass = Math.abs(nDelta) <= 0.05;
      if (nPass) compSummary.naisargika.pass++;
      else { compSummary.naisargika.fail++; pFailures.push('FAIL_NAISARGIKA'); }

      // Drik
      const drExp = oracle.drik[p];
      const drAct = dssmeSb.drig_bala[i];
      const drDelta = Math.round((drAct - drExp) * 100) / 100;
      const drPass = Math.abs(drDelta) <= 0.05;
      if (drPass) compSummary.drik.pass++;
      else { compSummary.drik.fail++; pFailures.push('FAIL_DRIK'); }

      // Total Virupas
      const totExp = oracle.total_virupas[p];
      const totAct = dssmeSb.total_virupas[i];
      const totDelta = Math.round((totAct - totExp) * 100) / 100;
      const totPass = Math.abs(totDelta) <= 0.05;
      if (totPass) compSummary.totalVirupas.pass++;
      else { compSummary.totalVirupas.fail++; pFailures.push('FAIL_TOTAL'); }

      // Rupa
      const rExp = oracle.rupa[p];
      const rAct = dssmeSb.total_rupas?.[i] ?? Math.round((dssmeSb.total_virupas[i] / 60.0) * 100) / 100;
      const rDelta = Math.round((rAct - rExp) * 100) / 100;
      const rPass = Math.abs(rDelta) <= 0.05;
      if (rPass) compSummary.rupa.pass++;
      else { compSummary.rupa.fail++; pFailures.push('FAIL_RUPA'); }

      // Strength Ratio
      const ratExp = oracle.strength_ratio[p];
      const ratAct = Math.round((dssmeSb.percent_required[i] / 100.0) * 100) / 100;
      const ratDelta = Math.round((ratAct - ratExp) * 100) / 100;
      const ratPass = Math.abs(ratDelta) <= 0.05;
      if (ratPass) compSummary.strengthRatio.pass++;
      else { compSummary.strengthRatio.fail++; pFailures.push('FAIL_STRENGTH_RATIO'); }

      if (pFailures.length > 0) fixturePassed = false;

      planetsRecord[p] = {
        planet: p,
        components: {
          sthana: { component: 'Sthana', expected: sExp, actual: sAct, delta: sDelta, status: sPass ? 'PASS' : 'FAIL', failureType: sPass ? 'PASS' : 'FAIL_STHANA' },
          kaala: { component: 'Kaala', expected: kExp, actual: kAct, delta: kDelta, status: kPass ? 'PASS' : 'FAIL', failureType: kPass ? 'PASS' : 'FAIL_KAALA' },
          dig: { component: 'Dig', expected: dExp, actual: dAct, delta: dDelta, status: dPass ? 'PASS' : 'FAIL', failureType: dPass ? 'PASS' : 'FAIL_DIG' },
          chesta: { component: 'Chesta', expected: cExp, actual: cAct, delta: cDelta, status: cPass ? 'PASS' : 'FAIL', failureType: cPass ? 'PASS' : 'FAIL_CHESTA' },
          naisargika: { component: 'Naisargika', expected: nExp, actual: nAct, delta: nDelta, status: nPass ? 'PASS' : 'FAIL', failureType: nPass ? 'PASS' : 'FAIL_NAISARGIKA' },
          drik: { component: 'Drik', expected: drExp, actual: drAct, delta: drDelta, status: drPass ? 'PASS' : 'FAIL', failureType: drPass ? 'PASS' : 'FAIL_DRIK' },
        },
        totalVirupas: { component: 'Total Virupas', expected: totExp, actual: totAct, delta: totDelta, status: totPass ? 'PASS' : 'FAIL', failureType: totPass ? 'PASS' : 'FAIL_TOTAL' },
        rupa: { component: 'Rupa', expected: rExp, actual: rAct, delta: rDelta, status: rPass ? 'PASS' : 'FAIL', failureType: rPass ? 'PASS' : 'FAIL_RUPA' },
        strengthRatio: { component: 'Strength Ratio', expected: ratExp, actual: ratAct, delta: ratDelta, status: ratPass ? 'PASS' : 'FAIL', failureType: ratPass ? 'PASS' : 'FAIL_STRENGTH_RATIO' },
        planetStatus: pFailures.length === 0 ? 'PASS' : 'FAIL',
        failureTypes: pFailures.length === 0 ? ['PASS'] : pFailures,
      };
    }

    // Accumulate Totals
    (Object.keys(compSummary) as Array<keyof typeof compSummary>).forEach((k) => {
      totals[k].pass += compSummary[k].pass;
      totals[k].fail += compSummary[k].fail;
    });

    const rootCauses: string[] = [];
    if (compSummary.sthana.fail > 0) rootCauses.push('Sthana subcomponents omitted from sum');
    if (compSummary.kaala.fail > 0) rootCauses.push('Kaala 9-subcomponents simplified to static table');
    if (compSummary.dig.fail > 0) rootCauses.push('Dig Bala uses house delta instead of Bhava Madhya');
    if (compSummary.chesta.fail > 0) rootCauses.push('Chesta Bala lacks mean motion / Chesta Kendra model');
    if (compSummary.drik.fail > 0) rootCauses.push('Drik Bala piecewise aspect matrix simplified');

    fixtureResults.push({
      fixtureId: f.fixture_id,
      name: f.name,
      purpose: f.purpose,
      location: f.location,
      datetime: f.datetime,
      status: fixturePassed ? 'PASS' : 'FAIL',
      componentSummary: compSummary,
      planets: planetsRecord as Record<PlanetName, PlanetComparison>,
      rootCause: rootCauses.length > 0 ? rootCauses.join('; ') : 'None',
    });
  }

  const passedFixtures = fixtureResults.filter((r) => r.status === 'PASS').length;
  const failedFixtures = fixtureResults.length - passedFixtures;

  return {
    timestamp: new Date().toISOString(),
    oracleEngine: manifest.oracle_engine,
    pinnedCommit: manifest.pinned_commit,
    fixtureCount: fixtureResults.length,
    passedFixtures,
    failedFixtures,
    componentTotals: totals,
    overallStatus: failedFixtures === 0 ? 'PASS' : passedFixtures > 0 ? 'PASS_WITH_FINDINGS' : 'BLOCKED',
    fixtures: fixtureResults,
  };
}
