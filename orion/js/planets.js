// ---------------------------------------------------------------------------
//  Procedural planets for the project catalogue, drawn on 2D canvases.
//  Each planet gets a seamless surface texture, then every frame the visible
//  hemisphere is re-sampled with a longitude offset so it appears to rotate.
// ---------------------------------------------------------------------------

function makeNoise(seed) {
  const perm = new Uint8Array(512);
  let s = seed >>> 0 || 1;
  const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const val = new Float32Array(256).map(() => rand());
  const fade = (t) => t * t * (3 - 2 * t);
  const h = (x, y, z) => val[perm[(perm[(perm[x & 255] + y) & 255] + z) & 255]];
  function noise(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = fade(xf), v = fade(yf), w = fade(zf);
    const l = (a, b, t) => a + (b - a) * t;
    return l(
      l(l(h(xi, yi, zi), h(xi + 1, yi, zi), u), l(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), u), v),
      l(l(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), u), l(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), u), v),
      w
    );
  }
  return function fbm(x, y, z, oct = 4) {
    let v = 0, a = 0.5, f = 1;
    for (let i = 0; i < oct; i++) { v += a * noise(x * f, y * f, z * f); f *= 2.02; a *= 0.5; }
    return v;
  };
}

const TW = 256;
const TH = 128;

function buildTexture(cfg, seed) {
  const fbm = makeNoise(seed);
  const tex = new Uint8ClampedArray(TW * TH * 3);
  const [r1, g1, b1] = cfg.hue;
  const [r2, g2, b2] = cfg.hue2;
  for (let y = 0; y < TH; y++) {
    const lat = (y / (TH - 1) - 0.5) * Math.PI;
    const cl = Math.cos(lat), sl = Math.sin(lat);
    for (let x = 0; x < TW; x++) {
      const lon = (x / TW) * Math.PI * 2;
      const px = cl * Math.cos(lon), py = sl, pz = cl * Math.sin(lon);
      let t;
      if (cfg.rocky) {
        const n = fbm(px * 2.4 + 3, py * 2.4, pz * 2.4, 5);
        const crater = Math.abs(fbm(px * 6, py * 6 + 4, pz * 6, 3) - 0.5) < 0.03 ? 0.25 : 0;
        t = Math.min(Math.max((n - 0.25) * 1.9 + crater, 0), 1);
      } else if (cfg.lava) {
        const n = fbm(px * 2.2, py * 2.2, pz * 2.2 + 5, 5);
        const crack = 1 - Math.min(Math.abs(n - 0.5) * 14, 1);
        t = crack;
      } else {
        const warp = fbm(px * 1.8, py * 1.8, pz * 1.8, 4);
        const band = Math.sin((py + warp * 0.35) * cfg.bands * Math.PI) * 0.5 + 0.5;
        const storm = fbm(px * 4 + 7, py * 7, pz * 4, 3);
        t = band * 0.75 + storm * 0.35;
        if (cfg.rings === false && cfg.bands <= 5) {
          // Ocean world: deep water with drifting cloud banks.
          const cloud = fbm(px * 3 + 11, py * 5, pz * 3, 5);
          t = 0.15 + warp * 0.35 + (cloud > 0.56 ? (cloud - 0.56) * 4 : 0);
        }
      }
      t = Math.min(Math.max(t, 0), 1.4);
      const i = (y * TW + x) * 3;
      if (cfg.lava) {
        const glow = Math.pow(t, 3);
        tex[i] = r2 + (r1 - r2) * glow + 40 * glow;
        tex[i + 1] = g2 + (g1 - g2) * glow;
        tex[i + 2] = b2 + (b1 - b2) * glow * 0.6;
      } else if (t > 1) {
        const c = t - 1;
        tex[i] = r1 + (255 - r1) * c * 2;
        tex[i + 1] = g1 + (255 - g1) * c * 2;
        tex[i + 2] = b1 + (255 - b1) * c * 2;
      } else {
        tex[i] = r2 + (r1 - r2) * t;
        tex[i + 1] = g2 + (g1 - g2) * t;
        tex[i + 2] = b2 + (b1 - b2) * t;
      }
    }
  }
  return tex;
}

function buildLookup(size, tilt) {
  const n = size * size;
  const idx = [];
  const lon = [];
  const row = [];
  const shade = [];
  const L = [-0.62, -0.42, 0.66];
  const ll = Math.hypot(...L);
  const lx = L[0] / ll, ly = L[1] / ll, lz = L[2] / ll;
  const ct = Math.cos(tilt), st = Math.sin(tilt);
  for (let k = 0; k < n; k++) {
    const px = ((k % size) + 0.5) / size * 2 - 1;
    const py = (Math.floor(k / size) + 0.5) / size * 2 - 1;
    const r2 = px * px + py * py;
    if (r2 > 1) continue;
    const pz = Math.sqrt(1 - r2);
    // Rotate by axial tilt so bands lean.
    const tx = px * ct - py * st;
    const ty = px * st + py * ct;
    const lat = Math.asin(Math.max(-1, Math.min(1, ty)));
    const lo = Math.atan2(tx, pz);
    const diff = Math.max(px * lx + py * ly + pz * lz, 0);
    const limb = Math.pow(pz, 0.35);
    const edge = 1 - Math.min(Math.max((Math.sqrt(r2) - 0.985) / 0.015, 0), 1);
    idx.push(k);
    lon.push(lo);
    row.push(Math.round(((lat / Math.PI) + 0.5) * (TH - 1)));
    shade.push((0.05 + diff * 1.05) * limb * edge);
  }
  return { idx: Int32Array.from(idx), lon: Float32Array.from(lon), row: Int32Array.from(row), shade: Float32Array.from(shade), size };
}

