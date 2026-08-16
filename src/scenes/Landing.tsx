import { useState } from 'react'

interface LandingProps {
  onHost: (name: string) => void
  onJoin: (name: string, code: string) => void
  onPractice: (name: string) => void
  error?: string | null
}

export default function Landing({ onHost, onJoin, onPractice, error }: LandingProps) {
  const [name, setName] = useState('')
  const [mode, setMode] = useState<'menu' | 'join'>('menu')
  const [code, setCode] = useState('')

  const player = name.trim() || 'Player'

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center px-6 py-10">
      <div className="animate-rise flex w-full max-w-md flex-col items-center gap-7 text-center">
        <div className="flex flex-col items-center gap-1">
          <span className="font-body text-sm uppercase tracking-[0.4em] text-gold">ഓണം · Onam</span>
          <h1 className="font-display text-6xl font-extrabold leading-none text-cream" style={{ textShadow: '0 3px 0 #6b3f22, 0 6px 18px rgba(0,0,0,.5)' }}>
            Vadam Vali
          </h1>
          <p className="mt-2 font-body text-base text-cream/80">
            Shout <span className="font-display font-bold text-gold">"Arpooo!"</span> to pull the rope. Loudest side wins the tug-of-war.
          </p>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={14}
          placeholder="Your name"
          className="w-full rounded-xl border border-gold/40 bg-black/25 px-4 py-3 text-center font-display text-xl text-cream placeholder:text-cream/40 focus:border-gold focus:outline-none"
        />

        {mode === 'menu' ? (
          <div className="flex w-full flex-col gap-3">
            <PrimaryButton onClick={() => onHost(player)}>Host a Match</PrimaryButton>
            <SecondaryButton onClick={() => setMode('join')}>Join with Code</SecondaryButton>
            <button
              onClick={() => onPractice(player)}
              className="mt-1 font-body text-sm text-cream/70 underline-offset-4 hover:text-gold hover:underline"
            >
              or practice against Maveli AI →
            </button>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-3">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
              placeholder="CODE"
              className="w-full rounded-xl border border-gold/40 bg-black/25 px-4 py-3 text-center font-mono text-3xl tracking-[0.4em] text-gold placeholder:text-cream/30 focus:border-gold focus:outline-none"
            />
            <PrimaryButton onClick={() => code.length === 4 && onJoin(player, code)} disabled={code.length !== 4}>
              Join Match
            </PrimaryButton>
            <SecondaryButton onClick={() => setMode('menu')}>← Back</SecondaryButton>
          </div>
        )}

        {error && <p className="font-body text-sm text-marigold">{error}</p>}
      </div>
    </div>
  )
}

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl bg-gold px-6 py-3.5 font-display text-xl font-bold text-mud-deep shadow-[0_4px_0_#b47c10] transition active:translate-y-0.5 active:shadow-[0_2px_0_#b47c10] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}

function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-cream/30 bg-black/20 px-6 py-3 font-display text-lg font-semibold text-cream transition hover:border-gold/60 hover:text-gold"
    >
      {children}
    </button>
  )
}
