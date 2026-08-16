import { useState } from "react"

export default function RoomCodeDisplay({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard blocked — the code is on screen anyway */
    }
  }

  return (
    <button
      onClick={copy}
      className="group flex flex-col items-center gap-2 rounded-2xl border border-gold/40 bg-black/25 px-8 py-5 transition hover:border-gold/80 hover:bg-black/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      <span className="font-body text-xs uppercase tracking-[0.35em] text-cream/60">
        Room code
      </span>
      <span
        className="font-mono text-5xl font-medium tracking-[0.25em] text-gold"
        style={{ textShadow: "0 2px 10px rgba(0,0,0,.5)" }}
      >
        {code}
      </span>
      <span className="font-body text-xs text-cream/70">
        {copied ? "Copied!" : "Tap to copy"}
      </span>
    </button>
  )
}
