sed -i 's/interface Session {/interface Session {\n  startAt?: number/g' src/App.tsx
sed -i 's/const handleStart = (voice: VoiceController | null) => {/const handleStart = (voice: VoiceController | null, startAt: number) => {\n    setSession((s) => (s ? { ...s, startAt } : null))/g' src/App.tsx
sed -i 's/opponentName={session.opponentName}/opponentName={session.opponentName}\n          startAt={session.startAt || Date.now()}/g' src/App.tsx
