/**
 * DSSME EVENT ENGINE V1.0 - Daily Calculation & New Day Context Types
 * Conforms to DSSME New Day & Daily Rollover Specification.
 */

import { CanonicalChart, DSSMEEvent, LocationInput } from '../types.js';

export interface DayContext {
  calculationDate: string; // YYYY-MM-DD (Authoritative Application Local Date)
  timezone: string;        // e.g. "Asia/Yangon"
  utcStart: string;        // ISO 8601 UTC representation of local 00:00:00
  utcEnd: string;          // ISO 8601 UTC representation of local 23:59:59.999

  latitude: number;
  longitude: number;

  ayanamsa: string;

  engineVersion: string;
  schemaVersion: string;
  ephemerisVersion: string;
  configurationHash: string;

  calculationId: string;
}

export type DayJobStatus = 'requested' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface DailyStepDefinition {
  index: number;
  totalSteps: number;
  localTime: string;      // YYYY-MM-DD HH:mm:ss
  utcTime: string;        // ISO UTC string
  stepMinutes: number;
}

export interface BoundarySample {
  timestampLocal: string; // e.g. Previous Day 23:59:00
  timestampUtc: string;
  chart: CanonicalChart;
}

export interface DrawTimeCalculationInstance {
  drawId: string;
  location: string;
  country: string;
  timezone: string;
  session: 'AM' | 'PM' | 'REFERENCE';
  localTime: string;      // e.g. "12:01"
  localDatetime: string;  // e.g. "2026-09-25 12:01:00"
  utcInstant: string;     // ISO 8601 UTC
  calculationId: string;  // e.g. "2026-09-25:yangon-am"
  chart: CanonicalChart;
  eventsCount: number;
}

export interface DailyCalculationRecord {
  jobId: string;
  calculationId: string;
  calculationKey: string;
  dayContext: DayContext;
  status: DayJobStatus;
  totalSteps: number;
  completedSteps: number;
  startedAt: string;
  completedAt?: string;
  chart: CanonicalChart;
  boundaryEvents: DSSMEEvent[];
  events: DSSMEEvent[];
  drawCalculations?: DrawTimeCalculationInstance[];
  summary: {
    totalEvents: number;
    boundaryEventsCount: number;
    drawCalculationsCount?: number;
    modulesRun: string[];
    executionDurationMs: number;
  };
  errorMessage?: string;
}

export interface NewDayCalculationRequest {
  date?: string;            // Local calendar date e.g. "2026-09-25" (if omitted, current local date)
  timezone?: string;        // Defaults to "Asia/Yangon"
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  ayanamsa?: string;        // Defaults to "Lahiri"
  stepMinutes?: number;     // 15, 30, or 60 (default: 60 min, 24 steps)
  forceRecalculate?: boolean;
}

export interface NewDayCalculationResponse {
  success: boolean;
  status: DayJobStatus;
  calculationId: string;
  jobId: string;
  calculationDate: string;
  timezone: string;
  cached: boolean;
  record?: DailyCalculationRecord;
  message?: string;
}
