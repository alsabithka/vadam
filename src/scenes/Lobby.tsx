import { useEffect, useRef, useState } from "react"
import Field from "../components/Field"
import RoomCodeDisplay from "../components/RoomCodeDisplay"
import { startMic, type VoiceController } from "../lib/voice"
import type { Transport } from "../lib/net"

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
  const [mic, setMic] = useState<"idle" | "granting" | "granted" | "denied">("idle")
  const [calib, setCalib] = useState<Calib>("none")
  const [connError, setConnError] = useState<string | null>(null)
  // Host tracks whether the guest clicked "Ready"
  const [guestReady, setGuestReady] = useState(mode === "local")
  // Guest tracks whether they've sent their ready signal
  const [selfReady, setSelfReady] = useState(false)
  const voiceRef = useRef<VoiceController | null>(null)
  const meterRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    transport.on("peer-join", () => setPeer(true))
    transport.onReady(() => setGuestReady(true))
    transport.onMatchStart((startAt) => onStart(voiceRef.current, startAt))
    transport
      .connect()
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Connection failed"
        setConnError(msg)
      })
  }, [transport])

  // Live mic-level meter animation
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
    onUnlockAudio()
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
    await voiceRef.current?.calibrateNoiseFloor(1500)
    setCalib("quiet-done")
  }

  const measureShout = async () => {
    setCalib("shout")
    await voiceRef.current?.calibratePeak(2000)
    setCalib("done")
  }

  // True when this player has completed all mic setup
  const ownReady = peer && mic === "granted" && calib === "done"

  const handleReady = () => {
    transport.sendReady()
    setSelfReady(true)
  }

  const handleStart = () => {
    if (role === "guest") return
    const startAt = Date.now() + 3500
    transport.sendMatchStart(startAt)
    onStart(voiceRef.current, startAt)
  }

  const titleText =
    mode === "local"
      ? "Practice Match"
      : role === "host"
        ? "Waiting for challenger"
        : "Joining match"

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden">
      <Field />
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />

      <div className="relative z-10 animate-rise flex w-full max-w-md flex-col items-center gap-5 px-6 py-10 text-center">
        {/* Header */}
        <div className="flex w-full items-center justify-between">
          <button
            onClick={onExit}
            className="font-body text-sm text-cream/70 transition hover:text-gold"
          >
            {"← Leave"}
          </button>
          <span className="font-body text-xs uppercase tracking-widest text-gold/60">
            {mode === "local" ? "Solo" : role === "host" ? "Host" : "Guest"}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <h2
            className="font-display text-4xl font-extrabold text-cream"
            style={{ textShadow: "0 3px 0 #4a2915" }}
          >
            {titleText}
          </h2>
          <p className="font-body text-sm text-cream/60">
            Hello, <span className="font-semibold text-gold">{playerName}</span>
          </p>
        </div>

        {/* Room code (online host only) */}
        {mode === "online" && role === "host" && (
          <div className="flex flex-col items-center gap-1">
            <RoomCodeDisplay code={roomCode} />
            <p className="font-body text-xs text-cream/50">
              Share this code with your opponent
            </p>
          </div>
        )}
        {mode === "online" && role === "guest" && (
          <p className="font-body text-sm text-cream/70">
            Connecting to room{" "}
            <span className="font-mono text-gold">{roomCode}</span>
            {"…"}
          </p>
        )}

        {/* Connection + mic status */}
        <div className="flex w-full flex-col gap-2.5">
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
                  ? "Microphone blocked — check browser permissions"
                  : "Microphone needed to shout"
            }
            action={
              mic !== "granted" && mic !== "denied" ? (
                <button
                  onClick={enableMic}
                  className="shrink-0 rounded-lg bg-gold px-3 py-1.5 font-display text-sm font-bold text-mud-deep transition hover:brightness-110 active:translate-y-0.5"
                >
                  {mic === "granting" ? "…" : "Enable"}
                </button>
              ) : mic === "denied" ? (
                <span className="font-body text-xs text-marigold">Blocked</span>
              ) : undefined
            }
          />

          {/* Host sees whether the opponent is ready */}
          {mode === "online" && role === "host" && peer && (
            <StatusRow
              ok={guestReady}
              label={guestReady ? "Opponent is ready!" : "Waiting for opponent to ready up…"}
            />
          )}
        </div>

        {/* Mic calibration panel */}
        {mic === "granted" && (
          <div className="flex w-full flex-col gap-3.5 rounded-2xl border border-gold/20 bg-black/45 p-5">
            <p className="font-display text-base font-bold text-cream">
              Calibrate Microphone
            </p>

            <div
              className="h-3 w-full overflow-hidden rounded-full"
              style={{ background: "rgba(0,0,0,0.5)", boxShadow: "inset 0 1px 3px rgba(0,0,0,.5)" }}
            >
              <div
                ref={meterRef}
                className="h-full rounded-full transition-none"
                style={{
                  width: "0%",
                  background: "linear-gradient(90deg, #8ec3ef, #f4b528, #ef7e1a)",
                }}
              />
            </div>

            <CalibStep
              index={1}
              label="Stay quiet"
              hint="Measures your room's background noise"
              state={calib === "none" ? "ready" : calib === "quiet" ? "busy" : "done"}
              busyLabel="Listening…"
              onRun={measureQuiet}
              disabled={calib === "quiet" || calib === "shout"}
            />
            <CalibStep
              index={2}
              label='Shout "Arpooo!"'
              hint="Sets your maximum loudness level"
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
          <div className="w-full rounded-xl border border-marigold/30 bg-marigold/10 px-4 py-3">
            <p className="font-body text-sm text-marigold">{connError}</p>
          </div>
        )}

        {/* ── Action area ─────────────────────────────────────────────────── */}

        {/* HOST (online): Start is only enabled once the guest is ready */}
        {mode === "online" && role === "host" && (
          <button
            onClick={handleStart}
            disabled={!ownReady || !guestReady}
            className="w-full rounded-xl bg-marigold px-6 py-4 font-display text-2xl font-extrabold text-cream shadow-[0_5px_0_#a34f08] transition active:translate-y-0.5 active:shadow-[0_2px_0_#a34f08] disabled:cursor-not-allowed disabled:opacity-35 hover:brightness-105"
          >
            {!ownReady
              ? "Complete your setup first"
              : !guestReady
                ? "Waiting for opponent…"
                : "Start Tug!"}
          </button>
        )}

        {/* GUEST (online): Ready button, then waiting pill */}
        {mode === "online" && role === "guest" && (
          selfReady ? (
            <div className="w-full rounded-xl border border-green-400/30 bg-green-400/10 px-6 py-4 text-center">
              <p className="font-display text-xl font-bold text-green-400">
                You are ready!
              </p>
              <p className="mt-1 font-body text-sm text-cream/50">
                Waiting for the host to start the match…
              </p>
            </div>
          ) : (
            <button
              onClick={handleReady}
              disabled={!ownReady}
              className="w-full rounded-xl bg-gold px-6 py-4 font-display text-2xl font-extrabold text-mud-deep shadow-[0_5px_0_#b47c10] transition active:translate-y-0.5 active:shadow-[0_2px_0_#b47c10] disabled:cursor-not-allowed disabled:opacity-35 hover:brightness-105"
            >
              {ownReady ? "I'm Ready!" : "Complete setup first"}
            </button>
          )
        )}

        {/* PRACTICE (local): Host starts immediately, AI auto-readies */}
        {mode === "local" && (
          <button
            onClick={handleStart}
            disabled={!ownReady}
            className="w-full rounded-xl bg-marigold px-6 py-4 font-display text-2xl font-extrabold text-cream shadow-[0_5px_0_#a34f08] transition active:translate-y-0.5 active:shadow-[0_2px_0_#a34f08] disabled:cursor-not-allowed disabled:opacity-35 hover:brightness-105"
          >
            Start Tug!
          </button>
        )}

        <p className="font-body text-xs text-cream/40">
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
    <div className="flex items-center justify-between gap-3 rounded-xl border border-cream/10 bg-black/40 px-4 py-3">
      <div className="flex items-center gap-3 text-left">
        <span
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${ok ? "bg-green-400" : "bg-cream/30"}`}
          style={ok ? { boxShadow: "0 0 8px #4ade80" } : undefined}
        />
        <span className="font-body text-sm text-cream/85">{label}</span>
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
      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 ${
        state === "locked" ? "opacity-40" : ""
      }`}
    >
      <div className="flex items-center gap-3 text-left">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold ${
            state === "done" ? "bg-green-400 text-mud-deep" : "bg-cream/15 text-cream"
          }`}
        >
          {state === "done" ? "✓" : index}
        </span>
        <div>
          <p className="font-display text-sm font-bold text-cream">{label}</p>
          <p className="font-body text-xs text-cream/60">{hint}</p>
        </div>
      </div>
      {state === "done" ? (
        <span className="font-body text-xs text-green-400">Done</span>
      ) : (
        <button
          onClick={onRun}
          disabled={disabled}
          className={`shrink-0 rounded-lg px-3 py-1.5 font-display text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
            state === "busy"
              ? "animate-pulse bg-marigold text-cream"
              : "bg-gold text-mud-deep hover:brightness-105"
          }`}
        >
          {state === "busy" ? busyLabel : "Measure"}
        </button>
      )}
    </div>
  )
}
