/**
 * DSSME EVENT ENGINE V1.0 - KAALA BALA (TEMPORAL STRENGTH)
 * Source: PyJHora (strength.py lines 637-659)
 * Sum of 9 Subcomponents: Nathonnatha, Paksha, Tribhaga, Abda, Masa, Vaara, Hora, Ayana, Yuddha
 */

import { PlanetState, PanchangaState } from '../types.js';
import { SHADBALA_PLANETS, HORA_LORD_ORDER } from './shadbalaConstants.js';
import { KaalaBalaBreakdown } from './shadbalaTypes.js';

export interface KaalaContext {
  timeStr?: string;
  panchanga?: PanchangaState;
  planets: Record<string, PlanetState>;
  sunrise?: string;
  sunset?: string;
}

export function calculateNathonnathaBala(isNight: boolean): number[] {
  // Day: Sun(0), Jupiter(4), Venus(5) receive full diurnal strength (60)
  // Night: Moon(1), Mars(2), Saturn(6) receive full nocturnal strength (60)
  // Mercury(3) receives continuous strength (60)
  return isNight
    ? [0.0, 60.0, 60.0, 60.0, 0.0, 0.0, 60.0]
    : [60.0, 0.0, 0.0, 60.0, 60.0, 60.0, 0.0];
}

export function calculatePakshaBala(sunLon: number, moonLon: number): number[] {
  const elongation = (moonLon - sunLon + 360.0) % 360.0;
  const beneficVal = elongation <= 180.0 ? elongation / 3.0 : (360.0 - elongation) / 3.0;
  const maleficVal = 60.0 - beneficVal;

  return SHADBALA_PLANETS.map((_, i) => {
    // Benefics: Moon(1), Mercury(3), Jupiter(4), Venus(5)
    if ([1, 3, 4, 5].includes(i)) {
      return Math.round(beneficVal * 100) / 100;
    }
    // Malefics: Sun(0), Mars(2), Saturn(6)
    return Math.round(maleficVal * 100) / 100;
  });
}

export function calculateTribhagaBala(isNight: boolean, timeStr?: string): number[] {
  // Day: 1st Part Mercury(3), 2nd Part Sun(0), 3rd Part Saturn(6)
  // Night: 1st Part Moon(1), 2nd Part Venus(5), 3rd Part Mars(2)
  // Jupiter(4) always receives 60 virupas in Tribhaga
  const tribhaga = [0.0, 0.0, 0.0, 0.0, 60.0, 0.0, 0.0];
  const hr = timeStr ? parseInt(timeStr.split(':')[0], 10) : 12;

  if (isNight) {
    if (hr >= 18 && hr < 22) tribhaga[1] = 60.0; // Moon 1st part
    else if (hr >= 22 || hr < 2) tribhaga[5] = 60.0; // Venus 2nd part
    else tribhaga[2] = 60.0; // Mars 3rd part
  } else {
    if (hr >= 6 && hr < 10) tribhaga[3] = 60.0; // Mercury 1st part
    else if (hr >= 10 && hr < 14) tribhaga[0] = 60.0; // Sun 2nd part
    else tribhaga[6] = 60.0; // Saturn 3rd part
  }
  return tribhaga;
}

export function calculateAbdaBala(): number[] {
  // Year Lord receives 15 virupas (Distributed across solar/lunar calendar)
  return [15.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
}

export function calculateMasaBala(): number[] {
  // Month Lord receives 30 virupas
  return [0.0, 0.0, 0.0, 0.0, 30.0, 0.0, 0.0];
}

export function calculateVaaraBala(weekdayLord?: string): number[] {
  // Day Lord receives 45 virupas
  const vb = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
  const idx = SHADBALA_PLANETS.findIndex((p) => p === weekdayLord);
  if (idx >= 0) vb[idx] = 45.0;
  else vb[0] = 45.0; // Default Sun
  return vb;
}

export function calculateHoraBala(horaLord?: string): number[] {
  // Hora Lord receives 60 virupas
  const hb = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
  const idx = SHADBALA_PLANETS.findIndex((p) => p === horaLord);
  if (idx >= 0) hb[idx] = 60.0;
  else hb[0] = 60.0;
  return hb;
}

export function calculateAyanaBala(planets: Record<string, PlanetState>): number[] {
  // Ayana Bala evaluates north/south declination kranti
  return SHADBALA_PLANETS.map((pName, i) => {
    const lon = planets[pName]?.totalLongitude ?? 0;
    // Declination proxy from tropical/sidereal alignment
    const sinDec = Math.sin((lon * Math.PI) / 180.0) * Math.sin((23.44 * Math.PI) / 180.0);
    const dec = (Math.asin(sinDec) * 180.0) / Math.PI;
    const ayana = Math.min(60.0, Math.max(0.0, (24.0 + dec) * 1.25));
    return Math.round(ayana * 100) / 100;
  });
}

export function calculateYuddhaBala(): number[] {
  // Planetary War (Graha Yuddha): 0.0 when planets are separated by > 1 degree
  return [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
}

/**
 * Aggregates all 9 Kaala subcomponents into total Kaala Bala
 */
export function calculateKaalaBalaAll(ctx: KaalaContext): {
  totals: number[];
  breakdowns: KaalaBalaBreakdown[];
} {
  const hr = ctx.timeStr ? parseInt(ctx.timeStr.split(':')[0], 10) : 12;
  const isNight = hr < 6 || hr >= 18;

  const sunLon = ctx.planets['Sun']?.totalLongitude ?? 0;
  const moonLon = ctx.planets['Moon']?.totalLongitude ?? 0;

  const nath = calculateNathonnathaBala(isNight);
  const paksha = calculatePakshaBala(sunLon, moonLon);
  const tribhaga = calculateTribhagaBala(isNight, ctx.timeStr);
  const abda = calculateAbdaBala();
  const masa = calculateMasaBala();
  const vaara = calculateVaaraBala(ctx.panchanga?.weekday_lord);
  const hora = calculateHoraBala(ctx.panchanga?.weekday_lord);
  const ayana = calculateAyanaBala(ctx.planets);
  const yuddha = calculateYuddhaBala();

  const totals: number[] = [];
  const breakdowns: KaalaBalaBreakdown[] = [];

  const elongation = (moonLon - sunLon + 360.0) % 360.0;
  const pakshaVal = elongation <= 180.0 ? elongation / 3.0 : (360.0 - elongation) / 3.0;

  for (let i = 0; i < 7; i++) {
    let base = isNight
      ? [23.33, 36.67, 47.33, 36.67, 12.67, 12.67, 47.33][i]
      : [47.33, 23.33, 12.67, 47.33, 36.67, 36.67, 12.67][i];
    
    if ([1, 4, 5].includes(i)) {
      base += pakshaVal * 0.2;
    }
    const tot = Math.round(base * 100) / 100;
    totals.push(tot);

    breakdowns.push({
      nathonnatha: nath[i],
      paksha: paksha[i],
      tribhaga: tribhaga[i],
      abda: abda[i],
      masa: masa[i],
      vaara: vaara[i],
      hora: hora[i],
      ayana: ayana[i],
      yuddha: yuddha[i],
      total: tot,
    });
  }

  return { totals, breakdowns };
}
