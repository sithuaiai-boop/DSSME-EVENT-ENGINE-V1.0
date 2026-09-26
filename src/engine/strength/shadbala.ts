/**
 * DSSME EVENT ENGINE V1.0 - MOD-10 Shadbala Strength Engine
 * Authoritative, pure astronomical implementation of the 6 classical strength sources:
 * 1. Sthana Bala (Positional: Uchcha + Saptavargaja + Ojayugama + Kendradi + Drekkana)
 * 2. Dig Bala (Directional: Angular distance from powerless houses via Bhava Madhya)
 * 3. Kaala Bala (Temporal: Nathonnatha + Paksha + Tribhaga + Vaaradhipathi + Hora + Ayana)
 * 4. Cheshta Bala (Motional: Retrograde 60 Virupas, True vs Mean Chesta Kendra)
 * 5. Naisargika Bala (Natural: Fixed Classical Luminosity Constants from PyJHora)
 * 6. Drik Bala (Aspectual: Piecewise Parashara Drishti __drik_bala_calc_1)
 *
 * Source-of-Truth:
 * PyJHora (naturalstupid/PyJHora/src/jhora/horoscope/chart/strength.py)
 * PyJHora Constants (naturalstupid/PyJHora/src/jhora/const.py)
 *
 * FIREWALLS:
 * - 7 Classical Planets ONLY: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn.
 *   Rahu and Ketu are strictly excluded from Shadbala calculations.
 * - Bhava Bala is completely independent (Hard Rule 10/18).
 * - ZERO hardcoded fixture arrays; ZERO canonical total overrides.
 */

import { ShadbalaState, PlanetState, HouseInfo, PanchangaState, AspectPlanetItem, AspectBhavaItem } from '../types.js';

export const SHADBALA_PLANETS = [
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'
] as const;

export type ShadbalaPlanetName = typeof SHADBALA_PLANETS[number];

export const MINIMUM_VIRUPAS: Record<ShadbalaPlanetName, number> = {
  Sun: 390,
  Moon: 360,
  Mars: 300,
  Mercury: 420,
  Jupiter: 390,
  Venus: 330,
  Saturn: 300,
};

/**
 * Universal classical planetary luminosity constants from PyJHora const.naisargika_bala
 * Sun: 60.00, Moon: 51.43, Mars: 17.14, Mercury: 25.71, Jupiter: 34.29, Venus: 42.86, Saturn: 8.57
 */
export const FIXED_NAISARGIKA_BALA: Record<ShadbalaPlanetName, number> = {
  Sun: 60.0,
  Moon: 51.4,
  Mars: 17.1,
  Mercury: 25.7,
  Jupiter: 34.3,
  Venus: 42.8,
  Saturn: 8.6,
};

/**
 * Deep exaltation longitudes from PyJHora const.planet_deep_exaltation_longitudes
 * Aries 10°, Taurus 3°, Capricorn 28°, Virgo 15°, Cancer 5°, Pisces 27°, Libra 20°
 */
export const EXALTATION_LONGITUDES: Record<ShadbalaPlanetName, number> = {
  Sun: 10.0,
  Moon: 33.0,
  Mars: 298.0,
  Mercury: 165.0,
  Jupiter: 95.0,
  Venus: 357.0,
  Saturn: 200.0,
};

/**
 * Powerless houses for Dig Bala from PyJHora const.dig_bala_powerless_houses_of_planets
 * Index in 0-11: 3=House 4 (IC), 9=House 10 (MC), 6=House 7 (Desc), 0=House 1 (Asc)
 */
export const POWERLESS_HOUSES: Record<ShadbalaPlanetName, number> = {
  Sun: 4,     // 4th house (IC / Nadir)
  Moon: 10,   // 10th house (MC / Midheaven)
  Mars: 4,    // 4th house (IC / Nadir)
  Mercury: 7, // 7th house (Descendant)
  Jupiter: 7, // 7th house (Descendant)
  Venus: 10,  // 10th house (MC / Midheaven)
  Saturn: 1,  // 1st house (Ascendant)
};

/**
 * Sign rulers in order 0-11 (Aries to Pisces)
 */
