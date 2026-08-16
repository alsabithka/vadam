import { useCallback, useRef, useState } from "react"
import Landing from "./scenes/Landing"
import Lobby from "./scenes/Lobby"
import Play from "./scenes/Play"
import Win from "./scenes/Win"
import { LocalAiTransport, SupabaseTransport, type Transport } from "./lib/net"
import { isSupabaseConfigured } from "./lib/supabase"
import { makeRoomCode, type Winner } from "./lib/game"
import type { VoiceController } from "./lib/voice"
import bgMusic from "./imports/Aadeda_Aattam_Nee_Video_Song___Vadam_Vali_Song___Aadu_2___Shaan_Rahman___Jayasurya___Vijay_Babu.mp3"

type Scene = "landing" | "lobby" | "play" | "win"

interface Session {
  startAt?: number
  role: "host" | "guest"
  mode: "online" | "local"
  roomCode: string
  playerName: string
  opponentName: string
  transport: Transport
}

export default function App() {
  const [scene, setScene] = useState<Scene>("landing")
  const [session, setSession] = useState<Session | null>(null)
  const [winner, setWinner] = useState<Winner>(null)
  const [error, setError] = useState<string | null>(null)
  const [round, setRound] = useState(0) // remount key for fresh physics each match
  const voiceRef = useRef<VoiceController | null>(null)

  const teardown = useCallback(() => {
    session?.transport.disconnect()
    voiceRef.current?.stop()
    voiceRef.current = null
  }, [session])

  const goHome = useCallback(() => {
    teardown()
    setSession(null)
    setWinner(null)
    setScene("landing")
  }, [teardown])

  const beginOnline = async (
    role: "host" | "guest",
    name: string,
    code: string,
  ) => {
    setError(null)
    if (!(await isSupabaseConfigured())) {
      setError(
        "Online play needs Supabase Realtime. Connect it, or play Practice for now.",
      )
      return
    }
    setSession({
      role,
      mode: "online",
      roomCode: code,
      playerName: name,
      opponentName: "Opponent",
      transport: new SupabaseTransport(code, role),
    })
    setScene("lobby")
  }

  const handleHost = (name: string) => beginOnline("host", name, makeRoomCode())
  const handleJoin = (name: string, code: string) =>
    beginOnline("guest", name, code)
  const handlePractice = (name: string) => {
    setError(null)
    setSession({
      role: "host",
      mode: "local",
      roomCode: "SOLO",
      playerName: name,
      opponentName: "Maveli",
      transport: new LocalAiTransport(0.5),
    })
    setScene("lobby")
  }

  const handleStart = (voice: VoiceController | null, startAt: number) => {
    setSession((s) => (s ? { ...s, startAt } : null))
    voiceRef.current = voice
    setRound((r) => r + 1)
    setScene("play")
  }

  const handleWin = (w: Winner) => {
    setWinner(w)
    setScene("win")
  }

  const playAgain = () => {
    setWinner(null)
    setRound((r) => r + 1)
    setScene("play")
  }

  return (
    <div className="h-full w-full">
      <audio src={bgMusic} autoPlay loop />
      {scene === "landing" && (
        <Landing
          onHost={handleHost}
          onJoin={handleJoin}
          onPractice={handlePractice}
          error={error}
        />
      )}

      {scene === "lobby" && session && (
        <Lobby
          mode={session.mode}
          role={session.role}
          roomCode={session.roomCode}
          playerName={session.playerName}
          transport={session.transport}
          onStart={handleStart}
          onExit={goHome}
        />
      )}

      {scene === "play" && session && (
        <Play
          key={round}
          role={session.role}
          mode={session.mode}
          transport={session.transport}
          voice={voiceRef.current}
          playerName={session.playerName}
          opponentName={session.opponentName}
          startAt={session.startAt || Date.now()}
          onWin={handleWin}
          onExit={goHome}
        />
      )}

      {scene === "win" && session && (
        <Win
          winner={winner}
          role={session.role}
          mode={session.mode}
          playerName={session.playerName}
          opponentName={session.opponentName}
          startAt={session.startAt || Date.now()}
          onPlayAgain={playAgain}
          onNewRoom={goHome}
        />
      )}

      {/* landscape lock hint for small portrait screens */}
      <div className="landscape-hint fixed inset-0 z-50 flex-col items-center justify-center gap-3 bg-mud-deep px-8 text-center">
        <span className="text-4xl">🔄</span>
        <p className="font-display text-2xl font-bold text-cream">
          Rotate your device
        </p>
        <p className="font-body text-sm text-cream/70">
          Vadam Vali is best played in landscape.
        </p>
      </div>
    </div>
  )
}
