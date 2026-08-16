// Live microphone intensity capture using the Web Audio API.
//
// Pipeline: mic -> high-pass (kills rumble) -> analyser. We read the FREQUENCY
// domain and average only the human-voice band (~300Hz–3kHz), which rejects
// non-voice noise far better than full-spectrum RMS. Each reading is gated and
// normalized against a per-device noise floor and (optionally) a measured
// shout peak, so two different mics/rooms produce comparable 0..1 values.

export interface VoiceController {
  /** Latest smoothed intensity, 0..1 (fast attack, clean decay). */
  getIntensity: () => number
  /** Instantaneous (unsmoothed) normalized intensity. */
  getPeak: () => number
  /** Raw voice-band energy 0..1 before gating/normalization (for calibration UI). */
  getRawBand: () => number
  /** Measure ambient room noise for `ms` and store it as the noise floor. */
  calibrateNoiseFloor: (ms?: number) => Promise<number>
  /** Measure the loudest reading over `ms` (user shouts) and store it as peak. */
  calibratePeak: (ms?: number) => Promise<number>
  getCalibration: () => { noiseFloor: number; userPeak: number }
  stop: () => void
}

export interface VoiceOptions {
  /** Attack time constant in ms — smaller = snappier onset. */
  attackMs?: number
  /** Release time constant in ms — smaller = faster decay to silence. */
  releaseMs?: number
  /** Reading must exceed noiseFloor * (1 + gateMargin) to register. */
  gateMargin?: number
}

const VOICE_LO = 300 // Hz
const VOICE_HI = 3000 // Hz

export async function startMic(
  opts: VoiceOptions = {},
): Promise<VoiceController> {
  const { attackMs = 25, releaseMs = 50, gateMargin = 0.15 } = opts
  const attackTau = attackMs / 1000
  const releaseTau = releaseMs / 1000

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  })

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext
  const ctx = new AudioCtx()
  if (ctx.state === "suspended") void ctx.resume()

  const source = ctx.createMediaStreamSource(stream)

  // High-pass removes low-frequency rumble/plosives before analysis.
  const highpass = ctx.createBiquadFilter()
  highpass.type = "highpass"
  highpass.frequency.value = 170
  highpass.Q.value = 0.707

  const analyser = ctx.createAnalyser()
  analyser.fftSize = 1024
  analyser.smoothingTimeConstant = 0.3
  source.connect(highpass)
  highpass.connect(analyser)

  const freq = new Uint8Array(analyser.frequencyBinCount)
  const binHz = ctx.sampleRate / analyser.fftSize
  const loBin = Math.max(1, Math.floor(VOICE_LO / binHz))
  const hiBin = Math.min(
    analyser.frequencyBinCount - 1,
    Math.ceil(VOICE_HI / binHz),
  )

  // Average the voice-band bins, normalized to 0..1.
  const readBand = () => {
    analyser.getByteFrequencyData(freq)
    let sum = 0
    for (let i = loBin; i <= hiBin; i++) sum += freq[i]
    return sum / (hiBin - loBin + 1) / 255
  }

  let noiseFloor = 0.02
  let userPeak = 0.45 // sensible default until the player calibrates
  let smoothed = 0
  let peak = 0
  let rawBand = 0
  let lastTs = performance.now()

  const step = (now: number) => {
    const dt = Math.min(0.05, (now - lastTs) / 1000)
    lastTs = now
    rawBand = readBand()

    // gate idle hiss, then normalize into the calibrated dynamic range
    const gate = noiseFloor * (1 + gateMargin)
    const gated = rawBand <= gate ? 0 : rawBand - noiseFloor
    const range = Math.max(userPeak - noiseFloor, 0.06)
    const norm = Math.max(0, Math.min(1, gated / range))
    const shaped = Math.pow(norm, 0.85)
    peak = shaped

    // asymmetric, frame-rate-independent smoothing: fast attack, clean release
    const tau = shaped > smoothed ? attackTau : releaseTau
    const k = 1 - Math.exp(-dt / tau)
    smoothed += (shaped - smoothed) * k
    if (smoothed < 0.002) smoothed = 0
  }

  let raf = requestAnimationFrame(function loop(t) {
    step(t)
    raf = requestAnimationFrame(loop)
  })

  // Sample rawBand over a window; `reducer` folds each sample into a result.
  const sampleWindow = (
    ms: number,
    seed: number,
    reducer: (acc: number, v: number, n: number) => number,
  ) =>
    new Promise<number>((resolve) => {
      let acc = seed
      let n = 0
      const id = setInterval(() => {
        acc = reducer(acc, rawBand, ++n)
      }, 30)
      setTimeout(() => {
        clearInterval(id)
        resolve(acc)
      }, ms)
    })

  const calibrateNoiseFloor = async (ms = 800) => {
    const avg = await sampleWindow(ms, 0, (acc, v, n) => acc + (v - acc) / n)
    noiseFloor = avg
    return noiseFloor
  }
  const calibratePeak = async (ms = 1600) => {
    const max = await sampleWindow(ms, 0, (acc, v) => Math.max(acc, v))
    // Only accept a peak that clearly rose above the floor.
    if (max > noiseFloor + 0.08) userPeak = max
    return userPeak
  }

  // Auto-calibrate the noise floor up front so idle mics never read as shouts.
  await calibrateNoiseFloor(800)

  return {
    getIntensity: () => smoothed,
    getPeak: () => peak,
    getRawBand: () => rawBand,
    calibrateNoiseFloor,
    calibratePeak,
    getCalibration: () => ({ noiseFloor, userPeak }),
    stop: () => {
      cancelAnimationFrame(raf)
      stream.getTracks().forEach((t) => t.stop())
      void ctx.close()
    },
  }
}
