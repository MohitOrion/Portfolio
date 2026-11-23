// ---------------------------------------------------------------------------
//  Pulsar plot, after the famous 1967 chart of PSR B1919+21 (CP 1919),
//  the first pulsar ever discovered.
//
//  Each line is one radio pulse. A new pulse arrives every 1.3373 seconds,
//  the pulsar's real rotation period, and the stack scrolls up one line.
// ---------------------------------------------------------------------------
import { throttledLoop, whenVisible } from "../lib/motion.js";

const PERIOD = 1.3373; // seconds
const LINES = 46;
const SAMPLES = 140;   // points per line

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** One pulse: a few narrow peaks near the middle, plus receiver noise. */
function makePulse(random) {
  const peaks = [];
  const peakCount = 2 + Math.floor(random() * 3);
  for (let i = 0; i < peakCount; i++) {
    peaks.push({
      centre: 0.5 + (random() - 0.5) * 0.14,
      width: 0.012 + random() * 0.022,
      height: 0.25 + random() * 0.85,
    });
  }

  const line = new Float32Array(SAMPLES);
  for (let i = 0; i < SAMPLES; i++) {
    const x = i / (SAMPLES - 1);
    let y = (random() - 0.5) * 0.045 + (random() - 0.5) * 0.02;   // noise
    const envelope = Math.exp(-(((x - 0.5) / 0.16) ** 2));           // pulse lives in the middle
    for (const p of peaks) y += p.height * Math.exp(-(((x - p.centre) / p.width) ** 2));
    line[i] = y * (0.35 + envelope * 0.65) + envelope * random() * 0.06;
  }
  return line;
}

export function mountPulsar(canvas, { reducedMotion = false, ink = "#eceef6", accent = "#ffb46a" } = {}) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const random = seededRandom(1919);
  const pulses = Array.from({ length: LINES + 1 }, () => makePulse(random));
  let W = 0;
  let H = 0;
  let dpr = 1;
  let phase = 0; // 0 → 1 within the current period

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const rect = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(rect.width * dpr));
    H = Math.max(1, Math.round(rect.height * dpr));
    canvas.width = W;
    canvas.height = H;
  }

  function tracePulse(pulse, baseY, left, width, amplitude) {
    ctx.beginPath();
    for (let i = 0; i < SAMPLES; i++) {
      const x = left + (i / (SAMPLES - 1)) * width;
      const y = baseY - pulse[i] * amplitude;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const left = W * 0.14;
    const width = W - left * 2;
    const top = H * 0.16;
    const gap = (H * 0.95 - top) / LINES;
    const amplitude = gap * 5.2;
    const scroll = phase * phase * (3 - 2 * phase); // ease each step
    ctx.lineWidth = Math.max(1, 1.15 * dpr);
    ctx.lineJoin = "round";

    // Draw from the back (top) to the front (bottom).
    for (let i = 0; i <= LINES; i++) {
      const baseY = top + (i - scroll) * gap;
      if (baseY < top - gap * 0.5) continue;
      const grow = i === LINES ? scroll : 1; // the newest pulse rises in
      const amp = amplitude * grow;

      // Erase everything below this line, so nearer pulses hide the ones behind.
      tracePulse(pulses[i], baseY, left, width, amp);
      ctx.lineTo(left + width, baseY + gap * 2);
      ctx.lineTo(left, baseY + gap * 2);
      ctx.closePath();
      ctx.globalCompositeOperation = "destination-out";
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";

      // Then draw the line itself. The newest pulses are highlighted.
      tracePulse(pulses[i], baseY, left, width, amp);
      const newest = i >= LINES - 1;
      ctx.strokeStyle = newest ? accent : ink;
      ctx.globalAlpha = newest ? 1 : 0.35 + 0.6 * (i / LINES);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  resize();
  draw();
  window.addEventListener("resize", () => { resize(); draw(); });

  if (!reducedMotion) {
    const loop = throttledLoop((dt) => {
      phase += dt / PERIOD;
      if (phase >= 1) {
        phase -= 1;
        pulses.shift();
        pulses.push(makePulse(random));
      }
      draw();
    }, 30);
    whenVisible(canvas, (visible) => (visible ? loop.start() : loop.stop()), "0px");
  }
}
