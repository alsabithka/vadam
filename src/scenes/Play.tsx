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
import { useTransform, MotionValue } from "framer-motion"

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
}

export default function Play({
  role,
  mode,
  transport,
  voice,
  playerName,
  opponentName,
  onWin,
  onExit,
}: PlayProps) {
  const [count, setCount] = useState(3)
  const active = count === 0
  const { state, anim, peerLeft } = useTugGame({
    role,
    transport,
    voice,
    active,
  })

  useEffect(() => {
    if (count === 0) return
    const t = setTimeout(() => setCount((c) => c - 1), 750)
    return () => clearTimeout(t)
  }, [count])

  useEffect(() => {
    if (state.status === "over" && state.winner) {
      const t = setTimeout(() => onWin(state.winner), 1100)
      return () => clearTimeout(t)
    }
  }, [state.status, state.winner, onWin])

  const leftName = role === "host" ? playerName : opponentName
  const rightName = role === "host" ? opponentName : playerName

  // Shared coordinate system setup for characters and rope
  // We place the left character at x=70, and right character at x=930.
  // Their height is 340, so at y=260 they touch the bottom of the 600 viewBox.
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

  const leftHand = useMemo(
    () => ({
      x: useTransform(hostAnim.localHandX, (x) => HOST_X + x),
      y: useTransform(hostAnim.localHandY, (y) => CHAR_Y + y),
    }),
    [hostAnim.localHandX, hostAnim.localHandY],
  )

  const rightHand = useMemo(
    () => ({
      x: useTransform(guestAnim.localHandX, (x) => GUEST_X - x),
      y: useTransform(guestAnim.localHandY, (y) => CHAR_Y + y),
    }),
    [guestAnim.localHandX, guestAnim.localHandY],
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

        {/* 1. Back Legs */}
        <CharacterBackLeg
          team="blue"
          side="left"
          anim={hostAnim}
          x={HOST_X}
          y={CHAR_Y}
        />
        <CharacterBackLeg
          team="mustard"
          side="right"
          anim={guestAnim}
          x={GUEST_X}
          y={CHAR_Y}
        />

        {/* 2. Rope (behind torso) */}
        <Rope
          pull={state.pull}
          iHost={anim.iHost}
          iGuest={anim.iGuest}
          leftHand={leftHand}
          rightHand={rightHand}
        />

        {/* 3. Torso + Arms + Head */}
        <CharacterTorso
          team="blue"
          side="left"
          anim={hostAnim}
          x={HOST_X}
          y={CHAR_Y}
        />
        <CharacterTorso
          team="mustard"
          side="right"
          anim={guestAnim}
          x={GUEST_X}
          y={CHAR_Y}
        />

        {/* 4. Front Legs + Feet */}
        <CharacterFrontLeg
          team="blue"
          side="left"
          anim={hostAnim}
          x={HOST_X}
          y={CHAR_Y}
        />
        <CharacterFrontLeg
          team="mustard"
          side="right"
          anim={guestAnim}
          x={GUEST_X}
          y={CHAR_Y}
        />
      </svg>

      {/* meters + names */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between px-[3vw] pt-[2.5vh]">
        <IntensityMeter
          intensity={anim.iHost}
          team="blue"
          align="left"
          name={leftName}
        />
        <IntensityMeter
          intensity={anim.iGuest}
          team="mustard"
          align="right"
          name={rightName}
        />
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
          <span
            key={count}
            className="animate-rise font-display text-[22vw] font-extrabold leading-none text-gold"
            style={{ textShadow: "0 4px 0 #6b3f22" }}
          >
            {count}
          </span>
        </div>
      )}
      {active && count === 0 && <Flash />}
      {syncing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur z-50">
          <p className="font-display text-3xl font-bold text-cream">
            Syncing...
          </p>
        </div>
      )}

      {/* opponent disconnected */}
      {peerLeft && mode === "online" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur">
          <p className="font-display text-3xl font-bold text-cream">
            Opponent disconnected
          </p>
          <button
            onClick={onExit}
            className="rounded-xl bg-gold px-6 py-3 font-display text-lg font-bold text-mud-deep"
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
    const t = setTimeout(() => setShow(false), 900)
    return () => clearTimeout(t)
  }, [])
  if (!show) return null
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span
        className="animate-rise font-display text-[10vw] font-extrabold text-cream"
        style={{ textShadow: "0 3px 0 #ef7e1a, 0 0 30px rgba(0,0,0,.6)" }}
      >
        ആർപ്പോ!
      </span>
    </div>
  )
}
