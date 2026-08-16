import { useEffect, useRef } from 'react'

interface RopeProps {
  pull: number // -1 (left wins) .. +1 (right wins)
  iHost: number // left player's live (smoothed) intensity 0..1
  iGuest: number // right player's live (smoothed) intensity 0..1
}

const W = 1000
const H = 220
const LEFT = 70
const RIGHT = 930
const BASE_Y = 110
const IDLE_AMP = 3 // rope is never fully static
const MAX_AMP = 26
const CENTER_SHIFT = 210 // px the midpoint travels toward the winning side

// Continuous jute rope. The centreline is layered noise — a slow tension/sag
// wave plus a faster intensity-scaled jitter — and the rope is drawn as a
// ribbon whose thickness varies along its length (thin where taut, slack near
// the losing side). The knot's midpoint follows the pull through a spring so
// direction changes carry momentum instead of snapping.
export default function Rope({ pull, iHost, iGuest }: RopeProps) {
  const ribbonRef = useRef<SVGPathElement | null>(null)
  const coreRef = useRef<SVGPathElement | null>(null)
  const knotRef = useRef<SVGGElement | null>(null)
  const props = useRef({ pull, iHost, iGuest })
  props.current = { pull, iHost, iGuest }

  useEffect(() => {
    let raf = 0
    let phase = 0
    let last = performance.now()
    // spring state for the sliding midpoint
    let midCur = (LEFT + RIGHT) / 2
    let midVel = 0

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const { pull: p, iHost: a, iGuest: b } = props.current
      const total = a + b
      phase += (0.16 + total * 0.3) * (dt * 60)

      // critically-ish damped spring toward the target midpoint
      const target = (LEFT + RIGHT) / 2 + p * CENTER_SHIFT
      const accel = 90 * (target - midCur) - 15 * midVel
      midVel += accel * dt
      midCur += midVel * dt

      const baseFreq = 0.009
      const jitterFreq = 0.045
      const steps = 56
      const top: string[] = []
      const bottom: string[] = []
      let core = ''

      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const x = LEFT + (RIGHT - LEFT) * t
        const taper = Math.sin(Math.PI * t) // 0 at ends, 1 mid
        const localShout = a * (1 - t) + b * t

        // layered noise: slow base wave + fast jitter (+ a second offset sine)
        const base = Math.sin(x * baseFreq + phase * 0.4) * (IDLE_AMP + total * 7)
        const jitter =
          (Math.sin(x * jitterFreq + phase * 2.1) * 0.6 + Math.sin(x * jitterFreq * 1.7 + phase * 3.3) * 0.4) *
          localShout *
          MAX_AMP
        const sag = Math.sin(t * Math.PI) * 11
        const y = BASE_Y + (base + jitter) * taper + sag

        // thickness: thin where taut, thicker/slack toward the losing side
        const slack = Math.max(0, p) * (1 - t) * 3 + Math.max(0, -p) * t * 3
        const halfW = 5.4 + (1 - localShout) * 2.1 + slack

        top.push(`${x.toFixed(1)} ${(y - halfW).toFixed(1)}`)
        bottom.push(`${x.toFixed(1)} ${(y + halfW).toFixed(1)}`)
        core += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' '
      }

      const ribbon = 'M' + top.join(' L ') + ' L ' + bottom.reverse().join(' L ') + ' Z'
      ribbonRef.current?.setAttribute('d', ribbon)
      coreRef.current?.setAttribute('d', core)

      const midT = (midCur - LEFT) / (RIGHT - LEFT)
      const midY = BASE_Y + Math.sin(midT * Math.PI) * 11
      knotRef.current?.setAttribute('transform', `translate(${midCur.toFixed(1)} ${midY.toFixed(1)})`)

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

      {/* rope: dark core underlay for depth, then the textured variable-width ribbon */}
      <path ref={coreRef} d="" fill="none" stroke="#3d2610" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
      <path ref={ribbonRef} d="" fill="url(#strands)" stroke="#5e3a12" strokeWidth="0.75" />

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
