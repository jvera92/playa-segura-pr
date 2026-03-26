import { getBuoyObservation } from '@/lib/buoy-api'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const station = searchParams.get('station')

  if (!station || !/^\d{5}$/.test(station)) {
    return Response.json({ error: 'Valid 5-digit station ID required' }, { status: 400 })
  }

  try {
    const data = await getBuoyObservation(station)
    return Response.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch buoy data'
    return Response.json({ error: message }, { status: 502 })
  }
}
