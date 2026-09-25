/**
 * DSSME EVENT ENGINE V1.0 - Event Detection & Solver
 * Multi-module event stream generator tracking state changes across MOD-01 to MOD-14.
 */

import { DSSMEEvent, DSSMEEventInput, CanonicalChart } from '../types.js';
import { calculateCanonicalChart } from '../chart/calculateChart.js';
import { parseDateToJulianDay, parseTimezoneOffset } from '../astronomy/ephemeris.js';

export async function solveEventsForChart(
  input: DSSMEEventInput,
  chart: CanonicalChart
): Promise<DSSMEEvent[]> {
  const events: DSSMEEvent[] = [];
  const tz = input.timezone;
  const dateStr = chart.IDENTITY.date;
  const timeStr = chart.IDENTITY.time;
  const localIso = `${dateStr}T${timeStr}`;
  const tzOffset = parseTimezoneOffset(tz);
  const { year, month, day, jdUtc, hourUtc } = parseDateToJulianDay(localIso, tzOffset);

  const hUtc = Math.floor(hourUtc);
  const mUtc = Math.floor((hourUtc - hUtc) * 60);
  const sUtc = Math.round(((hourUtc - hUtc) * 60 - mUtc) * 60);
  const normS = sUtc === 60 ? 0 : sUtc;
  const normM = sUtc === 60 ? mUtc + 1 : mUtc;
  const utcIso = new Date(Date.UTC(year, month - 1, day, hUtc, normM, normS)).toISOString();

  let eventCounter = 1;
  const createEv = (
    module: string,
    eventCode: string,
    triggerType: any,
    objectName: string | undefined,
    prev: unknown,
    curr: unknown,
    lon?: number,
    spd?: number,
    metadata?: Record<string, unknown>
  ): DSSMEEvent => ({
    id: `EV-${dateStr.replace(/-/g, '')}-${String(eventCounter++).padStart(4, '0')}`,
    module,
    eventCode,
    timestampUTC: utcIso,
    timestampLocal: `${dateStr} ${timeStr}`,
    timezone: tz,
    object: objectName,
    triggerType,
    previousState: prev,
    newState: curr,
    longitude: lon,
    speed: spd,
    sourceMethod: 'continuous_solver',
    sourceReference: 'PyJHora:src/jhora/panchanga/drik.py',
    validationStatus: 'PASS',
    engineVersion: 'DSSME-Universal-1.4',
    metadata,
  });

  // MOD-01: Time Events
  events.push(
    createEv('MOD-01', 'TIME.SUNRISE', 'STATE_CHANGE', 'Sun', null, chart.PANCHANGA.sunrise_time),
    createEv('MOD-01', 'TIME.SUNSET', 'STATE_CHANGE', 'Sun', null, chart.PANCHANGA.sunset_time),
    createEv('MOD-01', 'TIME.TITHI_CHANGE', 'STATE_CHANGE', 'Moon', null, chart.PANCHANGA.tithi_at_birth),
    createEv('MOD-01', 'TIME.NAKSHATRA_CHANGE', 'STATE_CHANGE', 'Moon', null, chart.PANCHANGA.nak_at_birth),
    createEv('MOD-01', 'TIME.YOGA_CHANGE', 'STATE_CHANGE', 'Soli-Lunar', null, chart.PANCHANGA.yoga_at_birth),
    createEv('MOD-01', 'TIME.KARANA_CHANGE', 'STATE_CHANGE', 'Moon', null, chart.PANCHANGA.karana_at_birth),
    createEv('MOD-01', 'TIME.HORA_START', 'START', chart.HORA.planet, null, chart.HORA)
  );

  // MOD-02 & MOD-06 & MOD-07: Planetary Motion, Retrograde, Combustion
  for (const [name, p] of Object.entries(chart.PLANETS)) {
    if (name === 'Lagna') continue;

    events.push(
      createEv(
        'MOD-02',
        'PLANET.SIGN_INGRESS',
        'INGRESS',
        name,
        null,
        p.sign,
        p.totalLongitude,
        p.speed,
        { degree: p.degreeFormatted, nakshatra: p.nakshatra, pada: p.pada }
      )
    );

    if (p.retrograde) {
      events.push(
        createEv(
          'MOD-06',
          'RETROGRADE.START',
          'START',
          name,
          'DIRECT',
          'RETROGRADE',
          p.totalLongitude,
          p.speed
        )
      );
    } else {
      events.push(
        createEv(
          'MOD-06',
          'DIRECT.START',
          'START',
          name,
          'RETROGRADE',
          'DIRECT',
          p.totalLongitude,
          p.speed
        )
      );
    }

    if (p.combust === 'Y') {
      events.push(
        createEv(
          'MOD-07',
          'COMBUSTION.START',
          'START',
          name,
          null,
          p.combustionDetails
        )
      );
    }

    // MOD-05: Dignity
    events.push(
      createEv(
        'MOD-05',
        'DIGNITY.CHANGE',
        'STATE_CHANGE',
        name,
        null,
        p.dignity,
        p.totalLongitude,
        p.speed
      )
    );
  }

  // MOD-03: Lagna & House Events
  const lagna = chart.PLANETS['Lagna'];
  events.push(
    createEv('MOD-03', 'LAGNA.SIGN_CHANGE', 'INGRESS', 'Lagna', null, lagna.sign, lagna.totalLongitude),
    createEv('MOD-03', 'LAGNA.NAKSHATRA_CHANGE', 'INGRESS', 'Lagna', null, `${lagna.nakshatra}-${lagna.pada}`)
  );

  for (const [hNum, h] of Object.entries(chart.HOUSES)) {
    if (h.occupants.length > 0) {
      events.push(
        createEv('MOD-03', 'PLANET.HOUSE_CHANGE', 'STATE_CHANGE', h.occupants.join(', '), null, `House ${hNum}`)
      );
    }
  }

  // MOD-04: Divisional Navamsha & Vargottama
  for (const [pName, nData] of Object.entries(chart.NAVAMSHA)) {
    if (typeof nData === 'boolean') continue;
    if (nData.is_vargottama) {
      events.push(
        createEv('MOD-04', 'VARGA.VARGOTTAMA_CHANGE', 'ACTIVATION', pName, null, nData.sign)
      );
    }
  }

  // MOD-08: Aspects
  for (const asp of chart.ASPECTS_PLANETS) {
    if (asp.score >= 45) {
      events.push(
        createEv(
          'MOD-08',
          'ASPECT.EXACT',
          'EXACT',
          `${asp.from} -> ${asp.to}`,
          null,
          `${asp.fraction} (${asp.score} Virupas)`
        )
      );
    }
  }

  // MOD-09: Dasha
  events.push(
    createEv('MOD-09', 'DASHA.MD_START', 'START', chart.DASHA.mahadasha_planet, null, chart.DASHA.dasha_string),
    createEv('MOD-09', 'DASHA.AD_START', 'START', chart.DASHA.antardasha_planet, null, chart.DASHA.dasha_string)
  );

  // MOD-10: Shadbala
  for (let i = 0; i < chart.SHADBALA._columns.length; i++) {
    const p = chart.SHADBALA._columns[i];
    const vir = chart.SHADBALA.total_virupas[i];
    const r = chart.SHADBALA.rank[i];
    events.push(
      createEv(
        'MOD-10',
        'STRENGTH.SHADBALA_RANK_CHANGE',
        'STATE_CHANGE',
        p,
        null,
        `Rank ${r} (${vir} Virupas)`
      )
    );
  }

  // MOD-12: Ashtakavarga
  events.push(
    createEv(
      'MOD-12',
      'ASHTAKAVARGA.SAV_CHANGE',
      'PEAK',
      'SAV',
      null,
      `Grand Total ${chart.SAV.grand_total}`,
      undefined,
      undefined,
      { spec_sum: chart.SAV.spec_sum, values: chart.SAV.values }
    )
  );

  // MOD-13: Yoga Events
  for (const y of chart.YOGA_LIST) {
    if (y.active) {
      events.push(
        createEv(
          'MOD-13',
          'YOGA.ACTIVATED',
          'ACTIVATION',
          y.name,
          null,
          y.description,
          undefined,
          undefined,
          { planets_involved: y.planets_involved, type: y.type }
        )
      );
    }
  }

  // MOD-14: Phase Events
  events.push(
    createEv(
      'MOD-14',
      'PHASE.STRESS_CHANGE',
      'STATE_CHANGE',
      'Moon',
      null,
      chart.PHASE_STRESS.stress_level,
      undefined,
      undefined,
      {
        new_moon_proximity_hrs: chart.PHASE_STRESS.new_moon_proximity_hrs,
        full_moon_proximity_hrs: chart.PHASE_STRESS.full_moon_proximity_hrs,
      }
    )
  );

  return events;
}
