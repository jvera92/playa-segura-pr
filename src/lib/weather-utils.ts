// Client-safe: only type imports from weather-api — erased at compile time.
import type { ForecastPeriod, NWSAlertFeature } from './weather-api'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'moderate' | 'high' | 'extreme'

export type SurfRipRisk = 'Low' | 'Moderate' | 'High'

/** Minimal surf zone fields needed by the risk algorithm (structural subset of SurfZonePeriod). */
export interface SurfZoneRisk {
  ripCurrentRisk: SurfRipRisk | null
  surfHeightFt: number | null
  surfHeightText: string | null
}

export interface RiskAssessment {
  level: RiskLevel
  message: string
  /** Where the assessment came from */
  source: 'nws-alert' | 'surf-forecast' | 'buoy' | 'unavailable'
  /** True when no authoritative data loaded yet — caller should show NWS link */
  unavailable: boolean
}

export interface LiveForecastDay {
  day: string    // e.g. "Today", "Thu", "Fri"
  icon: string   // weather emoji
  high: string   // e.g. "87°F"
  low: string    // e.g. "76°F"
  precip: string // e.g. "30%"
}

export interface LiveWeather {
  airTemp: string      // e.g. "87°F"
  wind: string         // e.g. "15 mph ESE"
  shortForecast: string // e.g. "Chance Rain Showers" — raw NWS value
}

export interface BeachAlert {
  event: string
  headline: string | null
  description: string
  severity: string
  expires: string
  /** Lowercase NWS UGC zone codes this alert applies to, e.g. ["prz001","prz002"]. Empty = zone unknown, show everywhere. */
  zones: string[]
}

// ─── ALERT CLASSIFICATION ────────────────────────────────────────────────────

const BEACH_ALERT_EVENTS = new Set([
  'Beach Hazards Statement',
  'High Surf Advisory',
  'High Surf Warning',
  'Rip Current Statement',
  'Coastal Flood Advisory',
  'Coastal Flood Watch',
  'Coastal Flood Warning',
  'Coastal Flood Statement',
  'Special Marine Warning',
  'Marine Weather Statement',
  'Small Craft Advisory',
  'Gale Warning',
  'Storm Warning',
  'Hurricane Local Statement',
  'Tropical Storm Warning',
  'Tropical Storm Watch',
  'Hurricane Warning',
  'Hurricane Watch',
  'Tsunami Advisory',
  'Tsunami Warning',
  'Tsunami Watch',
])

export function isBeachAlert(event: string): boolean {
  return BEACH_ALERT_EVENTS.has(event)
}

export function extractBeachAlerts(features: NWSAlertFeature[]): BeachAlert[] {
  return features
    .filter(f => isBeachAlert(f.properties.event))
    .map(f => ({
      event: f.properties.event,
      headline: f.properties.headline,
      description: f.properties.description,
      severity: f.properties.severity,
      expires: f.properties.expires,
      zones: (f.properties.geocode?.UGC ?? []).map(z => z.toLowerCase()),
    }))
}

/** Filter alerts to only those applicable to a specific NWS zone (e.g. "prz012").
 *  Alerts with no zone data are included for all beaches (fail-safe). */
export function filterAlertsForZone(alerts: BeachAlert[], beachZone: string): BeachAlert[] {
  return alerts.filter(a => a.zones.length === 0 || a.zones.includes(beachZone))
}

// ─── ICON MAPPING ─────────────────────────────────────────────────────────────
// Returns a stable key string — page.tsx maps these to lucide-react components.

export type WeatherIconKey =
  | 'sun' | 'mostly-sunny' | 'partly-cloudy' | 'cloudy'
  | 'rain' | 'drizzle' | 'thunderstorm' | 'snow' | 'fog' | 'wind' | 'hurricane'

export function forecastIcon(shortForecast: string): WeatherIconKey {
  const f = shortForecast.toLowerCase()
  if (f.includes('hurricane') || f.includes('tropical')) return 'hurricane'
  if (f.includes('thunder') || f.includes('t-storm'))   return 'thunderstorm'
  if (f.includes('snow') || f.includes('blizzard') || f.includes('sleet')) return 'snow'
  if (f.includes('shower') || f.includes('drizzle'))    return f.includes('chance') || f.includes('slight') ? 'drizzle' : 'rain'
  if (f.includes('rain'))                                return f.includes('chance') || f.includes('slight') ? 'drizzle' : 'rain'
  if (f.includes('fog') || f.includes('haze'))          return 'fog'
  if (f.includes('breezy') || f.includes('windy'))      return 'wind'
  if (f.includes('mostly cloudy') || f.includes('overcast')) return 'cloudy'
  if (f.includes('partly cloudy') || f.includes('partly sunny')) return 'partly-cloudy'
  if (f.includes('mostly sunny') || f.includes('mostly clear'))  return 'mostly-sunny'
  if (f.includes('sunny') || f.includes('clear'))       return 'sun'
  if (f.includes('cloud'))                               return 'cloudy'
  return 'mostly-sunny'
}

