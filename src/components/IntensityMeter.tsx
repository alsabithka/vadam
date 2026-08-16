interface MeterProps {
  intensity: number // 0..1
  team: 'blue' | 'mustard'
  align: 'left' | 'right'
  name: string
}

const COLOR = {
  blue: { from: '#8ec3ef', to: '#2f6fb0', glow: 'rgba(47,111,176,0.6)' },
  mustard: { from: '#f3c766', to: '#d99a1c', glow: 'rgba(217,154,28,0.6)' },
}

export default function IntensityMeter({ intensity, team, align, name }: MeterProps) {
  const pct = Math.round(Math.min(1, intensity) * 100)
  const c = COLOR[team]
  const shouting = intensity > 0.62
  const right = align === 'right'

  return (
    <div className={`flex flex-col gap-1.5 ${right ? 'items-end' : 'items-start'}`} style={{ width: 'min(38vw, 260px)' }}>
      <div className={`flex w-full items-baseline gap-2 ${right ? 'flex-row-reverse' : ''}`}>
        <span className="font-display text-lg font-bold tracking-wide text-cream drop-shadow">{name}</span>
        <span className="font-mono text-xs text-cream/70">{pct}%</span>
        {shouting && (
          <span className="font-display text-sm font-extrabold text-gold animate-pulse" style={{ textShadow: '0 1px 6px rgba(0,0,0,.6)' }}>
            ആർപ്പോ!
          </span>
        )}
      </div>
      <div
        className="relative h-4 w-full overflow-hidden rounded-full border border-black/30"
        style={{ background: 'rgba(20,10,4,0.55)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,.5)' }}
      >
        <div
          className="absolute inset-y-0 rounded-full"
          style={{
            width: `${pct}%`,
            [right ? 'right' : 'left']: 0,
            background: `linear-gradient(90deg, ${c.from}, ${c.to})`,
            boxShadow: shouting ? `0 0 14px ${c.glow}` : 'none',
            transition: 'width 90ms linear',
          }}
        />
      </div>
    </div>
  )
}
