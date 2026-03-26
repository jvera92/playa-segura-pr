/**
 * Quick connectivity test for the NWS weather API.
 * Run with: npx tsx scripts/test-weather.ts
 */

import { getWeatherForecast, getPRAlerts } from '../src/lib/weather-api'

// Condado Beach, San Juan, PR
const LAT = 18.455
const LNG = -66.073

async function main() {
  console.log('=== Testing NWS Weather API ===\n')

  console.log(`Fetching forecast for Condado Beach (${LAT}, ${LNG})...`)
  try {
    const { location, forecast } = await getWeatherForecast(LAT, LNG)
    console.log(`Location: ${location.relativeLocation.properties.city}, ${location.relativeLocation.properties.state}`)
    console.log(`Timezone: ${location.timeZone}`)
    console.log(`Forecast updated: ${forecast.updateTime}`)
    console.log(`\nNext ${Math.min(3, forecast.periods.length)} forecast periods:`)
    for (const period of forecast.periods.slice(0, 3)) {
      console.log(`  [${period.name}] ${period.temperature}°${period.temperatureUnit} — ${period.shortForecast}`)
    }
  } catch (err) {
    console.error('Forecast fetch failed:', err)
  }

  console.log('\nFetching active NWS alerts for Puerto Rico...')
  try {
    const alerts = await getPRAlerts()
    if (alerts.features.length === 0) {
      console.log('No active alerts for Puerto Rico.')
    } else {
      console.log(`${alerts.features.length} active alert(s):`)
      for (const alert of alerts.features) {
        const p = alert.properties
        console.log(`  [${p.severity}] ${p.event} — ${p.areaDesc}`)
        if (p.headline) console.log(`    ${p.headline}`)
      }
    }
  } catch (err) {
    console.error('Alerts fetch failed:', err)
  }
}

main()
