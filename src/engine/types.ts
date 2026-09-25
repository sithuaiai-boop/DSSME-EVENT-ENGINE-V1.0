/**
 * DSSME EVENT ENGINE V1.0 - Canonical Types
 * Strict schema definitions for astronomical and Vedic event calculations.
 */

export type TriggerType =
  | 'START'
  | 'END'
  | 'INGRESS'
  | 'CROSSING'
  | 'STATE_CHANGE'
  | 'EXACT'
  | 'APPLYING'
  | 'SEPARATING'
  | 'PEAK'
  | 'ACTIVATION'
  | 'DEACTIVATION';

export type ValidationStatus = 'PASS' | 'WARN' | 'FAIL' | 'UNVERIFIED';

export type DignityType =
  | 'Exalted'
  | 'Own'
  | 'Moolatrikona'
  | 'Grt.Friend'
  | 'Friend'
  | 'Neutral'
  | 'Enemy'
  | 'Grt.Enemy'
  | 'Debilitated'
  | '—';

export type HouseType = 'Angular' | 'Succedent' | 'Cadent';
export type LagnaType = 'Movable' | 'Fixed' | 'Dual';
export type PakshaType = 'Shukla' | 'Krishna';
export type StressLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';

export interface LocationInput {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

export interface DSSMEEventInput {
  datetime: string; // ISO 8601 or YYYY-MM-DD HH:mm:ss
  timezone: string; // e.g. "UTC+9", "Asia/Tokyo", "+09:00"
  location: LocationInput;
  ayanamsa: 'Lahiri';
  options?: {
    calculateEventsRangeDays?: number;
    stepMinutes?: number;
    enabledModules?: string[];
  };
}

export type EventType =
  | 'Lottery Draw'
  | 'General Event'
  | 'Prashna'
  | 'Transit Event'
  | 'Custom Event';

export interface EventProfile {
  eventId: string;
  eventName: string;
  eventType: EventType;
  localDate: string;  // YYYY-MM-DD
  localTime: string;  // HH:mm:ss
  timezone: string;   // IANA identifier e.g. "Asia/Yangon"
  latitude: number;
  longitude: number;
  country: string;
  state?: string;
  city: string;
  ayanamsa: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DSSMEEvent {
  id: string;
  module: string; // MOD-01 to MOD-15
  eventCode: string; // e.g. "TIME.TITHI_CHANGE", "PLANET.SIGN_INGRESS"
  timestampUTC: string;
  timestampLocal: string;
  timezone: string;
  object?: string; // Planet name or point (e.g. "Sun", "Moon", "Lagna")
  triggerType: TriggerType;
  previousState?: unknown;
  newState?: unknown;
  longitude?: number;
  speed?: number;
  sourceMethod: string;
  sourceReference: string;
  validationStatus: ValidationStatus;
  engineVersion: string;
  metadata?: Record<string, unknown>;
}

export interface PlanetState {
  name: string;
  sign: string;
  degree?: string; // XX°YY'ZZ" (canonical benchmark field)
  degreeInSign: number; // 0-30
  degreeFormatted: string; // XX°YY'ZZ"
  totalLongitude: number; // 0-360
  nakshatra: string;
  pada: number; // 1-4
  house: number; // 1-12
  speed: number;
  retro: 'Y' | 'N' | 'R';
  retrograde: boolean;
  combust: 'Y' | 'N';
  combustionDetails?: {
    combust: boolean;
    sep_deg: number;
    severity: 'Mild' | 'Severe' | 'None' | null;
  };
  dispositor: string;
  dignity: DignityType;
  sb_ratio?: number;
  sb_rank?: number;
}

export interface PanchangaState {
  paksha: PakshaType;
  tithi_number: number; // 1-30
  tithi_name: string;
  tithi_at_birth: string;
  nakshatra_number: number; // 1-27
  nakshatra_name: string;
  nakshatra_pada: number;
  nak_at_birth: string;
  yoga_number: number; // 1-27
  yoga_name: string;
  yoga_at_birth: string;
  karana_number: number; // 1-60
  karana_name: string;
  karana_at_birth: string;
  weekday_lord: string;
  sunrise_time: string;
  sunset_time: string;
  solar_noon?: string;
  day_length_hours?: number;
  moon_nak_entry?: string;
  moon_nak_exit?: string;
  eclipse_proximity: boolean;
  gandanta_active: boolean;
  ingress_stacking: boolean;
  amavasya_zone: boolean;
  purnima_zone: boolean;
}

export interface DashaPeriod {
  planet: string;
  start: string;
  end: string;
}

export interface DashaState {
  mahadasha_planet: string;
  antardasha_planet: string;
  pratyantara: string;
  dasha_string: string;
  upcoming_ad: DashaPeriod[];
  next_mahadasha_planet: string;
}

export interface HouseInfo {
  houseNumber: number;
  sign: string;
  lord: string;
  occupants: string[];
  type: HouseType;
  cuspDegree?: number;
}

export interface ShadbalaState {
  _columns: string[];
  total_virupas: number[];
  total_rupas?: number[];
  minimum_required: number[];
  percent_required: number[];
  strength_ratio?: number[];
  rank: number[];
  sthana_total: number[];
  sthana_pct?: number[];
  dig_bala: number[];
  dig_pct?: number[];
  kaala_total: number[];
  kaala_pct?: number[];
  chesta_bala: number[];
  chesta_pct?: number[];
  naisargika_bala: number[];
  drig_bala: number[];
  drig_pct?: number[];
}

export interface BhavaBalaItem {
  sign: string;
  lord_contrib?: number;
  drishti?: number;
  total: number;
}

export interface AshtakavargaState {
  _signs: string[];
  BAV: Record<string, number[]>; // 8 tables: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Lagna
  SAV: {
    values: number[]; // 12 signs Aries -> Pisces
    grand_total: number;
    spec_houses: {
      H2: { sign: string; sav: number; occupant: string };
      H5: { sign: string; sav: number; occupant: string };
      H8: { sign: string; sav: number; occupant: string };
      H11: { sign: string; sav: number; occupant: string };
    };
    spec_sum: number;
    spec_triangle: number;
  };
  BAV_CURRENT_SIGN: Record<string, { sign: string; bav: number }>;
}

export interface AspectPlanetItem {
  from: string;
  to: string;
  fraction: string;
  score: number;
}

export interface AspectBhavaItem {
  degree: number;
  aspects: Record<string, number>;
}

export interface NavamshaPlanet {
  sign: string;
  dignity: DignityType;
  is_vargottama: boolean;
  is_pushkara: boolean;
}

export interface YogaItem {
  name: string;
  type: 'spec_positive' | 'spec_negative' | 'neutral';
  planets_involved: string[];
  active: boolean;
  description: string;
}

export interface CanonicalChart {
  IDENTITY: {
    date: string;
    day: string;
    time: string;
    timezone: string;
    location_city: string;
    location_country: string;
    latitude: string;
    longitude: string;
    ayanamsa_name: string;
    ayanamsa_value: string;
    lagna_sign: string;
    lagna_degree: string;
    lagna_type: LagnaType;
    body_mode: string;
    objective: string;
    risk: string;
    geometry: string;
    engine_version: string;
  };
  PANCHANGA: PanchangaState;
  DASHA: DashaState;
  PLANETS: Record<string, PlanetState>;
  HOUSES: Record<string, HouseInfo>;
  SHADBALA: ShadbalaState;
  BHAVA_BALA: Record<string, BhavaBalaItem>;
  BAV: Record<string, number[]>;
  SAV: AshtakavargaState['SAV'];
  BAV_CURRENT_SIGN: Record<string, { sign: string; bav: number }>;
  ASPECTS_PLANETS: AspectPlanetItem[];
  ASPECTS_BHAVAS: Record<string, AspectBhavaItem>;
  DIGNITY: Record<string, DignityType>;
  RETROGRADE: Record<string, boolean>;
  COMBUST: Record<string, { combust: boolean; sep_deg: number | null; severity: 'Mild' | 'Severe' | 'None' | null }>;
  HOUSE_POSITIONS: Record<string, { house: number; type: HouseType }>;
  SIGN_CLUSTERS: Array<{ sign: string; sign_index: number; planets: string[]; sav: number }>;
  HORA: { planet: string; hora_number: number; start_time: string; end_time: string };
  PHASE_STRESS: {
    new_moon_proximity_hrs: number;
    full_moon_proximity_hrs: number;
    ingress_within_24h: string[];
    sign_boundary_planets: string[];
    stress_level: StressLevel;
  };
  NAVAMSHA: {
    _available: boolean;
    [planet: string]: NavamshaPlanet | boolean;
  };
  YOGA_LIST: YogaItem[];
  _meta?: {
    errors: string[];
    warnings: string[];
    blocks_populated: string[];
    blocks_defaulted: string[];
    validation_note: string;
  };
}

export interface BenchmarkResult {
  metric: string;
  dssme: string | number | boolean;
  reference: string | number | boolean;
  absoluteDifference: number;
  relativeDifference?: number;
  tolerance: number;
  status: ValidationStatus;
  category: string;
  note?: string;
}
