sed -i '/private peerJoin: (() => void) | null = null/a \  private matchStartCb: ((startAt: number) => void) | null = null' src/lib/net.ts
sed -i '/onState() {/i \  onMatchStart(cb: (startAt: number) => void) {\n    this.matchStartCb = cb\n  }' src/lib/net.ts
sed -i '/sendState() {}/i \  sendMatchStart(startAt: number) {\n    this.matchStartCb?.(startAt)\n  }' src/lib/net.ts
