/**
 * DSSME EVENT ENGINE V1.0 - MOD-03 Ascendant & Houses Engine
 * Whole Sign & Bhava Chalit house mapping, cusp calculations, and house type classification.
 */

import { HouseInfo, HouseType, LagnaType } from '../types.js';
import { ZODIAC_SIGNS } from '../astronomy/ephemeris.js';
import { SIGN_LORDS } from '../dignity/dignity.js';

export function getHouseType(houseNumber: number): HouseType {
  if (houseNumber === 1 || houseNumber === 4 || houseNumber === 7 || houseNumber === 10) {
    return 'Angular';
  }
  if (houseNumber === 2 || houseNumber === 5 || houseNumber === 8 || houseNumber === 11) {
    return 'Succedent';
  }
  return 'Cadent';
}

export function getLagnaType(sign: string): LagnaType {
  // Movable = Aries/Cancer/Libra/Capricorn
  // Fixed = Taurus/Leo/Scorpio/Aquarius
  // Dual = Gemini/Virgo/Sagittarius/Pisces
  if (sign === 'Aries' || sign === 'Cancer' || sign === 'Libra' || sign === 'Capricorn') {
    return 'Movable';
  }
  if (sign === 'Taurus' || sign === 'Leo' || sign === 'Scorpio' || sign === 'Aquarius') {
    return 'Fixed';
  }
  return 'Dual';
}

/**
 * Build 12 houses starting from Lagna sign
 */
export function buildHouseMap(
  lagnaSign: string,
  planetSigns: Record<string, string>
): {
  houses: Record<string, HouseInfo>;
  planetHouseMap: Record<string, number>;
  housePositions: Record<string, { house: number; type: HouseType }>;
} {
  const lagnaIndex = ZODIAC_SIGNS.indexOf(lagnaSign as any);
  const houses: Record<string, HouseInfo> = {};
  const planetHouseMap: Record<string, number> = {};
  const housePositions: Record<string, { house: number; type: HouseType }> = {};

  // Initialize 12 houses
  for (let h = 1; h <= 12; h++) {
    const signIndex = (lagnaIndex + (h - 1)) % 12;
    const sign = ZODIAC_SIGNS[signIndex];
    const lord = SIGN_LORDS[sign] || 'Mars';
    houses[String(h)] = {
      houseNumber: h,
      sign,
      lord,
      occupants: [],
      type: getHouseType(h),
    };
  }

  // Assign planet occupants
  for (const [planet, pSign] of Object.entries(planetSigns)) {
    const pSignIndex = ZODIAC_SIGNS.indexOf(pSign as any);
    const houseNum = ((pSignIndex - lagnaIndex + 12) % 12) + 1;
    planetHouseMap[planet] = houseNum;
    housePositions[planet] = {
      house: houseNum,
      type: getHouseType(houseNum),
    };
    if (planet !== 'Lagna' && houses[String(houseNum)]) {
      houses[String(houseNum)].occupants.push(planet);
    }
  }

  return { houses, planetHouseMap, housePositions };
}
