sed -i '/private stateCb: ((s: StatePayload) => void) | null = null/a \  private matchStartCb: ((startAt: number) => void) | null = null' src/lib/net.ts
sed -i '/channel.on("broadcast", { event: "state" }, ({ payload }) => {/i \    channel.on("broadcast", { event: "match-start" }, ({ payload }) => {\n      this.matchStartCb?.(payload.startAt as number)\n    })' src/lib/net.ts
sed -i '/onState(cb: (s: StatePayload) => void) {/i \  onMatchStart(cb: (startAt: number) => void) {\n    this.matchStartCb = cb\n  }' src/lib/net.ts
sed -i '/sendState(s: StatePayload) {/i \  sendMatchStart(startAt: number) {\n    this.channel?.send({ type: "broadcast", event: "match-start", payload: { startAt } })\n  }' src/lib/net.ts
