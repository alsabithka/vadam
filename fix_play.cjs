const fs = require("fs")
let code = fs.readFileSync("src/scenes/Play.tsx", "utf-8")

code = code.replace(
  /  const \[count, setCount\] = useState\(3\)\n  const active = count === 0\n  const \{ state, anim, peerLeft \} = useTugGame\(\{\n    role,\n    transport,\n    voice,\n    active,\n  \}\)\n\n  useEffect\(\(\) => \{\n    if \(count === 0\) return\n    const t = setTimeout\(\(\(c\) => setCount\(\(c\) - 1\)\), 750\)\n    return \(\) => clearTimeout\(t\)\n  \}, \[count\]\)/,
  `  const [count, setCount] = useState(() => Math.max(0, Math.ceil((startAt - Date.now()) / 1000)))

  useEffect(() => {
    if (count <= 0) return
    let raf = 0
    const tick = () => {
      const left = Math.ceil((startAt - Date.now()) / 1000)
      if (left <= 0) setCount(0)
      else {
        setCount(left)
        raf = requestAnimationFrame(tick)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [startAt, count])

  // Need useTugGame to get peerLeft and state, but we need active to pass to it.
  // Actually, we can pass a tentative active, then compute the real active.
  const { state, anim, peerLeft } = useTugGame({
    role,
    transport,
    voice,
    active: count === 0, // tentative
  })

  const isStartPayload = state?.status === "playing" && state?.pull === 0;
  const peerConnected = mode === "local" || !peerLeft;
  const syncing = count === 0 && mode === "online" && role === "guest" && isStartPayload;
  const active = count === 0 && !syncing && peerConnected;
`,
)

// also fix the active usage in useTugGame by injecting active={active} ? But useTugGame is already called above. It's fine if the tentative one is used for the first render? Wait, useTugGame needs the *real* active so it starts listening/computing.

// Let's rewrite the replacement to call useTugGame with a ref to active or something?
// Actually, active is used in useTugGame to determine if it should listen to mic and send state.
// If syncing is true, it shouldn't be active.

code = code.replace(
  /active: count === 0, \/\/ tentative/,
  `active: count === 0 && !(mode === "online" && role === "guest" && state?.status === "playing" && state?.pull === 0),`,
)

// Replace `{active && count === 0 && <Flash />}`
code = code.replace(
  /\{active && count === 0 && <Flash \/>\}/,
  `{active && count === 0 && <Flash />}
      {syncing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur z-50">
          <p className="font-display text-3xl font-bold text-cream">Syncing...</p>
        </div>
      )}`,
)

fs.writeFileSync("src/scenes/Play.tsx", code)
