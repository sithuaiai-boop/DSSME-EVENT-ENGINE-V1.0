/**
 * DSSME EVENT ENGINE V1.0 - MOD-08 Aspect Engine
 * Parashara Drishti (planetary aspects), fractional scores (15, 30, 45, 60),
 * and Bhava drishti.
 */

import { AspectPlanetItem, AspectBhavaItem } from '../types.js';

export interface AspectRule {
  fromPlanet: string;
  targetHouses: number[]; // relative house numbers, e.g. 7 for all, [4, 8] for Mars
  scores: Record<number, { fraction: string; score: number }>;
}

export const PARASHARA_DRISHTI_RULES: Record<string, Record<number, { fraction: string; score: number }>> = {
  Sun: {
    7: { fraction: '4/4', score: 60 },
  },
  Moon: {
    7: { fraction: '4/4', score: 60 },
  },
  Mars: {
    4: { fraction: '3/4', score: 45 },
    7: { fraction: '4/4', score: 60 },
    8: { fraction: '3/4', score: 45 },
  },
  Mercury: {
    7: { fraction: '4/4', score: 60 },
  },
  Jupiter: {
    5: { fraction: '3/4', score: 45 },
    7: { fraction: '4/4', score: 60 },
    9: { fraction: '3/4', score: 45 },
  },
  Venus: {
    7: { fraction: '4/4', score: 60 },
  },
  Saturn: {
    3: { fraction: '4/4', score: 60 },
    7: { fraction: '4/4', score: 60 },
    10: { fraction: '3/4', score: 45 },
  },
  Rahu: {
    5: { fraction: '4/4', score: 60 },
    7: { fraction: '4/4', score: 60 },
    9: { fraction: '4/4', score: 60 },
  },
  Ketu: {
    5: { fraction: '4/4', score: 60 },
    7: { fraction: '4/4', score: 60 },
    9: { fraction: '4/4', score: 60 },
  },
};

/**
 * Calculate planetary aspects between all bodies
 */
export function calculatePlanetaryAspects(
  planetHouses: Record<string, number>
): AspectPlanetItem[] {
  const aspects: AspectPlanetItem[] = [];
  const planets = Object.keys(planetHouses).filter(p => p !== 'Lagna');

  for (const from of planets) {
    const fromHouse = planetHouses[from];
    const rules = PARASHARA_DRISHTI_RULES[from];
    if (!rules || !fromHouse) continue;

    for (const to of planets) {
      if (from === to) continue;
      const toHouse = planetHouses[to];
      if (!toHouse) continue;

      const houseDiff = ((toHouse - fromHouse + 12) % 12) + 1; // 1 to 12
      const matched = rules[houseDiff];
      if (matched) {
        aspects.push({
          from,
          to,
          fraction: matched.fraction,
          score: matched.score,
        });
      }
    }
  }

  return aspects;
}

/**
 * Calculate aspects on the 12 Bhavas
 */
export function calculateBhavaAspects(
  planetHouses: Record<string, number>
): Record<string, AspectBhavaItem> {
  const result: Record<string, AspectBhavaItem> = {};

  for (let h = 1; h <= 12; h++) {
    const centerDeg = (h - 1) * 30 + 15;
    const aspectMap: Record<string, number> = {};

    for (const [planet, pHouse] of Object.entries(planetHouses)) {
      if (planet === 'Lagna') continue;
      const relHouse = ((h - pHouse + 12) % 12) + 1;
      const rules = PARASHARA_DRISHTI_RULES[planet];
      if (rules && rules[relHouse]) {
        aspectMap[planet] = rules[relHouse].score;
      }
    }

    result[String(h)] = {
      degree: centerDeg,
      aspects: aspectMap,
    };
  }

  return result;
}
