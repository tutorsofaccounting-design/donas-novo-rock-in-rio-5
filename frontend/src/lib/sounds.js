// Plays a short mouse-click sound using the Web Audio API — no external files.
// Called from the header's "Pesquisar" button.

let _ctx = null;

function getCtx() {
  if (_ctx) return _ctx;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    _ctx = new Ctx();
    return _ctx;
  } catch {
    return null;
  }
}

export function playClick() {
  const ctx = getCtx();
  if (!ctx) return;

  // Resume if auto-suspended by browser policy
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const now = ctx.currentTime;

  // Short, bright "tick" — two layered components: a noise burst + a very short sine ping.
  // 1) Noise burst (the physical "clack")
  const bufferSize = Math.floor(ctx.sampleRate * 0.03); // 30 ms of noise
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    // Exponential decay envelope
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 2500;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.18, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

  noise.connect(hp).connect(noiseGain).connect(ctx.destination);
  noise.start(now);
  noise.stop(now + 0.04);

  // 2) Sine ping (the "tick" body)
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(1800, now);
  osc.frequency.exponentialRampToValueAtTime(900, now + 0.05);

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0.0001, now);
  oscGain.gain.exponentialRampToValueAtTime(0.22, now + 0.002);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

  osc.connect(oscGain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.08);
}
