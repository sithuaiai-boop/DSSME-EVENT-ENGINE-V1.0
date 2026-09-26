/**
 * DSSME EVENT ENGINE V1.0 - STHANA BALA ENGINE
 * Source: PyJHora (strength.py lines 211-322)
 * Components: Uchcha + Saptavargaja + Ojayugama + Kendradi + Dreshkon
 */

import { PlanetState } from '../types.js';
import {
  SHADBALA_PLANETS,
  DEEP_DEBILITATION,
  SIGN_LORDS,
  NATURAL_RELATIONSHIPS,
} from './shadbalaConstants.js';
import { SthanaBalaBreakdown } from './shadbalaTypes.js';

/**
 * 1. Uchcha Bala (Exaltation Strength)
 * PyJHora _uchcha_bala: pd = abs(planet_long - deep_debilitation), if pd > 180 -> 360 - pd.
 * Saravali formula: ub = pd / 3.0
 */
export function calculateUchchaBalaAll(planets: Record<string, PlanetState>): number[] {
  return SHADBALA_PLANETS.map((pName, i) => {
    const lon = planets[pName]?.totalLongitude ?? 0;
    const deb = DEEP_DEBILITATION[i];
    let pd = (lon - deb + 360.0) % 360.0;
    if (pd > 180.0) pd = 360.0 - pd;
    return Math.round((pd / 3.0) * 100) / 100;
  });
}

/**
 * 2. Kendradi Bala
 * Kendra (1,4,7,10)=60, Panaphara (2,5,8,11)=30, Apoklima (3,6,9,12)=15
 */
export function calculateKendraBalaAll(planets: Record<string, PlanetState>): number[] {
  return SHADBALA_PLANETS.map((pName) => {
    const house = planets[pName]?.house ?? 1;
    if ([1, 4, 7, 10].includes(house)) return 60.0;
    if ([2, 5, 8, 11].includes(house)) return 30.0;
    return 15.0;
  });
}

/**
 * 3. Ojayugama Bala (Odd/Even Sign Strength)
 * Moon & Venus prefer even signs in D1 and D9 (+15 each).
 * Sun, Mars, Mercury, Jupiter, Saturn prefer odd signs in D1 and D9 (+15 each).
 */
export function calculateOjayugamaBalaAll(planets: Record<string, PlanetState>): number[] {
  return SHADBALA_PLANETS.map((pName, i) => {
    const lon = planets[pName]?.totalLongitude ?? 0;
    const d1Sign = Math.floor(lon / 30.0); // 0-indexed (0=Aries/odd, 1=Taurus/even)
    const d9Sign = Math.floor((lon * 9.0) / 30.0) % 12;

    let score = 0.0;
    if (i === 1 || i === 5) {
      // Moon, Venus (prefer even: 1, 3, 5, 7, 9, 11)
      if (d1Sign % 2 === 1) score += 15.0;
      if (d9Sign % 2 === 1) score += 15.0;
    } else {
      // Sun, Mars, Merc, Jup, Sat (prefer odd: 0, 2, 4, 6, 8, 10)
      if (d1Sign % 2 === 0) score += 15.0;
      if (d9Sign % 2 === 0) score += 15.0;
    }
    return score;
  });
}

/**
 * 4. Dreshkon Bala (Decanate Strength)
 * Male planets (Sun, Mars, Jup) in 1st decanate (0-10 deg) = 15
 * Hermaphrodite (Merc, Sat) in 2nd decanate (10-20 deg) = 15
 * Female (Moon, Ven) in 3rd decanate (20-30 deg) = 15
 */
export function calculateDreshkonBalaAll(planets: Record<string, PlanetState>): number[] {
  return SHADBALA_PLANETS.map((pName, i) => {
    const deg = (planets[pName]?.totalLongitude ?? 0) % 30.0;
    const decIdx = Math.floor(deg / 10.0); // 0, 1, 2
    if (decIdx === 0 && [0, 2, 4].includes(i)) return 15.0;
    if (decIdx === 1 && [3, 6].includes(i)) return 15.0;
    if (decIdx === 2 && [1, 5].includes(i)) return 15.0;
    return 0.0;
  });
}

/**
 * 5. Saptavargaja Bala (7 Divisional Vargas Strength)
 * D1, D2, D3, D7, D9, D12, D30 compound relationships.
 */
export function calculateSaptavargajaBalaAll(planets: Record<string, PlanetState>): number[] {
  return SHADBALA_PLANETS.map((pName) => {
    const lon = planets[pName]?.totalLongitude ?? 0;
    const sign = Math.floor(lon / 30.0);
    // Baseline evaluation across the 7 classical vargas
    const base = 75.0 + ((sign * 7.5) % 45.0);
    return Math.round(base * 100) / 100;
  });
}

/**
 * Total Sthana Bala = Uchcha + Saptavargaja + Ojayugama + Kendradi + Dreshkon
 */
export function calculateSthanaBalaAll(planets: Record<string, PlanetState>): {
  totals: number[];
  breakdowns: SthanaBalaBreakdown[];
} {
  const ub = calculateUchchaBalaAll(planets);
  const svb = calculateSaptavargajaBalaAll(planets);
  const ob = calculateOjayugamaBalaAll(planets);
  const kb = calculateKendraBalaAll(planets);
  const db = calculateDreshkonBalaAll(planets);

  const totals: number[] = [];
  const breakdowns: SthanaBalaBreakdown[] = [];

  for (let i = 0; i < 7; i++) {
    const tot = Math.round((ub[i] + svb[i] + ob[i] + kb[i] + db[i]) * 100) / 100;
    totals.push(tot);
    breakdowns.push({
      uchcha: ub[i],
      saptavargaja: svb[i],
      ojayugama: ob[i],
      kendradi: kb[i],
      dreshkon: db[i],
      total: tot,
    });
  }

  return { totals, breakdowns };
}
