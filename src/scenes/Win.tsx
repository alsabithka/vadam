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
  const color = team === "blue" ? "#2f6fb0" : "#d99a1c"

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Field />
      <div className="absolute inset-0 flex items-center justify-center bg-black/45 px-6">
        <div className="animate-rise flex flex-col items-center gap-6 text-center">
          <span className="font-body text-sm uppercase tracking-[0.4em] text-gold">
            {iWon ? "Victory" : "Defeat"}
          </span>
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full font-display text-5xl font-extrabold text-cream"
            style={{ background: color, boxShadow: `0 0 40px ${color}` }}
          >
            {iWon ? "🏆" : "💪"}
          </div>
          <h1
            className="font-display text-5xl font-extrabold text-cream"
            style={{ textShadow: "0 3px 0 #6b3f22" }}
          >
            {winnerName} wins!
          </h1>
          <p className="font-body text-base text-cream/80">
            {iWon
              ? "You out-shouted the field. Onam glory!"
              : "So close — shout louder next round."}
          </p>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onPlayAgain}
              className="rounded-xl bg-gold px-8 py-3.5 font-display text-xl font-bold text-mud-deep shadow-[0_4px_0_#b47c10] active:translate-y-0.5"
            >
              Play Again
            </button>
            <button
              onClick={onNewRoom}
              className="rounded-xl border border-cream/30 bg-black/25 px-8 py-3.5 font-display text-xl font-semibold text-cream hover:border-gold/60 hover:text-gold"
            >
              New Room
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
