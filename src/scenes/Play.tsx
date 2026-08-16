import { useEffect, useState, useMemo } from "react"
import Field from "../components/Field"
import {
  useCharacterAnim,
  CharacterBackLeg,
  CharacterTorso,
  CharacterFrontLeg,
  CharacterDefs,
} from "../components/Character"
import Rope from "../components/Rope"
import IntensityMeter from "../components/IntensityMeter"
import { useTugGame } from "../lib/useTugGame"
import type { Transport } from "../lib/net"
import type { VoiceController } from "../lib/voice"
import type { Winner } from "../lib/game"
import { useTransform } from "framer-motion"

interface PlayProps {
  role: "host" | "guest"
  mode: "online" | "local"
  transport: Transport
  voice: VoiceController | null
  playerName: string
  opponentName: string
  startAt: number
  onWin: (winner: Winner) => void
  onExit: () => void
  muted: boolean
  onToggleMute: () => void
}

const HOST_X = 70
const GUEST_X = 930
const CHAR_Y = 260

export default function Play({
  role,
  mode,
  transport,
  voice,
  playerName,
  opponentName,
  startAt,
  onWin,
  onExit,
  muted,
  onToggleMute,
}: PlayProps) {
  const [count, setCount] = useState(() =>
    Math.max(0, Math.ceil((startAt - Date.now()) / 1000)),
  )
  const active = count === 0
  const { state, anim, peerConnected, peerLeft } = useTugGame({
    role,
    transport,
    voice,
    active,
  })

  const syncing =
    mode === "online" && !peerConnected && role === "guest" && !active

  // Single stable interval — no recreation on every tick avoids missing the 0 transition.
  useEffect(() => {
    if (count === 0) return
    const t = setInterval(() => {
      setCount(Math.max(0, Math.ceil((startAt - Date.now()) / 1000)))
    }, 50)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startAt])

  useEffect(() => {
    if (state.status === "over" && state.winner) {
      const t = setTimeout(() => onWin(state.winner), 1100)
      return () => clearTimeout(t)
    }
  }, [state.status, state.winner, onWin])

  const leftName = role === "host" ? playerName : opponentName
  const rightName = role === "host" ? opponentName : playerName

  const HOST_X = 70
  const GUEST_X = 930
  const CHAR_Y = 260

  const hostAnim = useCharacterAnim({
    side: "left",
    team: "blue",
    intensity: anim.iHost,
    spike: anim.spikeHost,
    pullVel: anim.pullVel,
    straining: active,
    phaseOffset: 0,
  })
  const guestAnim = useCharacterAnim({
    side: "right",
    team: "mustard",
    intensity: anim.iGuest,
    spike: anim.spikeGuest,
    pullVel: anim.pullVel,
    straining: active,
    phaseOffset: 1.9,
  })

  // useTransform must be called unconditionally at the top level — never inside
  // useMemo or any conditional. Putting them here ensures the hook count is
  // stable across every render.
  const leftHandX = useTransform(hostAnim.localHandX, (x) => HOST_X + x)
  const leftHandY = useTransform(hostAnim.localHandY, (y) => CHAR_Y + y)
  const rightHandX = useTransform(guestAnim.localHandX, (x) => GUEST_X - x)
  const rightHandY = useTransform(guestAnim.localHandY, (y) => CHAR_Y + y)

  const leftHand = useMemo(
    () => ({ x: leftHandX, y: leftHandY }),
    [leftHandX, leftHandY],
  )
  const rightHand = useMemo(
    () => ({ x: rightHandX, y: rightHandY }),
    [rightHandX, rightHandY],
  )

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Field />

      {/* Merged SVG for back-to-front layering */}
      <svg
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 w-full h-full overflow-visible"
      >
        <defs>
          <CharacterDefs team="blue" side="left" />
          <CharacterDefs team="mustard" side="right" />
        </defs>

        <CharacterBackLeg team="blue" side="left" anim={hostAnim} x={HOST_X} y={CHAR_Y} />
        <CharacterBackLeg team="mustard" side="right" anim={guestAnim} x={GUEST_X} y={CHAR_Y} />

        <Rope
          pull={state.pull}
          iHost={anim.iHost}
          iGuest={anim.iGuest}
          leftHand={leftHand}
          rightHand={rightHand}
        />

        <CharacterTorso team="blue" side="left" anim={hostAnim} x={HOST_X} y={CHAR_Y} />
        <CharacterTorso team="mustard" side="right" anim={guestAnim} x={GUEST_X} y={CHAR_Y} />

        <CharacterFrontLeg team="blue" side="left" anim={hostAnim} x={HOST_X} y={CHAR_Y} />
        <CharacterFrontLeg team="mustard" side="right" anim={guestAnim} x={GUEST_X} y={CHAR_Y} />
      </svg>

      {/* Intensity meters + player names */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between px-[3vw] pt-[2.5vh]">
        <IntensityMeter intensity={anim.iHost} team="blue" align="left" name={leftName} />
        <IntensityMeter intensity={anim.iGuest} team="mustard" align="right" name={rightName} />
      </div>

      {/* Controls */}
      <div className="absolute left-1/2 top-3 -translate-x-1/2 flex items-center gap-3">
        <button
          onClick={onExit}
          className="rounded-full border border-cream/25 bg-black/30 px-4 py-1.5 font-body text-xs text-cream/70 transition hover:text-gold hover:border-gold/40 backdrop-blur-sm"
        >
          Quit
        </button>
        <button
          onClick={onToggleMute}
          aria-label={muted ? "Unmute music" : "Mute music"}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-cream/20 bg-black/30 text-base text-cream backdrop-blur-sm transition hover:bg-black/50 active:translate-y-0.5"
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>

      {/* countdown overlay
          display = min(count, 3) so both players always see 3→2→1 even if
          one client mounts slightly late and starts at count=4. The `key`
          on the displayed value ensures the pop-in animation only fires on
          actual digit changes (4→3 is silent, 3→2→1 each animate). */}
      {count > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-sm">
          <span
            key={Math.min(count, 3)}
            className="animate-rise font-display font-extrabold leading-none text-gold"
            style={{
              fontSize: "22vw",
              textShadow: "0 6px 0 #6b3f22, 0 0 60px rgba(244,181,40,0.4)",
            }}
          >
            {Math.min(count, 3)}
          </span>
        </div>
      )}

      {/* "GO!" flash when the war begins */}
      {active && <Flash />}

      {/* guest waiting for host physics to arrive */}
      {syncing && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold/30 border-t-gold" />
          <p className="font-display text-3xl font-bold text-cream">Syncing…</p>
          <p className="font-body text-sm text-cream/60">Waiting for host to begin</p>
        </div>
      )}

      {peerLeft && mode === "online" && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-black/75 backdrop-blur">
          <p className="font-display text-3xl font-bold text-cream">Opponent disconnected</p>
          <p className="font-body text-sm text-cream/60">The match cannot continue</p>
          <button
            onClick={onExit}
            className="rounded-xl bg-gold px-8 py-3.5 font-display text-xl font-bold text-mud-deep shadow-[0_4px_0_#b47c10] transition active:translate-y-0.5"
          >
            Back to menu
          </button>
        </div>
      )}
    </div>
  )
}

function Flash() {
  const [show, setShow] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 1200)
    return () => clearTimeout(t)
  }, [])
  if (!show) return null
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span
        className="animate-rise font-display text-[14vw] font-extrabold leading-none text-gold"
        style={{ textShadow: "0 4px 0 #6b3f22, 0 0 40px rgba(244,181,40,0.6)" }}
      >
        GO!
      </span>
    </div>
  )
}
