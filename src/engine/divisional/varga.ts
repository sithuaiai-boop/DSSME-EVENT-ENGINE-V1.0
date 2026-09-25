/**
 * DSSME EVENT ENGINE V1.0 - MOD-04 Divisional Engine (Vargas D1 to D60)
 * Reusable modular Varga mapping, Navamsha calculation, Pushkara Navamsha zones,
 * and Vargottama detection.
 */

import { ZODIAC_SIGNS } from '../astronomy/ephemeris.js';
import { NavamshaPlanet, DignityType } from '../types.js';

export interface VargaDefinition {
  division: number; // e.g. 1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60
  name: string;
  code: string;
}

export const VARGA_LIST: VargaDefinition[] = [
  { division: 1, name: 'Rashi', code: 'D1' },
  { division: 2, name: 'Hora', code: 'D2' },
  { division: 3, name: 'Drekkana', code: 'D3' },
  { division: 4, name: 'Chaturthamsha', code: 'D4' },
  { division: 7, name: 'Saptamsha', code: 'D7' },
  { division: 9, name: 'Navamsha', code: 'D9' },
  { division: 10, name: 'Dashamsha', code: 'D10' },
  { division: 12, name: 'Dwadashamsha', code: 'D12' },
  { division: 16, name: 'Shodashamsha', code: 'D16' },
  { division: 20, name: 'Vimshamsha', code: 'D20' },
  { division: 24, name: 'Chaturvimshamsha', code: 'D24' },
  { division: 27, name: 'Saptavimshamsha', code: 'D27' },
  { division: 30, name: 'Trimshamsha', code: 'D30' },
  { division: 40, name: 'Khavedamsha', code: 'D40' },
  { division: 45, name: 'Akshavedamsha', code: 'D45' },
  { division: 60, name: 'Shashtiamsha', code: 'D60' },
];

/**
 * Calculate Navamsha (D9) sign index (0-11)
 */
export function calculateNavamshaSignIndex(totalLongitude: number): number {
  const norm = ((totalLongitude % 360) + 360) % 360;
  const signIndex = Math.floor(norm / 30);
  const degInSign = norm % 30;
  const navamshaPart = Math.floor(degInSign / (30 / 9)); // 0-8

  let startSignIndex = 0;
  // Fire signs (Aries, Leo, Sagittarius): starts from Aries (0)
  if (signIndex % 4 === 0) startSignIndex = 0;
  // Earth signs (Taurus, Virgo, Capricorn): starts from Capricorn (9)
  else if (signIndex % 4 === 1) startSignIndex = 9;
  // Air signs (Gemini, Libra, Aquarius): starts from Libra (6)
  else if (signIndex % 4 === 2) startSignIndex = 6;
  // Water signs (Cancer, Scorpio, Pisces): starts from Cancer (3)
  else if (signIndex % 4 === 3) startSignIndex = 3;

  return (startSignIndex + navamshaPart) % 12;
}

/**
 * Check if degree falls into Pushkara Navamsha zone
 */
export function isPushkaraNavamsha(signIndex: number, degInSign: number): boolean {
  switch (signIndex) {
    case 0: // Aries: 16°00' - 20°00'
      return degInSign >= 16.0 && degInSign < 20.0;
    case 1: // Taurus: 13°20' - 16°40'
      return degInSign >= 13.333333 && degInSign < 16.666667;
    case 2: // Gemini: 23°20' - 26°40'
      return degInSign >= 23.333333 && degInSign < 26.666667;
    case 3: // Cancer: 26°40' - 30°00'
      return degInSign >= 26.666667 && degInSign <= 30.0;
    case 4: // Leo: 0°00' - 3°20' and 26°40' - 30°00'
      return (degInSign >= 0.0 && degInSign < 3.333333) || (degInSign >= 26.666667 && degInSign <= 30.0);
    case 5: // Virgo: 23°20' - 26°40'
      return degInSign >= 23.333333 && degInSign < 26.666667;
    case 6: // Libra: 10°00' - 13°20'
      return degInSign >= 10.0 && degInSign < 13.333333;
    case 7: // Scorpio: 0°00' - 3°20'
      return degInSign >= 0.0 && degInSign < 3.333333;
    case 8: // Sagittarius: 16°40' - 20°00'
      return degInSign >= 16.666667 && degInSign < 20.0;
    case 9: // Capricorn: 13°20' - 16°40' and 23°20' - 26°40'
      return (degInSign >= 13.333333 && degInSign < 16.666667) || (degInSign >= 23.333333 && degInSign < 26.666667);
    case 10: // Aquarius: 6°40' - 10°00'
      return degInSign >= 6.666667 && degInSign < 10.0;
    case 11: // Pisces: 10°00' - 13°20'
      return degInSign >= 10.0 && degInSign < 13.333333;
    default:
      return false;
  }
}

/**
 * Calculate Navamsha state for all planets
 */
export function buildNavamshaState(
  planets: Record<string, { totalLongitude: number; sign: string }>,
  dignityCalculator: (planet: string, sign: string) => DignityType
): Record<string, NavamshaPlanet> {
  const result: Record<string, NavamshaPlanet> = {};

  for (const [name, p] of Object.entries(planets)) {
    if (name === 'Lagna') continue;
    const navSignIdx = calculateNavamshaSignIndex(p.totalLongitude);
    const navSign = ZODIAC_SIGNS[navSignIdx];
    const is_vargottama = p.sign === navSign; // Strict sign-name equality test per §3 Rule 18
    const degInSign = p.totalLongitude % 30;
    const signIdx = Math.floor(p.totalLongitude / 30);
    const is_pushkara = isPushkaraNavamsha(signIdx, degInSign);
    const dignity = (name === 'Rahu' || name === 'Ketu') ? '—' : dignityCalculator(name, navSign);

    result[name] = {
      sign: navSign,
      dignity,
      is_vargottama,
      is_pushkara,
    };
  }

  return result;
}