export function mountPlanet(canvas, cfg, seed = 7, { reducedMotion = false } = {}) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssSize = canvas.clientWidth || 160;
  canvas.width = Math.round(cssSize * dpr);
  canvas.height = Math.round(cssSize * dpr);
  const W = canvas.width;

  // Planet body is rendered at a modest resolution, then scaled up smoothly.
  const bodyFrac = cfg.rings ? 0.5 : 0.7;
  const res = Math.min(Math.round(W * bodyFrac), 180);
  const body = document.createElement("canvas");
  body.width = res;
  body.height = res;
  const bctx = body.getContext("2d");
  const img = bctx.createImageData(res, res);
  const tex = buildTexture(cfg, seed);
  const lut = buildLookup(res, cfg.tilt || 0);
  const tau = Math.PI * 2;
  const atm = cfg.hue;

  let rot = Math.random() * tau;
  let speed = cfg.speed || 0.01;
  let boost = 0;
  let visible = false;
  let raf = 0;

  function paintBody() {
    const d = img.data;
    const { idx, lon, row, shade } = lut;
    for (let i = 0; i < idx.length; i++) {
      let u = (lon[i] + rot) / tau;
      u -= Math.floor(u);
      const t = (row[i] * TW + ((u * TW) | 0)) * 3;
      const s = shade[i];
      const o = idx[i] * 4;
      d[o] = tex[t] * s;
      d[o + 1] = tex[t + 1] * s;
      d[o + 2] = tex[t + 2] * s;
      d[o + 3] = 255;
    }
    bctx.putImageData(img, 0, 0);
  }

  function ring(front) {
    const cx = W / 2, cy = W / 2;
    const pr = (W * bodyFrac) / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(cfg.tilt || 0);
    ctx.beginPath();
    if (front) ctx.rect(-W, 0, W * 2, W);
    else ctx.rect(-W, -W, W * 2, W);
    ctx.clip();
    const bands = [
      [1.32, 1.5, 0.34],
      [1.53, 1.78, 0.6],
      [1.82, 1.9, 0.22],
      [1.93, 2.0, 0.38],
    ];
    for (const [a, b, alpha] of bands) {
      ctx.beginPath();
      ctx.ellipse(0, 0, pr * b, pr * b * 0.24, 0, 0, tau);
      ctx.ellipse(0, 0, pr * a, pr * a * 0.24, 0, 0, tau, true);
      ctx.fillStyle = `rgba(${atm[0]}, ${Math.round(atm[1] * 0.92)}, ${Math.round(atm[2] * 0.8)}, ${alpha})`;
      ctx.fill("evenodd");
    }
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, W);
    const pr = (W * bodyFrac) / 2;
    const cx = W / 2, cy = W / 2;
    // Atmospheric glow behind the body.
    const g = ctx.createRadialGradient(cx, cy, pr * 0.9, cx, cy, pr * 1.45);
    g.addColorStop(0, `rgba(${atm[0]}, ${atm[1]}, ${atm[2]}, 0.32)`);
    g.addColorStop(1, `rgba(${atm[0]}, ${atm[1]}, ${atm[2]}, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, W);
    if (cfg.rings) ring(false);
    paintBody();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(body, cx - pr, cy - pr, pr * 2, pr * 2);
    // Thin bright rim on the lit side.
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const rim = ctx.createRadialGradient(cx - pr * 0.3, cy - pr * 0.25, pr * 0.7, cx, cy, pr * 1.02);
    rim.addColorStop(0.85, "rgba(0,0,0,0)");
    rim.addColorStop(1, `rgba(${atm[0]}, ${atm[1]}, ${atm[2]}, 0.35)`);
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(cx, cy, pr * 1.02, 0, tau);
    ctx.fill();
    ctx.restore();
    if (cfg.rings) ring(true);
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    boost += ((visible === "hover" ? 1 : 0) - boost) * Math.min(dt * 4, 1);
    rot += (speed + boost * 0.09) * dt * 6;
    draw();
    if (visible) raf = requestAnimationFrame(loop);
  }

  draw();

  if (!reducedMotion && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const was = visible;
        visible = e.isIntersecting ? (visible === "hover" ? "hover" : true) : false;
        if (visible && !was) { last = performance.now(); raf = requestAnimationFrame(loop); }
        if (!visible) cancelAnimationFrame(raf);
      }
    }, { rootMargin: "80px" });
    io.observe(canvas);
  }

  return {
    hover(on) {
      if (!visible) return;
      visible = on ? "hover" : true;
    },
  };
}
