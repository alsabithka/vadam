import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion'

type Team = 'blue' | 'mustard'

interface CharacterProps {
  side: 'left' | 'right'
  team: Team
  intensity: number // smoothed 0..1 live shout
  spike: number // increments on a hard shout — fires anticipation + dust
  pullVel: number // signed rope velocity (+ = moving right)
  straining: boolean
  phaseOffset?: number // desync the two characters so they never lockstep
}

const PALETTE: Record<Team, { shirt: string; shirtShade: string; stripe: string; band: string }> = {
  blue: { shirt: '#2f6fb0', shirtShade: '#24568a', stripe: '#2f6fb0', band: '#8ec3ef' },
  mustard: { shirt: '#d99a1c', shirtShade: '#b47c10', stripe: '#d99a1c', band: '#f3c766' },
}

const SKIN = '#a9713f'
const SKIN_SHADE = '#8a5a2e'
const MUNDU = '#f6efdd'
const MUNDU_SHADE = '#e4d6b4'

// Layered, semi-realistic tug-of-war figure driven entirely by game state via
// Framer Motion springs. Torso lean springs (with overshoot) toward how hard
// the player pulls; the mundu lags behind it as cloth; legs step at a cadence
// coupled to rope movement; hard shouts fire a wind-up + follow-through and
// kick up a mud puff. Only transform/opacity animate, so it stays at 60fps.
export default function Character({ side, team, intensity, spike, pullVel, straining, phaseOffset = 0 }: CharacterProps) {
  const c = PALETTE[team]

  // live inputs the internal RAF reads without re-rendering
  const intensityRef = useRef(intensity)
  const draggedRef = useRef(0)
  intensityRef.current = intensity
  // positive when THIS character is being dragged toward center (losing ground)
  draggedRef.current = Math.max(0, side === 'left' ? pullVel : -pullVel)

  // --- torso lean: spring with weight + overshoot ---
  const bodyLean = useSpring(-18, { stiffness: 120, damping: 14, mass: 0.8 })
  const windup = useMotionValue(0) // one-shot anticipation/follow-through
  const breath = useMotionValue(0) // never-frozen idle sway
  const torsoRot = useTransform(() => bodyLean.get() + windup.get() + breath.get())
  // mundu lags the torso — softer spring = secondary cloth motion
  const clothRot = useSpring(torsoRot, { stiffness: 55, damping: 11, mass: 1.2 })

  // retarget the lean whenever the shout / drag changes
  useEffect(() => {
    const dragged = Math.min(1, draggedRef.current * 9)
    bodyLean.set(-(18 + intensity * 16) + dragged * 13)
  }, [intensity, pullVel, bodyLean])

  // wind-up (dip forward) then follow-through (extra lean back) on each spike
  useEffect(() => {
    if (spike === 0) return
    const controls = animate(windup, [5, -11, 0], {
      duration: 0.5,
      times: [0, 0.28, 1],
      ease: [0.2, 0.8, 0.2, 1],
    })
    return () => controls.stop()
  }, [spike, windup])

  // --- leg cadence + breathing (single RAF, writes motion values only) ---
  const legBack = useMotionValue(-2)
  const legFront = useMotionValue(-2)
  const liftBack = useMotionValue(0)
  const liftFront = useMotionValue(0)

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let phase = phaseOffset
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const i = intensityRef.current
      const dragged = draggedRef.current
      // footfall speed rises with effort and with being dragged
      const speed = (straining ? 1.5 : 0.7) + i * 3.4 + Math.min(2.4, dragged * 5)
      phase += speed * dt * Math.PI
      const s = Math.sin(phase)
      legBack.set(-2 + 14 * s)
      legFront.set(-2 + 14 * Math.sin(phase + Math.PI))
      liftBack.set(-Math.max(0, 7 * s))
      liftFront.set(-Math.max(0, 7 * Math.sin(phase + Math.PI)))
      breath.set(Math.sin(now / 1000 * (1.05 + phaseOffset * 0.1)) * (1.1 + i * 0.7))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [straining, phaseOffset, legBack, legFront, liftBack, liftFront, breath])

  // --- mud puffs at the front foot on hard plants ---
  const [dust, setDust] = useState<{ id: number; x: number }[]>([])
  useEffect(() => {
    if (spike === 0) return
    const id = spike + Math.random()
    const x = 140 + (Math.random() - 0.5) * 24
    setDust((d) => [...d, { id, x }])
    const t = setTimeout(() => setDust((d) => d.filter((p) => p.id !== id)), 620)
    return () => clearTimeout(t)
  }, [spike])

  const originTorso: CSSProperties = { transformOrigin: '112px 200px' }
  const backLegStyle = { transformOrigin: '104px 202px', rotate: legBack, y: liftBack }
  const frontLegStyle = { transformOrigin: '120px 204px', rotate: legFront, y: liftFront }

  return (
    <div
      className="pointer-events-none select-none"
      style={{ width: 'min(30vw, 240px)', transform: side === 'right' ? 'scaleX(-1)' : undefined }}
    >
      <svg viewBox="0 0 240 340" width="100%" role="img" aria-label={`${team} player pulling the rope`}>
        <defs>
          <radialGradient id={`sh-${team}-${side}`} cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#000" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* cast shadow in the mud */}
        <ellipse cx="118" cy="326" rx="86" ry="15" fill={`url(#sh-${team}-${side})`} />

        {/* mud puffs at the plant */}
        {dust.map((p) => (
          <motion.circle
            key={p.id}
            cx={p.x}
            cy={306}
            fill="#8a5a2e"
            initial={{ scale: 0.3, opacity: 0.65 }}
            animate={{ scale: 1.9, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            r={9}
            style={{ transformOrigin: `${p.x}px 306px` }}
          />
        ))}

        {/* ---- BACK LEG (far side) ---- */}
        <motion.g style={backLegStyle}>
          <path d="M104 200 q-24 26 -30 52 q-4 20 8 40" fill="none" stroke={SKIN_SHADE} strokeWidth="20" strokeLinecap="round" />
          <path d="M96 196 q-16 20 -22 40 l24 6 q6 -24 20 -40 z" fill={MUNDU_SHADE} />
          <path d="M70 292 q-14 4 -18 12 q-2 8 10 10 l30 0 q8 -1 6 -10 l-6 -14 z" fill={SKIN} />
        </motion.g>

        {/* ---- FRONT LEG (planted, bent ~120°) ---- */}
        <motion.g style={frontLegStyle}>
          <path d="M120 202 q18 24 20 50 q1 22 -6 42" fill="none" stroke={SKIN} strokeWidth="21" strokeLinecap="round" />
          <path d="M112 198 q18 20 20 42 l-24 4 q-4 -24 -18 -42 z" fill={MUNDU} />
          <path d="M132 296 q22 2 30 12 q4 9 -8 11 l-34 0 q-8 -1 -6 -12 l4 -12 z" fill={SKIN} />
        </motion.g>

        {/* mundu waist wrap — lags the torso (cloth secondary motion) */}
        <motion.g style={{ ...originTorso, rotate: clothRot }}>
          <path d="M86 196 q26 -16 56 -2 l-6 26 q-24 10 -48 0 z" fill={MUNDU} />
          <path d="M88 202 h50 l-2 8 h-46 z" fill={c.stripe} opacity="0.85" />
        </motion.g>

        {/* ---- TORSO + HEAD + ARMS ---- */}
        <motion.g style={{ ...originTorso, rotate: torsoRot }}>
          {/* trunk (leaning back), shirt */}
          <path d="M92 200 q-6 -60 22 -96 q10 -12 24 -6 q22 12 20 44 q-2 34 -14 64 q-26 10 -52 -6 z" fill={c.shirt} />
          <path d="M118 100 q20 12 18 44 q-2 30 -12 58 l-10 -2 q10 -30 12 -60 q2 -28 -14 -38 z" fill={c.shirtShade} />
          <path d="M96 108 q18 -14 40 -6 l-4 16 q-18 -8 -34 2 z" fill={c.band} />

          {/* neck */}
          <path d="M118 92 l14 8 -6 16 -16 -6 z" fill={SKIN_SHADE} />

          {/* head, leaning back with the strain */}
          <g transform="rotate(-6 150 70)">
            <ellipse cx="150" cy="70" rx="17" ry="19" fill={SKIN} />
            <path d="M133 66 q0 -22 20 -24 q22 -2 20 18 q-10 -8 -22 -6 q-14 2 -18 12 z" fill="#241209" />
            <ellipse cx="158" cy="70" rx="2.2" ry="2.6" fill="#241209" />
            <ellipse cx="163" cy="82" rx="5" ry="6.5" fill="#3a160c" />
            <ellipse cx="139" cy="76" rx="4" ry="5" fill={SKIN_SHADE} />
          </g>

          {/* ---- ARMS: both hands grip the rope, palms facing in ---- */}
          <path d="M108 118 q40 6 84 46" fill="none" stroke={SKIN_SHADE} strokeWidth="17" strokeLinecap="round" />
          <path d="M104 126 q46 12 86 52" fill="none" stroke={SKIN} strokeWidth="18" strokeLinecap="round" />
          <path d="M102 118 q16 -6 30 2 l-4 14 q-14 -8 -28 -2 z" fill={c.band} />

          <g transform="translate(192 168)">
            <ellipse cx="0" cy="0" rx="12" ry="10" fill={SKIN} />
            <path d="M-8 -6 q10 -6 18 2 M-9 0 q11 -4 19 3 M-8 6 q10 -3 18 3" stroke={SKIN_SHADE} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          </g>
          <g transform="translate(190 180)">
            <ellipse cx="0" cy="0" rx="11" ry="9" fill={SKIN_SHADE} />
            <path d="M-8 -4 q10 -5 17 2 M-8 3 q10 -3 17 3" stroke="#6f4520" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          </g>
        </motion.g>
      </svg>
    </div>
  )
}