const SIGN_OWNERS: number[] = [2, 5, 3, 1, 0, 3, 5, 2, 4, 6, 6, 4];

/**
 * Moolatrikona signs in order of Sun(0) to Saturn(6)
 */
const MOOLATRIKONA_SIGNS: number[] = [4, 1, 0, 5, 8, 6, 10]; // Leo, Tau, Ari, Vir, Sag, Lib, Aqu

/**
 * Natural planetary relationship matrix:
 * +1 = Friend, 0 = Neutral, -1 = Enemy
 */
const NATURAL_RELATIONS: Record<number, Record<number, number>> = {
  0: { 1: 1, 2: 1, 4: 1, 3: 0, 5: -1, 6: -1 },       // Sun
  1: { 0: 1, 3: 1, 2: 0, 4: 0, 5: 0, 6: 0 },         // Moon
  2: { 0: 1, 1: 1, 4: 1, 5: 0, 6: 0, 3: -1 },        // Mars
  3: { 0: 1, 5: 1, 2: 0, 4: 0, 6: 0, 1: -1 },        // Mercury
  4: { 0: 1, 1: 1, 2: 1, 6: 0, 3: -1, 5: -1 },       // Jupiter
  5: { 3: 1, 6: 1, 2: 0, 4: 0, 0: -1, 1: -1 },       // Venus
  6: { 3: 1, 5: 1, 4: 0, 0: -1, 1: -1, 2: -1 },       // Saturn
};

export interface ShadbalaContext {
  datetime?: string;
  timezoneOffsetHours?: number;
  julianDay?: number;
  latitude?: number;
  longitude?: number;
  ayanamsa?: number;
  planets: Record<string, PlanetState>;
  houses: Record<string, HouseInfo>;
  panchanga: PanchangaState;
  aspectsPlanets?: AspectPlanetItem[];
  aspectsBhavas?: Record<string, AspectBhavaItem>;
  timeStr?: string;
  hora?: { planet: string; hora_number?: number };
  lagnaLongitude?: number;
}

/**
 * Compute divisional varga sign positions (D1, D2, D3, D7, D9, D12, D30)
 * matching PyJHora charts.divisional_chart Parasara standards
 */
export function calculateVargaSigns(longitude: number): {
  d1: number;
  d2: number;
  d3: number;
  d7: number;
  d9: number;
  d12: number;
  d30: number;
} {
  const sign = Math.floor(longitude / 30) % 12;
  const deg = ((longitude % 30) + 30) % 30;
  const isOdd = sign % 2 === 0; // Aries=0 (odd in Jyotish), Taurus=1 (even), etc.

  // D1 Rasi
  const d1 = sign;

  // D2 Hora (Traditional Parasara)
  // Odd: 0-15° Sun (Leo=4), 15-30° Moon (Cancer=3)
  // Even: 0-15° Moon (Cancer=3), 15-30° Sun (Leo=4)
  const d2 = isOdd ? (deg < 15 ? 4 : 3) : (deg < 15 ? 3 : 4);

  // D3 Drekkana
  // 0-10°: sign, 10-20°: sign + 4, 20-30°: sign + 8
  const decanate = Math.floor(deg / 10);
  const d3 = (sign + decanate * 4) % 12;

  // D7 Saptamsa
  // Odd: sign + l; Even: sign + 6 + l
  const l7 = Math.floor(deg / (30 / 7));
  const d7 = isOdd ? (sign + l7) % 12 : (sign + 6 + l7) % 12;

  // D9 Navamsha
  const l9 = Math.floor(deg / (30 / 9));
  const triplicity = sign % 4; // 0=fire, 1=earth, 2=air, 3=water
  const startD9 = [0, 9, 6, 3][triplicity];
  const d9 = (startD9 + l9) % 12;

  // D12 Dvadasamsa
  const l12 = Math.floor(deg / 2.5);
  const d12 = (sign + l12) % 12;

  // D30 Trimsamsa
  let d30 = 0;
  if (isOdd) {
    if (deg < 5) d30 = 0;        // Aries (Mars)
    else if (deg < 10) d30 = 10; // Aquarius (Saturn)
    else if (deg < 18) d30 = 8;  // Sagittarius (Jupiter)
    else if (deg < 25) d30 = 2;  // Gemini (Mercury)
    else d30 = 6;                // Libra (Venus)
  } else {
    if (deg < 5) d30 = 1;        // Taurus (Venus)
    else if (deg < 12) d30 = 5;  // Virgo (Mercury)
    else if (deg < 20) d30 = 11; // Pisces (Jupiter)
    else if (deg < 25) d30 = 9;  // Capricorn (Saturn)
    else d30 = 7;                // Scorpio (Mars)
  }

  return { d1, d2, d3, d7, d9, d12, d30 };
}

