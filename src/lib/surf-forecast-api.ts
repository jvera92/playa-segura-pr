// NWS Surf Zone Forecast text files — issued twice daily by NWS San Juan.
// Format reference: https://tgftp.nws.noaa.gov/data/forecasts/marine/surf_zone/pr/

const USER_AGENT = 'PlayaSeguraPR/1.0 (playasegurapr@gmail.com)'
const TGFTP_BASE = 'https://tgftp.nws.noaa.gov/data/forecasts/marine/surf_zone/pr'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type SurfRipRisk = 'Low' | 'Moderate' | 'High'

export interface SurfZonePeriod {
  /** "TODAY", "TONIGHT", "FRIDAY", etc. */
  label: string
  ripCurrentRisk: SurfRipRisk | null
  /** Numeric surf height in feet, null when not parseable */
  surfHeightFt: number | null
  /** Raw height text, e.g. "Around 5 feet" or "2 to 4 feet" */
  surfHeightText: string | null
}

export interface SurfZoneForecast {
  zone: string
  /** index 0 = first/current period (today or nearest future) */
  periods: SurfZonePeriod[]
}

// ─── PARSER ───────────────────────────────────────────────────────────────────
//
// Expanded format (first 1–2 periods):
//   .FRIDAY...
//   Rip Current Risk*...........Moderate.
//   Surf Height.................Around 5 feet.
//   Weather.....................Mostly cloudy...
//
// Compact one-liner (later periods):
//   .MONDAY...Surf height around 4 feet. Partly sunny.
//

const DAY_NAMES = 'TODAY|TONIGHT|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY'
const DAY_HEADER_RE = new RegExp(`^\\.(${DAY_NAMES})\\b`, 'i')

function parseSurfHeightFt(text: string): number | null {
  // "Around 5 feet" → 5
  const around = text.match(/around\s+(\d+(?:\.\d+)?)\s+feet?/i)
  if (around) return parseFloat(around[1])
  // "2 to 4 feet" → use the higher value (conservative for safety)
  const range = text.match(/(\d+(?:\.\d+)?)\s+to\s+(\d+(?:\.\d+)?)\s+feet?/i)
  if (range) return parseFloat(range[2])
  // "5 feet" plain
  const plain = text.match(/(\d+(?:\.\d+)?)\s+feet?/i)
  if (plain) return parseFloat(plain[1])
  return null
}

export function parseSurfZoneForecast(zone: string, text: string): SurfZoneForecast {
  const lines = text.split('\n')
  const periods: SurfZonePeriod[] = []
  let current: SurfZonePeriod | null = null

  for (const rawLine of lines) {
    const line = rawLine.trim()

    // Stop before the narrative/legend section
    if (line === '&&' || line === '$$') break

    const dayMatch = line.match(DAY_HEADER_RE)
    if (dayMatch) {
      if (current) periods.push(current)
      current = {
        label: dayMatch[1].toUpperCase(),
        ripCurrentRisk: null,
        surfHeightFt: null,
        surfHeightText: null,
      }

      // Compact one-liner: .MONDAY...Surf height around 4 feet. Partly sunny.
      // Anything after the initial "DAYNAME..." is the inline forecast text.
      const inlineText = line.replace(/^\.\w+\.+/, '').trim()
      if (inlineText) {
        const surfMatch = inlineText.match(/surf\s+height\s+([\w\s]+?)(?:\.|,|$)/i)
        if (surfMatch) {
          const t = surfMatch[1].trim(); current.surfHeightText = t.charAt(0).toUpperCase() + t.slice(1)
          current.surfHeightFt = parseSurfHeightFt(surfMatch[1])
        }
      }
      continue
    }

    if (!current) continue

    // Rip Current Risk*...........Moderate.
    // The asterisk is literal; dots and spaces separate the label from the value.
    const ripMatch = line.match(/^Rip Current Risk\*[.\s]+(Low|Moderate|High)\./i)
    if (ripMatch) {
      const raw = ripMatch[1]
      current.ripCurrentRisk = (raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()) as SurfRipRisk
      continue
    }

    // Surf Height.................Around 5 feet.
    const surfMatch = line.match(/^Surf Height[.\s]+(.*?)\.\s*$/i)
    if (surfMatch) {
      const raw = surfMatch[1].trim()
      current.surfHeightText = raw.charAt(0).toUpperCase() + raw.slice(1)
      current.surfHeightFt = parseSurfHeightFt(raw)
    }
  }

  if (current) periods.push(current)
  return { zone, periods }
}

// ─── FETCH ────────────────────────────────────────────────────────────────────

export async function getSurfZoneForecast(zone: string): Promise<SurfZoneForecast> {
  const url = `${TGFTP_BASE}/${zone.toLowerCase()}.txt`
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`Surf zone HTTP ${res.status} for ${zone}`)
  const text = await res.text()
  return parseSurfZoneForecast(zone, text)
}
