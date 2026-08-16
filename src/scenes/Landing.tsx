import { useState } from "react"
import Field from "../components/Field"

interface LandingProps {
  onHost: (name: string) => void
  onJoin: (name: string, code: string) => void
  onPractice: (name: string) => void
  error: string | null
}

export default function Landing({
  onHost,
  onJoin,
  onPractice,
  error,
}: LandingProps) {
  const [name, setName] = useState("")
  const [mode, setMode] = useState<"menu" | "join">("menu")
  const [code, setCode] = useState("")
  const [nameError, setNameError] = useState<string | null>(null)
  const [codeError, setCodeError] = useState<string | null>(null)

  const validateName = (): string | null => {
    const t = name.trim()
    if (t.length < 2) return "Name must be at least 2 characters"
    return null
  }

  const handleHost = () => {
    const err = validateName()
    if (err) { setNameError(err); return }
    setNameError(null)
    onHost(name.trim())
  }

  const handleJoin = () => {
    const err = validateName()
    if (err) { setNameError(err); return }
    setNameError(null)
    if (code.length !== 4) { setCodeError("Room code must be 4 characters"); return }
    setCodeError(null)
    onJoin(name.trim(), code)
  }

  const handlePractice = () => {
    const err = validateName()
    if (err) { setNameError(err); return }
    setNameError(null)
    onPractice(name.trim())
  }

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden">
      {/* Paddy field background */}
      <Field />

      {/* Dark overlay for readability */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(30,10,2,0.72) 0%, rgba(30,10,2,0.55) 50%, rgba(30,10,2,0.8) 100%)",
        }}
      />

      {/* Decorative top border — kolam-inspired pattern */}
      <div className="absolute inset-x-0 top-0 z-10 h-1.5 bg-gradient-to-r from-transparent via-gold to-transparent opacity-80" />
      <svg
        viewBox="0 0 1200 28"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-1.5 z-10 w-full"
        style={{ height: 28 }}
      >
        {/* repeating flower dots */}
        {Array.from({ length: 20 }).map((_, i) => (
          <g key={i} transform={`translate(${i * 60 + 30}, 14)`}>
            <circle cx="0" cy="0" r="3" fill="#f4b528" opacity="0.7" />
            <circle cx="10" cy="0" r="1.5" fill="#ef7e1a" opacity="0.5" />
            <circle cx="-10" cy="0" r="1.5" fill="#ef7e1a" opacity="0.5" />
            <circle cx="0" cy="8" r="1.5" fill="#ef7e1a" opacity="0.5" />
            <circle cx="0" cy="-8" r="1.5" fill="#ef7e1a" opacity="0.5" />
          </g>
        ))}
      </svg>

      {/* Decorative bottom border */}
      <div className="absolute inset-x-0 bottom-0 z-10 h-1.5 bg-gradient-to-r from-transparent via-gold to-transparent opacity-80" />
      <svg
        viewBox="0 0 1200 28"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-1.5 z-10 w-full"
        style={{ height: 28 }}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <g key={i} transform={`translate(${i * 60 + 30}, 14)`}>
            <circle cx="0" cy="0" r="3" fill="#f4b528" opacity="0.7" />
            <circle cx="10" cy="0" r="1.5" fill="#ef7e1a" opacity="0.5" />
            <circle cx="-10" cy="0" r="1.5" fill="#ef7e1a" opacity="0.5" />
            <circle cx="0" cy="8" r="1.5" fill="#ef7e1a" opacity="0.5" />
            <circle cx="0" cy="-8" r="1.5" fill="#ef7e1a" opacity="0.5" />
          </g>
        ))}
      </svg>

      {/* Jute rope divider SVG */}
      <svg
        viewBox="0 0 900 24"
        preserveAspectRatio="none"
        className="absolute z-10 w-full max-w-2xl opacity-40"
        style={{ top: "calc(50% - 200px)", height: 24 }}
      >
        <defs>
          <linearGradient id="rope-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="20%" stopColor="#c9973f" />
            <stop offset="80%" stopColor="#a06a2a" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <path
          d="M0 12 Q100 4 200 12 T400 12 T600 12 T800 12 T900 12"
          stroke="url(#rope-grad)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M0 14 Q100 6 200 14 T400 14 T600 14 T800 14 T900 14"
          stroke="#5e3a12"
          strokeWidth="2"
          fill="none"
          opacity="0.6"
        />
      </svg>

      {/* Main card */}
      <div className="relative z-20 animate-rise flex w-full max-w-sm flex-col items-center gap-6 px-6 text-center">
        {/* Title block */}
        <div className="flex flex-col items-center gap-2">
          <span
            className="font-body text-xs uppercase tracking-[0.5em] text-dusk"
            style={{ textShadow: "0 1px 8px rgba(0,0,0,.8)" }}
          >
            ഓണം · Onam Festival
          </span>

          <h1
            className="font-display leading-none text-gold"
            style={{
              fontSize: "clamp(3rem, 12vw, 6rem)",
              fontWeight: 800,
              textShadow:
                "0 4px 0 #4a2915, 0 8px 32px rgba(0,0,0,0.7), 0 0 60px rgba(244,181,40,0.25)",
            }}
          >
            Vadam Vali
          </h1>

          <span
            className="font-display text-2xl font-semibold text-cream/70"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,.7)" }}
          >
            വടം വലി
          </span>

          <p
            className="mt-1 font-body text-sm text-cream/70"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,.8)" }}
          >
            Shout to pull. Shout louder to win.
          </p>
        </div>

        {/* Name input */}
        <div className="w-full flex flex-col gap-1">
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setNameError(null) }}
            maxLength={14}
            placeholder="Your name"
            className="w-full rounded-xl border border-gold/50 bg-mud-deep/80 px-4 py-3.5 text-center font-display text-xl text-cream placeholder:text-cream/35 focus:border-gold focus:outline-none backdrop-blur-sm transition"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,.5)" }}
          />
          {nameError && (
            <p className="font-body text-xs text-marigold">{nameError}</p>
          )}
        </div>

        {/* Action buttons */}
        {mode === "menu" ? (
          <div className="flex w-full flex-col gap-3">
            <button
              onClick={handleHost}
              className="w-full rounded-xl bg-gold px-6 py-4 font-display text-xl font-extrabold text-mud-deep shadow-[0_5px_0_#b47c10] transition active:translate-y-0.5 active:shadow-[0_2px_0_#b47c10] hover:brightness-105"
            >
              Host Match
            </button>
            <button
              onClick={() => { setMode("join"); setNameError(null) }}
              className="w-full rounded-xl border-2 border-gold/50 bg-black/25 px-6 py-3.5 font-display text-lg font-bold text-gold backdrop-blur-sm transition hover:border-gold hover:bg-black/40"
            >
              Join Online Room
            </button>
            <button
              onClick={handlePractice}
              className="mt-1 font-body text-sm text-cream/60 transition hover:text-dusk"
            >
              Practice vs Maveli AI →
            </button>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-3">
            <div className="flex flex-col gap-1">
              <input
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase().slice(0, 4)); setCodeError(null) }}
                placeholder="CODE"
                className="w-full rounded-xl border border-gold/50 bg-mud-deep/80 px-4 py-3.5 text-center font-mono text-3xl tracking-[0.4em] text-gold placeholder:text-cream/30 focus:border-gold focus:outline-none backdrop-blur-sm transition"
              />
              {codeError && (
                <p className="font-body text-xs text-marigold">{codeError}</p>
              )}
            </div>
            <button
              onClick={handleJoin}
              className="w-full rounded-xl bg-gold px-6 py-4 font-display text-xl font-extrabold text-mud-deep shadow-[0_5px_0_#b47c10] transition active:translate-y-0.5 active:shadow-[0_2px_0_#b47c10] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={code.length !== 4}
            >
              Join Match
            </button>
            <button
              onClick={() => { setMode("menu"); setCodeError(null) }}
              className="w-full rounded-xl border border-cream/25 bg-black/25 backdrop-blur-sm px-6 py-3 font-display text-base font-semibold text-cream hover:border-gold/50 hover:text-gold transition"
            >
              ← Back
            </button>
          </div>
        )}

        {error && (
          <p className="font-body text-sm text-marigold rounded-lg border border-marigold/30 bg-black/30 px-4 py-2">
            {error}
          </p>
        )}

        <p className="font-body text-xs text-cream/40">
          Best played in landscape · turn up the volume
        </p>
      </div>
    </div>
  )
}
