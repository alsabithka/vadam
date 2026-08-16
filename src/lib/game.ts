// Shared, deterministic tug-of-war physics. The host runs `stepPull` and
// broadcasts the result so both clients render an identical rope position.

export type GameStatus = "playing" | "over"
export type Winner = "host" | "guest" | null

export interface StatePayload {
  /** Rope midpoint balance, -1 (host/left wins) .. +1 (guest/right wins). */
  pull: number
  iHost: number
  iGuest: number
  status: GameStatus
  winner: Winner
}

export const PULL_SPEED = 0.9 // how fast intensity difference moves the rope
export const CENTER_DECAY = 0.18 // gentle pull back toward center each second
export const WIN_THRESHOLD = 0.82

/** Advance the rope balance by one frame. */
export function stepPull(
  pull: number,
  iHost: number,
  iGuest: number,
  dt: number,
): number {
  const drive = (iGuest - iHost) * PULL_SPEED
  const decay = -pull * CENTER_DECAY
  let next = pull + (drive + decay) * dt
  return Math.max(-1, Math.min(1, next))
}

export function checkWinner(pull: number): Winner {
  if (pull <= -WIN_THRESHOLD) return "host"
  if (pull >= WIN_THRESHOLD) return "guest"
  return null
}

/** Random 4-character room code (unambiguous glyphs only). */
export function makeRoomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 4; i++)
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  return code
}
