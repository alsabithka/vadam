sed -i 's/export type TransportEvent = "peer-join" | "peer-leave" | "intensity" | "state"/export type TransportEvent = "peer-join" | "peer-leave" | "intensity" | "state" | "match-start"/' src/lib/net.ts
sed -i '/sendState: (s: StatePayload) => void/a \  sendMatchStart: (startAt: number) => void' src/lib/net.ts
sed -i '/onState: (cb: (s: StatePayload) => void) => void/a \  onMatchStart: (cb: (startAt: number) => void) => void' src/lib/net.ts
