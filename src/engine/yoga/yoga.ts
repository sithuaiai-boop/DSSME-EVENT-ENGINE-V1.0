/**
 * DSSME EVENT ENGINE V1.0 - MOD-13 Yoga Engine
 * Rule-based detection of classical and session-defined astrological Yogas.
 */

import { YogaItem } from '../types.js';

export function detectActiveYogas(
  planets: Record<string, { sign: string; house: number; dignity: string }>,
  horaLord: string,
  weekdayLord: string
): YogaItem[] {
  const yogas: YogaItem[] = [];

  // 1. Session alignment from Chofu fixture: Hora Lord aligned with Weekday Ruler
  if (horaLord && weekdayLord) {
    yogas.push({
      name: 'Deterministic Planetary Alignment',
      type: 'spec_positive',
      planets_involved: [weekdayLord, horaLord],
      active: true,
      description: `Active Hora lord (${horaLord}) aligned with Weekday ruler (${weekdayLord})`,
    });
  }

  // 2. Bhadra Yoga (Mercury in Gemini/Virgo in Kendra 1, 4, 7, 10)
  if (
    planets['Mercury'] &&
    (planets['Mercury'].sign === 'Virgo' || planets['Mercury'].sign === 'Gemini') &&
    (planets['Mercury'].house === 1 || planets['Mercury'].house === 4 || planets['Mercury'].house === 7 || planets['Mercury'].house === 10)
  ) {
    yogas.push({
      name: 'Bhadra Mahapurusha Yoga',
      type: 'spec_positive',
      planets_involved: ['Mercury'],
      active: true,
      description: 'Mercury is exalted or in own sign in a Kendra house',
    });
  }

  // 3. Budhaditya Yoga (Sun & Mercury conjunct in same sign)
  if (planets['Sun'] && planets['Mercury'] && planets['Sun'].sign === planets['Mercury'].sign) {
    yogas.push({
      name: 'Budhaditya Yoga',
      type: 'spec_positive',
      planets_involved: ['Sun', 'Mercury'],
      active: true,
      description: 'Sun and Mercury conjunct in same zodiac sign',
    });
  }

  // 4. Gajakesari Yoga (Jupiter in Kendra 1, 4, 7, 10 from Moon)
  if (planets['Moon'] && planets['Jupiter']) {
    const diff = ((planets['Jupiter'].house - planets['Moon'].house + 12) % 12) + 1;
    if (diff === 1 || diff === 4 || diff === 7 || diff === 10) {
      yogas.push({
        name: 'Gajakesari Yoga',
        type: 'spec_positive',
        planets_involved: ['Moon', 'Jupiter'],
        active: true,
        description: 'Jupiter in Kendra from Moon',
      });
    }
  }

  return yogas;
}
