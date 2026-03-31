import { getPRAlerts } from '@/lib/weather-api'
import { isBeachAlert } from '@/lib/weather-utils'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const limited = rateLimit(request)
  if (limited) return limited

  try {
    const data = await getPRAlerts()
    const total = data.features?.length ?? 0
    const beach = data.features?.filter(f => isBeachAlert(f.properties.event)) ?? []
    console.log(`[alerts] NWS returned ${total} total PR alerts, ${beach.length} beach-relevant`)
    if (beach.length > 0) {
      beach.forEach((f, i) => {
        console.log(`[alerts]   ${i + 1}. event=${JSON.stringify(f.properties.event)} severity=${f.properties.severity}`)
      })
    } else {
      console.log('[alerts]   (no active beach/surf alerts for PR)')
    }
    return Response.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[alerts] fetch failed:', message)
    return Response.json({ error: message }, { status: 502 })
  }
}
