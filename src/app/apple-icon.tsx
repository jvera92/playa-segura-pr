import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  const s = 180
  const half = s / 2
  const starTop = Math.round(half * 0.22)
  const starSize = Math.round(s * 0.19)
  const psTop = Math.round(s * 0.62)
  const psSize = Math.round(s * 0.17)

  return new ImageResponse(
    (
      <div
        style={{
          width: s,
          height: s,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          background:
            'linear-gradient(to right,' +
            ' #CE1126 0%, #CE1126 20%,' +
            ' #FFFFFF 20%, #FFFFFF 40%,' +
            ' #CE1126 40%, #CE1126 60%,' +
            ' #FFFFFF 60%, #FFFFFF 80%,' +
            ' #CE1126 80%, #CE1126 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: half,
            height: half,
            background: 'linear-gradient(to top right, transparent 50%, #0F172A 50%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: half,
            height: half,
            background: 'linear-gradient(to top left, transparent 50%, #0F172A 50%)',
            display: 'flex',
          }}
        />
        <span
          style={{
            position: 'absolute',
            top: starTop,
            left: 0,
            right: 0,
            textAlign: 'center',
            color: '#FFFFFF',
            fontSize: starSize,
            lineHeight: '1',
          }}
        >
          ★
        </span>
        <span
          style={{
            position: 'absolute',
            top: psTop,
            left: 0,
            right: 0,
            textAlign: 'center',
            color: '#0F172A',
            fontSize: psSize,
            fontWeight: 900,
            fontFamily: 'serif',
            letterSpacing: '-0.02em',
            lineHeight: '1',
          }}
        >
          PS
        </span>
      </div>
    ),
    { ...size }
  )
}
