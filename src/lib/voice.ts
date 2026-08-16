// Live microphone intensity capture using the Web Audio API.
// Returns a normalized 0..1 "shout" value smoothed over time so the rope
// responds to sustained loudness rather than momentary clicks.

export interface VoiceController {
  /** Latest smoothed intensity, 0..1. */
  getIntensity: () => number
  /** Instantaneous (unsmoothed) intensity, useful for punchy meters. */
  getPeak: () => number
  stop: () => void
}

export interface VoiceOptions {
  /** Loudness (RMS) mapped to 1.0. Lower = more sensitive. */
  gain?: number
  /** 0..1 smoothing factor for the running value. Higher = snappier. */
  attack?: number
  release?: number
}

export async function startMic(opts: VoiceOptions = {}): Promise<VoiceController> {
  const { gain = 3.2, attack = 0.55, release = 0.12 } = opts

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  })

  const AudioCtx =
    window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const ctx = new AudioCtx()
  // Some browsers start the context suspended until a gesture resumes it.
  if (ctx.state === 'suspended') void ctx.resume()

  const source = ctx.createMediaStreamSource(stream)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 1024
  analyser.smoothingTimeConstant = 0.4
  source.connect(analyser)

  const buffer = new Float32Array(analyser.fftSize)
  let smoothed = 0
  let peak = 0

  const sample = () => {
    analyser.getFloatTimeDomainData(buffer)
    let sum = 0
    for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i]
    const rms = Math.sqrt(sum / buffer.length)
    // Perceptual-ish curve so quiet room ~0 and a real shout saturates.
    const raw = Math.min(1, Math.pow(rms * gain, 0.7))
    peak = raw
    const k = raw > smoothed ? attack : release
    smoothed += (raw - smoothed) * k
    return smoothed
  }

  let raf = requestAnimationFrame(function loop() {
    sample()
    raf = requestAnimationFrame(loop)
  })

  return {
    getIntensity: () => smoothed,
    getPeak: () => peak,
    stop: () => {
      cancelAnimationFrame(raf)
      stream.getTracks().forEach((t) => t.stop())
      void ctx.close()
    },
  }
}
