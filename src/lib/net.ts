// Transport layer for room-code multiplayer.
//
// Two implementations share one interface so the game loop is agnostic:
//   - SupabaseTransport: real 2-browser play over Realtime broadcast.
//   - LocalAiTransport:  single-device practice against a shouting AI.

import type { StatePayload } from "./game"
import { openRoomChannel } from "./supabase"
import type { RealtimeChannel } from "@supabase/supabase-js"

export type Role = "host" | "guest"

export interface Transport {
  readonly kind: "supabase" | "local"
  connect: () => Promise<void>
  /** guest -> host: mic calibration complete, ready to play */
  sendReady: () => void
  /** guest -> host: live intensity */
  sendIntensity: (v: number) => void
  /** host -> guest: physics state */
  sendState: (s: StatePayload) => void
  /** host -> both: absolute match-start timestamp */
  sendMatchStart: (startAt: number) => void
  on: (ev: "peer-join" | "peer-leave", cb: () => void) => void
  onReady: (cb: () => void) => void
  onIntensity: (cb: (v: number) => void) => void
  onState: (cb: (s: StatePayload) => void) => void
  onMatchStart: (cb: (startAt: number) => void) => void
  disconnect: () => void
}

// ---------------------------------------------------------------------------

export class SupabaseTransport implements Transport {
  readonly kind = "supabase" as const
  private channel: RealtimeChannel | null = null
  private handlers: Record<string, (() => void)[]> = {}
  private readyCb: (() => void) | null = null
  private intensityCb: ((v: number) => void) | null = null
  private stateCb: ((s: StatePayload) => void) | null = null
  private matchStartCb: ((startAt: number) => void) | null = null
  private peers = 0
  private peerPresent = false

  constructor(
    private roomCode: string,
    private role: Role,
  ) {}

  async connect() {
    const channel = await openRoomChannel(this.roomCode)
    if (!channel) throw new Error("Supabase is not connected")
    this.channel = channel

    channel.on("broadcast", { event: "ready" }, () => {
      this.readyCb?.()
    })
    channel.on("broadcast", { event: "intensity" }, ({ payload }) => {
      this.intensityCb?.(payload.v as number)
    })
    channel.on("broadcast", { event: "match-start" }, ({ payload }) => {
      this.matchStartCb?.(payload.startAt as number)
    })
    channel.on("broadcast", { event: "state" }, ({ payload }) => {
      this.stateCb?.(payload as StatePayload)
    })
    channel.on("presence", { event: "join" }, () => {
      this.peers = Object.keys(channel.presenceState()).length
      if (this.peers > 1) this.emit("peer-join")
    })
    channel.on("presence", { event: "leave" }, () => {
      this.peers = Object.keys(channel.presenceState()).length
      this.emit("peer-leave")
    })

    await new Promise<void>((resolve, reject) => {
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.track({ role: this.role, at: Date.now() })
          this.peers = Object.keys(channel.presenceState()).length
          if (this.peers > 1) this.emit("peer-join")
          resolve()
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          reject(new Error("Could not join room"))
        }
      })
    })
  }

  private emit(ev: "peer-join" | "peer-leave") {
    if (ev === "peer-join") this.peerPresent = true
    if (ev === "peer-leave") this.peerPresent = false
    this.handlers[ev]?.forEach((cb) => cb())
  }

  on(ev: "peer-join" | "peer-leave", cb: () => void) {
    ;(this.handlers[ev] ||= []).push(cb)
    if (ev === "peer-join" && this.peerPresent) cb()
  }
  onReady(cb: () => void) {
    this.readyCb = cb
  }
  onIntensity(cb: (v: number) => void) {
    this.intensityCb = cb
  }
  onMatchStart(cb: (startAt: number) => void) {
    this.matchStartCb = cb
  }
  onState(cb: (s: StatePayload) => void) {
    this.stateCb = cb
  }
  sendReady() {
    this.channel?.send({ type: "broadcast", event: "ready", payload: {} })
  }
  sendIntensity(v: number) {
    this.channel?.send({ type: "broadcast", event: "intensity", payload: { v } })
  }
  sendMatchStart(startAt: number) {
    this.channel?.send({
      type: "broadcast",
      event: "match-start",
      payload: { startAt },
    })
  }
  sendState(s: StatePayload) {
    this.channel?.send({ type: "broadcast", event: "state", payload: s })
  }
  disconnect() {
    this.channel?.unsubscribe()
    this.channel = null
  }
}

// ---------------------------------------------------------------------------

/** Practice opponent: fluctuating shouts with occasional strong surges. */
export class LocalAiTransport implements Transport {
  readonly kind = "local" as const
  private intensityCb: ((v: number) => void) | null = null
  private readyCb: (() => void) | null = null
  private timer: ReturnType<typeof setInterval> | null = null
  private t = 0
  private surge = 0
  private peerJoined = false

  constructor(private difficulty = 0.55) {}

  async connect() {
    // AI peer joins and immediately signals ready after a short delay.
    setTimeout(() => {
      this.peerJoined = true
      this.peerJoin?.()
      this.readyCb?.()
    }, 400)
    this.timer = setInterval(() => {
      this.t += 0.12
      if (Math.random() < 0.04) this.surge = 0.6 + Math.random() * 0.4
      this.surge *= 0.9
      const base =
        this.difficulty * (0.5 + 0.5 * Math.abs(Math.sin(this.t * 1.3)))
      const noise = (Math.random() - 0.5) * 0.15
      const v = Math.max(0, Math.min(1, base + this.surge + noise))
      this.intensityCb?.(v)
    }, 120)
  }

  private peerJoin: (() => void) | null = null
  private matchStartCb: ((startAt: number) => void) | null = null

  on(ev: "peer-join" | "peer-leave", cb: () => void) {
    if (ev === "peer-join") {
      this.peerJoin = cb
      if (this.peerJoined) cb()
    }
  }
  onReady(cb: () => void) {
    this.readyCb = cb
    // If AI already signalled ready before the listener registered, fire now.
    if (this.peerJoined) cb()
  }
  onIntensity(cb: (v: number) => void) {
    this.intensityCb = cb
  }
  onMatchStart(_cb: (startAt: number) => void) {
    // No remote peer in practice mode; host calls onStart directly.
  }
  onState() {}
  sendReady() {}      // guest action; no-op for host-only local mode
  sendIntensity() {}
  sendMatchStart(_startAt: number) {}
  sendState() {}
  disconnect() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }
}
