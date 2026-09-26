/**
 * DSSME EVENT ENGINE V1.0 - NAISARGIKA BALA
 * Fixed natural luminosity strength based on PyJHora const.naisargika_bala[:-2]
 */

import { FIXED_NAISARGIKA_BALA } from './shadbalaConstants.js';

export function calculateNaisargikaBalaAll(): number[] {
  return [...FIXED_NAISARGIKA_BALA];
}
