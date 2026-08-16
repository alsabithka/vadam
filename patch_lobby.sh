sed -i 's/onStart: (voice: VoiceController | null) => void/onStart: (voice: VoiceController | null, startAt: number) => void/' src/scenes/Lobby.tsx
sed -i '/const meterRef = useRef/a \  const [waitingForHost, setWaitingForHost] = useState(false)' src/scenes/Lobby.tsx
sed -i '/transport.on("peer-join", () => setPeer(true))/a \    transport.onMatchStart((startAt) => {\n      onStart(voiceRef.current, startAt)\n    })' src/scenes/Lobby.tsx
sed -i '/const measureShout = async () => {/a \  const handleStart = () => {\n    if (role === "guest") return;\n    const startAt = Date.now() + 1500;\n    transport.sendMatchStart(startAt);\n    onStart(voiceRef.current, startAt);\n  }' src/scenes/Lobby.tsx
