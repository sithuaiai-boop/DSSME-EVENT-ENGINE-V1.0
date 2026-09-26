/**
 * DSSME EVENT ENGINE V1.0 - New Day & Day Rollover Control Panel
 * Displays authoritative calculation day, status badge, manual calculation modal,
 * historical days browser, and acceptance test runner.
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Play,
  Layers,
  Sparkles,
  History,
  ShieldCheck,
  ChevronRight,
  Database,
} from 'lucide-react';
import { newDayOrchestrator } from '../engine/day/newDayOrchestrator.js';
import { dayPersistence } from '../engine/day/dayPersistence.js';
import { getLocalCalendarDate, computeLocalDayUtcBoundaries, DEFAULT_TIMEZONE } from '../engine/day/dayUtils.js';
import { DailyCalculationRecord, DayJobStatus } from '../engine/day/dayTypes.js';
import { runNewDayAcceptanceTests, AcceptanceSuiteReport } from '../engine/day/newDayTests.js';
import {
  LOTTERY_DRAW_TIMES,
  getDrawTimeString,
  getDrawUtcInstant,
} from '../engine/lottery/drawConfig.js';
import { runLotteryDrawTests, DrawTestSuiteReport } from '../engine/lottery/drawTests.js';

interface NewDayControlProps {
  onDaySelected?: (record: DailyCalculationRecord) => void;
}

export const NewDayControl: React.FC<NewDayControlProps> = ({ onDaySelected }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'calculate' | 'history' | 'tests'>('calculate');

  // Timezone and date state
  const [timezone, setTimezone] = useState<string>(DEFAULT_TIMEZONE);
  const [selectedDate, setSelectedDate] = useState<string>(getLocalCalendarDate(DEFAULT_TIMEZONE));
  const [stepMinutes, setStepMinutes] = useState<number>(60);
  const [forceRecalculate, setForceRecalculate] = useState<boolean>(false);

  // Execution state
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [totalSteps, setTotalSteps] = useState<number>(25);
  const [lastLocalTime, setLastLocalTime] = useState<string>('');
  const [eventsFound, setEventsFound] = useState<number>(0);
  const [activeRecord, setActiveRecord] = useState<DailyCalculationRecord | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // History & Tests
  const [historyList, setHistoryList] = useState<DailyCalculationRecord[]>([]);
  const [testReport, setTestReport] = useState<AcceptanceSuiteReport | null>(null);
  const [drawTestReport, setDrawTestReport] = useState<DrawTestSuiteReport | null>(null);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [isRunningDrawTests, setIsRunningDrawTests] = useState<boolean>(false);

  // Initialize and subscribe
  useEffect(() => {
    // Initial fetch of current record
    const current = dayPersistence.getCurrentDayRecord();
    if (current) {
      setActiveRecord(current);
    }
    setHistoryList(dayPersistence.getAllRecords());

    // Subscribe to orchestrator
    const unsubscribe = newDayOrchestrator.subscribe((data) => {
      if (data.status === 'running') {
        setIsCalculating(true);
        setCurrentStep(data.progressStep);
        setTotalSteps(data.totalSteps);
      } else if (data.status === 'completed') {
        setIsCalculating(false);
        if (data.record) {
          setActiveRecord(data.record);
          setHistoryList(dayPersistence.getAllRecords());
          if (onDaySelected) onDaySelected(data.record);
        }
      } else if (data.status === 'failed') {
        setIsCalculating(false);
        setErrorMessage(data.error || 'Calculation failed');
      }
    });

    // Start background rollover poller
    newDayOrchestrator.startRolloverPoller(30000);

    return () => {
      unsubscribe();
      newDayOrchestrator.stopRolloverPoller();
    };
  }, [onDaySelected]);

  const boundaries = computeLocalDayUtcBoundaries(selectedDate, timezone);

  const handleRunCalculation = async () => {
    setIsCalculating(true);
    setErrorMessage('');
    setStatusMessage('Starting durable step workflow...');
    setCurrentStep(0);
    setEventsFound(0);

    try {
      const response = await newDayOrchestrator.calculateDay(
        {
          date: selectedDate,
          timezone,
          stepMinutes,
          forceRecalculate,
        },
        (step, total, localTime, count) => {
          setCurrentStep(step);
          setTotalSteps(total);
          setLastLocalTime(localTime);
          setEventsFound(count);
        }
      );

      if (response.success && response.record) {
        setActiveRecord(response.record);
        setHistoryList(dayPersistence.getAllRecords());
        setStatusMessage(response.message || 'Completed successfully');
        if (onDaySelected) {
          onDaySelected(response.record);
        }
      } else {
        setErrorMessage(response.message || 'Calculation did not complete');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Calculation execution failed');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleRunAcceptanceTests = async () => {
    setIsRunningTests(true);
    try {
      const report = await runNewDayAcceptanceTests();
      setTestReport(report);
    } catch (err: any) {
      console.error('Acceptance tests execution error:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleRunDrawTests = async () => {
    setIsRunningDrawTests(true);
    try {
      const report = await runLotteryDrawTests();
      setDrawTestReport(report);
    } catch (err: any) {
      console.error('Lottery draw tests execution error:', err);
    } finally {
      setIsRunningDrawTests(false);
    }
  };

  const handleSelectHistorical = (rec: DailyCalculationRecord) => {
    setActiveRecord(rec);
    setSelectedDate(rec.dayContext.calculationDate);
    setTimezone(rec.dayContext.timezone);
    if (onDaySelected) {
      onDaySelected(rec);
    }
    setIsOpen(false);
  };

  const currentDisplayDate = activeRecord?.dayContext.calculationDate || selectedDate;
  const currentDisplayTz = activeRecord?.dayContext.timezone || timezone;

  return (
    <>
      {/* AUTHORITATIVE DAY BANNER / STATUS PILL */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 shadow-md flex flex-wrap items-center justify-between gap-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                Authoritative Day
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                  isCalculating
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                    : activeRecord
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                }`}
              >
                ● {isCalculating ? 'CALCULATING' : activeRecord ? 'COMPLETED' : 'READY'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-bold text-slate-100 font-mono">
                {currentDisplayDate}
              </span>
              <span className="text-xs text-slate-400 font-mono bg-slate-800/80 px-1.5 py-0.5 rounded">
                {currentDisplayTz}
              </span>
              {activeRecord && (
                <span className="text-xs text-slate-400 hidden sm:inline">
                  • {activeRecord.summary.totalEvents} events ({activeRecord.summary.boundaryEventsCount} midnight)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          {isCalculating && (
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>
                Step {currentStep}/{totalSteps}
              </span>
            </div>
          )}

          <button
            onClick={() => setIsOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-950/20 flex items-center gap-1.5 transition-all cursor-pointer font-mono"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>NEW DAY CALCULATION</span>
          </button>
        </div>
      </div>

      {/* MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    DSSME New Day & Daily Rollover Engine
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      v1.4
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Deterministic daily calculation context, midnight boundary state & durable step grid
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Sub-Tabs */}
            <div className="flex border-b border-slate-800 px-6 bg-slate-950/30">
              <button
                onClick={() => setActiveSubTab('calculate')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                  activeSubTab === 'calculate'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                Daily Calculation
              </button>
              <button
                onClick={() => setActiveSubTab('history')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                  activeSubTab === 'history'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Historical Days ({historyList.length})
              </button>
              <button
                onClick={() => setActiveSubTab('tests')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                  activeSubTab === 'tests'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Acceptance Tests (21 Items)
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* TAB 1: DAILY CALCULATION */}
              {activeSubTab === 'calculate' && (
                <div className="space-y-5">
                  {/* Context Form Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Date Field */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-slate-400 uppercase">
                        Application Local Date
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                      <div className="flex gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setSelectedDate(getLocalCalendarDate(timezone))}
                          className="text-[10px] text-amber-400 hover:underline font-mono"
                        >
                          Today
                        </button>
                        <span className="text-[10px] text-slate-600">•</span>
                        <button
                          type="button"
                          onClick={() => setSelectedDate('2026-09-25')}
                          className="text-[10px] text-amber-400 hover:underline font-mono"
                        >
                          2026-09-25
                        </button>
                        <span className="text-[10px] text-slate-600">•</span>
                        <button
                          type="button"
                          onClick={() => setSelectedDate('2026-09-16')}
                          className="text-[10px] text-amber-400 hover:underline font-mono"
                        >
                          Chofu Fixture
                        </button>
                      </div>
                    </div>

                    {/* Timezone Field */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-slate-400 uppercase">
                        Configured Timezone
                      </label>
                      <select
                        value={timezone}
                        onChange={(e) => {
                          setTimezone(e.target.value);
                          newDayOrchestrator.setTimezone(e.target.value);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                      >
                        <option value="Asia/Yangon">Asia/Yangon (UTC+06:30)</option>
                        <option value="Asia/Bangkok">Asia/Bangkok (UTC+07:00)</option>
                        <option value="Asia/Tokyo">Asia/Tokyo (UTC+09:00)</option>
                        <option value="Asia/Kolkata">Asia/Kolkata (UTC+05:30)</option>
                        <option value="Europe/London">Europe/London (UTC+01:00)</option>
                      </select>
                      <p className="text-[10px] text-slate-500">Default: Asia/Yangon (+06:30)</p>
                    </div>

                    {/* Step Interval */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-slate-400 uppercase">
                        Durable Step Size
                      </label>
                      <select
                        value={stepMinutes}
                        onChange={(e) => setStepMinutes(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                      >
                        <option value={60}>60 minutes (24 steps - Standard)</option>
                        <option value={30}>30 minutes (48 steps - High Res)</option>
                        <option value={15}>15 minutes (96 steps - Ultra Res)</option>
                      </select>
                      <p className="text-[10px] text-slate-500">Fits inside Vercel timeout limits</p>
                    </div>
                  </div>

                  {/* UTC Normalization Info Box */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2">
                    <div className="text-slate-400 font-semibold flex items-center justify-between">
                      <span>UTC Boundary Normalization</span>
                      <span className="text-emerald-400 text-[10px]">Deterministic Context</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 text-[11px]">
                      <div>
                        <span className="text-slate-500">Local Day Start: </span>
                        {boundaries.localStart}
                      </div>
                      <div>
                        <span className="text-slate-500">UTC Start: </span>
                        {boundaries.utcStart}
                      </div>
                      <div>
                        <span className="text-slate-500">Local Day End: </span>
                        {boundaries.localEnd}
                      </div>
                      <div>
                        <span className="text-slate-500">UTC End: </span>
                        {boundaries.utcEnd}
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-500">Midnight Boundary Sample: </span>
                        {boundaries.boundarySampleLocal} ({boundaries.boundarySampleUtc})
                      </div>
                    </div>
                  </div>

                  {/* AUTHORITATIVE LOTTERY DRAW SCHEDULE (SECTION 11) */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="font-bold text-slate-100 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        LOTTERY DRAW TIMES (AUTHORITATIVE SCHEDULE)
                      </span>
                      <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                        Fixed Canonical
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-slate-300">
                      {LOTTERY_DRAW_TIMES.map((d) => (
                        <div
                          key={d.id}
                          className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-slate-200">
                              {d.location}, {d.country} {d.session !== 'REFERENCE' ? `(${d.session})` : ''}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {d.timezone}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-amber-400">
                              {getDrawTimeString(d)}{' '}
                              <span className="text-xs text-amber-500/80 font-normal">
                                {d.abbreviation}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              UTC {getDrawUtcInstant(d, selectedDate).slice(11, 16)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {activeRecord?.drawCalculations && activeRecord.drawCalculations.length > 0 && (
                      <div className="pt-2 border-t border-slate-800 space-y-2">
                        <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                          <span>Calculated Draw Charts for {activeRecord.dayContext.calculationDate}:</span>
                          <span className="text-emerald-400 text-[10px]">All 4 Sessions Resolved</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {activeRecord.drawCalculations.map((dc) => (
                            <div
                              key={dc.calculationId}
                              className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-[11px]"
                            >
                              <div>
                                <div className="font-bold text-slate-200">
                                  {dc.location} {dc.session !== 'REFERENCE' ? dc.session : ''} {dc.localTime}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Lagna: {dc.chart.IDENTITY.lagna_sign} {dc.chart.IDENTITY.lagna_degree.slice(0, 5)} • {dc.chart.PANCHANGA.nakshatra_name}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (onDaySelected) {
                                    onDaySelected({
                                      ...activeRecord,
                                      chart: dc.chart,
                                    });
                                  }
                                  setIsOpen(false);
                                }}
                                className="px-2 py-1 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 transition-colors cursor-pointer"
                              >
                                View Chart
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Checkbox */}
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={forceRecalculate}
                      onChange={(e) => setForceRecalculate(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <span>Force recalculation (re-executes all steps even if cached in store)</span>
                  </label>

                  {/* Execution Progress Bar (if running) */}
                  {isCalculating && (
                    <div className="space-y-2 bg-slate-950 border border-amber-500/30 rounded-xl p-4">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-amber-400 flex items-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Executing Daily Step Grid...
                        </span>
                        <span className="text-slate-300">
                          Step {currentStep} of {totalSteps} (
                          {Math.round((currentStep / Math.max(totalSteps, 1)) * 100)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-amber-400 h-full transition-all duration-150"
                          style={{
                            width: `${(currentStep / Math.max(totalSteps, 1)) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1">
                        <span>Current Time: {lastLocalTime || 'Initializing boundary...'}</span>
                        <span>Events Detected: {eventsFound}</span>
                      </div>
                    </div>
                  )}

                  {/* Feedback Messages */}
                  {errorMessage && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 font-mono">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {statusMessage && !errorMessage && !isCalculating && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 font-mono">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>{statusMessage}</span>
                    </div>
                  )}

                  {/* Active Record Summary (if exists) */}
                  {activeRecord && !isCalculating && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 font-mono">
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                        <span className="text-slate-200 font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Active Day Context: {activeRecord.dayContext.calculationDate}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Duration: {activeRecord.summary.executionDurationMs}ms
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                          <div className="text-[10px] text-slate-500 uppercase">Total Events</div>
                          <div className="text-base font-bold text-amber-400">
                            {activeRecord.summary.totalEvents}
                          </div>
                        </div>
                        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                          <div className="text-[10px] text-slate-500 uppercase">Midnight Crossings</div>
                          <div className="text-base font-bold text-emerald-400">
                            {activeRecord.summary.boundaryEventsCount}
                          </div>
                        </div>
                        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                          <div className="text-[10px] text-slate-500 uppercase">Steps Solved</div>
                          <div className="text-base font-bold text-slate-200">
                            {activeRecord.completedSteps}
                          </div>
                        </div>
                        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                          <div className="text-[10px] text-slate-500 uppercase">Modules Active</div>
                          <div className="text-base font-bold text-cyan-400">
                            {activeRecord.summary.modulesRun.length}
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400">
                        <span className="text-slate-500">Calculation ID: </span>
                        <code className="text-slate-300">{activeRecord.calculationId}</code>
                      </div>
                    </div>
                  )}

                  {/* Trigger Button */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isCalculating}
                      onClick={handleRunCalculation}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono flex items-center gap-2 shadow-lg shadow-amber-950/20 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {isCalculating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>CALCULATING...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>START NEW DAY CALCULATION</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: HISTORICAL DAYS */}
              {activeSubTab === 'history' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>Immutable Persisted Days ({historyList.length})</span>
                    <span>Historical results remain queryable</span>
                  </div>

                  {historyList.length === 0 ? (
                    <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-500 text-xs font-mono">
                      No historical days calculated yet. Run a daily calculation to persist results.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {historyList.map((rec) => (
                        <div
                          key={rec.calculationKey}
                          onClick={() => handleSelectHistorical(rec)}
                          className="bg-slate-950 hover:bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 p-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-between"
                        >
                          <div className="space-y-1 font-mono">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-200">
                                {rec.dayContext.calculationDate}
                              </span>
                              <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                                {rec.dayContext.timezone}
                              </span>
                              <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                                ● {rec.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              <span>Events: {rec.summary.totalEvents}</span> •{' '}
                              <span>Boundary: {rec.summary.boundaryEventsCount}</span> •{' '}
                              <span>ID: {rec.calculationId.slice(0, 22)}...</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button className="px-3 py-1 text-xs font-mono bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-200 rounded-lg transition-colors flex items-center gap-1">
                              <span>Load</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ACCEPTANCE TESTS */}
              {activeSubTab === 'tests' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">
                        Section 21 Acceptance Test Suite
                      </h4>
                      <p className="text-xs text-slate-400">
                        21 criteria covering local midnight detection, UTC boundaries, immutability, and MOD-15
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRunDrawTests}
                        disabled={isRunningDrawTests}
                        className="px-3.5 py-2 rounded-lg text-xs font-mono font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow"
                      >
                        {isRunningDrawTests ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>TESTING DRAWS...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 fill-current" />
                            <span>10 DRAW TESTS</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleRunAcceptanceTests}
                        disabled={isRunningTests}
                        className="px-3.5 py-2 rounded-lg text-xs font-mono font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow"
                      >
                        {isRunningTests ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>TESTING NEW DAY...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>21 NEW DAY TESTS</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Draw Test Report Banner & Table */}
                  {drawTestReport && (
                    <div className="space-y-2.5 font-mono">
                      <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {drawTestReport.allPassed ? '🎯' : '⚠️'}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-slate-200">
                              Lottery Draw Suite: {drawTestReport.allPassed ? '10/10 PASS (100%)' : 'FAILURES DETECTED'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Chofu 18:50 JST • Yangon AM 12:01 MMT • Yangon PM 16:10 MMT • Bangkok PM 15:45 ICT
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                          AUTHORITATIVE
                        </span>
                      </div>

                      <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                        {drawTestReport.results.map((t, tIdx) => (
                          <div
                            key={`${t.id}-${tIdx}`}
                            className={`p-2 rounded-lg border text-[11px] flex items-center justify-between ${
                              t.status === 'PASS'
                                ? 'bg-slate-950/80 border-slate-800 text-slate-300'
                                : 'bg-rose-950/20 border-rose-800 text-rose-300'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-amber-400 font-bold">#{t.id}</span>
                                <span className="font-semibold">{t.criterion}</span>
                                <span className="text-[9px] text-slate-500 bg-slate-800 px-1 py-0.2 rounded">
                                  {t.category}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400">{t.details}</div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                t.status === 'PASS'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {t.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {testReport && (
                    <div className="space-y-3 font-mono">
                      {/* KPI Banner */}
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {testReport.allPassed ? '✅' : '⚠️'}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-slate-200">
                              Suite Result: {testReport.allPassed ? '100% PASS' : 'FAILURES DETECTED'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {testReport.passedCount} of {testReport.totalTests} tests passed
                            </div>
                          </div>
                        </div>
                        <div className="text-xs font-bold text-emerald-400">
                          {testReport.allPassed ? 'ALL CRITERIA SATISFIED' : ''}
                        </div>
                      </div>

                      {/* Test Items Table */}
                      <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                        {testReport.results.map((t, tIdx) => (
                          <div
                            key={`${t.id}-${tIdx}`}
                            className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                              t.status === 'PASS'
                                ? 'bg-slate-950/80 border-slate-800 text-slate-300'
                                : 'bg-rose-950/20 border-rose-800 text-rose-300'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500 font-bold">#{t.id}</span>
                                <span className="font-semibold">{t.name}</span>
                                <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.2 rounded">
                                  {t.category}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400">{t.details}</div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                t.status === 'PASS'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {t.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!testReport && !isRunningTests && (
                    <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-500 text-xs font-mono">
                      Click &ldquo;Run All 21 Tests&rdquo; to execute the automated verification suite.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
