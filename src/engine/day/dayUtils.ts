/**
 * DSSME EVENT ENGINE V1.0 - Daily Calculation Utilities
 * Timezone normalization, boundary calculations, and deterministic keys.
 */

import { parseTimezoneOffset } from '../astronomy/ephemeris.js';
import { DayContext, DailyStepDefinition } from './dayTypes.js';

export const ENGINE_VERSION = 'DSSME-Universal-1.4';
export const SCHEMA_VERSION = 'v1.4';
export const EPHEMERIS_VERSION = 'SwissEph-WASM-2.10.03';
export const DEFAULT_TIMEZONE = 'Asia/Yangon';
export const DEFAULT_LOCATION = {
  latitude: 16.8661,
  longitude: 96.1951,
  city: 'Yangon',
  country: 'Myanmar',
};

/**
 * Derives authoritative local calendar date (YYYY-MM-DD) for configured timezone.
 * Never defaults to browser local or server local timezone.
 */
export function getLocalCalendarDate(timezone: string = DEFAULT_TIMEZONE, now: Date = new Date()): string {
  try {
    const tzClean = timezone.includes('/') ? timezone : (timezone.includes('Yangon') ? 'Asia/Yangon' : timezone);
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tzClean,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(now); // Outputs 'YYYY-MM-DD'
  } catch {
    // Offset-based fallback (e.g. UTC+06:30, +06:30)
    const offsetHours = parseTimezoneOffset(timezone);
    const targetMs = now.getTime() + offsetHours * 3600 * 1000;
    const targetDate = new Date(targetMs);
    const y = targetDate.getUTCFullYear();
    const m = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(targetDate.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

/**
 * Converts local calendar day boundaries into exact UTC ISO strings.
 * e.g. 2026-09-25 in Asia/Yangon (+06:30)
 * Local Start: 2026-09-25 00:00:00 -> UTC 2026-09-24T17:30:00.000Z
 * Local End:   2026-09-25 23:59:59.999 -> UTC 2026-09-25T17:29:59.999Z
 */
export function computeLocalDayUtcBoundaries(
  dateStr: string,
  timezone: string = DEFAULT_TIMEZONE
): {
  localStart: string;
  localEnd: string;
  utcStart: string;
  utcEnd: string;
  boundarySampleLocal: string;
  boundarySampleUtc: string;
} {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const offsetHours = parseTimezoneOffset(timezone);
  const offsetMs = Math.round(offsetHours * 3600 * 1000);

  // Local start: midnight 00:00:00.000
  const localStartUtcMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0) - offsetMs;
  const utcStart = new Date(localStartUtcMs).toISOString();

  // Local end: 23:59:59.999
  const localEndUtcMs = Date.UTC(year, month - 1, day, 23, 59, 59, 999) - offsetMs;
  const utcEnd = new Date(localEndUtcMs).toISOString();

  // Boundary sample: 1 minute before local midnight (23:59:00 of previous day)
  const boundarySampleUtcMs = localStartUtcMs - 60 * 1000;
  const boundarySampleUtc = new Date(boundarySampleUtcMs).toISOString();

  // Compute local string for boundary sample
  const prevDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - 24 * 3600 * 1000);
  const py = prevDate.getUTCFullYear();
  const pm = String(prevDate.getUTCMonth() + 1).padStart(2, '0');
  const pd = String(prevDate.getUTCDate()).padStart(2, '0');
  const boundarySampleLocal = `${py}-${pm}-${pd} 23:59:00`;

  return {
    localStart: `${dateStr} 00:00:00`,
    localEnd: `${dateStr} 23:59:59`,
    utcStart,
    utcEnd,
    boundarySampleLocal,
    boundarySampleUtc,
  };
}

/**
 * Creates step definitions across the 24-hour day range (e.g. 15m, 30m, or 60m steps).
 */
export function generateDailyStepGrid(
  dateStr: string,
  timezone: string = DEFAULT_TIMEZONE,
  stepMinutes: number = 60
): DailyStepDefinition[] {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const offsetHours = parseTimezoneOffset(timezone);
  const offsetMs = Math.round(offsetHours * 3600 * 1000);

  const totalMinutes = 24 * 60;
  const stepCount = Math.floor(totalMinutes / stepMinutes);
  const steps: DailyStepDefinition[] = [];

  for (let i = 0; i <= stepCount; i++) {
    const minuteOffset = i * stepMinutes;
    const hours = Math.floor(minuteOffset / 60);
    const mins = minuteOffset % 60;

    // Handle end-of-day step (24:00 is represented as 23:59:59 for practical calculation)
    let localHours = hours;
    let localMins = mins;
    let localSecs = 0;

    if (hours === 24) {
      localHours = 23;
      localMins = 59;
      localSecs = 59;
    }

    const localTime = `${dateStr} ${String(localHours).padStart(2, '0')}:${String(localMins).padStart(2, '0')}:${String(localSecs).padStart(2, '0')}`;
    const localUtcMs = Date.UTC(year, month - 1, day, localHours, localMins, localSecs, 0) - offsetMs;
    const utcTime = new Date(localUtcMs).toISOString();

    steps.push({
      index: i,
      totalSteps: stepCount + 1,
      localTime,
      utcTime,
      stepMinutes,
    });
  }

  return steps;
}

/**
 * Deterministic hash generator (MurmurHash-like 64-bit hex).
 */
export function simpleHash(input: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0');
}

/**
 * Generates deterministic configuration hash.
 */
export function computeConfigurationHash(
  ayanamsa: string,
  engineVersion: string,
  ephemerisVersion: string,
  extraConfig: Record<string, unknown> = {}
): string {
  const payload = JSON.stringify({
    ayanamsa,
    engineVersion,
    ephemerisVersion,
    extraConfig,
  });
  return simpleHash(payload);
}

/**
 * Generates canonical daily calculation key for idempotency and locking.
 */
export function generateDailyCalculationKey(
  calculationDate: string,
  timezone: string,
  latitude: number,
  longitude: number,
  ayanamsa: string,
  engineVersion: string,
  ephemerisVersion: string,
  configurationHash: string
): string {
  const normLat = latitude.toFixed(4);
  const normLon = longitude.toFixed(4);
  const rawKey = `${calculationDate}|${timezone}|${normLat}|${normLon}|${ayanamsa}|${engineVersion}|${ephemerisVersion}|${configurationHash}`;
  return `DAYKEY-${simpleHash(rawKey)}`;
}

/**
 * Builds canonical DayContext.
 */
export function buildDayContext(
  dateStr: string,
  timezone: string = DEFAULT_TIMEZONE,
  latitude: number = DEFAULT_LOCATION.latitude,
  longitude: number = DEFAULT_LOCATION.longitude,
  ayanamsa: string = 'Lahiri'
): DayContext {
  const boundaries = computeLocalDayUtcBoundaries(dateStr, timezone);
  const configHash = computeConfigurationHash(ayanamsa, ENGINE_VERSION, EPHEMERIS_VERSION);
  const calcId = `CALC-DAY-${dateStr.replace(/-/g, '')}-${simpleHash(timezone).slice(0, 6)}`;

  return {
    calculationDate: dateStr,
    timezone,
    utcStart: boundaries.utcStart,
    utcEnd: boundaries.utcEnd,
    latitude,
    longitude,
    ayanamsa,
    engineVersion: ENGINE_VERSION,
    schemaVersion: SCHEMA_VERSION,
    ephemerisVersion: EPHEMERIS_VERSION,
    configurationHash: configHash,
    calculationId: calcId,
  };
}
