/**
 * DSSME EVENT ENGINE V1.0 - SHADBALA CALCULATION ENGINE (MOD-10)
 * Source of Truth: PyJHora (naturalstupid/PyJHora - commit 48e57d29)
 *
 * Implements Parashara 6-fold planetary strength:
 * 1. Sthana Bala (Positional Strength): Uchcha + Saptavargaja + Ojayugama + Kendradi + Dreshkon
 * 2. Dig Bala (Directional Strength): Bhava-Madhya distance / 3 from Powerless Points
 * 3. Kaala Bala (Temporal Strength): Nathonnatha + Paksha + Tribhaga + Abda + Masa + Vaara + Hora + Ayana + Yuddha
 * 4. Chesta Bala (Motional Strength): True vs Mean motion / Chesta Kendra / Retrograde = 60.0
 * 5. Naisargika Bala (Natural Strength): Universal fixed luminosity constants
 * 6. Drik Bala (Aspectual Strength): 7x7 continuous piecewise Parashara aspect matrix (__drik_bala_calc_1)
 *
 * FIREWALL CONTRACT:
 * - RS(p) = Sthana + Dig + Kaala + Chesta + Naisargika + Drik
 * - Exactly 0.0 Bhava Bala contributes to Shadbala RS(p)
 * - Rahu and Ketu are strictly excluded from Shadbala calculations
 */

import { PlanetState, HouseInfo, ShadbalaState } from '../types.js';
import {
  SHADBALA_PLANETS,
  MIN_REQUIRED_VIRUPAS,
} from './shadbalaConstants.js';
import { ShadbalaContext } from './shadbalaTypes.js';
import { calculateSthanaBalaAll } from './sthanaBala.js';
import { calculateDigBalaAll } from './digBala.js';
import { calculateKaalaBalaAll } from './kaalaBala.js';
import { calculateChestaBalaAll } from './chestaBala.js';
import { calculateNaisargikaBalaAll } from './naisargikaBala.js';
import { calculateDrikBalaAll } from './drikBala.js';
import { createShadbalaTrace } from './shadbalaTrace.js';

export const MINIMUM_VIRUPAS = MIN_REQUIRED_VIRUPAS;

export {
  SHADBALA_PLANETS,
  MIN_REQUIRED_VIRUPAS,
  calculateSthanaBalaAll,
  calculateDigBalaAll,
  calculateKaalaBalaAll,
  calculateChestaBalaAll,
  calculateNaisargikaBalaAll,
  calculateDrikBalaAll,
};

/**
 * Primary Public Entry Point for Shadbala Calculation
 */
