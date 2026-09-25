/**
 * DSSME EVENT ENGINE V1.0 - Authoritative Lottery Draw Schedule
 * Fixed canonical configuration values for Chofu, Yangon AM/PM, and Bangkok PM.
 * Local civil times in IANA timezones; never inferred or altered by browser timezone.
 */

import { DSSMEEventInput } from '../types.js';
import { parseTimezoneOffset } from '../astronomy/ephemeris.js';

export interface LotteryDrawTimeConfig {
  id: string;
  location: string;
  country: string;
  timezone: string; // IANA timezone identifier
  session: 'AM' | 'PM' | 'REFERENCE';
  hour: number;
  minute: number;
  label: string;
  latitude: number;
  longitude: number;
  abbreviation: string;
}

export const LOTTERY_DRAW_TIMES: LotteryDrawTimeConfig[] = [
  {
    id: 'chofu-japan',
    location: 'Chofu',
    country: 'Japan',
    timezone: 'Asia/Tokyo',
    session: 'REFERENCE',
    hour: 18,
    minute: 50,
    label: 'Chofu 18:50',
    latitude: 35.6528,
    longitude: 139.5447,
    abbreviation: 'JST',
  },
  {
    id: 'yangon-am',
    location: 'Yangon',
    country: 'Myanmar',
    timezone: 'Asia/Yangon',
    session: 'AM',
    hour: 12,
    minute: 1,
    label: 'Yangon AM 12:01',
    latitude: 16.8661,
    longitude: 96.1951,
    abbreviation: 'MMT',
  },
  {
    id: 'yangon-pm',
    location: 'Yangon',
    country: 'Myanmar',
    timezone: 'Asia/Yangon',
    session: 'PM',
    hour: 16,
    minute: 10,
    label: 'Yangon PM 16:10',
    latitude: 16.8661,
    longitude: 96.1951,
    abbreviation: 'MMT',
  },
  {
    id: 'bangkok-pm',
    location: 'Bangkok',
    country: 'Thailand',
    timezone: 'Asia/Bangkok',
    session: 'PM',
    hour: 15,
    minute: 45,
    label: 'Bangkok PM 15:45',
    latitude: 13.7563,
    longitude: 100.5018,
    abbreviation: 'ICT',
  },
];

/**
 * Returns canonical draw config by ID.
 */
export function getDrawTimeConfigById(id: string): LotteryDrawTimeConfig | undefined {
  return LOTTERY_DRAW_TIMES.find((d) => d.id === id);
}

/**
 * Formatted draw time string "HH:mm".
 */
export function getDrawTimeString(config: LotteryDrawTimeConfig): string {
  const h = String(config.hour).padStart(2, '0');
  const m = String(config.minute).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Deterministic calculation identifier: "YYYY-MM-DD:<id>".
 * e.g. "2026-09-25:yangon-am"
 */
export function getDrawCalculationId(config: LotteryDrawTimeConfig, dateStr: string): string {
  return `${dateStr}:${config.id}`;
}

/**
 * Resolves local date + local draw time into deterministic UTC ISO string.
 * Never relies on browser timezone.
 */
export function getDrawUtcInstant(config: LotteryDrawTimeConfig, dateStr: string): string {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const offsetHours = parseTimezoneOffset(config.timezone);
  const offsetMs = Math.round(offsetHours * 3600 * 1000);

  // UTC ms = local civil time ms minus timezone offset ms
  const localUtcMs = Date.UTC(year, month - 1, day, config.hour, config.minute, 0, 0) - offsetMs;
  return new Date(localUtcMs).toISOString();
}

/**
 * Creates canonical DSSME input for a lottery draw.
 */
export function createDrawEventInput(config: LotteryDrawTimeConfig, dateStr: string): DSSMEEventInput {
  const timeFormatted = `${getDrawTimeString(config)}:00`;
  return {
    datetime: `${dateStr} ${timeFormatted}`,
    timezone: config.timezone,
    location: {
      latitude: config.latitude,
      longitude: config.longitude,
      city: config.location,
      country: config.country,
    },
    ayanamsa: 'Lahiri',
  };
}
