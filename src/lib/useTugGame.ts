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

interface GameHook {
  state: StatePayload
  peerConnected: boolean
  peerLeft: boolean
}

const START: StatePayload = { pull: 0, iHost: 0, iGuest: 0, status: 'playing', winner: null }

// The host owns physics and broadcasts state at ~10Hz. The guest streams its
// own intensity up and renders whatever the host reports back.
export function useTugGame({ role, transport, voice, active }: Options): GameHook {
  const [state, setState] = useState<StatePayload>(START)
  const [peerConnected, setPeerConnected] = useState(false)
  const [peerLeft, setPeerLeft] = useState(false)

  const remoteIntensity = useRef(0)
  const pullRef = useRef(0)
  const winnerRef = useRef<Winner>(null)

  useEffect(() => {
    transport.on('peer-join', () => {
      setPeerConnected(true)
      setPeerLeft(false)
    })
    transport.on('peer-leave', () => setPeerLeft(true))

    if (role === 'host') {
      transport.onIntensity((v) => (remoteIntensity.current = v))
    } else {
      transport.onState((s) => {
        pullRef.current = s.pull
        winnerRef.current = s.winner
        setState(s)
      })
    }
  }, [transport, role])

  useEffect(() => {
    if (!active) return
    let raf = 0
    let last = performance.now()
    let lastSend = 0

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const mine = voice ? voice.getIntensity() : 0

      if (role === 'host') {
        if (!winnerRef.current) {
          const iHost = mine
          const iGuest = remoteIntensity.current
          pullRef.current = stepPull(pullRef.current, iHost, iGuest, dt)
          const w = checkWinner(pullRef.current)
          if (w) winnerRef.current = w
          const next: StatePayload = {
            pull: pullRef.current,
            iHost,
            iGuest,
            status: w ? 'over' : 'playing',
            winner: w,
          }
          setState(next)
          if (now - lastSend > 90 || w) {
            transport.sendState(next)
            lastSend = now
          }
        }
      } else {
        // Guest: report own shout upstream, throttled.
        if (now - lastSend > 90) {
          transport.sendIntensity(mine)
          lastSend = now
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [active, role, transport, voice])

  return { state, peerConnected, peerLeft }
}
