import type { CSSProperties } from 'react'

type Team = 'blue' | 'mustard'

interface CharacterProps {
  side: 'left' | 'right'
  team: Team
  intensity: number // 0..1 live shout
  straining: boolean
}

const PALETTE: Record<Team, { shirt: string; shirtShade: string; stripe: string; band: string }> = {
  blue: { shirt: '#2f6fb0', shirtShade: '#24568a', stripe: '#2f6fb0', band: '#8ec3ef' },
  mustard: { shirt: '#d99a1c', shirtShade: '#b47c10', stripe: '#d99a1c', band: '#f3c766' },
}

const SKIN = '#a9713f'
const SKIN_SHADE = '#8a5a2e'
const MUNDU = '#f6efdd'
const MUNDU_SHADE = '#e4d6b4'

// A layered, semi-realistic tug-of-war figure. Torso+arms, back leg and front
// leg are independent groups so they animate separately: legs run a continuous
// backward-stepping cycle (CSS keyframes, never idle) while the torso leans
// back harder the louder the player shouts.
export default function Character({ side, team, intensity, straining }: CharacterProps) {
  const c = PALETTE[team]
  const lean = 18 + Math.min(1, intensity) * 16 // degrees the torso pulls back
  const cycle = 1.25 - Math.min(1, intensity) * 0.55 // faster steps when louder

  const torsoStyle: CSSProperties = {
    transformOrigin: '112px 200px',
    transform: `rotate(${-lean}deg)`,
    transition: 'transform 120ms linear',
    animation: `torso-strain ${(cycle * 0.9).toFixed(2)}s ease-in-out infinite`,
  }
  const backLegStyle: CSSProperties = {
    transformOrigin: '104px 202px',
    animation: `leg-back ${cycle.toFixed(2)}s ease-in-out infinite`,
  }
  const frontLegStyle: CSSProperties = {
    transformOrigin: '120px 204px',
    animation: `leg-back ${cycle.toFixed(2)}s ease-in-out infinite`,
    animationDelay: `${(-cycle / 2).toFixed(2)}s`,
  }

  return (
    <div
      className="pointer-events-none select-none"
      style={{
        width: 'min(30vw, 240px)',
        filter: straining ? 'saturate(1.05)' : 'saturate(0.98) brightness(0.99)',
        transform: side === 'right' ? 'scaleX(-1)' : undefined,
      }}
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

        {/* ---- BACK LEG (far side) ---- */}
        <g style={backLegStyle}>
          <path
            d="M104 200 q-24 26 -30 52 q-4 20 8 40"
            fill="none"
            stroke={SKIN_SHADE}
            strokeWidth="20"
            strokeLinecap="round"
          />
          {/* mundu drape over the thigh */}
          <path d="M96 196 q-16 20 -22 40 l24 6 q6 -24 20 -40 z" fill={MUNDU_SHADE} />
          {/* foot digging in, heel lifted */}
          <g style={{ transformOrigin: '82px 292px', animation: `heel-dig ${cycle.toFixed(2)}s ease-in-out infinite` }}>
            <path d="M70 292 q-14 4 -18 12 q-2 8 10 10 l30 0 q8 -1 6 -10 l-6 -14 z" fill={SKIN} />
          </g>
        </g>

        {/* ---- FRONT LEG (planted, bent ~120°) ---- */}
        <g style={frontLegStyle}>
          <path
            d="M120 202 q18 24 20 50 q1 22 -6 42"
            fill="none"
            stroke={SKIN}
            strokeWidth="21"
            strokeLinecap="round"
          />
          <path d="M112 198 q18 20 20 42 l-24 4 q-4 -24 -18 -42 z" fill={MUNDU} />
          {/* forward foot pressing into mud */}
          <path d="M132 296 q22 2 30 12 q4 9 -8 11 l-34 0 q-8 -1 -6 -12 l4 -12 z" fill={SKIN} />
        </g>

        {/* ---- TORSO + HEAD + ARMS ---- */}
        <g style={torsoStyle}>
          {/* mundu waist wrap */}
          <path d="M86 196 q26 -16 56 -2 l-6 26 q-24 10 -48 0 z" fill={MUNDU} />
          <path d="M88 202 h50 l-2 8 h-46 z" fill={c.stripe} opacity="0.85" />

          {/* trunk (leaning back), shirt */}
          <path
            d="M92 200 q-6 -60 22 -96 q10 -12 24 -6 q22 12 20 44 q-2 34 -14 64 q-26 10 -52 -6 z"
            fill={c.shirt}
          />
          <path
            d="M118 100 q20 12 18 44 q-2 30 -12 58 l-10 -2 q10 -30 12 -60 q2 -28 -14 -38 z"
            fill={c.shirtShade}
          />
          {/* rolled-up sleeve band on shoulder */}
          <path d="M96 108 q18 -14 40 -6 l-4 16 q-18 -8 -34 2 z" fill={c.band} />

          {/* neck */}
          <path d="M118 92 l14 8 -6 16 -16 -6 z" fill={SKIN_SHADE} />

          {/* head, leaning back with the strain */}
          <g transform="rotate(-6 150 70)">
            <ellipse cx="150" cy="70" rx="17" ry="19" fill={SKIN} />
            <path d="M133 66 q0 -22 20 -24 q22 -2 20 18 q-10 -8 -22 -6 q-14 2 -18 12 z" fill="#241209" />
            <ellipse cx="158" cy="70" rx="2.2" ry="2.6" fill="#241209" />
            {/* open, shouting mouth */}
            <ellipse cx="163" cy="82" rx="5" ry="6.5" fill="#3a160c" />
            <ellipse cx="139" cy="76" rx="4" ry="5" fill={SKIN_SHADE} />
          </g>

          {/* ---- ARMS: both hands grip the rope, palms facing in ---- */}
          {/* far arm */}
          <path
            d="M108 118 q40 6 84 46"
            fill="none"
            stroke={SKIN_SHADE}
            strokeWidth="17"
            strokeLinecap="round"
          />
          {/* near arm */}
          <path
            d="M104 126 q46 12 86 52"
            fill="none"
            stroke={SKIN}
            strokeWidth="18"
            strokeLinecap="round"
          />
          <path d="M102 118 q16 -6 30 2 l-4 14 q-14 -8 -28 -2 z" fill={c.band} />

          {/* gripping hands with finger curl at the rope */}
          <g transform="translate(192 168)">
            <ellipse cx="0" cy="0" rx="12" ry="10" fill={SKIN} />
            <path d="M-8 -6 q10 -6 18 2 M-9 0 q11 -4 19 3 M-8 6 q10 -3 18 3" stroke={SKIN_SHADE} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          </g>
          <g transform="translate(190 180)">
            <ellipse cx="0" cy="0" rx="11" ry="9" fill={SKIN_SHADE} />
            <path d="M-8 -4 q10 -5 17 2 M-8 3 q10 -3 17 3" stroke="#6f4520" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          </g>
        </g>
      </svg>
    </div>
  )
}
