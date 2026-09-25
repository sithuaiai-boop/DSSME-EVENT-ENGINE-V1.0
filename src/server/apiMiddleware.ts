/**
 * DSSME EVENT ENGINE V1.0 - Server API Handler & Vite Middleware
 * Handles /api/* endpoints for Day Rollover, Chart State, and Benchmark.
 */

import { IncomingMessage, ServerResponse } from 'http';
import { newDayOrchestrator } from '../engine/day/newDayOrchestrator.js';
import { dayPersistence } from '../engine/day/dayPersistence.js';
import { runNewDayAcceptanceTests } from '../engine/day/newDayTests.js';
import { calculateCanonicalChart } from '../engine/chart/calculateChart.js';
import { solveEventsForChart } from '../engine/events/eventSolver.js';
import { runChofuBenchmark } from '../engine/benchmark/chofuBenchmark.js';
import { ENGINE_VERSION, EPHEMERIS_VERSION, getLocalCalendarDate } from '../engine/day/dayUtils.js';
import { LOTTERY_DRAW_TIMES, getDrawUtcInstant, getDrawTimeString } from '../engine/lottery/drawConfig.js';
import { runLotteryDrawTests } from '../engine/lottery/drawTests.js';

function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(data, null, 2));
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || '';
  if (!url.startsWith('/api/')) return false;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.end();
    return true;
  }

  try {
    // 1. GET /api/health
    if (url === '/api/health' && req.method === 'GET') {
      sendJson(res, 200, {
        status: 'UP',
        engineVersion: ENGINE_VERSION,
        ephemerisVersion: EPHEMERIS_VERSION,
        uptimeSeconds: process.uptime(),
        timestampUTC: new Date().toISOString(),
      });
      return true;
    }

    // 2. GET /api/version
    if (url === '/api/version' && req.method === 'GET') {
      sendJson(res, 200, {
        name: 'DSSME EVENT ENGINE V1.0',
        engineVersion: ENGINE_VERSION,
        ephemerisVersion: EPHEMERIS_VERSION,
        commitHash: 'dssme-universal-v1.4-day-rollover',
        environment: 'node-esm-wasm',
      });
      return true;
    }

    // 3. GET /api/day/current
    if (url === '/api/day/current' && req.method === 'GET') {
      const status = newDayOrchestrator.getStatus();
      sendJson(res, 200, {
        status: status.isProcessing ? 'running' : 'completed',
        timezone: status.configuredTimezone,
        calculationDate: status.currentLocalCalendarDate,
        activeRecord: status.activeRecord || null,
        historyCount: status.historyCount,
        engineVersion: ENGINE_VERSION,
        ephemerisVersion: EPHEMERIS_VERSION,
      });
      return true;
    }

    // 4. POST /api/day/calculate
    if (url === '/api/day/calculate' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const response = await newDayOrchestrator.calculateDay(body);
      sendJson(res, response.success ? 200 : 400, response);
      return true;
    }

    // 5. GET /api/day/history
    if (url === '/api/day/history' && req.method === 'GET') {
      const history = dayPersistence.getAllRecords().map((r) => ({
        jobId: r.jobId,
        calculationId: r.calculationId,
        calculationKey: r.calculationKey,
        calculationDate: r.dayContext.calculationDate,
        timezone: r.dayContext.timezone,
        status: r.status,
        totalEvents: r.summary.totalEvents,
        boundaryEventsCount: r.summary.boundaryEventsCount,
        startedAt: r.startedAt,
        completedAt: r.completedAt,
        durationMs: r.summary.executionDurationMs,
      }));
      sendJson(res, 200, {
        total: history.length,
        history,
      });
      return true;
    }

    // 6. GET /api/day/tests
    if (url === '/api/day/tests' && req.method === 'GET') {
      const suiteReport = await runNewDayAcceptanceTests();
      sendJson(res, 200, suiteReport);
      return true;
    }

    // 7. GET /api/lottery/schedule
    if (url === '/api/lottery/schedule' && req.method === 'GET') {
      const today = getLocalCalendarDate('Asia/Yangon');
      const schedule = LOTTERY_DRAW_TIMES.map((d) => ({
        id: d.id,
        location: d.location,
        country: d.country,
        timezone: d.timezone,
        session: d.session,
        drawTime: getDrawTimeString(d),
        abbreviation: d.abbreviation,
        label: d.label,
        utcInstant: getDrawUtcInstant(d, today),
        latitude: d.latitude,
        longitude: d.longitude,
      }));
      sendJson(res, 200, {
        authoritative: true,
        referenceDate: today,
        schedule,
      });
      return true;
    }

    // 8. GET /api/lottery/tests
    if (url === '/api/lottery/tests' && req.method === 'GET') {
      const report = await runLotteryDrawTests();
      sendJson(res, 200, report);
      return true;
    }

    // 9. GET /api/benchmark
    if (url === '/api/benchmark' && req.method === 'GET') {
      const chart = await calculateCanonicalChart({
        datetime: '2026-09-16 18:50:00',
        timezone: 'UTC+9',
        location: { latitude: 35.6528, longitude: 139.5447, city: 'Chofu', country: 'Japan' },
        ayanamsa: 'Lahiri',
      });
      const report = runChofuBenchmark(chart);
      sendJson(res, 200, report);
      return true;
    }

    // 8. POST /api/chart/state
    if (url === '/api/chart/state' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const chart = await calculateCanonicalChart(body);
      sendJson(res, 200, chart);
      return true;
    }

    // 9. POST /api/events/calculate
    if (url === '/api/events/calculate' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const chart = await calculateCanonicalChart(body);
      const events = await solveEventsForChart(body, chart);
      sendJson(res, 200, { chart, events, totalEvents: events.length });
      return true;
    }

    sendJson(res, 404, { error: 'Not Found', path: url });
    return true;
  } catch (err: any) {
    console.error('API Error:', err);
    sendJson(res, 500, { error: err?.message || 'Internal Server Error' });
    return true;
  }
}
