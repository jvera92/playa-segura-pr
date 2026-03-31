import { getSurfZoneForecast } from '@/lib/surf-forecast-api'
import { rateLimit } from '@/lib/rate-limit'

const VALID_ZONES = new Set(['prz001','prz002','prz003','prz005','prz007','prz008','prz010','prz011','prz012','prz013'])

export async function GET(request: Request) {
  const limited = rateLimit(request)
  if (limited) return limited

  const { searchParams } = new URL(request.url)
  const zone = searchParams.get('zone')?.toLowerCase()

  if (!zone || !VALID_ZONES.has(zone)) {
    return Response.json({ error: `Valid zone required (e.g. prz001). Got: ${zone}` }, { status: 400 })
  }

  try {
    const data = await getSurfZoneForecast(zone)
    console.log(
      `[surf-forecast] ${zone}: today=${data.periods[0]?.label} ` +
      `rip=${data.periods[0]?.ripCurrentRisk ?? 'null'} ` +
      `surf=${data.periods[0]?.surfHeightText ?? 'null'}`
    )
    return Response.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch surf forecast'
    console.error(`[surf-forecast] ${zone} error:`, message)
    return Response.json({ error: message }, { status: 502 })
  }
}
