import { ImageResponse } from 'next/og'

export function generateImageMetadata() {
  return [
    { id: '192', size: { width: 192, height: 192 }, contentType: 'image/png' },
    { id: '512', size: { width: 512, height: 512 }, contentType: 'image/png' },
  ]
}

export const contentType = 'image/png'

// Build a Puerto Rico flag icon adapted to a square canvas.
// Portrait layout: 5 vertical red/white stripes, navy downward triangle at top
// (formed by two CSS gradient halves), white ★ inside, "PS" in navy below.
//
// The triangle is exactly size/2 tall, making each half-div a perfect square,
// which lets `to top right` / `to top left` linear-gradients produce clean
// 45° diagonals — no clip-path needed.
function FlagIcon({ size: s }: { size: number }) {
  const half = s / 2            // half the icon = width of each gradient div = triangle height
  const starTop = Math.round(half * 0.22)
  const starSize = Math.round(s * 0.19)
  const psTop = Math.round(s * 0.62)
  const psSize = Math.round(s * 0.17)

  return (
    <div
      style={{
        width: s,
        height: s,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        // 5 vertical stripes: red–white–red–white–red
        background:
          'linear-gradient(to right,' +
          ' #CE1126 0%, #CE1126 20%,' +
          ' #FFFFFF 20%, #FFFFFF 40%,' +
          ' #CE1126 40%, #CE1126 60%,' +
          ' #FFFFFF 60%, #FFFFFF 80%,' +
          ' #CE1126 80%, #CE1126 100%)',
      }}
    >
      {/*
        Triangle = two square gradient halves, each (half × half).
        Left half:  gradient "to top right"  → navy fills upper-right ◥
        Right half: gradient "to top left"   → navy fills upper-left  ◤
        Together they form a downward-pointing ▽ covering the top 50% of the icon.
      */}
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

      {/* White star centred in the triangle */}
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

      {/* "PS" in navy, centred in the stripe area below the triangle */}
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
  )
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const iconId = await id
  const size = iconId === '512' ? 512 : 192

  return new ImageResponse(<FlagIcon size={size} />, { width: size, height: size })
}
