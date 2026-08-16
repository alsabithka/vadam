const fs = require("fs")
let code = fs.readFileSync("src/scenes/Lobby.tsx", "utf-8")

code = code.replace(
  /  const measureShout = async \(\) => \{\n    const handleStart = \(\) => \{\n      if \(role === "guest"\) return\n      const startAt = Date.now\(\) \+ 1500\n      transport.sendMatchStart\(startAt\)\n      onStart\(voiceRef.current, startAt\)\n    \}\n    setCalib\("shout"\)/,
  `  const handleStart = () => {
    if (role === "guest") return
    const startAt = Date.now() + 1500
    transport.sendMatchStart(startAt)
    onStart(voiceRef.current, startAt)
  }

  const measureShout = async () => {
    setCalib("shout")`,
)

fs.writeFileSync("src/scenes/Lobby.tsx", code)
