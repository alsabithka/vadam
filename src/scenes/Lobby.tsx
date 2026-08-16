import { useEffect, useRef, useState } from "react"
import RoomCodeDisplay from "../components/RoomCodeDisplay"
import { startMic, type VoiceController } from "../lib/voice"
import type { Transport } from "../lib/net"
import bgImage from "../imports/download.jpg"

interface LobbyProps {
  mode: "online" | "local"
  role: "host" | "guest"
  roomCode: string
  playerName: string
  transport: Transport
  onStart: (voice: VoiceController | null, startAt: number) => void
  onUnlockAudio: () => void
  onExit: () => void
}

type Calib = "none" | "quiet" | "quiet-done" | "shout" | "done"

export default function Lobby({
  mode,
  role,
  roomCode,
  playerName,
  transport,
  onStart,
  onUnlockAudio,
  onExit,
}: LobbyProps) {
  const [peer, setPeer] = useState(mode === "local")
  const [mic, setMic] = useState<"idle" | "granting" | "granted" | "denied">(
    "idle",
  )
  const [calib, setCalib] = useState<Calib>("none")
  const [connError, setConnError] = useState<string | null>(null)
  const voiceRef = useRef<VoiceController | null>(null)
  const meterRef = useRef<HTMLDivElement | null>(null)
  const [waitingForHost, setWaitingForHost] = useState(false)

  useEffect(() => {
    transport.on("peer-join", () => setPeer(true))
    transport.onMatchStart((startAt) => {
      onStart(voiceRef.current, startAt)
    })
    transport
      .connect()
      .catch((e) => setConnError(e?.message ?? "Connection failed"))
  }, [transport])

  useEffect(() => {
    if (mic !== "granted") return
    let raf = 0
    const tick = () => {
      const v = voiceRef.current?.getIntensity() ?? 0
      if (meterRef.current)
        meterRef.current.style.width = `${Math.round(v * 100)}%`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [mic])

  const enableMic = async () => {
    onUnlockAudio() // first real user click — valid moment to start music per autoplay policy
    setMic("granting")
    try {
      voiceRef.current = await startMic()
      setMic("granted")
    } catch {
      setMic("denied")
    }
  }

  const measureQuiet = async () => {
    setCalib("quiet")
    await voiceRef.current?.calibrateNoiseFloor(1000)
    setCalib("quiet-done")
  }
  const handleStart = () => {
    if (role === "guest") return
    const startAt = Date.now() + 1500
    transport.sendMatchStart(startAt)
    onStart(voiceRef.current, startAt)
  }

  const measureShout = async () => {
    setCalib("shout")
    await voiceRef.current?.calibratePeak(1800)
    setCalib("done")
  }

  const ready = peer && mic === "granted" && calib === "done"

  return (
    <div
      className="relative flex min-h-full flex-col items-center justify-center px-6 py-10 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 animate-rise flex w-full max-w-md flex-col items-center gap-6 text-center">
        <button
          onClick={onExit}
          className="self-start font-body text-sm text-cream/80 hover:text-gold"
        >
          ← Leave
        </button>

        <h2 className="font-display text-4xl font-extrabold text-cream">
          {mode === "local"
            ? "Practice Match"
            : role === "host"
              ? "Waiting for a challenger"
              : "Joining match"}
        </h2>

        {mode === "online" && role === "host" && (
          <RoomCodeDisplay code={roomCode} />
        )}
        {mode === "online" && (
          <p className="font-body text-sm text-cream/90">
            {role === "host"
              ? "Share this code with your opponent."
              : `Connecting to room ${roomCode}…`}
          </p>
        )}

        <div className="flex w-full flex-col gap-3">
          <StatusRow
            ok={peer}
            label={
              mode === "local"
                ? "Maveli AI ready"
                : peer
                  ? "Opponent connected"
                  : "Waiting for opponent…"
            }
          />
          <StatusRow
            ok={mic === "granted"}
            label={
              mic === "granted"
                ? "Microphone ready"
                : mic === "denied"
                  ? "Microphone blocked"
                  : "Microphone needed to shout"
            }
            action={
              mic !== "granted" ? (
                <button
                  onClick={enableMic}
                  className="rounded-lg bg-gold px-3 py-1.5 font-display text-sm font-bold text-mud-deep"
                >
                  {mic === "granting" ? "…" : "Enable"}
                </button>
              ) : undefined
            }
          />
        </div>

        {mic === "granted" && (
          <div className="flex w-full flex-col gap-3 rounded-2xl border border-gold/25 bg-black/40 p-4">
            <p className="font-display text-lg font-bold text-cream">
              Calibrate your mic
            </p>

            <div
              className="h-3 w-full overflow-hidden rounded-full bg-black/50"
              style={{ boxShadow: "inset 0 1px 3px rgba(0,0,0,.5)" }}
            >
              <div
                ref={meterRef}
                className="h-full rounded-full"
                style={{
                  width: "0%",
                  background: "linear-gradient(90deg,#8ec3ef,#f4b528)",
                }}
              />
            </div>

            <CalibStep
              index={1}
              label="Stay quiet"
              hint="Measures your room's background noise"
              state={
                calib === "none" ? "ready" : calib === "quiet" ? "busy" : "done"
              }
              busyLabel="Listening…"
              onRun={measureQuiet}
              disabled={calib === "quiet" || calib === "shout"}
            />
            <CalibStep
              index={2}
              label='Shout "Arpooo!"'
              hint="Sets your loudest level"
              state={
                calib === "done"
                  ? "done"
                  : calib === "shout"
                    ? "busy"
                    : calib === "quiet-done"
                      ? "ready"
                      : "locked"
              }
              busyLabel="Shout now!"
              onRun={measureShout}
              disabled={calib !== "quiet-done"}
            />
          </div>
        )}

        {connError && (
          <p className="font-body text-sm text-marigold">{connError}</p>
        )}

        {role === "host" || mode === "local" ? (
          <button
            onClick={handleStart}
            disabled={!ready}
            className="w-full rounded-xl bg-marigold px-6 py-4 font-display text-2xl font-extrabold text-cream shadow-[0_4px_0_#b45a10] transition active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start Tug!
          </button>
        ) : (
          <div
            className={`w-full rounded-xl px-6 py-4 font-display text-2xl font-extrabold text-cream transition ${
              ready
                ? "bg-marigold shadow-[0_4px_0_#b45a10] animate-pulse"
                : "bg-black/20 border border-cream/15 text-cream/40"
            }`}
          >
            {ready ? "Waiting for host..." : "Complete setup to join"}
          </div>
        )}

        <p className="font-body text-xs text-cream/70">
          Best played in landscape · turn up the volume
        </p>
      </div>
    </div>
  )
}

function StatusRow({
  ok,
  label,
  action,
}: {
  ok: boolean
  label: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-cream/15 bg-black/40 px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            ok ? "bg-green-400" : "bg-cream/40"
          }`}
          style={ok ? { boxShadow: "0 0 8px #4ade80" } : undefined}
        />
        <span className="font-body text-sm text-cream/90">{label}</span>
      </div>
      {action}
    </div>
  )
}

function CalibStep({
  index,
  label,
  hint,
  state,
  busyLabel,
  onRun,
  disabled,
}: {
  index: number
  label: string
  hint: string
  state: "locked" | "ready" | "busy" | "done"
  busyLabel: string
  onRun: () => void
  disabled: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 ${
        state === "locked" ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-3 text-left">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold ${
            state === "done"
              ? "bg-green-400 text-mud-deep"
              : "bg-cream/15 text-cream"
          }`}
        >
          {state === "done" ? "✓" : index}
        </span>
        <div>
          <p className="font-display text-sm font-bold text-cream">{label}</p>
          <p className="font-body text-xs text-cream/70">{hint}</p>
        </div>
      </div>
      {state === "done" ? (
        <span className="font-body text-xs text-green-400">Done</span>
      ) : (
        <button
          onClick={onRun}
          disabled={disabled}
          className={`rounded-lg px-3 py-1.5 font-display text-sm font-bold ${
            state === "busy"
              ? "animate-pulse bg-marigold text-cream"
              : "bg-gold text-mud-deep"
          } disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {state === "busy" ? busyLabel : "Measure"}
        </button>
      )}
    </div>
  )
}
