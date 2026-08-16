import { useEffect, useRef, useState } from 'react'
import { checkWinner, stepPull, type StatePayload, type Winner } from './game'
import type { Role, Transport } from './net'
import type { VoiceController } from './voice'

interface Options {
  role: Role
  transport: Transport
  voice: VoiceController | null
  active: boolean // start the loop once both players are in
}

// Smoothed, animation-ready signals derived from the raw game state. These are
// what the visuals consume so network jitter never reaches the springs.
export interface AnimState {
  iHost: number // smoothed 0..1
  iGuest: number
  spikeHost: number // increments on each hard shout — trigger for one-shots
  spikeGuest: number
  pullVel: number // signed rope velocity (per second), smoothed
}

interface GameHook {
  state: StatePayload
  anim: AnimState
  peerConnected: boolean
  peerLeft: boolean
}

const START: StatePayload = { pull: 0, iHost: 0, iGuest: 0, status: 'playing', winner: null }
const START_ANIM: AnimState = { iHost: 0, iGuest: 0, spikeHost: 0, spikeGuest: 0, pullVel: 0 }

const SPIKE_JUMP = 0.16 // rise needed to count as a fresh "pull"
const SPIKE_LEVEL = 0.45 // and it must clear this loudness
const SPIKE_COOLDOWN = 260 // ms between spikes per side

// The host owns physics and broadcasts state at ~10Hz. The guest streams its
// own intensity up and renders whatever the host reports back. On top of that
// we run a per-frame smoothing pass that produces animation-ready signals.
export function useTugGame({ role, transport, voice, active }: Options): GameHook {
  const [state, setState] = useState<StatePayload>(START)
  const [anim, setAnim] = useState<AnimState>(START_ANIM)
  const [peerConnected, setPeerConnected] = useState(false)
  const [peerLeft, setPeerLeft] = useState(false)

  const remoteTarget = useRef(0) // last value received over the network
  const remoteSmooth = useRef(0) // lerped toward target each frame (host physics input)
  const latestState = useRef<StatePayload>(START)
  const pullRef = useRef(0)
  const winnerRef = useRef<Winner>(null)

  useEffect(() => {
    transport.on('peer-join', () => {
      setPeerConnected(true)
      setPeerLeft(false)
    })
    transport.on('peer-leave', () => setPeerLeft(true))

    if (role === 'host') {
      transport.onIntensity((v) => (remoteTarget.current = v))
    } else {
      transport.onState((s) => {
        pullRef.current = s.pull
        winnerRef.current = s.winner
        latestState.current = s
        setState(s)
      })
    }
  }, [transport, role])

  useEffect(() => {
    if (!active) return
    let raf = 0
    let last = performance.now()
    let lastSend = 0
    let lastAnimPush = 0

    // smoothing / derived-signal accumulators
    const sm = { host: 0, guest: 0, vel: 0, prevPull: pullRef.current }
    const spikeCtr = { host: 0, guest: 0 }
    const spikePrev = { host: 0, guest: 0 }
    const spikeAt = { host: 0, guest: 0 }

    // Light animation smoothing only — voice.ts already shapes attack/release,
    // so the release here stays fast to preserve its clean decay.
    const emaAlpha = (target: number, cur: number, up = 0.4, down = 0.3) =>
      cur + (target - cur) * (target > cur ? up : down)

    const detectSpike = (side: 'host' | 'guest', smoothVal: number, now: number) => {
      const rise = smoothVal - spikePrev[side]
      if (rise > SPIKE_JUMP && smoothVal > SPIKE_LEVEL && now - spikeAt[side] > SPIKE_COOLDOWN) {
        spikeCtr[side]++
        spikeAt[side] = now
      }
      spikePrev[side] = smoothVal
    }

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const mine = voice ? voice.getIntensity() : 0

      // ---- authoritative physics (host) / upstream send (guest) ----
      let rawHost: number
      let rawGuest: number

      if (role === 'host') {
        // Lerp toward the last networked value so ~10Hz packets render as
        // continuous motion instead of stepping every frame batch.
        remoteSmooth.current += (remoteTarget.current - remoteSmooth.current) * 0.3
        rawHost = mine
        rawGuest = remoteSmooth.current
        if (!winnerRef.current) {
          pullRef.current = stepPull(pullRef.current, rawHost, rawGuest, dt)
          const w = checkWinner(pullRef.current)
          if (w) winnerRef.current = w
          const next: StatePayload = { pull: pullRef.current, iHost: rawHost, iGuest: rawGuest, status: w ? 'over' : 'playing', winner: w }
          latestState.current = next
          if (now - lastSend > 60 || w) {
            setState(next)
            transport.sendState(next)
            lastSend = now
          }
        }
      } else {
        // Guest: own mic is snappier than the round-tripped value for its side.
        rawHost = latestState.current.iHost
        rawGuest = mine
        if (now - lastSend > 90) {
          transport.sendIntensity(mine)
          lastSend = now
        }
      }

      // ---- smoothing + derived animation signals (both roles) ----
      sm.host = emaAlpha(rawHost, sm.host)
      sm.guest = emaAlpha(rawGuest, sm.guest)
      detectSpike('host', sm.host, now)
      detectSpike('guest', sm.guest, now)

      const rawVel = dt > 0 ? (pullRef.current - sm.prevPull) / dt : 0
      sm.prevPull = pullRef.current
      sm.vel += (rawVel - sm.vel) * 0.2

      if (now - lastAnimPush > 33) {
        setAnim({ iHost: sm.host, iGuest: sm.guest, spikeHost: spikeCtr.host, spikeGuest: spikeCtr.guest, pullVel: sm.vel })
        lastAnimPush = now
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [active, role, transport, voice])

  return { state, anim, peerConnected, peerLeft }
}
