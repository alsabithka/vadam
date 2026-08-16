import { useEffect, useState } from 'react'
import Field from '../components/Field'
import Character from '../components/Character'
import Rope from '../components/Rope'
import IntensityMeter from '../components/IntensityMeter'
import { useTugGame } from '../lib/useTugGame'
import type { Transport } from '../lib/net'
import type { VoiceController } from '../lib/voice'
import type { Winner } from '../lib/game'

interface PlayProps {
  role: 'host' | 'guest'
  mode: 'online' | 'local'
  transport: Transport
  voice: VoiceController | null
  playerName: string
  opponentName: string
  onWin: (winner: Winner) => void
  onExit: () => void
}

export default function Play({ role, mode, transport, voice, playerName, opponentName, onWin, onExit }: PlayProps) {
  const [count, setCount] = useState(3)
  const active = count === 0
  const { state, peerLeft } = useTugGame({ role, transport, voice, active })

  // Countdown before the pull begins.
  useEffect(() => {
    if (count === 0) return
    const t = setTimeout(() => setCount((c) => c - 1), 750)
    return () => clearTimeout(t)
  }, [count])

  // End the round shortly after a winner is locked in.
  useEffect(() => {
    if (state.status === 'over' && state.winner) {
      const t = setTimeout(() => onWin(state.winner), 1100)
      return () => clearTimeout(t)
    }
  }, [state.status, state.winner, onWin])

  // Names: host is always the left/blue player.
  const leftName = role === 'host' ? playerName : opponentName
  const rightName = role === 'host' ? opponentName : playerName

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Field />

      {/* rope layer, inset so its anchors meet the characters' hands */}
      <div className="absolute" style={{ left: '9%', right: '9%', top: '40%', height: '30%' }}>
        <Rope pull={state.pull} iHost={state.iHost} iGuest={state.iGuest} />
      </div>

      {/* characters */}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-[2vw]" style={{ height: '78%' }}>
        <Character side="left" team="blue" intensity={state.iHost} straining={active} />
        <Character side="right" team="mustard" intensity={state.iGuest} straining={active} />
      </div>

      {/* meters + names */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between px-[3vw] pt-[2.5vh]">
        <IntensityMeter intensity={state.iHost} team="blue" align="left" name={leftName} />
        <IntensityMeter intensity={state.iGuest} team="mustard" align="right" name={rightName} />
      </div>

      <button
        onClick={onExit}
        className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-cream/25 bg-black/30 px-4 py-1 font-body text-xs text-cream/70 hover:text-gold"
      >
        Quit
      </button>

      {/* countdown */}
      {count > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <span key={count} className="animate-rise font-display text-[22vw] font-extrabold leading-none text-gold" style={{ textShadow: '0 4px 0 #6b3f22' }}>
            {count}
          </span>
        </div>
      )}
      {active && count === 0 && <Flash />}

      {/* opponent disconnected */}
      {peerLeft && mode === 'online' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur">
          <p className="font-display text-3xl font-bold text-cream">Opponent disconnected</p>
          <button onClick={onExit} className="rounded-xl bg-gold px-6 py-3 font-display text-lg font-bold text-mud-deep">
            Back to menu
          </button>
        </div>
      )}
    </div>
  )
}

// A one-shot "ARPOOO!" flash the moment the pull begins.
function Flash() {
  const [show, setShow] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 900)
    return () => clearTimeout(t)
  }, [])
  if (!show) return null
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span className="animate-rise font-display text-[10vw] font-extrabold text-cream" style={{ textShadow: '0 3px 0 #ef7e1a, 0 0 30px rgba(0,0,0,.6)' }}>
        ആർപ്പോ!
      </span>
    </div>
  )
}
