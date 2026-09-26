/**
 * DSSME EVENT ENGINE V1.0 - DIG BALA (DIRECTIONAL STRENGTH)
 * Source: PyJHora (strength.py lines 416-426)
 * Formula: dbp[p] = (180.0 - diff(powerless_point, planet_long)) / 3.0
 */

import { PlanetState, HouseInfo } from '../types.js';
import { SHADBALA_PLANETS, POWERLESS_HOUSES } from './shadbalaConstants.js';

export function calculateDigBalaAll(
  planets: Record<string, PlanetState>,
  houses?: HouseInfo[],
  bhavaMadhya?: number[]
): number[] {
  return SHADBALA_PLANETS.map((pName, i) => {
    const pData = planets[pName];
    const pLong = pData?.totalLongitude ?? 0;
    const pwHouse = POWERLESS_HOUSES[i]; // 1-indexed (e.g. 4 for Sun)

    // Determine powerless longitude point
    let pwLong: number;
    if (bhavaMadhya && bhavaMadhya.length >= 12 && typeof bhavaMadhya[pwHouse - 1] === 'number') {
      pwLong = bhavaMadhya[pwHouse - 1];
    } else if (houses && houses.length >= 12) {
      const hData = houses[pwHouse - 1];
      const hNum = hData?.houseNumber ?? (hData as any)?.house ?? pwHouse;
      pwLong = hData?.cuspDegree ?? ((hNum - 1) * 30.0 + 15.0);
    } else {
      pwLong = (pLong + pwHouse * 30.0) % 360.0;
    }

    let diff = Math.abs(pwLong - pLong);
    if (diff > 180.0) diff = 360.0 - diff;

    const digVirupas = Math.max(0, (180.0 - diff) / 3.0);
    return Math.round(digVirupas * 100) / 100;
  });
}