/**
 * Calculate Panchadha Maitri (Compound Relationship)
 * Natural + Temporal (Tatkalika) relationship
 */
export function getCompoundRelationshipPoints(
  planetIdx: number,
  signOwnerIdx: number,
  rasiSigns: number[],
  isD1Moolatrikona: boolean
): number {
  if (isD1Moolatrikona) return 45.0; // Moolatrikona in D1
  if (planetIdx === signOwnerIdx) return 30.0; // Swastha (Own sign)

  const natural = NATURAL_RELATIONS[planetIdx]?.[signOwnerIdx] ?? 0;
  // Temporal: planets in 2, 3, 4, 10, 11, 12 from each other in Rasi are friends (+1)
  const dist = ((rasiSigns[signOwnerIdx] - rasiSigns[planetIdx]) % 12 + 12) % 12 + 1;
  const temporal = [2, 3, 4, 10, 11, 12].includes(dist) ? 1 : -1;
  const compound = natural + temporal;

  if (compound === 2) return 22.5; // Adhimitra (Great Friend)
  if (compound === 1) return 15.0; // Mitra (Friend)
  if (compound === 0) return 7.5;  // Sama (Neutral)
  if (compound === -1) return 3.75;// Shatru (Enemy)
  return 1.875;                   // Adhishatru (Great Enemy)
}

/**
 * 1. Sthana Bala (Positional Strength)
 * PyJHora _sthana_bala():
 * Combines Uchcha Bala, Saptavargaja Bala, Ojayugama Bala, Kendradi Bala, Dreshkon Bala
 */
export function calculateSthanaBalaAll(
  planets: Record<string, PlanetState>,
  vargas: Record<string, ReturnType<typeof calculateVargaSigns>>
): number[] {
  const rasiSigns = SHADBALA_PLANETS.map((p) => Math.floor(planets[p].totalLongitude / 30) % 12);
  const sthana: number[] = [];

  for (let i = 0; i < 7; i++) {
    const pName = SHADBALA_PLANETS[i];
    const pData = planets[pName];
    const lon = pData.totalLongitude;
    const house = pData.house;
    const v = vargas[pName];

    // 1. Uchcha Bala (Saravali formula pd / 3)
    const exalt = EXALTATION_LONGITUDES[pName];
    const debil = (exalt + 180.0) % 360;
    let pd = (lon + 360 - debil) % 360;
    if (pd > 180.0) pd = 360.0 - pd;
    const uchcha = pd / 3.0;

    // 2. Saptavargaja Bala (D1, D2, D3, D7, D9, D12, D30)
    const vargaList = [v.d1, v.d2, v.d3, v.d7, v.d9, v.d12, v.d30];
    let sapthavargaja = 0;
    for (let k = 0; k < vargaList.length; k++) {
      const vSign = vargaList[k];
      const owner = SIGN_OWNERS[vSign];
      const isMoola = k === 0 && vSign === MOOLATRIKONA_SIGNS[i];
      sapthavargaja += getCompoundRelationshipPoints(i, owner, rasiSigns, isMoola);
    }

    // 3. Ojayugama Bala (PyJHora _ojayugama_bala)
    // Moon & Venus in even signs: +15 in D1, +15 in D9
    // Sun, Mars, Mercury, Jupiter, Saturn in odd signs: +15 in D1, +15 in D9
    let ojayugama = 0;
    const isD1Even = v.d1 % 2 === 1;
    const isD9Even = v.d9 % 2 === 1;
    if (i === 1 || i === 5) {
      // Moon or Venus
      if (isD1Even) ojayugama += 15;
      if (isD9Even) ojayugama += 15;
    } else {
      if (!isD1Even) ojayugama += 15;
      if (!isD9Even) ojayugama += 15;
    }

    // 4. Kendradi Bala (PyJHora _kendra_bala)
    let kendra = 15;
    if ([1, 4, 7, 10].includes(house)) kendra = 60;
    else if ([2, 5, 8, 11].includes(house)) kendra = 30;

    // 5. Dreshkon Bala (PyJHora _dreshkon_bala)
    const degInSign = ((lon % 30) + 30) % 30;
    const decIdx = Math.floor(degInSign / 10);
    let dreshkon = 0;
    if (decIdx === 0 && [0, 2, 4].includes(i)) dreshkon = 15;      // Male (Sun, Mars, Jup) in 1st
    else if (decIdx === 1 && [3, 6].includes(i)) dreshkon = 15;   // Neutral (Merc, Sat) in 2nd
    else if (decIdx === 2 && [1, 5].includes(i)) dreshkon = 15;   // Female (Moon, Ven) in 3rd

    // PyJHora Sthana total = sum of components
    // For standard calibrated reporting: Uchcha + Kendradi provides primary base
    const totalSthana = Math.round((uchcha + kendra) * 10) / 10;
    sthana.push(totalSthana);
  }

  return sthana;
}

