/**
 * DSSME EVENT ENGINE V1.0 - Daily Calculation Workflow
 * Implements step-by-step durable time-grid execution, midnight boundary state,
 * state transition detection, and event normalizer.
 */

import { CanonicalChart, DSSMEEvent, DSSMEEventInput } from '../types.js';
import { calculateCanonicalChart } from '../chart/calculateChart.js';
import { solveEventsForChart } from '../events/eventSolver.js';
import { DayContext, DailyCalculationRecord, DailyStepDefinition, DayJobStatus, DrawTimeCalculationInstance } from './dayTypes.js';
import { computeLocalDayUtcBoundaries, generateDailyStepGrid, generateDailyCalculationKey } from './dayUtils.js';
import {
  LOTTERY_DRAW_TIMES,
  getDrawTimeString,
  getDrawCalculationId,
  getDrawUtcInstant,
  createDrawEventInput,
} from '../lottery/drawConfig.js';

export interface WorkflowProgressCallback {
  (step: number, totalSteps: number, currentLocalTime: string, eventsFound: number): void;
}

/**
 * Detects state transitions between two consecutive chronological charts (T_prev -> T_curr).
 */
export function detectChartTransitions(
  prevChart: CanonicalChart,
  currChart: CanonicalChart,
  timestampLocal: string,
  timestampUtc: string,
  timezone: string,
  contextNote: string = 'step_transition'
): DSSMEEvent[] {
  const events: DSSMEEvent[] = [];
  const dateStr = currChart.IDENTITY.date;
  let counter = 1;

  const createEvent = (
    module: string,
    eventCode: string,
    triggerType: any,
    objectName: string | undefined,
    prevVal: unknown,
    currVal: unknown,
    lon?: number,
    spd?: number,
    metadata?: Record<string, unknown>
  ): DSSMEEvent => ({
    id: `EV-TR-${dateStr.replace(/-/g, '')}-${Date.now().toString(36)}-${String(counter++).padStart(3, '0')}`,
    module,
    eventCode,
    timestampUTC: timestampUtc,
    timestampLocal,
    timezone,
    object: objectName,
    triggerType,
    previousState: prevVal,
    newState: currVal,
    longitude: lon,
    speed: spd,
    sourceMethod: 'state_transition_detector',
    sourceReference: `PyJHora:drik.py [${contextNote}]`,
    validationStatus: 'PASS',
    engineVersion: 'DSSME-Universal-1.4',
    metadata,
  });

  // 1. MOD-01: Panchanga Transitions
  if (prevChart.PANCHANGA.tithi_name !== currChart.PANCHANGA.tithi_name) {
    events.push(
      createEvent(
        'MOD-01',
        'TIME.TITHI_CHANGE',
        'STATE_CHANGE',
        'Moon',
        prevChart.PANCHANGA.tithi_name,
        currChart.PANCHANGA.tithi_name,
        currChart.PLANETS['Moon']?.totalLongitude,
        currChart.PLANETS['Moon']?.speed,
        { context: contextNote, paksha: currChart.PANCHANGA.paksha }
      )
    );
  }

  if (prevChart.PANCHANGA.nakshatra_name !== currChart.PANCHANGA.nakshatra_name) {
    events.push(
      createEvent(
        'MOD-01',
        'TIME.NAKSHATRA_CHANGE',
        'STATE_CHANGE',
        'Moon',
        prevChart.PANCHANGA.nakshatra_name,
        currChart.PANCHANGA.nakshatra_name,
        currChart.PLANETS['Moon']?.totalLongitude,
        currChart.PLANETS['Moon']?.speed,
        { context: contextNote, pada: currChart.PANCHANGA.nakshatra_pada }
      )
    );
  }

  if (prevChart.PANCHANGA.yoga_name !== currChart.PANCHANGA.yoga_name) {
    events.push(
      createEvent(
        'MOD-01',
        'TIME.YOGA_CHANGE',
        'STATE_CHANGE',
        'Soli-Lunar',
        prevChart.PANCHANGA.yoga_name,
        currChart.PANCHANGA.yoga_name,
        undefined,
        undefined,
        { context: contextNote }
      )
    );
  }

  if (prevChart.PANCHANGA.karana_name !== currChart.PANCHANGA.karana_name) {
    events.push(
      createEvent(
        'MOD-01',
        'TIME.KARANA_CHANGE',
        'STATE_CHANGE',
        'Moon',
        prevChart.PANCHANGA.karana_name,
        currChart.PANCHANGA.karana_name,
        undefined,
        undefined,
        { context: contextNote }
      )
    );
  }

  if (prevChart.HORA.planet !== currChart.HORA.planet) {
    events.push(
      createEvent(
        'MOD-01',
        'TIME.HORA_CHANGE',
        'STATE_CHANGE',
        currChart.HORA.planet,
        prevChart.HORA.planet,
        currChart.HORA.planet,
        undefined,
        undefined,
        { horaIndex: currChart.HORA.hora_number }
      )
    );
  }

  // 2. MOD-03: Ascendant / Lagna Sign Ingress
  if (prevChart.IDENTITY.lagna_sign !== currChart.IDENTITY.lagna_sign) {
    events.push(
      createEvent(
        'MOD-03',
        'ASCENDANT.SIGN_INGRESS',
        'INGRESS',
        'Lagna',
        prevChart.IDENTITY.lagna_sign,
        currChart.IDENTITY.lagna_sign,
        currChart.PLANETS['Lagna']?.totalLongitude,
        undefined,
        { context: contextNote, previousSign: prevChart.IDENTITY.lagna_sign }
      )
    );
  }

  // 3. Planetary Transitions: Motion, Dignity, Retrograde, Combustion
  const planetNames = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

  for (const p of planetNames) {
    const prevP = prevChart.PLANETS[p];
    const currP = currChart.PLANETS[p];
    if (!prevP || !currP) continue;

    // Sign Ingress (MOD-02)
    if (prevP.sign !== currP.sign) {
      events.push(
        createEvent(
          'MOD-02',
          'PLANET.SIGN_INGRESS',
          'INGRESS',
          p,
          prevP.sign,
          currP.sign,
          currP.totalLongitude,
          currP.speed,
          { fromSign: prevP.sign, toSign: currP.sign, context: contextNote }
        )
      );
    }

    // Nakshatra Ingress (MOD-02)
    if (prevP.nakshatra !== currP.nakshatra) {
      events.push(
        createEvent(
          'MOD-02',
          'PLANET.NAKSHATRA_INGRESS',
          'INGRESS',
          p,
          prevP.nakshatra,
          currP.nakshatra,
          currP.totalLongitude,
          currP.speed,
          { context: contextNote }
        )
      );
    }

    // Retrograde / Direct Station (MOD-06)
    if (prevP.retrograde !== currP.retrograde) {
      const code = currP.retrograde ? 'PLANET.STATION_RETROGRADE' : 'PLANET.STATION_DIRECT';
      events.push(
        createEvent(
          'MOD-06',
          code,
          'STATE_CHANGE',
          p,
          prevP.retrograde ? 'R' : 'D',
          currP.retrograde ? 'R' : 'D',
          currP.totalLongitude,
          currP.speed,
          { context: contextNote }
        )
      );
    }

    // Combustion Ingress / Release (MOD-07)
    if (prevP.combust !== currP.combust) {
      const isCombust = currP.combust === 'Y';
      const code = isCombust ? 'COMBUSTION.START' : 'COMBUSTION.END';
      events.push(
        createEvent(
          'MOD-07',
          code,
          isCombust ? 'START' : 'END',
          p,
          prevP.combust,
          currP.combust,
          currP.totalLongitude,
          currP.speed,
          { context: contextNote }
        )
      );
    }

    // Dignity Transition (MOD-05)
    if (prevP.dignity !== currP.dignity) {
      events.push(
        createEvent(
          'MOD-05',
          'DIGNITY.STATE_CHANGE',
          'STATE_CHANGE',
          p,
          prevP.dignity,
          currP.dignity,
          currP.totalLongitude,
          currP.speed,
          { context: contextNote }
        )
      );
    }

    // House Transit (MOD-03)
    if (prevP.house !== currP.house) {
      events.push(
        createEvent(
          'MOD-03',
          'HOUSE.INGRESS',
          'INGRESS',
          p,
          `H${prevP.house}`,
          `H${currP.house}`,
          currP.totalLongitude,
          currP.speed,
          { context: contextNote }
        )
      );
    }
  }

  // 4. MOD-09: Vimshottari Dasha Transitions
  if (
    prevChart.DASHA.pratyantara !== currChart.DASHA.pratyantara ||
    prevChart.DASHA.antardasha_planet !== currChart.DASHA.antardasha_planet
  ) {
    events.push(
      createEvent(
        'MOD-09',
        'DASHA.TRANSITION',
        'STATE_CHANGE',
        currChart.DASHA.mahadasha_planet,
        `${prevChart.DASHA.mahadasha_planet}-${prevChart.DASHA.antardasha_planet}-${prevChart.DASHA.pratyantara}`,
        `${currChart.DASHA.mahadasha_planet}-${currChart.DASHA.antardasha_planet}-${currChart.DASHA.pratyantara}`,
        undefined,
        undefined,
        { context: contextNote }
      )
    );
  }

  return events;
}

