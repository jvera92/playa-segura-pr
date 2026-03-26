// Client-safe: only type imports from weather-api — erased at compile time.
import type { ForecastPeriod, NWSAlertFeature } from './weather-api'

// ─── TYPES ────────────────────────────────────────────────────────────────────

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
    }))
}

// ─── ICON MAPPING ─────────────────────────────────────────────────────────────

export function forecastIcon(shortForecast: string): string {
  const f = shortForecast.toLowerCase()
  if (f.includes('hurricane') || f.includes('tropical')) return '🌀'
  if (f.includes('thunder') || f.includes('t-storm'))   return '⛈'
  if (f.includes('snow') || f.includes('blizzard'))     return '❄️'
  if (f.includes('freezing') || f.includes('sleet'))    return '🌨'
  // "Showers And Thunderstorms" already caught above; remaining shower/rain cases:
  if (f.includes('shower') || f.includes('drizzle'))    return f.includes('chance') || f.includes('slight') ? '🌦' : '🌧'
  if (f.includes('rain'))                                return f.includes('chance') || f.includes('slight') ? '🌦' : '🌧'
  if (f.includes('fog') || f.includes('haze'))          return '🌫'
  if (f.includes('breezy') || f.includes('windy'))      return '🌬'
  if (f.includes('mostly cloudy') || f.includes('overcast')) return '☁️'
  if (f.includes('partly cloudy') || f.includes('partly sunny')) return '⛅'
  if (f.includes('mostly sunny') || f.includes('mostly clear'))  return '🌤'
  if (f.includes('sunny') || f.includes('clear'))       return '☀️'
  if (f.includes('cloud'))                               return '☁️'
  return '🌤'
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
