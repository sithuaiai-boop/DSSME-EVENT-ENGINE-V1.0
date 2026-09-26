/**
 * DSSME EVENT ENGINE V1.0 - DRIK BALA (ASPECTUAL STRENGTH)
 * Source: PyJHora (strength.py lines 714-769, 924-950)
 * Continuous 7x7 pairwise piecewise Parashara aspect evaluation
 */

import { PlanetState } from '../types.js';
import { SHADBALA_PLANETS } from './shadbalaConstants.js';

/**
 * PyJHora __drik_bala_calc_1
 * Evaluates aspect strength (virupas) of aspecting planet (p1) on aspected planet (p2)
 */
export function drikBalaCalc1(dk_p1_p2: number, p1: number, p2: number): number {
  let v = 0.0;
  if (dk_p1_p2 >= 0 && dk_p1_p2 < 30) {
    v = 0.0;
  } else if (dk_p1_p2 >= 30 && dk_p1_p2 < 60) {
    v = 0.5 * (dk_p1_p2 - 30.0);
  } else if (dk_p1_p2 >= 60 && dk_p1_p2 < 90) {
    v = dk_p1_p2 - 60.0 + 15.0;
    if (p1 === 6) v += 45.0; // Saturn 3rd special aspect
  } else if (dk_p1_p2 >= 90 && dk_p1_p2 < 120) {
    v = 0.5 * (120.0 - dk_p1_p2) + 30.0;
    if (p1 === 2) v += 15.0; // Mars 4th special aspect
  } else if (dk_p1_p2 >= 120 && dk_p1_p2 < 150) {
    v = 150.0 - dk_p1_p2;
    if (p1 === 4) v += 30.0; // Jupiter 5th special aspect
  } else if (dk_p1_p2 >= 150 && dk_p1_p2 < 180) {
    v = 2.0 * (dk_p1_p2 - 150.0);
  } else if (dk_p1_p2 >= 180 && dk_p1_p2 < 300) {
    v = 0.5 * (300.0 - dk_p1_p2);
    if (p1 === 2 && dk_p1_p2 >= 210 && dk_p1_p2 < 240) v += 15.0; // Mars 8th aspect
    if (p1 === 4 && dk_p1_p2 >= 240 && dk_p1_p2 < 270) v += 30.0; // Jupiter 9th aspect
    if (p1 === 6 && dk_p1_p2 >= 270 && dk_p1_p2 < 300) v += 45.0; // Saturn 10th aspect
  } else {
    v = 0.0;
  }
  return v;
}

/**
 * Calculates net Drik Bala for all 7 classical planets
 * Net = (Sum of Benefic Aspects - Sum of Malefic Aspects) / 4.0
 */
export function calculateDrikBalaAll(planets: Record<string, PlanetState>): number[] {
  const longs = SHADBALA_PLANETS.map((p) => planets[p]?.totalLongitude ?? 0);
  const dk: number[][] = Array.from({ length: 7 }, () => Array(7).fill(0));

  for (let p1 = 0; p1 < 7; p1++) {
    // Aspected Planet
    const p1Long = longs[p1];
    for (let p2 = 0; p2 < 7; p2++) {
      // Aspecting Planet
      if (p1 === p2) continue;
      const p2Long = longs[p2];
      const angle = (360.0 + p1Long - p2Long) % 360.0;
      const strength = drikBalaCalc1(angle, p2, p1);
      dk[p1][p2] = strength;
    }
  }

  // Benefics: Jupiter(4), Venus(5), Moon(1), Mercury(3)
  // Malefics: Sun(0), Mars(2), Saturn(6)
  const benefics = [4, 5, 1, 3];
  const malefics = [0, 2, 6];

  const drikFinal: number[] = [];
  for (let target = 0; target < 7; target++) {
    let sumBenefic = 0.0;
    let sumMalefic = 0.0;

    for (let aspecting = 0; aspecting < 7; aspecting++) {
      const aspectVal = dk[target][aspecting];
      if (benefics.includes(aspecting)) {
        sumBenefic += aspectVal;
      }
      if (malefics.includes(aspecting)) {
        sumMalefic += aspectVal;
      }
    }

    const net = (sumBenefic - sumMalefic) / 4.0;
    drikFinal.push(Math.round(net * 100) / 100);
  }

  return drikFinal;
}
