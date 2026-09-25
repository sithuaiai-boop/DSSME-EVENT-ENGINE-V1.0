/**
 * DSSME EVENT ENGINE V1.0 - MOD-05 Dignity Engine
 * Evaluation of classical dignity: Exalted, Debilitated, Moolatrikona, Own,
 * and 5-fold compound relationship (Pancha-da Maitri):
 * Grt.Friend, Friend, Neutral, Enemy, Grt.Enemy.
 */

import { DignityType } from '../types.js';

export const SIGN_LORDS: Record<string, string> = {
  Aries: 'Mars',
  Taurus: 'Venus',
  Gemini: 'Mercury',
  Cancer: 'Moon',
  Leo: 'Sun',
  Virgo: 'Mercury',
  Libra: 'Venus',
  Scorpio: 'Mars',
  Sagittarius: 'Jupiter',
  Capricorn: 'Saturn',
  Aquarius: 'Saturn',
  Pisces: 'Jupiter',
};

export const NATURAL_RELATIONSHIPS: Record<string, { friends: string[]; enemies: string[]; neutrals: string[] }> = {
  Sun: {
    friends: ['Moon', 'Mars', 'Jupiter'],
    enemies: ['Venus', 'Saturn'],
    neutrals: ['Mercury'],
  },
  Moon: {
    friends: ['Sun', 'Mercury'],
    enemies: [],
    neutrals: ['Mars', 'Jupiter', 'Venus', 'Saturn'],
  },
  Mars: {
    friends: ['Sun', 'Moon', 'Jupiter'],
    enemies: ['Mercury'],
    neutrals: ['Venus', 'Saturn'],
  },
  Mercury: {
    friends: ['Sun', 'Venus'],
    enemies: ['Moon'],
    neutrals: ['Mars', 'Jupiter', 'Saturn'],
  },
  Jupiter: {
    friends: ['Sun', 'Moon', 'Mars'],
    enemies: ['Mercury', 'Venus'],
    neutrals: ['Saturn'],
  },
  Venus: {
    friends: ['Mercury', 'Saturn'],
    enemies: ['Sun', 'Moon'],
    neutrals: ['Mars', 'Jupiter'],
  },
  Saturn: {
    friends: ['Mercury', 'Venus'],
    enemies: ['Sun', 'Moon', 'Mars'],
    neutrals: ['Jupiter'],
  },
};

/**
 * Calculate natural/inherent dignity without chart context
 */
export function getInherentDignity(planet: string, sign: string, degInSign = 15): DignityType {
  if (planet === 'Rahu' || planet === 'Ketu') return '—';

  // Exaltation / Debilitation
  if (planet === 'Sun' && sign === 'Aries') return 'Exalted';
  if (planet === 'Sun' && sign === 'Libra') return 'Debilitated';
  if (planet === 'Moon' && sign === 'Taurus' && degInSign <= 3) return 'Exalted';
  if (planet === 'Moon' && sign === 'Scorpio') return 'Debilitated';
  if (planet === 'Mars' && sign === 'Capricorn') return 'Exalted';
  if (planet === 'Mars' && sign === 'Cancer') return 'Debilitated';
  if (planet === 'Mercury' && sign === 'Virgo') return 'Exalted';
  if (planet === 'Mercury' && sign === 'Pisces') return 'Debilitated';
  if (planet === 'Jupiter' && sign === 'Cancer') return 'Exalted';
  if (planet === 'Jupiter' && sign === 'Capricorn') return 'Debilitated';
  if (planet === 'Venus' && sign === 'Pisces') return 'Exalted';
  if (planet === 'Venus' && sign === 'Virgo') return 'Debilitated';
  if (planet === 'Saturn' && sign === 'Libra') return 'Exalted';
  if (planet === 'Saturn' && sign === 'Aries') return 'Debilitated';

  // Moolatrikona
  if (planet === 'Sun' && sign === 'Leo' && degInSign < 20) return 'Moolatrikona';
  if (planet === 'Moon' && sign === 'Taurus' && degInSign > 3) return 'Moolatrikona';
  if (planet === 'Mars' && sign === 'Aries' && degInSign < 12) return 'Moolatrikona';
  if (planet === 'Mercury' && sign === 'Virgo' && degInSign > 15 && degInSign <= 20) return 'Moolatrikona';
  if (planet === 'Jupiter' && sign === 'Sagittarius' && degInSign < 10) return 'Moolatrikona';
  if (planet === 'Venus' && sign === 'Libra' && degInSign <= 15) return 'Moolatrikona';
  if (planet === 'Saturn' && sign === 'Aquarius' && degInSign < 20) return 'Moolatrikona';

  // Own Sign
  const lord = SIGN_LORDS[sign];
  if (lord === planet) return 'Own';

  // Compound friendship default when chart positions are not supplied
  const rel = NATURAL_RELATIONSHIPS[planet];
  if (rel) {
    if (rel.friends.includes(lord)) return 'Friend';
    if (rel.enemies.includes(lord)) return 'Enemy';
    return 'Neutral';
  }

  return 'Neutral';
}

/**
 * Calculate full compound dignity (Pancha-da Maitri) taking chart positions into account
 */
export function calculateCompoundDignity(
  planet: string,
  sign: string,
  degInSign: number,
  planetHouseMap?: Record<string, number>
): DignityType {
  if (planet === 'Rahu' || planet === 'Ketu') return '—';

  // Exaltation, Debilitation, Moolatrikona, Own always take precedence
  const inherent = getInherentDignity(planet, sign, degInSign);
  if (inherent === 'Exalted' || inherent === 'Debilitated' || inherent === 'Moolatrikona' || inherent === 'Own') {
    return inherent;
  }

  const signLord = SIGN_LORDS[sign];
  if (!signLord || signLord === planet) return 'Own';

  // Natural relationship
  const rel = NATURAL_RELATIONSHIPS[planet];
  let naturalScore = 0; // -1 enemy, 0 neutral, +1 friend
  if (rel) {
    if (rel.friends.includes(signLord)) naturalScore = 1;
    else if (rel.enemies.includes(signLord)) naturalScore = -1;
  }

  // Temporary relationship (Tatkalika Mitra) based on house separation
  let tempScore = 0; // +1 friend, -1 enemy
  if (planetHouseMap && planetHouseMap[planet] !== undefined && planetHouseMap[signLord] !== undefined) {
    const pHouse = planetHouseMap[planet];
    const lordHouse = planetHouseMap[signLord];
    const sep = ((lordHouse - pHouse + 12) % 12) + 1; // 1 to 12
    // Houses 2, 3, 4, 10, 11, 12 from planet are temporary friends
    if (sep === 2 || sep === 3 || sep === 4 || sep === 10 || sep === 11 || sep === 12) {
      tempScore = 1;
    } else {
      tempScore = -1;
    }
  }

  const combined = naturalScore + tempScore;
  if (combined >= 2) return 'Grt.Friend';
  if (combined === 1) return 'Friend';
  if (combined === 0) return 'Neutral';
  if (combined === -1) return 'Enemy';
  return 'Grt.Enemy';
}
