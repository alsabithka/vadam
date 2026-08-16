import { useEffect, useRef } from 'react'

interface RopeProps {
  pull: number // -1 (left wins) .. +1 (right wins)
  iHost: number // left player's live intensity 0..1
  iGuest: number // right player's live intensity 0..1
}

const W = 1000
const H = 220
const LEFT = 70
const RIGHT = 930
const BASE_Y = 110
const IDLE_AMP = 3 // rope is never fully static
const MAX_AMP = 30
const CENTER_SHIFT = 210 // px the midpoint travels toward the winning side

// Continuous jute rope drawn with a travelling wave. Amplitude ramps from the
// side of whichever player is shouting; the central knot slides with the pull
// balance and marks the win threshold.
export default function Rope({ pull, iHost, iGuest }: RopeProps) {
  const pathRef = useRef<SVGPathElement | null>(null)
  const texRef = useRef<SVGPathElement | null>(null)
  const knotRef = useRef<SVGGElement | null>(null)
  const props = useRef({ pull, iHost, iGuest })
  props.current = { pull, iHost, iGuest }

  useEffect(() => {
    let raf = 0
    let phase = 0
    const render = () => {
      const { pull: p, iHost: a, iGuest: b } = props.current
      const total = a + b
      phase += 0.18 + total * 0.35
      const freq = 0.012 + total * 0.02
      const midX = (LEFT + RIGHT) / 2 + p * CENTER_SHIFT

      let d = ''
      const steps = 48
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const x = LEFT + (RIGHT - LEFT) * t
        // amplitude blends each end's shout; taper to zero at the anchored hands
        const localShout = a * (1 - t) + b * t
        const taper = Math.sin(Math.PI * t) // 0 at ends, 1 in middle
        const amp = (IDLE_AMP + localShout * MAX_AMP) * taper
        // sag the rope toward the losing side a touch
        const y = BASE_Y + Math.sin(x * freq + phase) * amp + Math.sin(t * Math.PI) * 10
        d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' '
      }
      pathRef.current?.setAttribute('d', d)
      texRef.current?.setAttribute('d', d)

      const midT = (midX - LEFT) / (RIGHT - LEFT)
      const midY = BASE_Y + Math.sin(midT * Math.PI) * 10
      knotRef.current?.setAttribute('transform', `translate(${midX.toFixed(1)} ${midY.toFixed(1)})`)

      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, height: '100%', overflow: 'visible' }}
      aria-hidden
    >
      <defs>
        <linearGradient id="jute" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9973f" />
          <stop offset="45%" stopColor="#a06a2a" />
          <stop offset="100%" stopColor="#6f4718" />
        </linearGradient>
        <pattern id="strands" width="14" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(8)">
          <rect width="14" height="12" fill="url(#jute)" />
          <path d="M0 2 L14 6 M0 8 L14 12" stroke="#5e3a12" strokeWidth="1.4" opacity="0.5" />
        </pattern>
      </defs>

      {/* center-line threshold ticks */}
      <line x1="500" y1="40" x2="500" y2="180" stroke="#fbf3d9" strokeWidth="2" strokeDasharray="4 8" opacity="0.35" />

      {/* rope: dark underlay for depth, then textured strand on top */}
      <path ref={pathRef} d="" fill="none" stroke="#3d2610" strokeWidth="16" strokeLinecap="round" />
      <path ref={texRef} d="" fill="none" stroke="url(#strands)" strokeWidth="11" strokeLinecap="round" />

      {/* central knot + festival flag marking the balance point */}
      <g ref={knotRef}>
        <ellipse cx="0" cy="0" rx="14" ry="17" fill="#7c4d1c" stroke="#3d2610" strokeWidth="3" />
        <path d="M-10 -6 Q0 0 -10 6 M10 -6 Q0 0 10 6" stroke="#3d2610" strokeWidth="2" fill="none" />
        <g transform="translate(0 -46)">
          <line x1="0" y1="0" x2="0" y2="46" stroke="#4a2915" strokeWidth="3" />
          <path d="M0 0 L34 8 L0 18 Z" fill="#ef7e1a" />
          <path d="M0 4 L20 8 L0 12 Z" fill="#f4b528" />
        </g>
      </g>
    </svg>
  )
}
