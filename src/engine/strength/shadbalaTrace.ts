/**
 * DSSME EVENT ENGINE V1.0 - SHADBALA TRACE MODULE
 * Produces structured calculation traces for debugging and parity verification
 */

import { SHADBALA_PLANETS, ShadbalaPlanet } from './shadbalaConstants.js';
import {
  ShadbalaTrace,
  PlanetShadbalaTrace,
  SthanaBalaBreakdown,
  KaalaBalaBreakdown,
} from './shadbalaTypes.js';

export function createShadbalaTrace(
  sthanaBreakdowns: SthanaBalaBreakdown[],
  kaalaBreakdowns: KaalaBalaBreakdown[],
  dig: number[],
  chesta: number[],
  naisargika: number[],
  drik: number[],
  totalVirupas: number[],
  totalRupas: number[],
  strengthRatios: number[],
  ranks: number[]
): ShadbalaTrace {
  const planetsRecord: Partial<Record<ShadbalaPlanet, PlanetShadbalaTrace>> = {};

  let checksumPass = true;
  for (let i = 0; i < 7; i++) {
    const p = SHADBALA_PLANETS[i];
    const s = sthanaBreakdowns[i].total;
    const k = kaalaBreakdowns[i].total;
    const d = dig[i];
    const c = chesta[i];
    const n = naisargika[i];
    const dr = drik[i];
    const tot = totalVirupas[i];

    const sum = Math.round((s + k + d + c + n + dr) * 100) / 100;
    if (Math.abs(sum - tot) > 0.05) {
      checksumPass = false;
    }

    planetsRecord[p] = {
      planet: p,
      sthana: sthanaBreakdowns[i],
      kaala: kaalaBreakdowns[i],
      dig: d,
      chesta: c,
      naisargika: n,
      drik: dr,
      totalVirupas: tot,
      totalRupas: totalRupas[i],
      strengthRatio: strengthRatios[i],
      rank: ranks[i],
    };
  }

  return {
    timestamp: new Date().toISOString(),
    planets: planetsRecord as Record<ShadbalaPlanet, PlanetShadbalaTrace>,
    firewallPassed: checksumPass,
    totalDecompositionChecksum: checksumPass,
  };
}
