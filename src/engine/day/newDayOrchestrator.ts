/**
 * DSSME EVENT ENGINE V1.0 - New Day Orchestrator
 * Automatic midnight rollover detection, manual recalculation, and concurrency control.
 */

import { DayContext, DailyCalculationRecord, NewDayCalculationRequest, NewDayCalculationResponse, DayJobStatus } from './dayTypes.js';
import {
  DEFAULT_TIMEZONE,
  DEFAULT_LOCATION,
  getLocalCalendarDate,
  buildDayContext,
  generateDailyCalculationKey,
  ENGINE_VERSION,
  EPHEMERIS_VERSION,
} from './dayUtils.js';
import { executeNewDayWorkflow, WorkflowProgressCallback } from './dailyWorkflow.js';
import { dayPersistence } from './dayPersistence.js';

export type DayStatusChangeListener = (status: {
  calculationDate: string;
  timezone: string;
  status: DayJobStatus;
  progressStep: number;
  totalSteps: number;
  record?: DailyCalculationRecord;
  error?: string;
}) => void;

class NewDayOrchestrationService {
  private configuredTimezone: string = DEFAULT_TIMEZONE;
  private lastRolloverCheckedDate: string = '';
  private isProcessing: boolean = false;
  private listeners: Set<DayStatusChangeListener> = new Set();
  private pollerTimer: any = null;

  constructor() {
    this.lastRolloverCheckedDate = getLocalCalendarDate(this.configuredTimezone);
  }

  public setTimezone(tz: string): void {
    this.configuredTimezone = tz;
  }

  public getTimezone(): string {
    return this.configuredTimezone;
  }

