/**
 * DSSME EVENT ENGINE V1.0 - MOD-07 Combustion Engine
 * Calculate Sun separation, combustion state, severity, entry/exit thresholds.
 */

export interface CombustionResult {
  combust: boolean;
  sep_deg: number;
  severity: 'Mild' | 'Severe' | 'None' | null;
}

export const COMBUSTION_THRESHOLDS: Record<string, { direct: number; retro: number }> = {
  Moon: { direct: 12.0, retro: 12.0 },
  Mars: { direct: 17.0, retro: 17.0 },
  Mercury: { direct: 14.0, retro: 13.0 },
  Jupiter: { direct: 11.0, retro: 11.0 },
  Venus: { direct: 10.0, retro: 8.0 },
  Saturn: { direct: 15.0, retro: 15.0 },
};

/**
 * Calculate smallest angular separation on a circle
 */
export function angularSeparation(lon1: number, lon2: number): number {
  const diff = Math.abs(lon1 - lon2) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Check combustion status and severity
 */
export function checkCombustion(
  planetName: string,
  planetLon: number,
  sunLon: number,
  isRetrograde = false
): CombustionResult {
  if (planetName === 'Sun') {
    return { combust: false, sep_deg: 0, severity: null };
  }
  if (planetName === 'Rahu' || planetName === 'Ketu') {
    return { combust: false, sep_deg: 0, severity: 'None' };
  }

  const thresholdDef = COMBUSTION_THRESHOLDS[planetName];
  if (!thresholdDef) {
    return { combust: false, sep_deg: 0, severity: null };
  }

  const sep = angularSeparation(planetLon, sunLon);
  const threshold = isRetrograde ? thresholdDef.retro : thresholdDef.direct;
  const isCombust = sep <= threshold;

  let severity: 'Mild' | 'Severe' | null = null;
  if (isCombust) {
    // Inner 50% = Severe, Outer 50% = Mild
    if (sep <= threshold / 2) {
      severity = 'Severe';
    } else {
      severity = 'Mild';
    }
  }

  return {
    combust: isCombust,
    sep_deg: Math.round(sep * 1000) / 1000,
    severity,
  };
}
