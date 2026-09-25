/**
 * DSSME EVENT ENGINE V1.0 - MOD-15 Validation & Benchmark Runner
 * Compares real-time DSSME engine calculations directly against
 * the canonical immutable fixture DSSME_CHART_2026-09-16_Chofu.json.
 */

import { BenchmarkResult, CanonicalChart } from '../types.js';
import chofuFixture from '../../../DSSME_CHART_2026-09-16_Chofu.json';

export interface BenchmarkSuiteReport {
  timestamp: string;
  totalChecks: number;
  passedChecks: number;
  warnChecks: number;
  failedChecks: number;
  overallStatus: 'PASS' | 'WARN' | 'FAIL';
  results: BenchmarkResult[];
}

export function runChofuBenchmark(dssmeChart: CanonicalChart): BenchmarkSuiteReport {
  const results: BenchmarkResult[] = [];

  const addCheck = (
    category: string,
    metric: string,
    dVal: any,
    refVal: any,
    tol: number,
    note?: string
  ) => {
    let diff = 0;
    let status: 'PASS' | 'WARN' | 'FAIL' = 'PASS';

    const dmsRegex = /^(\d{1,3})°(\d{1,2})'(\d{1,2})"/;
    const dMatch = typeof dVal === 'string' ? dVal.match(dmsRegex) : null;
    const rMatch = typeof refVal === 'string' ? refVal.match(dmsRegex) : null;

    if (dMatch && rMatch) {
      const dSec = parseInt(dMatch[1], 10) * 3600 + parseInt(dMatch[2], 10) * 60 + parseInt(dMatch[3], 10);
      const rSec = parseInt(rMatch[1], 10) * 3600 + parseInt(rMatch[2], 10) * 60 + parseInt(rMatch[3], 10);
      diff = Math.abs(dSec - rSec);
      const allowedTol = tol === 0 ? 1 : tol; // 1 arcsec standard precision tolerance
      status = diff <= allowedTol ? 'PASS' : (diff <= allowedTol * 2 ? 'WARN' : 'FAIL');
    } else if (typeof dVal === 'number' && typeof refVal === 'number') {
      diff = Math.abs(dVal - refVal);
      if (diff > tol) {
        status = diff <= tol * 2 ? 'WARN' : 'FAIL';
      }
    } else {
      const dStr = String(dVal).trim().toLowerCase();
      const rStr = String(refVal).trim().toLowerCase();
      diff = dStr === rStr ? 0 : 1;
      status = diff === 0 ? 'PASS' : 'FAIL';
    }

    results.push({
      category,
      metric,
      dssme: dVal,
      reference: refVal,
      absoluteDifference: Math.round(diff * 1000) / 1000,
      tolerance: tol,
      status,
      note,
    });
  };

  // 1. IDENTITY & LAGNA
  addCheck('Identity', 'Ayanamsa Name', dssmeChart.IDENTITY.ayanamsa_name, chofuFixture.IDENTITY.ayanamsa_name, 0);
  addCheck('Identity', 'Ayanamsa Value', dssmeChart.IDENTITY.ayanamsa_value, chofuFixture.IDENTITY.ayanamsa_value, 0, 'Lahiri Chitra Paksha');
  addCheck('Identity', 'Lagna Sign', dssmeChart.IDENTITY.lagna_sign, chofuFixture.IDENTITY.lagna_sign, 0);
  addCheck('Identity', 'Lagna Degree', dssmeChart.IDENTITY.lagna_degree, chofuFixture.IDENTITY.lagna_degree, 0, '1 arcsec precision');
  addCheck('Identity', 'Lagna Type', dssmeChart.IDENTITY.lagna_type, chofuFixture.IDENTITY.lagna_type, 0);

  // 2. PANCHANGA
  addCheck('Panchanga', 'Paksha', dssmeChart.PANCHANGA.paksha, chofuFixture.PANCHANGA.paksha, 0);
  addCheck('Panchanga', 'Tithi Name', dssmeChart.PANCHANGA.tithi_name, chofuFixture.PANCHANGA.tithi_name, 0);
  addCheck('Panchanga', 'Nakshatra Name', dssmeChart.PANCHANGA.nakshatra_name, chofuFixture.PANCHANGA.nakshatra_name, 0);
  addCheck('Panchanga', 'Nakshatra Pada', dssmeChart.PANCHANGA.nakshatra_pada, chofuFixture.PANCHANGA.nakshatra_pada, 0);
  addCheck('Panchanga', 'Yoga at Birth', dssmeChart.PANCHANGA.yoga_at_birth, chofuFixture.PANCHANGA.yoga_at_birth, 0);
  addCheck('Panchanga', 'Karana at Birth', dssmeChart.PANCHANGA.karana_at_birth, chofuFixture.PANCHANGA.karana_at_birth, 0);
  addCheck('Panchanga', 'Weekday Lord', dssmeChart.PANCHANGA.weekday_lord, chofuFixture.PANCHANGA.weekday_lord, 0);
  addCheck('Panchanga', 'Sunrise Time', dssmeChart.PANCHANGA.sunrise_time.slice(0, 5), chofuFixture.PANCHANGA.sunrise_time.slice(0, 5), 0);
  addCheck('Panchanga', 'Sunset Time', dssmeChart.PANCHANGA.sunset_time.slice(0, 5), chofuFixture.PANCHANGA.sunset_time.slice(0, 5), 0);

  // 3. PLANETARY STATES (Sign, House, Retrograde, Dignity)
  const planetsToTest = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  for (const p of planetsToTest) {
    const dPlanet = dssmeChart.PLANETS[p];
    const rPlanet = (chofuFixture.PLANETS as any)[p];
    if (dPlanet && rPlanet) {
      addCheck('Planets', `${p} Sign`, dPlanet.sign, rPlanet.sign, 0);
      addCheck('Planets', `${p} House`, dPlanet.house, rPlanet.house, 0);
      addCheck('Planets', `${p} Retrograde`, dPlanet.retrograde, rPlanet.retro === 'R', 0);
      addCheck('Planets', `${p} Dignity`, dPlanet.dignity, rPlanet.dignity, 0);
    }
  }

  // 4. RETROGRADE EXPLICIT TABLE
  addCheck('Retrograde', 'Saturn Retro', dssmeChart.RETROGRADE['Saturn'], chofuFixture.RETROGRADE.Saturn, 0);
  addCheck('Retrograde', 'Rahu Retro', dssmeChart.RETROGRADE['Rahu'], chofuFixture.RETROGRADE.Rahu, 0);
  addCheck('Retrograde', 'Ketu Retro', dssmeChart.RETROGRADE['Ketu'], chofuFixture.RETROGRADE.Ketu, 0);

  // 5. DASHA
  addCheck('Dasha', 'Mahadasha Planet', dssmeChart.DASHA.mahadasha_planet, chofuFixture.DASHA.mahadasha_planet, 0);
  addCheck('Dasha', 'Antardasha Planet', dssmeChart.DASHA.antardasha_planet, chofuFixture.DASHA.antardasha_planet, 0);
  addCheck('Dasha', 'Pratyantara Planet', dssmeChart.DASHA.pratyantara, chofuFixture.DASHA.pratyantara, 0);
  addCheck('Dasha', 'Dasha String', dssmeChart.DASHA.dasha_string, chofuFixture.DASHA.dasha_string, 0);
  addCheck('Dasha', 'Next Mahadasha', dssmeChart.DASHA.next_mahadasha_planet, chofuFixture.DASHA.next_mahadasha_planet, 0);

  // 6. SHADBALA VIRUPAS & RANKS
  const sbPlanets = chofuFixture.SHADBALA._columns;
  for (let i = 0; i < sbPlanets.length; i++) {
    const p = sbPlanets[i];
    const dVir = dssmeChart.SHADBALA.total_virupas[i];
    const rVir = chofuFixture.SHADBALA.total_virupas[i];
    addCheck('Shadbala', `${p} Total Virupas`, dVir, rVir, 0.5);

    const dRank = dssmeChart.SHADBALA.rank[i];
    const rRank = chofuFixture.SHADBALA.rank[i];
    addCheck('Shadbala', `${p} Rank`, dRank, rRank, 0);
  }

  // 7. ASHTAKAVARGA SAV & BAV
  addCheck('Ashtakavarga', 'SAV Grand Total', dssmeChart.SAV.grand_total, chofuFixture.SAV.grand_total, 0, 'Exact 7 classical planets');
  for (let s = 0; s < 12; s++) {
    const sName = dssmeChart.BAV._signs?.[s] || `Sign ${s + 1}`;
    addCheck('Ashtakavarga', `SAV ${sName}`, dssmeChart.SAV.values[s], chofuFixture.SAV.values[s], 0);
  }
  addCheck('Ashtakavarga', 'Spec Sum (H2, H5, H8, H11)', dssmeChart.SAV.spec_sum, chofuFixture.SAV.spec_sum, 0);

  // 8. HORA
  addCheck('Hora', 'Hora Planet', dssmeChart.HORA.planet, chofuFixture.HORA.planet, 0);
  addCheck('Hora', 'Hora Number', dssmeChart.HORA.hora_number, chofuFixture.HORA.hora_number, 0);

  // 9. NAVAMSHA
  const dMarsNav = dssmeChart.NAVAMSHA['Mars'] as any;
  const rMarsNav = (chofuFixture.NAVAMSHA as any)['Mars'];
  if (dMarsNav && rMarsNav) {
    addCheck('Navamsha', 'Mars Vargottama', dMarsNav.is_vargottama, rMarsNav.is_vargottama, 0);
    addCheck('Navamsha', 'Mars Navamsha Sign', dMarsNav.sign, rMarsNav.sign, 0);
  }

  const dSunNav = dssmeChart.NAVAMSHA['Sun'] as any;
  const rSunNav = (chofuFixture.NAVAMSHA as any)['Sun'];
  if (dSunNav && rSunNav) {
    addCheck('Navamsha', 'Sun Pushkara Navamsha', dSunNav.is_pushkara, rSunNav.is_pushkara, 0);
  }

  // 10. BHAVA BALA
  for (let h = 1; h <= 12; h++) {
    const k = String(h);
    addCheck('Bhava Bala', `House ${h} Total`, dssmeChart.BHAVA_BALA[k]?.total, (chofuFixture.BHAVA_BALA as any)[k]?.total, 0.5);
  }

  // Summary
  const passed = results.filter(r => r.status === 'PASS').length;
  const warned = results.filter(r => r.status === 'WARN').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const overallStatus = failed > 0 ? 'FAIL' : (warned > 0 ? 'WARN' : 'PASS');

  return {
    timestamp: new Date().toISOString(),
    totalChecks: results.length,
    passedChecks: passed,
    warnChecks: warned,
    failedChecks: failed,
    overallStatus,
    results,
  };
}
