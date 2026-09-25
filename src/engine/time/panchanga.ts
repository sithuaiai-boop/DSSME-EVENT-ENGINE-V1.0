/**
 * DSSME EVENT ENGINE V1.0 - MOD-01 Time & Panchanga Engine
 * Calculation of Tithi, Nakshatra, Yoga, Karana, Paksha, Hora, and day/night transitions.
 */

import { PanchangaState, PakshaType } from '../types.js';

export const TITHI_NAMES = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashti', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashti', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya'
] as const;

export const YOGA_NAMES = [
  'Vishkumbha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana',
  'Atiganda', 'Sukarma', 'Dhriti', 'Shoola', 'Ganda',
  'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra',
  'Siddhi', 'Vyatipata', 'Variyan', 'Parigha', 'Shiva',
  'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma',
  'Indra', 'Vaidhriti'
] as const;

export const MOVABLE_KARANAS = [
  'Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti'
] as const;

export const FIXED_KARANAS = [
  'Shakuni', 'Chatushpada', 'Naga', 'Kintughna'
] as const;

export const CHALDEAN_HORA_ORDER = [
  'Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars'
] as const;

export const WEEKDAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
] as const;

export const WEEKDAY_LORDS: Record<string, string> = {
  Sunday: 'Sun',
  Monday: 'Moon',
  Tuesday: 'Mars',
  Wednesday: 'Mercury',
  Thursday: 'Jupiter',
  Friday: 'Venus',
  Saturday: 'Saturn',
};

/**
 * Calculate Tithi (1-30) from Sun and Moon longitudes
 */
export function calculateTithi(sunLon: number, moonLon: number): {
  tithiNumber: number; // 1-30
  tithiName: string;
  paksha: PakshaType;
  tithiAtBirth: string;
} {
  const diff = ((moonLon - sunLon) % 360 + 360) % 360;
  const tithiIndex = Math.floor(diff / 12); // 0-29
  const tithiNumber = tithiIndex + 1;
  const paksha: PakshaType = tithiIndex < 15 ? 'Shukla' : 'Krishna';
  const tithiName = TITHI_NAMES[tithiIndex];
  const tithiAtBirth = `${tithiName} (${String(tithiNumber).padStart(2, '0')})`;

  return { tithiNumber, tithiName, paksha, tithiAtBirth };
}

/**
 * Calculate Soli-Lunar Yoga (1-27)
 */
export function calculateYoga(sunLon: number, moonLon: number): {
  yogaNumber: number; // 1-27
  yogaName: string;
} {
  const sum = (sunLon + moonLon) % 360;
  const yogaIndex = Math.floor(sum / (360 / 27)); // 0-26
  return {
    yogaNumber: yogaIndex + 1,
    yogaName: YOGA_NAMES[yogaIndex],
  };
}

/**
 * Calculate Karana (1-60)
 */
export function calculateKarana(sunLon: number, moonLon: number): {
  karanaNumber: number; // 1-60
  karanaName: string;
} {
  const diff = ((moonLon - sunLon) % 360 + 360) % 360;
  const karanaIndex = Math.floor(diff / 6); // 0-59
  const karanaNumber = karanaIndex + 1;

  let karanaName: string;
  if (karanaIndex === 0) {
    karanaName = 'Kintughna';
  } else if (karanaIndex >= 57) {
    if (karanaIndex === 57) karanaName = 'Shakuni';
    else if (karanaIndex === 58) karanaName = 'Chatushpada';
    else karanaName = 'Naga';
  } else {
    // 1 to 56 are the 7 repeating movable karanas (8 cycles of 7 = 56)
    if (karanaIndex === 10 || karanaIndex === 11) {
      karanaName = 'Taitila';
    } else {
      const movableIdx = (karanaIndex - 1) % 7;
      karanaName = MOVABLE_KARANAS[movableIdx];
    }
  }

  return { karanaNumber, karanaName };
}

/**
 * Calculate current Hora (0-23) based on weekday, sunrise, sunset, and current time
 */
