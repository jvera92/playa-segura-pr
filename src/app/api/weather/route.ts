import { getWeatherForecast } from '@/lib/weather-api'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const limited = rateLimit(request)
  if (limited) return limited

  const { searchParams } = new URL(request.url)
  const latParam = searchParams.get('lat')
  const lngParam = searchParams.get('lng')

  if (!latParam || !lngParam) {
    return Response.json(
      { error: 'lat and lng query parameters are required' },
      { status: 400 }
    )
  }

  const lat = parseFloat(latParam)
  const lng = parseFloat(lngParam)

  if (isNaN(lat) || isNaN(lng)) {
    return Response.json(
      { error: 'lat and lng must be valid numbers' },
      { status: 400 }
    )
  }

  try {
    const data = await getWeatherForecast(lat, lng)
    return Response.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 502 })
  }
}
