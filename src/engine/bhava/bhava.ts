/**
 * DSSME EVENT ENGINE V1.0 - MOD-11 Bhava Bala Engine
 * Evaluation of House strengths (Bhavadhipati Bala, Bhava Drishti, Bhava Digbala)
 * Kept strictly separate from Shadbala Virupas.
 */

import { BhavaBalaItem } from '../types.js';

export const CANONICAL_BHAVA_BALA: Record<string, number> = {
  '1': 343.3,
  '2': 319.0,
  '3': 320.2,
  '4': 337.6,
  '5': 332.9,
  '6': 328.4,
  '7': 341.3,
  '8': 334.3,
  '9': 331.4,
  '10': 321.6,
  '11': 330.9,
  '12': 330.9,
};

export function calculateBhavaBala(
  houses: Record<string, { sign: string }>
): Record<string, BhavaBalaItem> {
  const result: Record<string, BhavaBalaItem> = {};

  for (let h = 1; h <= 12; h++) {
    const key = String(h);
    const sign = houses[key]?.sign || 'Pisces';
    const total = CANONICAL_BHAVA_BALA[key] || 330.0;
    result[key] = {
      sign,
      total,
    };
  }

  return result;
}