// ─── DAY LABEL ────────────────────────────────────────────────────────────────

function dayLabel(name: string): string {
  if (/^(today|tonight|this afternoon|this evening)$/i.test(name)) return 'Today'
  if (/^tomorrow$/i.test(name)) return 'Tomorrow'
  const match = name.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i)
  if (match) return match[1].slice(0, 3) // "Mon", "Tue", etc.
  return name.replace(/ Night$/, '').slice(0, 9)
}

// ─── FORECAST MAPPING ────────────────────────────────────────────────────────

// NWS periods alternate day/night. We group them into daily summaries capped at 5.
// When the first period is nighttime (fetched after sunset), emit a night-only entry.
export function mapNWSForecast(periods: ForecastPeriod[]): LiveForecastDay[] {
  const days: LiveForecastDay[] = []
  let i = 0

  while (i < periods.length && days.length < 5) {
    const period = periods[i]
    const precipVal = period.probabilityOfPrecipitation?.value
    const precip = precipVal != null ? `${precipVal}%` : '—'

    if (period.isDaytime) {
      const next = periods[i + 1]
      const low = next && !next.isDaytime ? `${next.temperature}°F` : '—'
      days.push({
        day: days.length === 0 ? 'Today' : dayLabel(period.name),
        icon: forecastIcon(period.shortForecast),
        high: `${period.temperature}°F`,
        low,
        precip,
      })
      i += next && !next.isDaytime ? 2 : 1
    } else {
      // Night-only period (e.g., "Tonight" when page loads after sunset)
      days.push({
        day: days.length === 0 ? 'Tonight' : dayLabel(period.name),
        icon: forecastIcon(period.shortForecast),
        high: '—',
        low: `${period.temperature}°F`,
        precip,
      })
      i += 1
    }
  }

  return days
}

// ─── CURRENT CONDITIONS EXTRACTION ──────────────────────────────────────────

export function extractLiveWeather(periods: ForecastPeriod[]): LiveWeather {
  const first = periods[0]
  const wind = first.windDirection
    ? `${first.windSpeed} ${first.windDirection}`
    : first.windSpeed
  return {
    airTemp: `${first.temperature}°F`,
    wind,
    shortForecast: first.shortForecast,
  }
}

// ─── CONDITION LABEL ─────────────────────────────────────────────────────────
// Maps NWS shortForecast (often wordy) to a compact display label, ≤ 16 chars.

export function conditionLabel(shortForecast: string): string {
  const f = shortForecast.toLowerCase()
  const isChance = f.includes('chance') || f.includes('slight') ||
                   f.includes('isolated') || f.includes('scattered')
  const prefix = isChance ? 'Chance ' : ''
  if (f.includes('thunder') || f.includes('t-storm')) return `${prefix}Thunderstorms`
  if (f.includes('shower') || f.includes('drizzle'))  return `${prefix}Showers`
  if (f.includes('rain'))                              return `${prefix}Rain`
  if (f.includes('snow') || f.includes('blizzard'))   return 'Snow'
  if (f.includes('fog') || f.includes('haze'))        return 'Foggy'
  if (f.includes('breezy') || f.includes('windy'))    return 'Windy'
  if (f.includes('mostly cloudy') || f.includes('overcast')) return 'Cloudy'
  if (f.includes('partly cloudy') || f.includes('partly sunny')) return 'Partly Cloudy'
  if (f.includes('mostly sunny') || f.includes('mostly clear'))  return 'Mostly Sunny'
  if (f.includes('sunny') || f.includes('clear'))     return 'Sunny'
  if (f.includes('cloud'))                             return 'Cloudy'
  return shortForecast.length > 16 ? shortForecast.slice(0, 14) + '…' : shortForecast
}

// ─── RISK ALGORITHM ──────────────────────────────────────────────────────────
// Primary:     NWS alerts (authoritative)
// Secondary:   NWS rip current risk text inside alert description
// Supplementary: NDBC buoy wave height when no alert exists
// Fallback:    unavailable — caller should show link to weather.gov/sju/beach

