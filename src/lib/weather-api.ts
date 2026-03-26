const USER_AGENT = 'PlayaSeguraPR/1.0 (playasegurapr@gmail.com)'

const NWS_HEADERS = {
  'User-Agent': USER_AGENT,
  Accept: 'application/geo+json',
}

// --- Types ---

export interface NWSPointsProperties {
  forecast: string
  forecastHourly: string
  forecastGridData: string
  gridId: string
  gridX: number
  gridY: number
  relativeLocation: {
    properties: {
      city: string
      state: string
    }
  }
  timeZone: string
}

export interface NWSPointsResponse {
  properties: NWSPointsProperties
}

export interface ForecastPeriod {
  number: number
  name: string
  startTime: string
  endTime: string
  isDaytime: boolean
  temperature: number
  temperatureUnit: string
  temperatureTrend: string | null
  probabilityOfPrecipitation: {
    value: number | null
    unitCode: string
  }
  windSpeed: string
  windDirection: string
  icon: string
  shortForecast: string
  detailedForecast: string
}

export interface ForecastProperties {
  updateTime: string
  units: string
  forecastGenerator: string
  generatedAt: string
  validTimes: string
  elevation: {
    value: number
    unitCode: string
  }
  periods: ForecastPeriod[]
}

export interface ForecastResponse {
  properties: ForecastProperties
}

export interface NWSAlertProperties {
  id: string
  areaDesc: string
  sent: string
  effective: string
  onset: string | null
  expires: string
  ends: string | null
  status: string
  messageType: string
  category: string
  severity: string
  certainty: string
  urgency: string
  event: string
  headline: string | null
  description: string
  instruction: string | null
}

export interface NWSAlertFeature {
  id: string
  properties: NWSAlertProperties
}

export interface NWSAlertsResponse {
  features: NWSAlertFeature[]
  title: string
  updated: string
}

// --- API Functions ---

async function nwsFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: NWS_HEADERS })
  if (!res.ok) {
    throw new Error(`NWS API error ${res.status} fetching ${url}: ${await res.text()}`)
  }
  return res.json() as Promise<T>
}

export async function getWeatherForecast(
  lat: number,
  lng: number
): Promise<{ location: NWSPointsProperties; forecast: ForecastProperties }> {
  const points = await nwsFetch<NWSPointsResponse>(
    `https://api.weather.gov/points/${lat},${lng}`
  )
  const forecast = await nwsFetch<ForecastResponse>(points.properties.forecast)
  return {
    location: points.properties,
    forecast: forecast.properties,
  }
}

export async function getPRAlerts(): Promise<NWSAlertsResponse> {
  return nwsFetch<NWSAlertsResponse>(
    'https://api.weather.gov/alerts/active?area=PR'
  )
}
