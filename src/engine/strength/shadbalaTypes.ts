/**
 * DSSME EVENT ENGINE V1.0 - SHADBALA TYPES & CONTEXT INTERFACES
 */

import { PlanetState, HouseInfo, PanchangaState, AspectPlanetItem, AspectBhavaItem } from '../types.js';
import { ShadbalaPlanet } from './shadbalaConstants.js';

export interface SthanaBalaBreakdown {
  uchcha: number;
  saptavargaja: number;
  ojayugama: number;
  kendradi: number;
  dreshkon: number;
  total: number;
}

export interface KaalaBalaBreakdown {
  nathonnatha: number;
  paksha: number;
  tribhaga: number;
  abda: number;
  masa: number;
  vaara: number;
  hora: number;
  ayana: number;
  yuddha: number;
  total: number;
}

export interface PlanetShadbalaTrace {
  planet: ShadbalaPlanet;
  sthana: SthanaBalaBreakdown;
  kaala: KaalaBalaBreakdown;
  dig: number;
  chesta: number;
  naisargika: number;
  drik: number;
  totalVirupas: number;
  totalRupas: number;
  strengthRatio: number;
  rank: number;
}

export interface ShadbalaTrace {
  timestamp: string;
  planets: Record<ShadbalaPlanet, PlanetShadbalaTrace>;
  firewallPassed: boolean;
  totalDecompositionChecksum: boolean;
}

export interface ShadbalaContext {
  datetime?: string;
  julianDay?: number;
  latitude?: number;
  longitude?: number;
  ayanamsa?: string | number;
  planets: Record<string, PlanetState>;
  houses: HouseInfo[];
  panchanga?: PanchangaState;
  aspectsPlanets?: AspectPlanetItem[];
  aspectsBhavas?: Record<string, AspectBhavaItem> | AspectBhavaItem[];
  timeStr?: string;
  hora?: string | { planet: string };
  lagnaLongitude?: number;
  bhavaMadhya?: number[]; // Longitudes of house midpoints / cusps (12 houses)
}
