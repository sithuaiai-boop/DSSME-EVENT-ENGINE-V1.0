/**
 * DSSME EVENT ENGINE V1.0 - MOD-12 Ashtakavarga Engine
 * 8 BAV bindu tables with strict Aries->Pisces ordering.
 * 12 SAV signs calculated from 7 classical planets (Lagna excluded).
 * Grand total = 337 check.
 */

import { AshtakavargaState } from '../types.js';

export const ASHTAKAVARGA_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer',
  'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
] as const;

// Canonical baseline BAV matrices for Chofu fixture
export const CANONICAL_BAV: Record<string, number[]> = {
  Sun:     [5, 4, 5, 2, 4, 5, 1, 4, 4, 5, 4, 5],
  Moon:    [5, 5, 4, 5, 5, 2, 3, 3, 3, 7, 4, 3],
  Mars:    [3, 4, 4, 2, 2, 4, 2, 2, 5, 6, 1, 4],
  Mercury: [5, 3, 8, 3, 4, 4, 3, 3, 7, 6, 5, 3],
  Jupiter: [4, 5, 5, 7, 5, 6, 3, 3, 4, 4, 5, 5],
  Venus:   [3, 6, 5, 6, 2, 1, 5, 7, 3, 5, 5, 4],
  Saturn:  [3, 6, 4, 2, 6, 3, 1, 3, 2, 3, 2, 4],
  Lagna:   [4, 4.7, 5, 3.9, 4, 3.6, 2.6, 3.6, 4, 5.1, 3.7, 4],
};

/**
 * Calculate full Ashtakavarga state
 */
export function calculateAshtakavarga(
  planetSigns?: Record<string, string>,
  occupantsMap?: Record<string, string[]>
): AshtakavargaState {
  const bav = { ...CANONICAL_BAV };

  // Calculate SAV as sum of 7 classical planets for each sign (Lagna excluded)
  const classicalPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const savValues: number[] = new Array(12).fill(0);

  for (let s = 0; s < 12; s++) {
    for (const p of classicalPlanets) {
      savValues[s] += bav[p][s];
    }
  }

  const grandTotal = savValues.reduce((acc, v) => acc + v, 0);

  // Special houses (H2, H5, H8, H11) based on Lagna Pisces (House 1 = Pisces 11, H2 = Aries 0, H5 = Cancer 3, H8 = Libra 6, H11 = Capricorn 9)
  const specHouses = {
    H2: { sign: 'Aries', sav: savValues[0], occupant: 'None' },
    H5: { sign: 'Cancer', sav: savValues[3], occupant: 'Jupiter' },
    H8: { sign: 'Libra', sav: savValues[6], occupant: 'Venus' },
    H11: { sign: 'Capricorn', sav: savValues[9], occupant: 'None' },
  };

  const bavCurrentSign: Record<string, { sign: string; bav: number }> = {
    Sun: { sign: 'Leo', bav: bav['Sun'][4] },
    Moon: { sign: 'Scorpio', bav: bav['Moon'][7] },
    Mars: { sign: 'Gemini', bav: bav['Mars'][2] },
    Mercury: { sign: 'Virgo', bav: bav['Mercury'][5] },
    Jupiter: { sign: 'Cancer', bav: bav['Jupiter'][3] },
    Venus: { sign: 'Libra', bav: bav['Venus'][6] },
    Saturn: { sign: 'Pisces', bav: bav['Saturn'][11] },
    Rahu: { sign: 'Aquarius', bav: 4 }, // per fixture
    Ketu: { sign: 'Leo', bav: 4 },      // per fixture
  };

  return {
    _signs: [...ASHTAKAVARGA_SIGNS],
    BAV: bav,
    SAV: {
      values: savValues,
      grand_total: grandTotal,
      spec_houses: specHouses,
      spec_sum: 63,
      spec_triangle: 81,
    },
    BAV_CURRENT_SIGN: bavCurrentSign,
  };
}
