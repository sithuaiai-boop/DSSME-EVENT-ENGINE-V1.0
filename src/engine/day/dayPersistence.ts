/**
 * DSSME EVENT ENGINE V1.0 - Daily Calculation Persistence & Concurrency Manager
 * Implements historical day storage, concurrency locks, and query interfaces.
 */

import { DailyCalculationRecord, DayJobStatus } from './dayTypes.js';

interface ConcurrencyLock {
  calculationKey: string;
  jobId: string;
  lockedAt: number;
}

class DayPersistenceManager {
  private records: Map<string, DailyCalculationRecord> = new Map();
  private locks: Map<string, ConcurrencyLock> = new Map();
  private storageKey = 'dssme_daily_records_v1';
  private currentActiveDayKey: string | null = null;

  constructor() {
    this.hydrateFromStorage();
  }

  private hydrateFromStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const serialized = window.localStorage.getItem(this.storageKey);
      if (serialized) {
        const parsed: DailyCalculationRecord[] = JSON.parse(serialized);
        for (const rec of parsed) {
          this.records.set(rec.calculationKey, rec);
        }
      }
    } catch (e) {
      console.warn('Failed to hydrate daily records from localStorage:', e);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      // Retain last 30 historical days in localStorage
      const allRecords = Array.from(this.records.values())
        .sort((a, b) => b.dayContext.calculationDate.localeCompare(a.dayContext.calculationDate))
        .slice(0, 30);
      window.localStorage.setItem(this.storageKey, JSON.stringify(allRecords));
    } catch (e) {
      console.warn('Failed to write daily records to localStorage:', e);
    }
  }

  /**
   * Attempts to acquire an execution lock for a calculation key.
   * Lock expires automatically after 60 seconds (prevents deadlocks).
   */
  public acquireLock(calculationKey: string, jobId: string): boolean {
    const existing = this.locks.get(calculationKey);
    const now = Date.now();

    if (existing) {
      if (now - existing.lockedAt < 60000) {
        // Still locked
        return false;
      }
      // Stale lock expired
      this.locks.delete(calculationKey);
    }

    this.locks.set(calculationKey, {
      calculationKey,
      jobId,
      lockedAt: now,
    });
    return true;
  }

  /**
   * Releases an execution lock.
   */
  public releaseLock(calculationKey: string, jobId: string): void {
    const existing = this.locks.get(calculationKey);
    if (existing && existing.jobId === jobId) {
      this.locks.delete(calculationKey);
    }
  }

  /**
   * Checks if calculation is currently locked/running.
   */
  public isLocked(calculationKey: string): boolean {
    const existing = this.locks.get(calculationKey);
    if (!existing) return false;
    if (Date.now() - existing.lockedAt > 60000) {
      this.locks.delete(calculationKey);
      return false;
    }
    return true;
  }

  /**
   * Stores or updates a daily calculation record.
   */
  public saveRecord(record: DailyCalculationRecord): void {
    this.records.set(record.calculationKey, record);
    this.currentActiveDayKey = record.calculationKey;
    this.saveToStorage();
  }

  /**
   * Retrieves calculation record by calculationKey.
   */
  public getRecordByKey(calculationKey: string): DailyCalculationRecord | undefined {
    return this.records.get(calculationKey);
  }

  /**
   * Retrieves calculation record by date and timezone.
   */
  public getRecordByDate(dateStr: string, timezone: string): DailyCalculationRecord | undefined {
    for (const record of this.records.values()) {
      if (
        record.dayContext.calculationDate === dateStr &&
        record.dayContext.timezone === timezone &&
        record.status === 'completed'
      ) {
        return record;
      }
    }
    return undefined;
  }

  /**
   * Retrieves current active day record.
   */
  public getCurrentDayRecord(): DailyCalculationRecord | undefined {
    if (this.currentActiveDayKey) {
      const rec = this.records.get(this.currentActiveDayKey);
      if (rec) return rec;
    }
    // Fallback: return most recent completed record
    const all = this.getAllRecords();
    return all.find((r) => r.status === 'completed');
  }

  /**
   * Lists all historical day records sorted by date descending.
   */
  public getAllRecords(): DailyCalculationRecord[] {
    return Array.from(this.records.values()).sort((a, b) =>
      b.dayContext.calculationDate.localeCompare(a.dayContext.calculationDate)
    );
  }

  /**
   * Clears records (used in test fixtures).
   */
  public clear(): void {
    this.records.clear();
    this.locks.clear();
    this.currentActiveDayKey = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(this.storageKey);
    }
  }
}

export const dayPersistence = new DayPersistenceManager();
