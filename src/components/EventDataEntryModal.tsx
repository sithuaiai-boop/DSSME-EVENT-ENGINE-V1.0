/**
 * DSSME EVENT ENGINE V1.0 - New Event Chart / Event Data Entry Dialog
 * Follows the compact desktop dialog visual language, field hierarchy, and usability
 * of classic professional Vedic software (adapted from Birth Data to Event Data).
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  HelpCircle,
  X,
  Sparkles,
  Check,
  AlertCircle,
  Bookmark,
  ChevronDown,
} from 'lucide-react';
import { EventProfile, EventType, CanonicalChart, DSSMEEventInput } from '../engine/types.js';
import {
  LOTTERY_DRAW_TIMES,
  LotteryDrawTimeConfig,
  getDrawTimeString,
} from '../engine/lottery/drawConfig.js';
import {
  CANONICAL_COUNTRIES,
  CountryLocation,
  formatDMS,
  parseDMSOrDecimal,
  formatTimezoneOffsetString,
  saveDefaultPlace,
  getSavedDefaultPlace,
} from '../engine/lottery/locationDatabase.js';
import { parseTimezoneOffset } from '../engine/astronomy/ephemeris.js';

interface EventDataEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChartCreated: (profile: EventProfile, chart: CanonicalChart) => void;
  calculateChartFn: (input: DSSMEEventInput) => Promise<CanonicalChart>;
  initialDate?: string; // YYYY-MM-DD
  initialDrawPresetIndex?: number;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const EventDataEntryModal: React.FC<EventDataEntryModalProps> = ({
  isOpen,
  onClose,
  onChartCreated,
  calculateChartFn,
  initialDate = '2026-09-25',
  initialDrawPresetIndex = 2, // Yangon PM default
}) => {
  // Tabs: 'Event data' or 'Notes'
  const [activeTab, setActiveTab] = useState<'data' | 'notes'>('data');
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // Event Data Fields
  const [eventName, setEventName] = useState<string>('Yangon PM 2D Draw');
  const [eventType, setEventType] = useState<EventType>('Lottery Draw');

  // Date state (authoritative local event date YYYY-MM-DD)
  const [dateStr, setDateStr] = useState<string>(initialDate);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Time state (HH:mm:ss local civil time)
  const [timeStr, setTimeStr] = useState<string>('16:10:00');

  // Draw Preset dropdown selection
  const [selectedDrawPresetId, setSelectedDrawPresetId] = useState<string>(
    LOTTERY_DRAW_TIMES[initialDrawPresetIndex]?.id || 'yangon-pm'
  );

  // Country, State, City
  const [selectedCountryName, setSelectedCountryName] = useState<string>('Burma');
  const [selectedStateName, setSelectedStateName] = useState<string>('Yangon');
  const [selectedCityName, setSelectedCityName] = useState<string>('Yangon');

  // Manual Coordinates Override
  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);
  const [manualLatitude, setManualLatitude] = useState<number>(16.8661);
  const [manualLongitude, setManualLongitude] = useState<number>(96.1951);
  const [manualTimezone, setManualTimezone] = useState<string>('Asia/Yangon');

  // Notes tab
  const [notes, setNotes] = useState<string>('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string>('');

  const modalRef = useRef<HTMLDivElement>(null);

  // Derived geographical coordinates
  const currentCountry = CANONICAL_COUNTRIES.find((c) => c.name === selectedCountryName) || CANONICAL_COUNTRIES[0];
  const currentState = currentCountry.states.find((s) => s.name === selectedStateName) || currentCountry.states[0];
  const currentCity = currentState?.cities.find((c) => c.name === selectedCityName) || currentState?.cities[0];

  const resolvedLatitude = isManualOverride ? manualLatitude : (currentCity?.latitude ?? 16.8661);
  const resolvedLongitude = isManualOverride ? manualLongitude : (currentCity?.longitude ?? 96.1951);
  const resolvedTimezone = isManualOverride ? manualTimezone : (currentCity?.timezone ?? 'Asia/Yangon');
  const resolvedOffsetHours = parseTimezoneOffset(resolvedTimezone);

  // Load saved default place on initial mount if available
  useEffect(() => {
    const saved = getSavedDefaultPlace();
    if (saved && !isManualOverride) {
      const matchCountry = CANONICAL_COUNTRIES.find((c) => c.name === saved.country);
      if (matchCountry) {
        setSelectedCountryName(saved.country);
        setSelectedStateName(saved.state);
        setSelectedCityName(saved.city);
      }
    }
  }, []);

  // Update states list when country changes
  const handleCountryChange = (cName: string) => {
    setSelectedCountryName(cName);
    const country = CANONICAL_COUNTRIES.find((c) => c.name === cName) || CANONICAL_COUNTRIES[0];
    const defaultState = country.states[0]?.name || '';
    setSelectedStateName(defaultState);
    const defaultCity = country.states[0]?.cities[0]?.name || '';
    setSelectedCityName(defaultCity);
  };

  // Update cities list when state changes
  const handleStateChange = (sName: string) => {
    setSelectedStateName(sName);
    const state = currentCountry.states.find((s) => s.name === sName);
    if (state && state.cities.length > 0) {
      setSelectedCityName(state.cities[0].name);
    }
  };

  // Select Draw Preset handler
  const handleApplyDrawPreset = (presetId: string) => {
    setSelectedDrawPresetId(presetId);
    const preset = LOTTERY_DRAW_TIMES.find((d) => d.id === presetId);
    if (!preset) return;

    // Populate all canonical metadata
    setEventName(`${preset.location} ${preset.session === 'REFERENCE' ? 'Ref' : preset.session} Draw`);
    setTimeStr(`${getDrawTimeString(preset)}:00`);

    if (preset.id === 'chofu-japan') {
      setSelectedCountryName('Japan');
      setSelectedStateName('Tokyo');
      setSelectedCityName('Chofu');
    } else if (preset.id.startsWith('yangon')) {
      setSelectedCountryName('Burma');
      setSelectedStateName('Yangon');
      setSelectedCityName('Yangon');
    } else if (preset.id === 'bangkok-pm') {
      setSelectedCountryName('Thailand');
      setSelectedStateName('Bangkok');
      setSelectedCityName('Bangkok');
    }

    setIsManualOverride(false);
  };

  // Formatted date string "25 Sep 2026 (Fri)"
  const formattedDateDisplay = (() => {
    try {
      const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10));
      if (!y || !m || !d) return dateStr;
      const dateObj = new Date(Date.UTC(y, m - 1, d));
      const dayName = DAY_NAMES[dateObj.getUTCDay()];
      const monthName = MONTH_NAMES[m - 1];
      return `${String(d).padStart(2, '0')} ${monthName} ${y} (${dayName})`;
    } catch {
      return dateStr;
    }
  })();

  // Save Default Place
  const handleSaveDefaultPlace = () => {
    saveDefaultPlace({
      country: selectedCountryName,
      state: selectedStateName,
      city: selectedCityName,
      latitude: resolvedLatitude,
      longitude: resolvedLongitude,
      timezone: resolvedTimezone,
    });
    setSuccessToast(`Saved ${selectedCityName}, ${selectedCountryName} as default place`);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  // Create Chart Execution Pipeline
  const handleCreateChart = async () => {
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      // 1. Validation Rules (Section 20)
      if (!eventName.trim()) {
        throw new Error('Event Name is required.');
      }
      if (!dateStr || !dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        throw new Error('Valid date in format YYYY-MM-DD is required.');
      }
      if (!timeStr || !timeStr.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
        throw new Error('Valid time in format HH:mm:ss is required.');
      }
      if (resolvedLatitude < -90 || resolvedLatitude > 90) {
        throw new Error('Latitude must be between -90° and +90°.');
      }
      if (resolvedLongitude < -180 || resolvedLongitude > 180) {
        throw new Error('Longitude must be between -180° and +180°.');
      }
      if (!resolvedTimezone) {
        throw new Error('Valid IANA timezone is required.');
      }

      // Format time with seconds
      const parts = timeStr.split(':');
      const normalizedTime = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${(parts[2] || '00').padStart(2, '0')}`;

      // 2. Build Canonical EventProfile (Section 18)
      const eventProfile: EventProfile = {
        eventId: `EVT-${dateStr.replace(/-/g, '')}-${Date.now().toString(36)}`,
        eventName: eventName.trim(),
        eventType,
        localDate: dateStr,
        localTime: normalizedTime,
        timezone: resolvedTimezone,
        latitude: resolvedLatitude,
        longitude: resolvedLongitude,
        country: selectedCountryName,
        state: selectedStateName,
        city: selectedCityName,
        ayanamsa: 'Lahiri',
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 3. Astronomical Chart Calculation Flow (Section 19)
      const input: DSSMEEventInput = {
        datetime: `${dateStr} ${normalizedTime}`,
        timezone: resolvedTimezone,
        location: {
          latitude: resolvedLatitude,
          longitude: resolvedLongitude,
          city: selectedCityName,
          country: selectedCountryName,
        },
        ayanamsa: 'Lahiri',
      };

      const calculatedChart = await calculateChartFn(input);

      // 4. Pass EventProfile and Chart to parent
      onChartCreated(eventProfile, calculatedChart);
      onClose();
    } catch (err: any) {
      console.error('Event chart creation error:', err);
      setErrorMessage(err?.message || 'Failed to calculate event chart.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        ref={modalRef}
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col font-sans text-slate-200"
        style={{ maxHeight: '92vh' }}
      >
        {/* WINDOW TITLE BAR */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-500/50"></span>
            <h3 className="text-sm font-bold text-slate-100 tracking-wide">
              New Event Chart
            </h3>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
              DSSME v1.0
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            {/* Help Button */}
            <button
              type="button"
              onClick={() => setShowHelp((prev) => !prev)}
              className="p-1 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
              title="Help on Event Data Entry"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* HELP TOOLTIP / BANNER */}
        {showHelp && (
          <div className="bg-amber-950/40 border-b border-amber-500/30 px-5 py-2.5 text-xs text-amber-200 font-mono flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-300">
                Event Chart Data Entry Guide
              </p>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                Enter the exact local event time in the selected location&apos;s civil timezone. The engine resolves deterministic UTC instants through Swiss Ephemeris without browser timezone interference.
              </p>
            </div>
          </div>
        )}

        {/* TAB STRUCTURE: Event data | Notes */}
        <div className="flex border-b border-slate-800 px-5 bg-slate-950/60 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`py-2.5 px-4 font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'data'
                ? 'border-amber-400 text-amber-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Event data
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`py-2.5 px-4 font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'notes'
                ? 'border-amber-400 text-amber-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            Notes
            {notes && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
          </button>
        </div>

        {/* DIALOG BODY */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs font-mono">
          {/* TAB 1: EVENT DATA */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              {/* COMPACT QUICK DRAW SELECTOR (Section 15) */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Quick Draw Presets:
                  </span>
                  <span className="text-[10px] text-amber-400/80 font-normal">Authoritative</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {LOTTERY_DRAW_TIMES.map((draw) => (
                    <button
                      key={draw.id}
                      type="button"
                      onClick={() => handleApplyDrawPreset(draw.id)}
                      className={`px-2 py-1.5 rounded-lg border text-[11px] text-center font-bold transition-all cursor-pointer ${
                        selectedDrawPresetId === draw.id
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                          : 'bg-slate-900 text-slate-300 border-slate-700/80 hover:bg-slate-800'
                      }`}
                    >
                      {draw.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* FORM FIELDS GRID */}
              <div className="space-y-3 bg-slate-900/40 border border-slate-800 rounded-xl p-3.5">
                {/* 1. Event Name */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <label className="text-slate-400 font-semibold text-[11px]">
                    Event Name
                  </label>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      placeholder="e.g. Myanmar 2D AM Draw"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                </div>

                {/* 2. Event Type */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <label className="text-slate-400 font-semibold text-[11px]">
                    Event Type
                  </label>
                  <div className="sm:col-span-2 relative">
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value as EventType)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-amber-400 transition-colors appearance-none cursor-pointer"
                    >
                      <option value="Lottery Draw">Lottery Draw</option>
                      <option value="General Event">General Event</option>
                      <option value="Prashna">Prashna</option>
                      <option value="Transit Event">Transit Event</option>
                      <option value="Custom Event">Custom Event</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                  </div>
                </div>

                {/* 3. Date (with Calendar popup) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <label className="text-slate-400 font-semibold text-[11px]">
                    Date
                  </label>
                  <div className="sm:col-span-2 flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <input
                        type="date"
                        value={dateStr}
                        onChange={(e) => setDateStr(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-amber-400 transition-colors font-mono cursor-pointer"
                      />
                    </div>
                    <div
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-300 font-medium text-[11px] whitespace-nowrap"
                      title="Formatted Authoritative Event Date"
                    >
                      {formattedDateDisplay}
                    </div>
                  </div>
                </div>

                {/* 4. Time (HH:mm:ss local civil time) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <label className="text-slate-400 font-semibold text-[11px]">
                    Time
                  </label>
                  <div className="sm:col-span-2 flex items-center gap-1.5">
                    <input
                      type="text"
                      value={timeStr}
                      onChange={(e) => setTimeStr(e.target.value)}
                      placeholder="16:10:00"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-amber-400 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setTimeStr('00:00:00')}
                      className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-200 text-xs transition-colors"
                      title="Reset seconds / time"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* 5. Draw Preset (if Lottery Draw) */}
                {eventType === 'Lottery Draw' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                    <label className="text-slate-400 font-semibold text-[11px]">
                      Draw Preset
                    </label>
                    <div className="sm:col-span-2 relative">
                      <select
                        value={selectedDrawPresetId}
                        onChange={(e) => handleApplyDrawPreset(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-amber-400 transition-colors appearance-none cursor-pointer"
                      >
                        <option value="chofu-japan">Chofu, Japan — 18:50 (JST)</option>
                        <option value="yangon-am">Yangon, Myanmar — AM 12:01 (MMT)</option>
                        <option value="yangon-pm">Yangon, Myanmar — PM 16:10 (MMT)</option>
                        <option value="bangkok-pm">Bangkok, Thailand — PM 15:45 (ICT)</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>

              {/* LOCATION HIERARCHY (Country, State/Region, City) */}
              <div className="space-y-3 bg-slate-900/40 border border-slate-800 rounded-xl p-3.5">
                <div className="text-[11px] font-semibold text-slate-300 pb-1 border-b border-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    Location & Geographical Reference
                  </span>
                  <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isManualOverride}
                      onChange={(e) => setIsManualOverride(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <span>Manual Override</span>
                  </label>
                </div>

                {/* Country */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <label className="text-slate-400 font-semibold text-[11px]">
                    Country
                  </label>
                  <div className="sm:col-span-2 relative">
                    <select
                      value={selectedCountryName}
                      disabled={isManualOverride}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-amber-400 transition-colors appearance-none cursor-pointer disabled:opacity-50"
                    >
                      {CANONICAL_COUNTRIES.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                  </div>
                </div>

                {/* State / Region */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <label className="text-slate-400 font-semibold text-[11px]">
                    State / Region
                  </label>
                  <div className="sm:col-span-2 relative">
                    <select
                      value={selectedStateName}
                      disabled={isManualOverride}
                      onChange={(e) => handleStateChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-amber-400 transition-colors appearance-none cursor-pointer disabled:opacity-50"
                    >
                      {currentCountry.states.map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                  </div>
                </div>

                {/* City */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <label className="text-slate-400 font-semibold text-[11px]">
                    City
                  </label>
                  <div className="sm:col-span-2 relative">
                    <select
                      value={selectedCityName}
                      disabled={isManualOverride}
                      onChange={(e) => setSelectedCityName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-amber-400 transition-colors appearance-none cursor-pointer disabled:opacity-50"
                    >
                      {currentState.cities.map((city) => (
                        <option key={city.name} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                  </div>
                </div>

                {/* COORDINATES & ASTRONOMICAL METADATA */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  {/* Longitude */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                    <label className="text-slate-400 font-semibold text-[11px]">
                      Longitude
                    </label>
                    <div className="sm:col-span-2 flex items-center gap-2">
                      {isManualOverride ? (
                        <input
                          type="number"
                          step="0.0001"
                          value={manualLongitude}
                          onChange={(e) => setManualLongitude(parseFloat(e.target.value))}
                          className="w-full bg-slate-950 border border-amber-500/50 rounded-lg px-3 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-400"
                        />
                      ) : (
                        <div className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-xs flex justify-between">
                          <span>{formatDMS(resolvedLongitude, false)}</span>
                          <span className="text-slate-500">{resolvedLongitude.toFixed(4)}°</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Latitude */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                    <label className="text-slate-400 font-semibold text-[11px]">
                      Latitude
                    </label>
                    <div className="sm:col-span-2 flex items-center gap-2">
                      {isManualOverride ? (
                        <input
                          type="number"
                          step="0.0001"
                          value={manualLatitude}
                          onChange={(e) => setManualLatitude(parseFloat(e.target.value))}
                          className="w-full bg-slate-950 border border-amber-500/50 rounded-lg px-3 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-400"
                        />
                      ) : (
                        <div className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-xs flex justify-between">
                          <span>{formatDMS(resolvedLatitude, true)}</span>
                          <span className="text-slate-500">{resolvedLatitude.toFixed(4)}°</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timezone */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                    <label className="text-slate-400 font-semibold text-[11px]">
                      Timezone
                    </label>
                    <div className="sm:col-span-2">
                      {isManualOverride ? (
                        <input
                          type="text"
                          value={manualTimezone}
                          onChange={(e) => setManualTimezone(e.target.value)}
                          placeholder="e.g. Asia/Yangon"
                          className="w-full bg-slate-950 border border-amber-500/50 rounded-lg px-3 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-400"
                        />
                      ) : (
                        <div className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-xs flex justify-between">
                          <span className="font-bold text-amber-400">
                            {formatTimezoneOffsetString(resolvedOffsetHours)}
                          </span>
                          <span className="text-slate-400 font-sans text-[11px]">
                            {resolvedTimezone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* DST */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                    <label className="text-slate-400 font-semibold text-[11px]">
                      DST
                    </label>
                    <div className="sm:col-span-2">
                      <div className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-400 font-mono text-xs flex justify-between">
                        <span>00:00:00</span>
                        <span className="text-[10px] text-slate-600">Standard Time</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save as Default Place Button */}
                <div className="pt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleSaveDefaultPlace}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                    Save as Default Place
                  </button>
                  {successToast && (
                    <span className="text-emerald-400 text-[11px] flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3.5 h-3.5" />
                      {successToast}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-3 bg-slate-900/40 border border-slate-800 rounded-xl p-4">
              <label className="block text-slate-300 font-semibold text-xs mb-1">
                Event Notes & Observation Remarks (Optional)
              </label>
              <p className="text-[11px] text-slate-400 leading-normal">
                Record event remarks, lottery ticket details, witness logs, or prashna query context. This is saved in the EventProfile metadata and does not alter astronomical calculations.
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter event notes or prashna context here..."
                rows={7}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors font-mono text-xs"
              />
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* DIALOG FOOTER / ACTION BUTTONS */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
            <span>Ayanamsa: Lahiri</span> • <span>UTC Instant Resolved</span>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateChart}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-950/30 flex items-center gap-1.5 transition-all cursor-pointer font-mono disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>CALCULATING...</span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>Create Chart</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