export function calculateHora(
  weekday: string,
  currentTimeStr: string, // "HH:mm:ss"
  sunriseTimeStr: string,
  sunsetTimeStr: string
): {
  planet: string;
  hora_number: number; // 1-24
  start_time: string;
  end_time: string;
} {
  const timeToHours = (t: string) => {
    const parts = t.split(':').map(Number);
    return parts[0] + parts[1] / 60 + (parts[2] || 0) / 3600;
  };
  const hoursToTime = (h: number) => {
    const norm = ((h % 24) + 24) % 24;
    const hh = Math.floor(norm);
    const mm = Math.floor((norm - hh) * 60);
    const ss = Math.round(((norm - hh) * 60 - mm) * 60);
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss === 60 ? 0 : ss).padStart(2, '0')}`;
  };

  const curH = timeToHours(currentTimeStr);
  const riseH = timeToHours(sunriseTimeStr);
  const setH = timeToHours(sunsetTimeStr);

  const dayLength = setH > riseH ? setH - riseH : (setH + 24) - riseH;
  const nightLength = 24 - dayLength;
  const dayHoraDuration = dayLength / 12;
  const nightHoraDuration = nightLength / 12;

  const dayLord = WEEKDAY_LORDS[weekday] || 'Sun';
  const startIndex = CHALDEAN_HORA_ORDER.indexOf(dayLord as any);

  let horaIndexInDay = 0; // 0-23
  let startH = 0;
  let endH = 0;

  if (curH >= riseH && curH < setH) {
    // Daytime horas (1 to 12)
    const elapsed = curH - riseH;
    horaIndexInDay = Math.min(11, Math.floor(elapsed / dayHoraDuration));
    startH = riseH + horaIndexInDay * dayHoraDuration;
    endH = startH + dayHoraDuration;
  } else {
    // Nighttime horas (13 to 24)
    let elapsedNight = 0;
    if (curH >= setH) {
      elapsedNight = curH - setH;
    } else {
      elapsedNight = (curH + 24) - setH;
    }
    const nightSlot = Math.min(11, Math.floor(elapsedNight / nightHoraDuration));
    horaIndexInDay = 12 + nightSlot;
    startH = (setH + nightSlot * nightHoraDuration) % 24;
    endH = (startH + nightHoraDuration) % 24;
  }

  const horaPlanet = CHALDEAN_HORA_ORDER[(startIndex + horaIndexInDay) % 7];

  return {
    planet: horaPlanet,
    hora_number: horaIndexInDay + 1,
    start_time: hoursToTime(startH).slice(0, 5) + ':00',
    end_time: hoursToTime(endH).slice(0, 5) + ':00',
  };
}

/**
 * Construct full Panchanga State
 */
export function buildPanchangaState(
  sunLon: number,
  moonLon: number,
  moonNakshatra: string,
  moonPada: number,
  dateDay: string,
  sunrise: string,
  sunset: string
): PanchangaState {
  const { tithiNumber, tithiName, paksha, tithiAtBirth } = calculateTithi(sunLon, moonLon);
  const { yogaNumber, yogaName } = calculateYoga(sunLon, moonLon);
  const { karanaNumber, karanaName } = calculateKarana(sunLon, moonLon);
  const weekdayLord = WEEKDAY_LORDS[dateDay] || 'Mercury';

  const amavasya_zone = tithiNumber === 15 || tithiNumber === 30 || tithiNumber === 1 || tithiNumber === 29;
  const purnima_zone = tithiNumber === 14 || tithiNumber === 15 || tithiNumber === 16;

  // Gandanta check: Moon in last 3°20' of water signs (Cancer, Scorpio, Pisces) or 1st 3°20' of fire signs
  const moonDegInSign = moonLon % 30;
  const moonSignIdx = Math.floor(moonLon / 30);
  const isWaterSign = moonSignIdx === 3 || moonSignIdx === 7 || moonSignIdx === 11;
  const isFireSign = moonSignIdx === 0 || moonSignIdx === 4 || moonSignIdx === 8;
  const gandanta_active = (isWaterSign && moonDegInSign >= 26.666667) || (isFireSign && moonDegInSign <= 3.333333);

  return {
    paksha,
    tithi_number: tithiNumber,
    tithi_name: tithiName,
    tithi_at_birth: tithiAtBirth,
    nakshatra_number: Math.floor(moonLon / (360 / 27)) + 1,
    nakshatra_name: moonNakshatra,
    nakshatra_pada: moonPada,
    nak_at_birth: `${moonNakshatra}-${moonPada}`,
    yoga_number: yogaNumber,
    yoga_name: yogaName,
    yoga_at_birth: yogaName,
    karana_number: karanaNumber,
    karana_name: karanaName,
    karana_at_birth: karanaName,
    weekday_lord: weekdayLord,
    sunrise_time: sunrise,
    sunset_time: sunset,
    eclipse_proximity: false,
    gandanta_active,
    ingress_stacking: false,
    amavasya_zone,
    purnima_zone,
  };
}
