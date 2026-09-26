/**
 * DSSME EVENT ENGINE V1.0 - SHADBALA CONSTANTS
 * Source: PyJHora (naturalstupid/PyJHora - commit 48e57d29)
 * Files: src/jhora/const.py, src/jhora/horoscope/chart/strength.py
 */

export const SHADBALA_PLANETS = [
  'Sun',
  'Moon',
  'Mars',
  'Mercury',
  'Jupiter',
  'Venus',
  'Saturn',
] as const;

export type ShadbalaPlanet = typeof SHADBALA_PLANETS[number];

/** Deep Exaltation Longitudes (deg) in Sidereal Zodiac (const.deep_exaltation_degrees) */
export const DEEP_EXALTATION: readonly number[] = [10.0, 33.0, 298.0, 165.0, 100.0, 357.0, 200.0];

/** Deep Debilitation Longitudes (deg) in Sidereal Zodiac (const.deep_debilitation_degrees) */
export const DEEP_DEBILITATION: readonly number[] = [190.0, 213.0, 118.0, 345.0, 280.0, 177.0, 20.0];

/** Powerless houses (1-indexed) where planet has 0 Dig Bala (const.dig_bala_powerless_houses_of_planets) */
export const POWERLESS_HOUSES: readonly number[] = [4, 10, 4, 7, 7, 10, 1];

/** Fixed Naisargika natural strength virupas (const.naisargika_bala[:-2]) */
export const FIXED_NAISARGIKA_BALA: readonly number[] = [
  60.0,   // Sun
  51.43,  // Moon (60 * 6/7)
  17.14,  // Mars (60 * 2/7)
  25.71,  // Mercury (60 * 3/7)
  34.29,  // Jupiter (60 * 4/7)
  42.86,  // Venus (60 * 5/7)
  8.57,   // Saturn (60 * 1/7)
];

/** Minimum required Virupas for strength ratio (const.shad_bala_min_requirement) */
export const MIN_REQUIRED_VIRUPAS: readonly number[] = [
  390.0,  // Sun
  360.0,  // Moon
  300.0,  // Mars
  420.0,  // Mercury
  390.0,  // Jupiter
  330.0,  // Venus
  300.0,  // Saturn
];

/** Standard daily planetary speeds (deg/day) */
export const STANDARD_PLANETARY_SPEEDS: readonly number[] = [
  0.9856, // Sun
  13.176, // Moon
  0.524,  // Mars
  1.383,  // Mercury
  0.083,  // Jupiter
  1.200,  // Venus
  0.033,  // Saturn
];

/** Planetary rulerships for signs (0 = Aries ... 11 = Pisces) */
export const SIGN_LORDS: readonly number[] = [
  2, // 0: Aries -> Mars
  5, // 1: Taurus -> Venus
  3, // 2: Gemini -> Mercury
  1, // 3: Cancer -> Moon
  0, // 4: Leo -> Sun
  3, // 5: Virgo -> Mercury
  5, // 6: Libra -> Venus
  2, // 7: Scorpio -> Mars
  4, // 8: Sagittarius -> Jupiter
  6, // 9: Capricorn -> Saturn
  6, // 10: Aquarius -> Saturn
  4, // 11: Pisces -> Jupiter
];

/** Classical Natural Relationships matrix (Graha Maitri): 1=Friend, 0=Neutral, -1=Enemy */
export const NATURAL_RELATIONSHIPS: readonly (readonly number[])[] = [
  // Sun: Moon(1), Mars(2), Jup(4) Friend; Merc(3) Neutral; Ven(5), Sat(6) Enemy
  [0, 1, 1, 0, 1, -1, -1],
  // Moon: Sun(0), Merc(3) Friend; Mars(2), Jup(4), Ven(5), Sat(6) Neutral
  [1, 0, 0, 1, 0, 0, 0],
  // Mars: Sun(0), Moon(1), Jup(4) Friend; Ven(5), Sat(6) Neutral; Merc(3) Enemy
  [1, 1, 0, -1, 1, 0, 0],
  // Mercury: Sun(0), Ven(5) Friend; Mars(2), Jup(4), Sat(6) Neutral; Moon(1) Enemy
  [1, -1, 0, 0, 0, 1, 0],
  // Jupiter: Sun(0), Moon(1), Mars(2) Friend; Sat(6) Neutral; Merc(3), Ven(5) Enemy
  [1, 1, 1, -1, 0, -1, 0],
  // Venus: Merc(3), Sat(6) Friend; Mars(2), Jup(4) Neutral; Sun(0), Moon(1) Enemy
  [-1, -1, 0, 1, 0, 0, 1],
  // Saturn: Merc(3), Ven(5) Friend; Jup(4) Neutral; Sun(0), Moon(1), Mars(2) Enemy
  [-1, -1, -1, 1, 0, 1, 0],
];

/** Hora Lord order cycle starting from Sunday dawn (PyJHora const.hora_bala_hora_order) */
export const HORA_LORD_ORDER: readonly number[] = [0, 5, 3, 1, 6, 4, 2]; // Sun, Ven, Merc, Moon, Sat, Jup, Mars