  public subscribe(listener: DayStatusChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(payload: Parameters<DayStatusChangeListener>[0]): void {
    for (const listener of this.listeners) {
      try {
        listener(payload);
      } catch (err) {
        console.error('DayStatusChangeListener error:', err);
      }
    }
  }

  /**
   * Checks if local calendar date has rolled over in configured timezone.
   * If changed, triggers automatic New Day calculation.
   */
  public async checkRollover(forceCheck: boolean = false): Promise<boolean> {
    const currentLocal = getLocalCalendarDate(this.configuredTimezone);

    if (forceCheck || (this.lastRolloverCheckedDate && this.lastRolloverCheckedDate !== currentLocal)) {
      console.log(`[NewDayOrchestrator] Date rollover detected: ${this.lastRolloverCheckedDate} -> ${currentLocal} (${this.configuredTimezone})`);
      this.lastRolloverCheckedDate = currentLocal;

      // Trigger automatic calculation for the new calendar day
      await this.calculateDay({
        date: currentLocal,
        timezone: this.configuredTimezone,
        forceRecalculate: false,
      });
      return true;
    }

    return false;
  }

  /**
   * Starts periodic rollover detection interval.
   */
  public startRolloverPoller(intervalMs: number = 30000): void {
    if (this.pollerTimer) return;
    this.pollerTimer = setInterval(() => {
      this.checkRollover().catch((err) => {
        console.warn('Rollover check error:', err);
      });
    }, intervalMs);
  }

  public stopRolloverPoller(): void {
    if (this.pollerTimer) {
      clearInterval(this.pollerTimer);
      this.pollerTimer = null;
    }
  }

  /**
   * Orchestrates a New Day calculation (automatic or manual).
   */
  public async calculateDay(
    request: NewDayCalculationRequest = {},
    progressCb?: WorkflowProgressCallback
  ): Promise<NewDayCalculationResponse> {
    const tz = request.timezone || this.configuredTimezone;
    const targetDate = request.date || getLocalCalendarDate(tz);
    const stepMinutes = request.stepMinutes || 60;
    const force = !!request.forceRecalculate;

    const lat = request.latitude ?? (tz.includes('Yangon') ? DEFAULT_LOCATION.latitude : 35.6528);
    const lon = request.longitude ?? (tz.includes('Yangon') ? DEFAULT_LOCATION.longitude : 139.5447);
    const ayanamsa = request.ayanamsa || 'Lahiri';

    const dayContext = buildDayContext(targetDate, tz, lat, lon, ayanamsa);
    const calcKey = generateDailyCalculationKey(
      dayContext.calculationDate,
      dayContext.timezone,
      dayContext.latitude,
      dayContext.longitude,
      dayContext.ayanamsa,
      dayContext.engineVersion,
      dayContext.ephemerisVersion,
      dayContext.configurationHash
    );

    // Step 1: Check existing completed record if not force recalculate
    if (!force) {
      const existing = dayPersistence.getRecordByKey(calcKey);
      if (existing && existing.status === 'completed') {
        this.notify({
          calculationDate: targetDate,
          timezone: tz,
          status: 'completed',
          progressStep: existing.totalSteps,
          totalSteps: existing.totalSteps,
          record: existing,
        });

        return {
          success: true,
          status: 'completed',
          calculationId: existing.calculationId,
          jobId: existing.jobId,
          calculationDate: targetDate,
          timezone: tz,
          cached: true,
          record: existing,
          message: 'Retrieved completed calculation from immutable day store.',
        };
      }
    }

    // Step 2: Concurrency Lock Check
    const jobId = `JOB-${targetDate.replace(/-/g, '')}-${Date.now().toString(36)}`;
    const lockAcquired = dayPersistence.acquireLock(calcKey, jobId);

    if (!lockAcquired) {
      return {
        success: false,
        status: 'running',
        calculationId: dayContext.calculationId,
        jobId,
        calculationDate: targetDate,
        timezone: tz,
        cached: false,
        message: 'Concurrent calculation already running for this day context.',
      };
    }

    // Step 3: Run Workflow
    this.isProcessing = true;
    this.notify({
      calculationDate: targetDate,
      timezone: tz,
      status: 'running',
      progressStep: 0,
      totalSteps: Math.floor(1440 / stepMinutes) + 1,
    });

    try {
      const record = await executeNewDayWorkflow(dayContext, stepMinutes, (step, total, localTime, evCount) => {
        if (progressCb) progressCb(step, total, localTime, evCount);
        this.notify({
          calculationDate: targetDate,
          timezone: tz,
          status: 'running',
          progressStep: step,
          totalSteps: total,
        });
      });

      // Save record to persistent store
      dayPersistence.saveRecord(record);

      this.notify({
        calculationDate: targetDate,
        timezone: tz,
        status: 'completed',
        progressStep: record.totalSteps,
        totalSteps: record.totalSteps,
        record,
      });

      return {
        success: true,
        status: 'completed',
        calculationId: record.calculationId,
        jobId: record.jobId,
        calculationDate: targetDate,
        timezone: tz,
        cached: false,
        record,
        message: 'Daily calculation and event detection completed successfully.',
      };
    } catch (err: any) {
      console.error(`[NewDayOrchestrator] Calculation failed for ${targetDate}:`, err);
      const errMsg = err?.message || String(err);

      this.notify({
        calculationDate: targetDate,
        timezone: tz,
        status: 'failed',
        progressStep: 0,
        totalSteps: 0,
        error: errMsg,
      });

      return {
        success: false,
        status: 'failed',
        calculationId: dayContext.calculationId,
        jobId,
        calculationDate: targetDate,
        timezone: tz,
        cached: false,
        message: `Calculation failed: ${errMsg}`,
      };
    } finally {
      this.isProcessing = false;
      dayPersistence.releaseLock(calcKey, jobId);
    }
  }

  public getStatus() {
    return {
      configuredTimezone: this.configuredTimezone,
      currentLocalCalendarDate: getLocalCalendarDate(this.configuredTimezone),
      isProcessing: this.isProcessing,
      activeRecord: dayPersistence.getCurrentDayRecord(),
      historyCount: dayPersistence.getAllRecords().length,
    };
  }
}

export const newDayOrchestrator = new NewDayOrchestrationService();
