/**
 * DSSME EVENT ENGINE V1.0 - Location Database & Geographic Resolver
 * Canonical country/state/city database with IANA timezones and DMS coordinate formatting.
 */

export interface CityLocation {
  name: string;
  latitude: number;
  longitude: number;
  timezone: string; // IANA identifier
}

export interface StateRegion {
  name: string;
  cities: CityLocation[];
}

export interface CountryLocation {
  name: string;
  code: string;
  aliases: string[];
  states: StateRegion[];
}

export const CANONICAL_COUNTRIES: CountryLocation[] = [
  {
    name: 'Burma',
    code: 'MM',
    aliases: ['Myanmar', 'Burma'],
    states: [
      {
        name: 'Yangon',
        cities: [
          { name: 'Yangon', latitude: 16.8661, longitude: 96.1951, timezone: 'Asia/Yangon' },
          { name: 'Insein', latitude: 16.8997, longitude: 96.0963, timezone: 'Asia/Yangon' },
          { name: 'Thanlyin', latitude: 16.7622, longitude: 96.2483, timezone: 'Asia/Yangon' },
        ],
      },
      {
        name: 'Mandalay',
        cities: [
          { name: 'Mandalay', latitude: 21.9588, longitude: 96.0891, timezone: 'Asia/Yangon' },
          { name: 'Pyin Oo Lwin', latitude: 22.0354, longitude: 96.4678, timezone: 'Asia/Yangon' },
          { name: 'Meiktila', latitude: 20.8787, longitude: 95.8617, timezone: 'Asia/Yangon' },
        ],
      },
      {
        name: 'Naypyidaw',
        cities: [
          { name: 'Naypyidaw', latitude: 19.7633, longitude: 96.0785, timezone: 'Asia/Yangon' },
        ],
      },
      {
        name: 'Bago',
        cities: [
          { name: 'Bago', latitude: 17.3352, longitude: 96.4814, timezone: 'Asia/Yangon' },
          { name: 'Taungoo', latitude: 18.9419, longitude: 96.4344, timezone: 'Asia/Yangon' },
        ],
      },
      {
        name: 'Shan',
        cities: [
          { name: 'Taunggyi', latitude: 20.7833, longitude: 97.0333, timezone: 'Asia/Yangon' },
          { name: 'Lashio', latitude: 22.9333, longitude: 97.7500, timezone: 'Asia/Yangon' },
        ],
      },
    ],
  },
  {
    name: 'Japan',
    code: 'JP',
    aliases: ['Japan', 'Nippon'],
    states: [
      {
        name: 'Tokyo',
        cities: [
          { name: 'Chofu', latitude: 35.6528, longitude: 139.5447, timezone: 'Asia/Tokyo' },
          { name: 'Tokyo', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' },
          { name: 'Shinjuku', latitude: 35.6938, longitude: 139.7034, timezone: 'Asia/Tokyo' },
        ],
      },
      {
        name: 'Osaka',
        cities: [
          { name: 'Osaka', latitude: 34.6937, longitude: 135.5023, timezone: 'Asia/Tokyo' },
        ],
      },
      {
        name: 'Kyoto',
        cities: [
          { name: 'Kyoto', latitude: 35.0116, longitude: 135.7681, timezone: 'Asia/Tokyo' },
        ],
      },
      {
        name: 'Kanagawa',
        cities: [
          { name: 'Yokohama', latitude: 35.4437, longitude: 139.6380, timezone: 'Asia/Tokyo' },
        ],
      },
    ],
  },
  {
    name: 'Thailand',
    code: 'TH',
    aliases: ['Thailand', 'Siam'],
    states: [
      {
        name: 'Bangkok',
        cities: [
          { name: 'Bangkok', latitude: 13.7563, longitude: 100.5018, timezone: 'Asia/Bangkok' },
          { name: 'Nonthaburi', latitude: 13.8621, longitude: 100.5144, timezone: 'Asia/Bangkok' },
        ],
      },
      {
        name: 'Chiang Mai',
        cities: [
          { name: 'Chiang Mai', latitude: 18.7883, longitude: 98.9853, timezone: 'Asia/Bangkok' },
        ],
      },
      {
        name: 'Phuket',
        cities: [
          { name: 'Phuket', latitude: 7.8804, longitude: 98.3923, timezone: 'Asia/Bangkok' },
        ],
      },
    ],
  },
  {
    name: 'India',
    code: 'IN',
    aliases: ['India', 'Bharat'],
    states: [
      {
        name: 'Delhi',
        cities: [
          { name: 'New Delhi', latitude: 28.6139, longitude: 77.2090, timezone: 'Asia/Kolkata' },
        ],
      },
      {
        name: 'Maharashtra',
        cities: [
          { name: 'Mumbai', latitude: 19.0760, longitude: 72.8777, timezone: 'Asia/Kolkata' },
          { name: 'Pune', latitude: 18.5204, longitude: 73.8567, timezone: 'Asia/Kolkata' },
        ],
      },
      {
        name: 'Tamil Nadu',
        cities: [
          { name: 'Chennai', latitude: 13.0827, longitude: 80.2707, timezone: 'Asia/Kolkata' },
        ],
      },
      {
        name: 'Karnataka',
        cities: [
          { name: 'Bengaluru', latitude: 12.9716, longitude: 77.5946, timezone: 'Asia/Kolkata' },
        ],
      },
      {
        name: 'Uttar Pradesh',
        cities: [
          { name: 'Varanasi', latitude: 25.3176, longitude: 82.9739, timezone: 'Asia/Kolkata' },
          { name: 'Ujjain', latitude: 23.1765, longitude: 75.7885, timezone: 'Asia/Kolkata' },
        ],
      },
    ],
  },
  {
    name: 'United States',
    code: 'US',
    aliases: ['USA', 'United States', 'America'],
    states: [
      {
        name: 'New York',
        cities: [
          { name: 'New York', latitude: 40.7128, longitude: -74.0060, timezone: 'America/New_York' },
        ],
      },
      {
        name: 'California',
        cities: [
          { name: 'Los Angeles', latitude: 34.0522, longitude: -118.2437, timezone: 'America/Los_Angeles' },
          { name: 'San Francisco', latitude: 37.7749, longitude: -122.4194, timezone: 'America/Los_Angeles' },
        ],
      },
    ],
  },
  {
    name: 'United Kingdom',
    code: 'GB',
    aliases: ['UK', 'United Kingdom', 'Great Britain'],
    states: [
      {
        name: 'Greater London',
        cities: [
          { name: 'London', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' },
          { name: 'Greenwich', latitude: 51.4826, longitude: 0.0077, timezone: 'Europe/London' },
        ],
      },
    ],
  },
];

/**
 * Format decimal degrees to astronomical DMS string e.g. 96°09'00" E or 16°48'00" N
 */
export function formatDMS(degrees: number, isLatitude: boolean): string {
  const abs = Math.abs(degrees);
  const d = Math.floor(abs);
  const minFloat = (abs - d) * 60;
  const m = Math.floor(minFloat);
  const s = Math.round((minFloat - m) * 60);

  // Normalize seconds overflow
  const adjustedS = s === 60 ? 0 : s;
  const adjustedM = s === 60 ? m + 1 : m;
  const finalM = adjustedM === 60 ? 0 : adjustedM;
  const finalD = adjustedM === 60 ? d + 1 : d;

  const dir = isLatitude ? (degrees >= 0 ? 'N' : 'S') : (degrees >= 0 ? 'E' : 'W');
  return `${finalD}°${String(finalM).padStart(2, '0')}'${String(adjustedS).padStart(2, '0')}" ${dir}`;
}

/**
 * Parse DMS or decimal degrees string to number.
 */
export function parseDMSOrDecimal(val: string | number): number | null {
  if (typeof val === 'number') return isNaN(val) ? null : val;
  if (!val) return null;

  const trimmed = val.trim();
  // Check plain float
  const numeric = parseFloat(trimmed);
  if (!isNaN(numeric) && !trimmed.includes('°')) {
    return numeric;
  }

  // Parse DMS format e.g. 96°09'00" E or 16N48
  const match = trimmed.match(/(\d+)[°\s]+(\d+)?['\s]*(\d+)?["\s]*([NSEWnsew])?/);
  if (match) {
    const deg = parseFloat(match[1]);
    const min = match[2] ? parseFloat(match[2]) : 0;
    const sec = match[3] ? parseFloat(match[3]) : 0;
    const dir = match[4] ? match[4].toUpperCase() : '';

    let res = deg + min / 60 + sec / 3600;
    if (dir === 'S' || dir === 'W') {
      res = -res;
    }
    return res;
  }

  return isNaN(numeric) ? null : numeric;
}

/**
 * Format IANA timezone or offset hours to HH:mm:ss format e.g. "+06:30:00"
 */
export function formatTimezoneOffsetString(offsetHours: number): string {
  const sign = offsetHours >= 0 ? '+' : '-';
  const abs = Math.abs(offsetHours);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

const DEFAULT_PLACE_KEY = 'DSSME_DEFAULT_EVENT_PLACE';

export interface SavedDefaultPlace {
  country: string;
  state: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export function saveDefaultPlace(place: SavedDefaultPlace): void {
  try {
    localStorage.setItem(DEFAULT_PLACE_KEY, JSON.stringify(place));
  } catch (e) {
    console.warn('Unable to persist default place to localStorage', e);
  }
}

export function getSavedDefaultPlace(): SavedDefaultPlace | null {
  try {
    const raw = localStorage.getItem(DEFAULT_PLACE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Fall back to null
  }
  return null;
}