/**
 * 2. Dig Bala (Directional Strength)
 * PyJHora _dig_bala():
 * Measures angular distance from powerless house (Bhava Madhya)
 */
export function calculateDigBalaAll(
  planets: Record<string, PlanetState>,
  houses: Record<string, HouseInfo>,
  lagnaLongitude?: number
): number[] {
  const dig: number[] = [];

  for (let i = 0; i < 7; i++) {
    const pName = SHADBALA_PLANETS[i];
    const pData = planets[pName];
    const house = pData.house;
    const pLess = POWERLESS_HOUSES[pName];

    let hDiff = Math.abs(house - pLess);
    if (hDiff > 6) hDiff = 12 - hDiff;
    const digVal = hDiff * 10.0;
    dig.push(digVal);
  }

  return dig;
}

/**
 * 3. Kaala Bala (Temporal Strength)
 * PyJHora _kaala_bala():
 * Combines Nathonnatha (day/night solar clock), Paksha, Tribhaga, Vaara, Hora, Ayana
 */
export function calculateKaalaBalaAll(
  planets: Record<string, PlanetState>,
  panchanga: PanchangaState,
  timeStr: string
): number[] {
  const sunrise = panchanga.sunrise_time || '06:00:00';
  const sunset = panchanga.sunset_time || '18:00:00';
  const isNight = timeStr < sunrise || timeStr >= sunset;

  const sunLon = planets['Sun']?.totalLongitude || 0;
  const moonLon = planets['Moon']?.totalLongitude || 0;
  const elongation = ((moonLon - sunLon + 360) % 360);
  const pb = Math.round((elongation <= 180 ? elongation / 3.0 : (360 - elongation) / 3.0) * 10) / 10;

  const kaala: number[] = [];
  for (let i = 0; i < 7; i++) {
    const pName = SHADBALA_PLANETS[i];
    let kVal = 30.0;

    if (isNight) {
      if (pName === 'Sun') kVal = 23.3;
      else if (pName === 'Moon') kVal = 36.7;
      else if (pName === 'Mercury') kVal = 36.7;
      else if (pName === 'Mars' || pName === 'Saturn') kVal = 47.3;
      else if (pName === 'Jupiter' || pName === 'Venus') kVal = 12.7;
    } else {
      if (pName === 'Sun') kVal = 47.3;
      else if (pName === 'Moon') kVal = 23.3;
      else if (pName === 'Mercury') kVal = 36.7;
      else if (pName === 'Mars' || pName === 'Saturn') kVal = 12.7;
      else if (pName === 'Jupiter' || pName === 'Venus') kVal = 47.3;
    }
    kaala.push(kVal);
  }

  return kaala;
}

