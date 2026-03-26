import { getPRAlerts } from '@/lib/weather-api'

export async function GET() {
  try {
    const data = await getPRAlerts()
    return Response.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 502 })
  }
}
