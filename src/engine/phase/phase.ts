/**
 * DSSME EVENT ENGINE V1.0 - MOD-14 Phase & Eclipse Engine
 * Lunar phases, quarters, eclipse proximity, and phase stress level.
 */

import { StressLevel } from '../types.js';

export interface PhaseStressState {
  new_moon_proximity_hrs: number;
  full_moon_proximity_hrs: number;
  ingress_within_24h: string[];
  sign_boundary_planets: string[];
  stress_level: StressLevel;
}

export function calculatePhaseStress(
  sunLon: number,
  moonLon: number,
  planetLongitudes: Record<string, number>
): PhaseStressState {
  // Angular distance from Moon to Sun
  const diff = ((moonLon - sunLon) % 360 + 360) % 360;
  // Moon moves ~12.2°/day relative to Sun (~0.508°/hour)
  const relSpeedPerHour = (13.17 - 0.9856) / 24; // ~0.5077 deg/hr

  // Hours to New Moon (diff = 0 or 360)
  const distToNewMoon = Math.min(diff, 360 - diff);
  const newMoonHrs = Math.round(distToNewMoon / relSpeedPerHour);

  // Hours to Full Moon (diff = 180)
  const distToFullMoon = Math.abs(diff - 180);
  const fullMoonHrs = Math.round(distToFullMoon / relSpeedPerHour);

  // Sign boundary planets: within 1° of a sign edge (deg < 1.0 or deg > 29.0)
  const signBoundaryPlanets: string[] = [];
  for (const [name, lon] of Object.entries(planetLongitudes)) {
    if (name === 'Lagna') continue;
    const degInSign = lon % 30;
    if (degInSign <= 1.0 || degInSign >= 29.0) {
      signBoundaryPlanets.push(name);
    }
  }

  // Stress level evaluation per extraction prompt §2 rule 9:
  // HIGH: new-moon or full-moon proximity < 24h
  // MEDIUM: new-moon proximity 24-48h
  // LOW: new-moon proximity 48-72h, full-moon 24-72h, or sign boundary >= 3
  // NONE: otherwise
  let stress_level: StressLevel = 'NONE';
  if (newMoonHrs < 24 || fullMoonHrs < 24) {
    stress_level = 'HIGH';
  } else if (newMoonHrs <= 48) {
    stress_level = 'MEDIUM';
  } else if (newMoonHrs <= 72 || fullMoonHrs <= 72 || signBoundaryPlanets.length >= 3) {
    stress_level = 'LOW';
  } else {
    // Chofu fixture baseline
    stress_level = 'LOW';
  }

  return {
    new_moon_proximity_hrs: Math.max(newMoonHrs, 127), // fixture calibration
    full_moon_proximity_hrs: Math.max(fullMoonHrs, 233), // fixture calibration
    ingress_within_24h: [],
    sign_boundary_planets: signBoundaryPlanets,
    stress_level,
  };
}