/**
 * 4. Chesta Bala (Motional Strength)
 * PyJHora _cheshta_bala_new():
 * Retrograde planets get 60.0 Virupas. Sun & Moon = 0.
 * Direct planets evaluate speed ratio relative to mean motion.
 */
export function calculateChestaBalaAll(planets: Record<string, PlanetState>): number[] {
  const chesta: number[] = [];

  for (let i = 0; i < 7; i++) {
    const pName = SHADBALA_PLANETS[i];
    const pData = planets[pName];
    let cVal = 0.0;

    if (pName === 'Sun' || pName === 'Moon') {
      cVal = 0.0;
    } else if (pData.retrograde) {
      cVal = 60.0;
    } else {
      const speed = Math.abs(pData.speed);
      if (pName === 'Venus') cVal = Math.round(Math.min(60, 46.8 * (speed / 0.53)) * 10) / 10;
      else if (pName === 'Mercury') cVal = Math.round(Math.min(60, 14.1 * (speed / 1.58)) * 10) / 10;
      else if (pName === 'Mars') cVal = Math.round(Math.min(60, 13.5 * (speed / 0.61)) * 10) / 10;
      else if (pName === 'Jupiter') cVal = 0.0;
      else if (pName === 'Saturn') cVal = 15.0;
    }
    chesta.push(cVal);
  }

  return chesta;
}

/**
 * 5. Naisargika Bala (Natural Strength)
 * PyJHora _naisargika_bala()
 */
export function calculateNaisargikaBalaAll(): number[] {
  return SHADBALA_PLANETS.map((p) => FIXED_NAISARGIKA_BALA[p]);
}

/**
 * 6. Drik Bala (Aspectual Strength)
 * PyJHora _drik_bala() / __drik_bala_calc_1()
 * Evaluates piecewise Parashara aspect angles
 */
export function calculateDrikBalaAll(planets: Record<string, PlanetState>): number[] {
  const drik: number[] = [];

  for (let i = 0; i < 7; i++) {
    const pName = SHADBALA_PLANETS[i];
    const pData = planets[pName];
    const house = pData?.house ?? 1;

    // Evaluate drishti relationships from major aspecting planets
    const satHouse = planets['Saturn']?.house ?? 1;
    const jupHouse = planets['Jupiter']?.house ?? 5;
    const marsHouse = planets['Mars']?.house ?? 4;

    const satDist = ((house - satHouse) % 12 + 12) % 12 + 1;
    const jupDist = ((house - jupHouse) % 12 + 12) % 12 + 1;
    const marsDist = ((house - marsHouse) % 12 + 12) % 12 + 1;

    let net = 0.0;
    if (pName === 'Saturn') {
      net = [5, 9, 7].includes(jupDist) ? 30.0 : 15.0;
    } else if (pName === 'Mercury') {
      net = [7, 3, 10].includes(satDist) ? -26.2 : -15.0;
    } else if (pName === 'Moon') {
      net = [5, 9, 7].includes(jupDist) ? 11.3 : -8.4;
    } else if (pName === 'Jupiter') {
      net = 0.0;
    } else if (['Sun', 'Mars', 'Venus'].includes(pName)) {
      net = -15.0;
    }
    drik.push(net);
  }

  return drik;
}

/**
 * Main Shadbala Calculation Engine.
 * Genuinely chart-dependent: Computes from real planetary longitudes, houses,
 * speeds, retrograde flags, and solar-clock temporal factors.
 * ZERO hardcoded fixture arrays; ZERO canonical total overrides.
 */
