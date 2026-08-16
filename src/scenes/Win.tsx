import { useState } from "react"
import Field from "../components/Field"
import type { Winner } from "../lib/game"

interface WinProps {
  winner: Winner
  role: "host" | "guest"
  mode: "online" | "local"
  playerName: string
  opponentName: string
  startAt?: number
  onPlayAgain: () => void
  onNewRoom: () => void
}

export default function Win({
  winner,
  role,
  playerName,
  opponentName,
  onPlayAgain,
  onNewRoom,
}: WinProps) {
  const iWon =
    (winner === "host" && role === "host") ||
    (winner === "guest" && role === "guest")

  const winnerName =
    winner === "host"
      ? role === "host"
        ? playerName
        : opponentName
      : role === "guest"
        ? playerName
        : opponentName

  const team = winner === "host" ? "blue" : "mustard"
  const teamColor = team === "blue" ? "#2f6fb0" : "#d99a1c"
  const teamColorDeep = team === "blue" ? "#24568a" : "#b47c10"

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Field />
      <div className="absolute inset-0 bg-black/50" />
      <ConfettiLayer iWon={iWon} teamColor={teamColor} />

      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="animate-rise flex flex-col items-center gap-6 text-center max-w-sm w-full">
          <span
            className="font-body text-sm uppercase tracking-[0.5em]"
            style={{ color: teamColor, textShadow: `0 0 20px ${teamColor}` }}
          >
            {iWon ? "Victory" : "Defeat"}
          </span>

          <div
            className="animate-float flex h-24 w-24 items-center justify-center rounded-full text-5xl"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${teamColor}, ${teamColorDeep})`,
              boxShadow: `0 0 0 4px ${teamColor}40, 0 0 40px ${teamColor}60, 0 8px 24px rgba(0,0,0,.6)`,
            }}
          >
            {iWon ? "🏆" : "💪"}
          </div>

          <div className="flex flex-col items-center gap-1">
            <h1
              className="font-display text-5xl font-extrabold text-cream"
              style={{ textShadow: "0 4px 0 #4a2915, 0 8px 24px rgba(0,0,0,.6)" }}
            >
              {winnerName} wins!
            </h1>
            <p className="font-body text-base text-cream/75">
              {iWon
                ? "You out-shouted the field. Onam glory!"
                : "So close — shout louder next round."}
            </p>
          </div>

          <p
            className="font-display text-xl font-semibold"
            style={{ color: teamColor }}
          >
            {iWon ? "ജയ് !" : "അടുത്ത തവണ!"}
          </p>

          <div className="mt-2 flex flex-col gap-3 w-full sm:flex-row sm:justify-center">
            <button
              onClick={onPlayAgain}
              className="rounded-xl bg-gold px-8 py-3.5 font-display text-xl font-extrabold text-mud-deep shadow-[0_5px_0_#b47c10] transition active:translate-y-0.5 active:shadow-[0_2px_0_#b47c10] hover:brightness-105"
            >
              Play Again
            </button>
            <button
              onClick={onNewRoom}
              className="rounded-xl border-2 border-cream/30 bg-black/25 px-8 py-3.5 font-display text-xl font-semibold text-cream backdrop-blur-sm transition hover:border-gold/60 hover:text-gold"
            >
              New Room
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConfettiLayer({ iWon, teamColor }: { iWon: boolean; teamColor: string }) {
  const [dots] = useState(() =>
    Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      x: 5 + (i * 5.5) % 95,
      delay: (i * 0.37) % 3,
      dur: 2.8 + (i * 0.23) % 1.4,
      r: 0.4 + (i * 0.16) % 0.6,
      color: i % 3 === 0 ? "#f4b528" : i % 3 === 1 ? teamColor : "#ef7e1a",
    })),
  )

  if (!iWon) return null

  return (
    <svg
      className="pointer-events-none absolute inset-0 w-full h-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {dots.map((d) => (
        <circle key={d.id} cx={d.x} cy="-5" r={d.r} fill={d.color} opacity="0.85">
          <animate
            attributeName="cy"
            from="-5"
            to="110"
            dur={`${d.dur}s`}
            begin={`${d.delay}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0;0.85;0.85;0"
            dur={`${d.dur}s`}
            begin={`${d.delay}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
      {[
        { x: 8, y: 15 },
        { x: 92, y: 12 },
        { x: 15, y: 88 },
        { x: 85, y: 85 },
      ].map((pos, i) => (
        <g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
          {Array.from({ length: 8 }).map((_, j) => (
            <line
              key={j}
              x1="0"
              y1="0"
              x2={Math.cos((j * Math.PI) / 4) * 3}
              y2={Math.sin((j * Math.PI) / 4) * 3}
              stroke="#f4b528"
              strokeWidth="0.4"
              opacity="0.6"
            >
              <animate
                attributeName="opacity"
                values="0;0.6;0"
                dur="2s"
                begin={`${i * 0.5}s`}
                repeatCount="indefinite"
              />
            </line>
          ))}
          <circle cx="0" cy="0" r="0.8" fill="#f4b528" opacity="0.7">
            <animate
              attributeName="opacity"
              values="0;0.7;0"
              dur="2s"
              begin={`${i * 0.5}s`}
              repeatCount="indefinite"
            />
          </circle>
        </g>
      ))}
    </svg>
  )
}
