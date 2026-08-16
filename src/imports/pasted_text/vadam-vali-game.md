PROJECT: Vadam Vali — Real-Time Voice-Powered Tug-of-War (Onam Theme)

OVERVIEW:
Build a two-player, real-time multiplayer tug-of-war game where players 
shout "Arpooo!" into their microphones. Live voice intensity drives rope 
pulling force. Theme: Kerala Onam festival.

TECH STACK:
- Frontend: React + TypeScript + Vite
- Multiplayer: Supabase Realtime broadcast channels, room-code-based 
  matchmaking (host generates a 4-6 character code, second player joins 
  with it)
- Voice input: Web Audio API (getUserMedia + AnalyserNode) to compute 
  live volume/intensity per player, normalized 0-1
- Animation: Framer Motion or GSAP for character/rope movement
- Build tool: pnpm

CORE GAME FLOW:
1. Landing screen: "Host Game" or "Join Game" (enter room code)
2. Lobby: waiting for second player, mic permission request, display 
   room code
3. Play scene (full-screen, landscape-locked)
4. Win screen: shows winner, "Play Again" / "New Room" options

PLAY SCENE — HARD REQUIREMENTS:
1. Background: muddy Kerala paddy-field ground (wet brown/reddish clay, 
   mud streaks, puddle highlights) surrounded by dense tropical greenery 
   — coconut palms, banana leaves, areca palms framing the screen edges. 
   Warm golden-hour lighting. No flat/generic grass.
2. Characters: two human figures, one per player, positioned on opposite 
   sides pulling a shared rope toward center.
   - Semi-realistic proportions (NOT cartoon/chibi/anime/stick figure) — 
     built from real illustrated character assets (image-based layered 
     parts), not hand-coded SVG anatomy.
   - Traditional mundu (waist cloth) + shirt, one player blue, one mustard, 
     sleeves rolled up.
   - Low athletic pulling stance: knees bent ~120°, torso leaned back 
     20-35°, weight on back leg.
   - Both hands gripping the rope with visible finger curl, palms facing 
     each other.
   - Feet dig into mud (heel lift on push leg, foot tilt) — never flat 
     or floating.
   - Continuous backward-stepping leg cycle (alternating dig-in/step-back), 
     looping at all times — no idle/T-pose frame ever.
3. Rope: continuous jute-textured rope (twisted brown fiber look) rendered 
   with a wave function. Amplitude/frequency scale directly with each 
   player's live voice intensity. Idle amplitude floor (2-3px) so the rope 
   is always visibly moving, never static. Rope midpoint position reflects 
   pull balance and drives the win threshold.
4. Voice intensity meters: one per player, visible on-screen, updating 
   in real time from mic input.
5. Player name display: above or near each character.
6. Win condition: when rope midpoint crosses a defined threshold toward 
   one side, trigger win state, broadcast result to both clients, freeze 
   physics, show win screen.

MULTIPLAYER SYNC:
- Use Supabase broadcast channels keyed by room code.
- Each client sends its own voice intensity value at a throttled interval 
  (e.g. every 100ms) over the channel.
- Both clients render the SAME rope position derived from both players' 
  intensities (host or shared deterministic calculation — pick one 
  authoritative source, e.g. host computes and broadcasts rope state to 
  avoid desync).
- Handle disconnects gracefully (show "opponent disconnected" state).

CHARACTER ASSET STRATEGY:
- Do not generate humans via freehand SVG path code — this cannot achieve 
  realistic anatomy.
- Use real illustrated image assets (PNG with transparent background) for 
  each character, split into layers (torso+arms, front leg, back leg) so 
  they can be animated independently via CSS/Framer Motion transforms 
  (rotate/translate) instead of redrawn per frame.
- Keep consistent art style, lighting direction, and proportions across 
  both characters so they composite cleanly in the same scene.
- Store assets in src/assets/.

PROJECT STRUCTURE:
- src/App.tsx — routing between Landing / Lobby / Play / Win scenes
- src/scenes/ — one file per scene
- src/lib/supabase.ts — client + channel setup
- src/lib/voice.ts — mic intensity capture logic
- src/assets/ — character and background images
- src/components/ — Rope, Character, IntensityMeter, RoomCodeDisplay

ACCEPTANCE CRITERIA (confirm all before considering this done):
[ ] Room code matchmaking works between two separate browser sessions
[ ] Both clients see synchronized rope movement in real time
[ ] Voice intensity meters update live per player
[ ] Characters look semi-realistic (image-based), not cartoonish
[ ] Background is a muddy, green Kerala field, not generic
[ ] Both characters show visible two-hand rope grip
[ ] Backward-stepping leg animation loops continuously, no idle frame
[ ] Rope always has visible motion, scaled to voice intensity
[ ] Win state triggers correctly and displays on both clients
[ ] Full-screen landscape layout works on mobile and desktop
[ ] `pnpm run build` passes with no errors

Build this in phases if needed: (1) scaffold + routing, (2) Supabase 
matchmaking, (3) voice capture, (4) play scene visuals + rope physics, 
(5) win flow + polish. Confirm each phase works before moving to the next.