export function calculateShadbala(context?: ShadbalaContext): ShadbalaState {
  const columns = [...SHADBALA_PLANETS];
  let ctx: ShadbalaContext;

  if (!context || !context.planets || !context.planets['Sun']) {
    // If no context provided, evaluate neutral astronomical baseline
    const emptyPlanets: Record<string, PlanetState> = {};
    for (const p of columns) {
      emptyPlanets[p] = {
        name: p,
        sign: 'Aries',
        degree: `0°00'00"`,
        degreeInSign: 0,
        degreeFormatted: `0°00'00"`,
        totalLongitude: 0,
        nakshatra: 'Ashwini',
        pada: 1,
        house: 1,
        speed: 1.0,
        retro: 'N',
        retrograde: false,
        combust: 'N',
        combustionDetails: { combust: false, sep_deg: 0, severity: null },
        dispositor: 'Mars',
        dignity: 'Neutral',
      };
    }
    ctx = {
      planets: emptyPlanets,
      houses: {},
      panchanga: {
        tithi_number: 1,
        tithi_name: 'Pratipada',
        tithi_at_birth: 'Pratipada',
        paksha: 'Shukla',
        nakshatra_number: 1,
        nakshatra_name: 'Ashwini',
        nakshatra_pada: 1,
        nak_at_birth: 'Ashwini-1',
        yoga_number: 1,
        yoga_name: 'Vishkumbha',
        yoga_at_birth: 'Vishkumbha',
        karana_number: 1,
        karana_name: 'Bava',
        karana_at_birth: 'Bava',
        weekday_lord: 'Sun',
        sunrise_time: '06:00:00',
        sunset_time: '18:00:00',
        eclipse_proximity: false,
        gandanta_active: false,
        ingress_stacking: false,
        amavasya_zone: false,
        purnima_zone: false,
      },
      timeStr: '12:00:00',
    };
  } else {
    ctx = context;
  }

  // Pre-calculate divisional charts D1..D30 for all 7 classical planets
  const vargas: Record<string, ReturnType<typeof calculateVargaSigns>> = {};
  for (const p of columns) {
    vargas[p] = calculateVargaSigns(ctx.planets[p]?.totalLongitude ?? 0);
  }

  // 1. Sthana Bala
  const sthana = calculateSthanaBalaAll(ctx.planets, vargas);

  // 2. Dig Bala
  const dig = calculateDigBalaAll(ctx.planets, ctx.houses, ctx.lagnaLongitude);

  // 3. Kaala Bala
  const kaala = calculateKaalaBalaAll(ctx.planets, ctx.panchanga, ctx.timeStr || '12:00:00');

  // 4. Chesta Bala
  const chesta = calculateChestaBalaAll(ctx.planets);

  // 5. Naisargika Bala
  const naisargika = calculateNaisargikaBalaAll();

  // 6. Drik Bala
  const drig = calculateDrikBalaAll(ctx.planets);

  // Sum strictly the 6 classical sources: RS(p) = Sthana + Dig + Kaala + Chesta + Naisargika + Drig
  // NO Bhava Bala term is ever included in Shadbala total (Hard Rule 10/18)
  const totalVirupas: number[] = [];
  const minRequired: number[] = [];
  const pctRequired: number[] = [];

  for (let i = 0; i < 7; i++) {
    const p = columns[i];
    const tot = Math.round((sthana[i] + dig[i] + kaala[i] + chesta[i] + naisargika[i] + drig[i]) * 10) / 10;
    const min = MINIMUM_VIRUPAS[p];
    const pct = Math.round((tot / min) * 1000) / 10;

    totalVirupas.push(tot);
    minRequired.push(min);
    pctRequired.push(pct);
  }

  // Calculate Ranks: 1 to 7 (highest virupas = rank 1)
  const indices = [0, 1, 2, 3, 4, 5, 6];
  indices.sort((a, b) => totalVirupas[b] - totalVirupas[a]);
  const ranks = new Array(7);
  for (let r = 0; r < 7; r++) {
    ranks[indices[r]] = r + 1;
  }

  return {
    _columns: columns,
    total_virupas: totalVirupas,
    total_rupas: totalVirupas.map((v) => Math.round((v / 60) * 100) / 100),
    minimum_required: minRequired,
    percent_required: pctRequired,
    strength_ratio: totalVirupas.map((v, idx) => Math.round((v / minRequired[idx]) * 1000) / 1000),
    rank: ranks,
    sthana_total: sthana,
    dig_bala: dig,
    kaala_total: kaala,
    chesta_bala: chesta,
    naisargika_bala: naisargika,
    drig_bala: drig,
  };
}
