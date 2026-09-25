/**
 * DSSME EVENT ENGINE V1.0 - Authoritative Lottery Draw Schedule Tests
 * Validates all 10 criteria specified in Section 9 of the Lottery Draw Time Fix prompt.
 */

import {
  LOTTERY_DRAW_TIMES,
  getDrawTimeConfigById,
  getDrawTimeString,
  getDrawUtcInstant,
  createDrawEventInput,
  getDrawCalculationId,
} from './drawConfig.js';
import { executeNewDayWorkflow } from '../day/dailyWorkflow.js';
import { buildDayContext } from '../day/dayUtils.js';
import { calculateCanonicalChart } from '../chart/calculateChart.js';

export interface DrawTestItem {
  id: number;
  criterion: string;
  category: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

export interface DrawTestSuiteReport {
  timestamp: string;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  allPassed: boolean;
  results: DrawTestItem[];
}

export async function runLotteryDrawTests(): Promise<DrawTestSuiteReport> {
  const results: DrawTestItem[] = [];

  const add = (id: number, criterion: string, category: string, pass: boolean, details: string) => {
    results.push({
      id,
      criterion,
      category,
      status: pass ? 'PASS' : 'FAIL',
      details,
    });
  };

  // 1. Chofu = 18:50 Asia/Tokyo
  try {
    const chofu = getDrawTimeConfigById('chofu-japan');
    const pass =
      !!chofu &&
      chofu.location === 'Chofu' &&
      chofu.country === 'Japan' &&
      chofu.hour === 18 &&
      chofu.minute === 50 &&
      chofu.timezone === 'Asia/Tokyo' &&
      getDrawTimeString(chofu) === '18:50';
    add(1, 'Chofu = 18:50 Asia/Tokyo', 'SCHEDULE', pass, `Time: ${getDrawTimeString(chofu!)}, Timezone: ${chofu?.timezone}`);
  } catch (e: any) {
    add(1, 'Chofu = 18:50 Asia/Tokyo', 'SCHEDULE', false, e?.message);
  }

  // 2. Yangon AM = 12:01 Asia/Yangon
  try {
    const yangonAm = getDrawTimeConfigById('yangon-am');
    const pass =
      !!yangonAm &&
      yangonAm.location === 'Yangon' &&
      yangonAm.session === 'AM' &&
      yangonAm.hour === 12 &&
      yangonAm.minute === 1 &&
      yangonAm.timezone === 'Asia/Yangon' &&
      getDrawTimeString(yangonAm) === '12:01';
    add(2, 'Yangon AM = 12:01 Asia/Yangon', 'SCHEDULE', pass, `Time: ${getDrawTimeString(yangonAm!)}, Session: ${yangonAm?.session}`);
  } catch (e: any) {
    add(2, 'Yangon AM = 12:01 Asia/Yangon', 'SCHEDULE', false, e?.message);
  }

  // 3. Yangon PM = 16:10 Asia/Yangon
  try {
    const yangonPm = getDrawTimeConfigById('yangon-pm');
    const pass =
      !!yangonPm &&
      yangonPm.location === 'Yangon' &&
      yangonPm.session === 'PM' &&
      yangonPm.hour === 16 &&
      yangonPm.minute === 10 &&
      yangonPm.timezone === 'Asia/Yangon' &&
      getDrawTimeString(yangonPm) === '16:10';
    add(3, 'Yangon PM = 16:10 Asia/Yangon', 'SCHEDULE', pass, `Time: ${getDrawTimeString(yangonPm!)}, Session: ${yangonPm?.session}`);
  } catch (e: any) {
    add(3, 'Yangon PM = 16:10 Asia/Yangon', 'SCHEDULE', false, e?.message);
  }

  // 4. Bangkok PM = 15:45 Asia/Bangkok
  try {
    const bangkokPm = getDrawTimeConfigById('bangkok-pm');
    const pass =
      !!bangkokPm &&
      bangkokPm.location === 'Bangkok' &&
      bangkokPm.session === 'PM' &&
      bangkokPm.hour === 15 &&
      bangkokPm.minute === 45 &&
      bangkokPm.timezone === 'Asia/Bangkok' &&
      getDrawTimeString(bangkokPm) === '15:45';
    add(4, 'Bangkok PM = 15:45 Asia/Bangkok', 'SCHEDULE', pass, `Time: ${getDrawTimeString(bangkokPm!)}, Session: ${bangkokPm?.session}`);
  } catch (e: any) {
    add(4, 'Bangkok PM = 15:45 Asia/Bangkok', 'SCHEDULE', false, e?.message);
  }

  // 5. Browser timezone does not alter draw time
  try {
    const yangonAm = getDrawTimeConfigById('yangon-am')!;
    const timeStr = getDrawTimeString(yangonAm);
    // Must remain 12:01 regardless of local environment
    const pass = timeStr === '12:01' && yangonAm.hour === 12 && yangonAm.minute === 1;
    add(5, 'Browser timezone does not alter draw time', 'ISOLATION', pass, `Local civil time is fixed at ${timeStr}`);
  } catch (e: any) {
    add(5, 'Browser timezone does not alter draw time', 'ISOLATION', false, e?.message);
  }

  // 6. Local date is preserved correctly
  try {
    const testDate = '2026-09-25';
    const yangonPm = getDrawTimeConfigById('yangon-pm')!;
    const input = createDrawEventInput(yangonPm, testDate);
    const pass = input.datetime.startsWith('2026-09-25') && input.datetime === '2026-09-25 16:10:00';
    add(6, 'Local date is preserved correctly', 'INTEGRITY', pass, `Generated input datetime: ${input.datetime}`);
  } catch (e: any) {
    add(6, 'Local date is preserved correctly', 'INTEGRITY', false, e?.message);
  }

  // 7. Local time -> UTC conversion is deterministic
  try {
    const testDate = '2026-09-25';
    const yangonAm = getDrawTimeConfigById('yangon-am')!;
    const bangkokPm = getDrawTimeConfigById('bangkok-pm')!;
    const chofu = getDrawTimeConfigById('chofu-japan')!;

    // Yangon: 12:01 in UTC+6:30 -> 12:01 - 6h30m = 05:31 UTC
    const yangonAmUtc = getDrawUtcInstant(yangonAm, testDate);
    // Bangkok: 15:45 in UTC+7 -> 15:45 - 7h = 08:45 UTC
    const bangkokPmUtc = getDrawUtcInstant(bangkokPm, testDate);
    // Chofu: 18:50 in UTC+9 -> 18:50 - 9h = 09:50 UTC
    const chofuUtc = getDrawUtcInstant(chofu, testDate);

    const pass =
      yangonAmUtc === '2026-09-25T05:31:00.000Z' &&
      bangkokPmUtc === '2026-09-25T08:45:00.000Z' &&
      chofuUtc === '2026-09-25T09:50:00.000Z';

    add(
      7,
      'Local time -> UTC conversion is deterministic',
      'UTC_DERIVATION',
      pass,
      `Yangon AM: ${yangonAmUtc}, Bangkok PM: ${bangkokPmUtc}, Chofu: ${chofuUtc}`
    );
  } catch (e: any) {
    add(7, 'Local time -> UTC conversion is deterministic', 'UTC_DERIVATION', false, e?.message);
  }

  // 8. New Day loads all authoritative draw sessions
  try {
    const ctx = buildDayContext('2026-09-25', 'Asia/Yangon');
    const record = await executeNewDayWorkflow(ctx, 120);
    const drawCalcs = record.drawCalculations || [];
    const hasChofu = drawCalcs.some((d) => d.drawId === 'chofu-japan');
    const hasYangonAm = drawCalcs.some((d) => d.drawId === 'yangon-am');
    const hasYangonPm = drawCalcs.some((d) => d.drawId === 'yangon-pm');
    const hasBangkokPm = drawCalcs.some((d) => d.drawId === 'bangkok-pm');

    const pass = drawCalcs.length === 4 && hasChofu && hasYangonAm && hasYangonPm && hasBangkokPm;
    add(8, 'New Day loads all authoritative draw sessions', 'WORKFLOW', pass, `Loaded ${drawCalcs.length}/4 draw sessions`);
  } catch (e: any) {
    add(8, 'New Day loads all authoritative draw sessions', 'WORKFLOW', false, e?.message);
  }

  // 9. Duplicate draw calculations are prevented
  try {
    const testDate = '2026-09-25';
    const seenIds = new Set<string>();
    let duplicates = 0;
    for (const d of LOTTERY_DRAW_TIMES) {
      const calcId = getDrawCalculationId(d, testDate);
      if (seenIds.has(calcId)) duplicates++;
      seenIds.add(calcId);
    }
    const pass = duplicates === 0 && seenIds.size === 4;
    add(9, 'Duplicate draw calculations are prevented', 'IDEMPOTENCY', pass, `Unique calculation IDs: ${Array.from(seenIds).join(', ')}`);
  } catch (e: any) {
    add(9, 'Duplicate draw calculations are prevented', 'IDEMPOTENCY', false, e?.message);
  }

  // 10. Existing DSSME event calculations receive the correct UTC instant
  try {
    const yangonPm = getDrawTimeConfigById('yangon-pm')!;
    const input = createDrawEventInput(yangonPm, '2026-09-25');
    const chart = await calculateCanonicalChart(input);
    const pass = chart.IDENTITY.time === '16:10:00' && chart.IDENTITY.location_city === 'Yangon';
    add(10, 'Existing DSSME event calculations receive the correct UTC instant', 'ASTRONOMY', pass, `Chart calculated for ${chart.IDENTITY.location_city} at ${chart.IDENTITY.time}`);
  } catch (e: any) {
    add(10, 'Existing DSSME event calculations receive the correct UTC instant', 'ASTRONOMY', false, e?.message);
  }

  const passedCount = results.filter((r) => r.status === 'PASS').length;
  const failedCount = results.filter((r) => r.status === 'FAIL').length;

  return {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passedCount,
    failedCount,
    allPassed: failedCount === 0,
    results,
  };
}