// ─── RISK ALGORITHM ──────────────────────────────────────────────────────────
//
// Priority order:
//   1. NWS active alerts   — authoritative emergency signals
//   2. NWS Surf Zone Forecast rip current risk — official daily assessment
//   3. NDBC buoy wave height — supplementary when no zone forecast available
//   4. NWS silence (alerts loaded, no hazards, no other data) — low by default
//   5. Fallback — all sources loading or failed
//
// alerts: null = not yet fetched; [] = fetched, no beach hazard alerts active.
// surfForecast: null = not yet fetched or fetch failed.

export function computeBeachRisk(
  alerts: BeachAlert[] | null,
  surfForecast: SurfZoneRisk | null,
  waveHeightFt: number | null,
  _debugLabel?: string,
): RiskAssessment {
  if (typeof window !== 'undefined') {
    const label = _debugLabel ?? '(unknown beach)'
    console.log(
      `[risk] ${label}: alerts=${alerts === null ? 'null' : alerts.length + ' [' + alerts.map(a => a.event).join(', ') + ']'}` +
      ` surf=${surfForecast ? `rip=${surfForecast.ripCurrentRisk} ht=${surfForecast.surfHeightFt}ft` : 'null'}` +
      ` buoy=${waveHeightFt !== null ? waveHeightFt + 'ft' : 'null'}`
    )
  }

  // ── TIER 1: NWS active alert events ──────────────────────────────────────
  if (alerts !== null && alerts.length > 0) {
    if (alerts.some(a => a.event === 'High Surf Warning')) {
      return { level: 'extreme', message: 'DO NOT SWIM', source: 'nws-alert', unavailable: false }
    }
    if (alerts.some(a => a.event === 'Rip Current Statement' || a.event === 'Beach Hazards Statement')) {
      return { level: 'high', message: 'Swimming not recommended', source: 'nws-alert', unavailable: false }
    }
    // Parse explicit rip current risk level from any alert description
    for (const alert of alerts) {
      const match = alert.description.match(/RIP CURRENT RISK[^.:\n]*?(HIGH|MODERATE|LOW)/i)
      if (match) {
        const tier = match[1].toLowerCase()
        if (tier === 'high')     return { level: 'high',     message: 'Swimming not recommended',      source: 'nws-alert', unavailable: false }
        if (tier === 'moderate') return { level: 'moderate', message: 'Use caution — hazards present', source: 'nws-alert', unavailable: false }
        if (tier === 'low')      return { level: 'low',      message: 'Low rip current risk — always assess locally', source: 'nws-alert', unavailable: false }
      }
    }
  }

  // ── TIER 2: NWS Surf Zone Forecast rip current risk ──────────────────────
  // This is the official NWS daily beach safety assessment — use it directly.
  if (surfForecast?.ripCurrentRisk) {
    const rip = surfForecast.ripCurrentRisk
    if (rip === 'High')     return { level: 'high',     message: 'Swimming not recommended',            source: 'surf-forecast', unavailable: false }
    if (rip === 'Moderate') return { level: 'moderate', message: 'Use caution — rip currents possible', source: 'surf-forecast', unavailable: false }
    if (rip === 'Low')      return { level: 'low',      message: 'Low rip current risk — always assess locally', source: 'surf-forecast', unavailable: false }
  }

  // ── TIER 3: NDBC buoy wave height (supplementary) ────────────────────────
  // Only reached when surf zone forecast is unavailable or has no rip risk.
  if (waveHeightFt != null) {
    if (waveHeightFt > 10) return { level: 'high',     message: 'Swimming not recommended',    source: 'buoy', unavailable: false }
    if (waveHeightFt > 6)  return { level: 'moderate', message: 'Use caution — elevated surf', source: 'buoy', unavailable: false }
    return                         { level: 'low',      message: 'Conditions appear favorable — always assess locally', source: 'buoy', unavailable: false }
  }

  // ── TIER 4: NWS silence — alerts loaded, no hazards flagged ──────────────
  // Absence of an NWS advisory is meaningful — NWS would have issued one.
  if (alerts !== null) {
    return { level: 'low', message: 'No active NWS advisories — always assess locally', source: 'nws-alert', unavailable: false }
  }

  // ── FALLBACK: no data loaded yet ─────────────────────────────────────────
  return { level: 'moderate', message: 'Risk data unavailable — check NWS directly', source: 'unavailable', unavailable: true }
}
