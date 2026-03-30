import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  const s = 180

  return new ImageResponse(
    (
      <div
        style={{
          width: s,
          height: s,
          background: '#0f172a',
          borderRadius: Math.round(s * 0.2),
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
            bottom: -Math.round(s * 0.08),
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
            bottom: -Math.round(s * 0.04),
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
            fontSize: Math.round(s * 0.32),
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            position: 'relative',
            zIndex: 10,
            marginBottom: Math.round(s * 0.06),
            fontFamily: 'serif',
          }}
        >
          PS
        </span>
      </div>
    ),
    { ...size }
  )
}