export function calculateShadbala(context?: ShadbalaContext): ShadbalaState {
  // Construct fallback mock planets if context is absent (testing fallback)
  const planets: Record<string, PlanetState> = context?.planets ?? ({
    Sun: { name: 'Sun', sign: 'Aries', degreeInSign: 10, degreeFormatted: '10°00\'00"', totalLongitude: 10, nakshatra: 'Ashwini', pada: 1, house: 1, speed: 0.9856, retro: 'N', retrograde: false, combust: 'N' },
    Moon: { name: 'Moon', sign: 'Cancer', degreeInSign: 15, degreeFormatted: '15°00\'00"', totalLongitude: 105, nakshatra: 'Pushya', pada: 2, house: 4, speed: 13.176, retro: 'N', retrograde: false, combust: 'N' },
    Mars: { name: 'Mars', sign: 'Capricorn', degreeInSign: 28, degreeFormatted: '28°00\'00"', totalLongitude: 298, nakshatra: 'Dhanishta', pada: 3, house: 10, speed: 0.524, retro: 'N', retrograde: false, combust: 'N' },
    Mercury: { name: 'Mercury', sign: 'Aries', degreeInSign: 20, degreeFormatted: '20°00\'00"', totalLongitude: 20, nakshatra: 'Bharani', pada: 1, house: 1, speed: 1.383, retro: 'N', retrograde: false, combust: 'N' },
    Jupiter: { name: 'Jupiter', sign: 'Cancer', degreeInSign: 5, degreeFormatted: '05°00\'00"', totalLongitude: 95, nakshatra: 'Punarvasu', pada: 4, house: 4, speed: 0.083, retro: 'N', retrograde: false, combust: 'N' },
    Venus: { name: 'Venus', sign: 'Libra', degreeInSign: 12, degreeFormatted: '12°00\'00"', totalLongitude: 192, nakshatra: 'Swati', pada: 2, house: 7, speed: 1.200, retro: 'N', retrograde: false, combust: 'N' },
    Saturn: { name: 'Saturn', sign: 'Aries', degreeInSign: 20, degreeFormatted: '20°00\'00"', totalLongitude: 20, nakshatra: 'Bharani', pada: 1, house: 1, speed: -0.033, retro: 'R', retrograde: true, combust: 'N' },
  } as unknown as Record<string, PlanetState>);

  const houses: HouseInfo[] = context?.houses ?? [];
  const bhavaMadhya = context?.bhavaMadhya;

  // 1. Sthana Bala
  const { totals: sthana, breakdowns: sthanaBreakdowns } = calculateSthanaBalaAll(planets);

  // 2. Dig Bala
  const dig = calculateDigBalaAll(planets, houses, bhavaMadhya);

  // 3. Kaala Bala
  const { totals: kaala, breakdowns: kaalaBreakdowns } = calculateKaalaBalaAll({
    timeStr: context?.timeStr,
    panchanga: context?.panchanga,
    planets,
    sunrise: context?.panchanga?.sunrise_time,
    sunset: context?.panchanga?.sunset_time,
  });

  // 4. Chesta Bala
  const chesta = calculateChestaBalaAll(planets);

  // 5. Naisargika Bala
  const naisargika = calculateNaisargikaBalaAll();

  // 6. Drik Bala
  const drik = calculateDrikBalaAll(planets);

  // 7. Aggregate Total Virupas: Exactly 6 classical sources
  const totalVirupas: number[] = [];
  const totalRupas: number[] = [];
  const percentRequired: number[] = [];
  const strengthRatio: number[] = [];

  for (let i = 0; i < 7; i++) {
    const tot = Math.round((sthana[i] + dig[i] + kaala[i] + chesta[i] + naisargika[i] + drik[i]) * 100) / 100;
    totalVirupas.push(tot);

    const rupa = Math.round((tot / 60.0) * 100) / 100;
    totalRupas.push(rupa);

    const minReq = MIN_REQUIRED_VIRUPAS[i];
    const ratio = Math.round((tot / minReq) * 100) / 100;
    strengthRatio.push(ratio);
    percentRequired.push(Math.round(ratio * 100.0 * 10) / 10);
  }

  // 8. Calculate Planetary Ranks (1 = strongest virupas)
  const sortedIndices = totalVirupas
    .map((val, idx) => ({ val, idx }))
    .sort((a, b) => b.val - a.val);

  const rank = new Array(7).fill(0);
  sortedIndices.forEach((item, r) => {
    rank[item.idx] = r + 1;
  });

  // 9. Percentage of total virupas per component
  const sumTotalVirupas = totalVirupas.reduce((acc, v) => acc + v, 0) || 1;
  const sthana_pct = sthana.map((v) => Math.round((v / sumTotalVirupas) * 1000) / 10);
  const dig_pct = dig.map((v) => Math.round((v / sumTotalVirupas) * 1000) / 10);
  const kaala_pct = kaala.map((v) => Math.round((v / sumTotalVirupas) * 1000) / 10);
  const chesta_pct = chesta.map((v) => Math.round((v / sumTotalVirupas) * 1000) / 10);
  const drig_pct = drik.map((v) => Math.round((v / sumTotalVirupas) * 1000) / 10);

  return {
    _columns: [...SHADBALA_PLANETS],
    total_virupas: totalVirupas,
    total_rupas: totalRupas,
    minimum_required: [...MIN_REQUIRED_VIRUPAS],
    percent_required: percentRequired,
    strength_ratio: strengthRatio,
    rank,
    sthana_total: sthana,
    sthana_pct,
    dig_bala: dig,
    dig_pct,
    kaala_total: kaala,
    kaala_pct,
    chesta_bala: chesta,
    chesta_pct,
    naisargika_bala: naisargika,
    drig_bala: drik,
    drig_pct,
  };
}
