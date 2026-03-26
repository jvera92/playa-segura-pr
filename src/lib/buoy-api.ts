const USER_AGENT = 'PlayaSeguraPR/1.0 (playasegurapr@gmail.com)'
const NDBC_BASE = 'https://www.ndbc.noaa.gov/data/realtime2'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface BuoyObservation {
  stationId: string
  waveHeightM: number | null      // significant wave height in meters
  waveHeightFt: number | null     // converted to feet
  dominantPeriodS: number | null  // dominant wave period in seconds
  swellDirectionDeg: number | null
  swellDirectionCompass: string | null // e.g. "NNW"
  waterTempC: number | null
  waterTempF: number | null
  observedAt: string | null       // ISO-8601 UTC string
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function degToCompass(deg: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
  return dirs[Math.round(deg / 22.5) % 16]
}

/** Returns null for NDBC's "MM" sentinel and non-numeric values. */
function parseVal(s: string): number | null {
  if (s === 'MM' || s === 'mm' || s === '') return null
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

// ─── PARSER ───────────────────────────────────────────────────────────────────
// NDBC realtime2 format:
//   Line 1 (starts with #): column names  e.g. #YY  MM DD hh mm WDIR WSPD ...
//   Line 2 (starts with #): units         e.g. #yr  mo dy hr mn degT m/s  ...
//   Lines 3+: data records, most-recent first

function parseBuoyText(stationId: string, text: string): BuoyObservation {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)

  // First header line: strip leading '#' then split on whitespace
  const headerLine = lines[0]?.replace(/^#\s*/, '') ?? ''
  const headers = headerLine.split(/\s+/)

  // First non-comment line is the most recent observation
  const dataLine = lines.find(l => !l.startsWith('#'))
  if (!dataLine) {
    return emptyObservation(stationId)
  }
  const cols = dataLine.split(/\s+/)

  const get = (name: string): string | undefined => {
    const idx = headers.indexOf(name)
    return idx >= 0 ? cols[idx] : undefined
  }

  const waveHeightM   = parseVal(get('WVHT') ?? 'MM')
  const dominantPeriodS = parseVal(get('DPD') ?? 'MM')
  const swellDirectionDeg = parseVal(get('MWD') ?? 'MM')
  const waterTempC    = parseVal(get('WTMP') ?? 'MM')

  // Build UTC timestamp from YY MM DD hh mm columns
  // Note: 'MM' (uppercase) = month; 'mm' (lowercase) = minute — case-sensitive
  const yr = get('YY')
  const mo = get('MM')
  const dy = get('DD')
  const hh = get('hh')
  const mn = get('mm')
  let observedAt: string | null = null
  if (yr && mo && dy && hh && mn) {
    const year = yr.length === 2 ? `20${yr}` : yr
    observedAt = `${year}-${mo.padStart(2,'0')}-${dy.padStart(2,'0')}T${hh.padStart(2,'0')}:${mn.padStart(2,'0')}:00Z`
  }

  return {
    stationId,
    waveHeightM,
    waveHeightFt: waveHeightM != null ? Math.round(waveHeightM * 3.28084 * 10) / 10 : null,
    dominantPeriodS,
    swellDirectionDeg,
    swellDirectionCompass: swellDirectionDeg != null ? degToCompass(swellDirectionDeg) : null,
    waterTempC,
    waterTempF: waterTempC != null ? Math.round((waterTempC * 9 / 5 + 32) * 10) / 10 : null,
    observedAt,
  }
}

function emptyObservation(stationId: string): BuoyObservation {
  return {
    stationId,
    waveHeightM: null, waveHeightFt: null,
    dominantPeriodS: null,
    swellDirectionDeg: null, swellDirectionCompass: null,
    waterTempC: null, waterTempF: null,
    observedAt: null,
  }
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

export async function getBuoyObservation(stationId: string): Promise<BuoyObservation> {
  const url = `${NDBC_BASE}/${stationId}.txt`
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  })
  if (!res.ok) {
    throw new Error(`NDBC ${res.status} for station ${stationId}`)
  }
  const text = await res.text()
  return parseBuoyText(stationId, text)
}
