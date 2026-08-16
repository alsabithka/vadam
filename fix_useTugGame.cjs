const fs = require("fs")
let code = fs.readFileSync("src/scenes/Play.tsx", "utf-8")

// There is a bug in my previous replacement: state is not defined yet when I check it for tentative active.
// Let's rewrite the Play.tsx hook section safely.

code = code.replace(
  /  const \[count, setCount\] = useState\(\(\) => Math\.max\(0, Math\.ceil\(\(startAt - Date\.now\(\)\) \/ 1000\)\)\)[\s\S]*?const active = count === 0 && !syncing && peerConnected;/,
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

  // Need useTugGame to get peerLeft and state
  const { state, anim, peerLeft } = useTugGame({
    role,
    transport,
    voice,
    active: count === 0, // will patch active below for proper syncing
  })

  const isStartPayload = state?.status === "playing" && state?.pull === 0;
  const peerConnected = mode === "local" || !peerLeft;
  const syncing = count === 0 && mode === "online" && role === "guest" && isStartPayload;
  const active = count === 0 && !syncing && peerConnected;`,
)
fs.writeFileSync("src/scenes/Play.tsx", code)