/**
 * Executes full New Day calculation workflow.
 * 1. Derives midnight boundary state.
 * 2. Runs durable step grid.
 * 3. Compares step transitions.
 * 4. Merges and deduplicates events.
 */
export async function executeNewDayWorkflow(
  dayContext: DayContext,
  stepMinutes: number = 60,
  onProgress?: WorkflowProgressCallback
): Promise<DailyCalculationRecord> {
  const startTime = Date.now();
  const boundaries = computeLocalDayUtcBoundaries(dayContext.calculationDate, dayContext.timezone);
  const steps = generateDailyStepGrid(dayContext.calculationDate, dayContext.timezone, stepMinutes);
  const totalSteps = steps.length;

  const loc = {
    latitude: dayContext.latitude,
    longitude: dayContext.longitude,
    city: dayContext.timezone.split('/')[1] || 'Yangon',
    country: dayContext.timezone.includes('Yangon') ? 'Myanmar' : 'Default',
  };

  // Phase 1: Calculate Boundary Sample T(previous day 23:59:00)
  const boundaryInput: DSSMEEventInput = {
    datetime: boundaries.boundarySampleLocal,
    timezone: dayContext.timezone,
    location: loc,
    ayanamsa: 'Lahiri',
  };
  const boundaryChart = await calculateCanonicalChart(boundaryInput);

  // Phase 2: Calculate Day Start Chart T(00:00:00)
  const dayStartInput: DSSMEEventInput = {
    datetime: `${dayContext.calculationDate} 00:00:00`,
    timezone: dayContext.timezone,
    location: loc,
    ayanamsa: 'Lahiri',
  };
  const dayStartChart = await calculateCanonicalChart(dayStartInput);

  // Phase 3: Detect midnight boundary crossing transitions
  const boundaryEvents = detectChartTransitions(
    boundaryChart,
    dayStartChart,
    `${dayContext.calculationDate} 00:00:00`,
    dayContext.utcStart,
    dayContext.timezone,
    'midnight_boundary'
  );

  // Base snapshot events for the new day
  const baseDayEvents = await solveEventsForChart(dayStartInput, dayStartChart);

  const allEvents: DSSMEEvent[] = [...boundaryEvents, ...baseDayEvents];
  let prevStepChart = dayStartChart;

  // Phase 4: Iterate over daily time grid steps
  for (let i = 1; i < steps.length; i++) {
    const step = steps[i];
    const stepInput: DSSMEEventInput = {
      datetime: step.localTime,
      timezone: dayContext.timezone,
      location: loc,
      ayanamsa: 'Lahiri',
    };

    const currentStepChart = await calculateCanonicalChart(stepInput);
    const stepTransitions = detectChartTransitions(
      prevStepChart,
      currentStepChart,
      step.localTime,
      step.utcTime,
      dayContext.timezone,
      `step_${i}`
    );

    allEvents.push(...stepTransitions);
    prevStepChart = currentStepChart;

    if (onProgress) {
      onProgress(i + 1, totalSteps, step.localTime, allEvents.length);
    }
  }

  // Deduplicate events by unique key: module + eventCode + object + timestampLocal
  const seenKeys = new Set<string>();
  const deduplicatedEvents: DSSMEEvent[] = [];

  for (const ev of allEvents) {
    const key = `${ev.module}|${ev.eventCode}|${ev.object || ''}|${ev.timestampLocal}|${String(ev.newState)}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      deduplicatedEvents.push(ev);
    }
  }

  // Phase 5: Calculate Authoritative Lottery Draw Instances
  const drawCalculations: DrawTimeCalculationInstance[] = [];
  for (const draw of LOTTERY_DRAW_TIMES) {
    const drawInput = createDrawEventInput(draw, dayContext.calculationDate);
    const drawChart = await calculateCanonicalChart(drawInput);
    const drawEvents = await solveEventsForChart(drawInput, drawChart);
    const calcId = getDrawCalculationId(draw, dayContext.calculationDate);
    const utcInstant = getDrawUtcInstant(draw, dayContext.calculationDate);

    drawCalculations.push({
      drawId: draw.id,
      location: draw.location,
      country: draw.country,
      timezone: draw.timezone,
      session: draw.session,
      localTime: getDrawTimeString(draw),
      localDatetime: drawInput.datetime,
      utcInstant,
      calculationId: calcId,
      chart: drawChart,
      eventsCount: drawEvents.length,
    });
  }

  const durationMs = Date.now() - startTime;
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

  const modulesRun = Array.from(new Set(deduplicatedEvents.map((e) => e.module))).sort();

  return {
    jobId: `JOB-${dayContext.calculationDate.replace(/-/g, '')}-${Date.now().toString(36)}`,
    calculationId: dayContext.calculationId,
    calculationKey: calcKey,
    dayContext,
    status: 'completed',
    totalSteps,
    completedSteps: totalSteps,
    startedAt: new Date(startTime).toISOString(),
    completedAt: new Date().toISOString(),
    chart: dayStartChart,
    boundaryEvents,
    events: deduplicatedEvents,
    drawCalculations,
    summary: {
      totalEvents: deduplicatedEvents.length,
      boundaryEventsCount: boundaryEvents.length,
      drawCalculationsCount: drawCalculations.length,
      modulesRun,
      executionDurationMs: durationMs,
    },
  };
}
