import { ImageResponse } from 'next/og'

export function generateImageMetadata() {
  return [
    { id: '192', size: { width: 192, height: 192 }, contentType: 'image/png' },
    { id: '512', size: { width: 512, height: 512 }, contentType: 'image/png' },
  ]
}

export const contentType = 'image/png'

export default async function Icon({ id }: { id: Promise<string> }) {
  const iconId = await id
  const size = iconId === '512' ? 512 : 192

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: '#0f172a',
          borderRadius: Math.round(size * 0.2),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Bottom wave layer — darker */}
        <div
          style={{
            position: 'absolute',
            bottom: -Math.round(size * 0.08),
            left: '-10%',
            width: '120%',
            height: '42%',
            background: '#0369a1',
            borderRadius: '60% 60% 0 0',
            display: 'flex',
          }}
        />
        {/* Top wave layer — bright */}
        <div
          style={{
            position: 'absolute',
            bottom: -Math.round(size * 0.04),
            left: '-15%',
            width: '130%',
            height: '36%',
            background: '#0ea5e9',
            borderRadius: '55% 65% 0 0',
            display: 'flex',
          }}
        />
        {/* Wordmark */}
        <span
          style={{
            color: '#ffffff',
            fontSize: Math.round(size * 0.32),
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            position: 'relative',
            zIndex: 10,
            marginBottom: Math.round(size * 0.06),
            fontFamily: 'serif',
          }}
        >
          PS
        </span>
      </div>
    ),
    { width: size, height: size }
  )
}
