"use client";

// Tiny Web Audio sound design — no files to download.
let ctx: AudioContext | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noiseBuffer(a: AudioContext, seconds: number) {
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * seconds), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/** One knock on a heavy wooden door: low body thump + short woody click. */
export function playKnock() {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + 0.01;
  const out = a.createGain();
  out.gain.value = 0.9;
  out.connect(a.destination);

  const body = a.createOscillator();
  const bodyGain = a.createGain();
  body.type = "sine";
  body.frequency.setValueAtTime(140, t);
  body.frequency.exponentialRampToValueAtTime(58, t + 0.16);
  bodyGain.gain.setValueAtTime(0.0001, t);
  bodyGain.gain.exponentialRampToValueAtTime(0.85, t + 0.004);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  body.connect(bodyGain).connect(out);
  body.start(t);
  body.stop(t + 0.25);

  const click = a.createBufferSource();
  click.buffer = noiseBuffer(a, 0.08);
  const bp = a.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1100;
  bp.Q.value = 1.4;
  const clickGain = a.createGain();
  clickGain.gain.setValueAtTime(0.5, t);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  click.connect(bp).connect(clickGain).connect(out);
  click.start(t);
}

/** Airy swell while the camera pushes through the doorway. */
export function playSwell(duration = 2.4) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const src = a.createBufferSource();
  src.buffer = noiseBuffer(a, duration);
  const lp = a.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(300, t);
  lp.frequency.exponentialRampToValueAtTime(2400, t + duration * 0.7);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.07, t + duration * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(lp).connect(g).connect(a.destination);
  src.start(t);
}
