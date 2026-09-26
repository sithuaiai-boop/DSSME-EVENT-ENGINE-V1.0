/**
 * DSSME EVENT ENGINE V1.0 - CHESTA BALA (MOTIONAL STRENGTH)
 * Source: PyJHora (strength.py lines 693-711)
 * Rules: Sun/Moon = 0.0, Retrograde = 60.0, Direct motion = speed ratio * 30.0
 */

import { PlanetState } from '../types.js';
import { SHADBALA_PLANETS, STANDARD_PLANETARY_SPEEDS } from './shadbalaConstants.js';

export function calculateChestaBalaAll(planets: Record<string, PlanetState>): number[] {
  return SHADBALA_PLANETS.map((pName, i) => {
    if (i === 0 || i === 1) {
      // Sun and Moon do not receive Chesta Bala in classical Parashara
      return 0.0;
    }

    const pData = planets[pName];
    const isRetro = pData?.retrograde ?? false;
    if (isRetro) {
      // Full Chesta Bala for retrograde motion
      return 60.0;
    }

    const spd = Math.abs(pData?.speed ?? STANDARD_PLANETARY_SPEEDS[i]);
    const stdSpd = STANDARD_PLANETARY_SPEEDS[i];
    const ratio = Math.min(spd / stdSpd, 1.0);
    return Math.round(ratio * 30.0 * 100) / 100;
  });
}
