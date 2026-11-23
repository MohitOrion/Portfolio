// ---------------------------------------------------------------------------
//  Pulsar plot, after the 1967 chart of PSR B1919+21 (CP 1919).
//  Each line is one pulse; a new one arrives every 1.3373 seconds, the real
//  rotation period of the pulsar, and the stack scrolls up.
// ---------------------------------------------------------------------------

const PERIOD = 1.3373;
const LINES = 46;
const SAMPLES = 140;

function seededRandom(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function makeProfile(rand) {
  // A narrow main pulse made of a few sub-pulses, plus receiver noise.
  const peaks = [];
  const n = 2 + Math.floor(rand() * 3);
  for (let i = 0; i < n; i++) {
    peaks.push({ c: 0.5 + (rand() - 0.5) * 0.14, w: 0.012 + rand() * 0.022, a: 0.25 + rand() * 0.85 });
  }
  const out = new Float32Array(SAMPLES);
  for (let i = 0; i < SAMPLES; i++) {
    const x = i / (SAMPLES - 1);
    let y = (rand() - 0.5) * 0.045 + (rand() - 0.5) * 0.02;
    const env = Math.exp(-Math.pow((x - 0.5) / 0.16, 2));
    for (const p of peaks) y += p.a * Math.exp(-Math.pow((x - p.c) / p.w, 2));
    out[i] = y * (0.35 + env * 0.65) + env * (rand() * 0.06);
  }
  return out;
}

export function mountPulsar(canvas, { reducedMotion = false, ink = "#eceef6", accent = "#ffb46a" } = {}) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const rand = seededRandom(1919);
  const lines = Array.from({ length: LINES + 1 }, () => makeProfile(rand));
  let W = 0, H = 0, dpr = 1;
  let phase = 0;
  let raf = 0;
  let visible = false;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(rect.width * dpr));
    H = Math.max(1, Math.round(rect.height * dpr));
    canvas.width = W;
    canvas.height = H;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const padX = W * 0.14;
    const top = H * 0.16;
    const bottom = H * 0.95;
    const gap = (bottom - top) / LINES;
    const amp = gap * 5.2;
    const ease = phase * phase * (3 - 2 * phase);
    ctx.lineWidth = Math.max(1, 1.15 * dpr);
    ctx.lineJoin = "round";
    for (let li = 0; li <= LINES; li++) {
      const prof = lines[li];
      const base = top + (li - ease) * gap;
      if (base < top - gap * 0.5) continue;
      const fadeIn = li === LINES ? ease : 1;
      ctx.beginPath();
      for (let i = 0; i < SAMPLES; i++) {
        const x = padX + (i / (SAMPLES - 1)) * (W - padX * 2);
        const y = base - prof[i] * amp * fadeIn;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      // Erase beneath each line so nearer pulses hide the ones behind them.
      ctx.lineTo(W - padX, base + gap * 2);
      ctx.lineTo(padX, base + gap * 2);
      ctx.closePath();
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "#000";
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      ctx.beginPath();
      for (let i = 0; i < SAMPLES; i++) {
        const x = padX + (i / (SAMPLES - 1)) * (W - padX * 2);
        const y = base - prof[i] * amp * fadeIn;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      const newest = li === LINES || li === LINES - 1;
      ctx.strokeStyle = newest ? accent : ink;
      ctx.globalAlpha = newest ? 1 : 0.35 + 0.6 * (li / LINES);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    phase += dt / PERIOD;
    if (phase >= 1) {
      phase -= 1;
      lines.shift();
      lines.push(makeProfile(rand));
    }
    draw();
    if (visible) raf = requestAnimationFrame(loop);
  }

  resize();
  draw();
  window.addEventListener("resize", () => { resize(); draw(); });

  if (!reducedMotion && "IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && !visible) {
          visible = true;
          last = performance.now();
          raf = requestAnimationFrame(loop);
        } else if (!e.isIntersecting) {
          visible = false;
          cancelAnimationFrame(raf);
        }
      }
    }).observe(canvas);
  }
  return { redraw: draw };
}
