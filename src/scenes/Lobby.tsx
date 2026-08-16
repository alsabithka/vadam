import { useEffect, useRef, useState } from 'react'
import RoomCodeDisplay from '../components/RoomCodeDisplay'
import { startMic, type VoiceController } from '../lib/voice'
import type { Transport } from '../lib/net'

interface LobbyProps {
  mode: 'online' | 'local'
  role: 'host' | 'guest'
  roomCode: string
  playerName: string
  transport: Transport
  onStart: (voice: VoiceController | null) => void
  onExit: () => void
}

export default function Lobby({ mode, role, roomCode, playerName, transport, onStart, onExit }: LobbyProps) {
  const [peer, setPeer] = useState(mode === 'local')
  const [mic, setMic] = useState<'idle' | 'granting' | 'granted' | 'denied'>('idle')
  const [connError, setConnError] = useState<string | null>(null)
  const voiceRef = useRef<VoiceController | null>(null)

  useEffect(() => {
    transport.on('peer-join', () => setPeer(true))
    transport.connect().catch((e) => setConnError(e?.message ?? 'Connection failed'))
    return () => {
      // voice/transport handed off to Play on start; only stop if abandoned here
    }
  }, [transport])

  const enableMic = async () => {
    setMic('granting')
    try {
      voiceRef.current = await startMic()
      setMic('granted')
    } catch {
      setMic('denied')
    }
  }

  const ready = peer && mic === 'granted'

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center px-6 py-10">
      <div className="animate-rise flex w-full max-w-md flex-col items-center gap-6 text-center">
        <button onClick={onExit} className="self-start font-body text-sm text-cream/60 hover:text-gold">
          ← Leave
        </button>

        <h2 className="font-display text-4xl font-extrabold text-cream">
          {mode === 'local' ? 'Practice Match' : role === 'host' ? 'Waiting for a challenger' : 'Joining match'}
        </h2>

        {mode === 'online' && role === 'host' && <RoomCodeDisplay code={roomCode} />}
        {mode === 'online' && (
          <p className="font-body text-sm text-cream/70">
            {role === 'host' ? 'Share this code with your opponent.' : `Connecting to room ${roomCode}…`}
          </p>
        )}

        <div className="flex w-full flex-col gap-3">
          <StatusRow ok={peer} label={mode === 'local' ? 'Maveli AI ready' : peer ? 'Opponent connected' : 'Waiting for opponent…'} />
          <StatusRow
            ok={mic === 'granted'}
            label={mic === 'granted' ? 'Microphone ready' : mic === 'denied' ? 'Microphone blocked' : 'Microphone needed to shout'}
            action={
              mic !== 'granted' ? (
                <button onClick={enableMic} className="rounded-lg bg-gold px-3 py-1.5 font-display text-sm font-bold text-mud-deep">
                  {mic === 'granting' ? '…' : 'Enable'}
                </button>
              ) : undefined
            }
          />
        </div>

        {connError && <p className="font-body text-sm text-marigold">{connError}</p>}

        <button
          onClick={() => onStart(voiceRef.current)}
          disabled={!ready}
          className="w-full rounded-xl bg-marigold px-6 py-4 font-display text-2xl font-extrabold text-cream shadow-[0_4px_0_#b45a10] transition active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Start Tug!
        </button>
        <p className="font-body text-xs text-cream/50">Best played in landscape · turn up the volume</p>
      </div>
    </div>
  )
}

function StatusRow({ ok, label, action }: { ok: boolean; label: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-cream/15 bg-black/20 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${ok ? 'bg-green-400' : 'bg-cream/40'}`} style={ok ? { boxShadow: '0 0 8px #4ade80' } : undefined} />
        <span className="font-body text-sm text-cream/85">{label}</span>
      </div>
      {action}
    </div>
  )
}
