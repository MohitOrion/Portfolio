// ---------------------------------------------------------------------------
//  Procedural planets for the project cards, drawn on 2D canvases.
//
//  How it works:
//   1. buildTexture() paints a flat "world map" of the planet surface once.
//   2. buildLookup() works out, once, which spot on that map each pixel of
//      the round planet shows, and how brightly it is lit.
//   3. Every frame, paintBody() shifts the map sideways by the rotation angle
//      and copies the colours in. That's what makes the planet turn.
// ---------------------------------------------------------------------------
import { throttledLoop, whenVisible } from "../lib/motion.js";

const TEX_W = 256; // surface map size: longitude across...
const TEX_H = 128; // ...latitude down
const TAU = Math.PI * 2;

/** Seeded 3D value noise + fbm, so each planet always looks the same. */
function makeNoise(seed) {
  let state = seed >>> 0 || 1;
  const random = () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296);

  const perm = new Uint8Array(512);
  const order = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = order[i & 255];
  const values = new Float32Array(256).map(() => random());

  const smooth = (t) => t * t * (3 - 2 * t);
  const mix = (a, b, t) => a + (b - a) * t;
  const corner = (x, y, z) => values[perm[(perm[(perm[x & 255] + y) & 255] + z) & 255]];

  function noise(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const u = smooth(x - xi), v = smooth(y - yi), w = smooth(z - zi);
    return mix(
      mix(mix(corner(xi, yi, zi), corner(xi + 1, yi, zi), u), mix(corner(xi, yi + 1, zi), corner(xi + 1, yi + 1, zi), u), v),
      mix(mix(corner(xi, yi, zi + 1), corner(xi + 1, yi, zi + 1), u), mix(corner(xi, yi + 1, zi + 1), corner(xi + 1, yi + 1, zi + 1), u), v),
      w
    );
  }

  return function fbm(x, y, z, octaves = 4) {
    let value = 0, amplitude = 0.5, frequency = 1;
    for (let i = 0; i < octaves; i++) {
      value += amplitude * noise(x * frequency, y * frequency, z * frequency);
      frequency *= 2.02;
      amplitude *= 0.5;
    }
    return value;
  };
}

/**
 * Returns a value 0..1 (sometimes a bit above 1 for highlights) describing the
 * surface at one point on the sphere (px, py, pz). Each planet type has its own recipe.
 */
function surfaceValue(cfg, fbm, px, py, pz) {
  if (cfg.rocky) {
    const terrain = fbm(px * 2.4 + 3, py * 2.4, pz * 2.4, 5);
    const craterRim = Math.abs(fbm(px * 6, py * 6 + 4, pz * 6, 3) - 0.5) < 0.03 ? 0.25 : 0;
    return (terrain - 0.25) * 1.9 + craterRim;
  }
  if (cfg.lava) {
    const crust = fbm(px * 2.2, py * 2.2, pz * 2.2 + 5, 5);
    return 1 - Math.min(Math.abs(crust - 0.5) * 14, 1); // bright thin cracks
  }
  const warp = fbm(px * 1.8, py * 1.8, pz * 1.8, 4);
  if (cfg.ocean) {
    const cloud = fbm(px * 3 + 11, py * 5, pz * 3, 5);
    return 0.15 + warp * 0.35 + (cloud > 0.56 ? (cloud - 0.56) * 4 : 0);
  }
  // Gas or ice giant: wavy horizontal bands plus storms.
  const band = Math.sin((py + warp * 0.35) * cfg.bands * Math.PI) * 0.5 + 0.5;
  const storms = fbm(px * 4 + 7, py * 7, pz * 4, 3);
  return band * 0.75 + storms * 0.35;
}

/** Paint the flat surface map (RGB bytes) for one planet. */
function buildTexture(cfg, seed) {
  const fbm = makeNoise(seed);
  const texture = new Uint8ClampedArray(TEX_W * TEX_H * 3);
  const [r1, g1, b1] = cfg.hue;   // bright colour
  const [r2, g2, b2] = cfg.hue2;  // dark colour

  for (let y = 0; y < TEX_H; y++) {
    const lat = (y / (TEX_H - 1) - 0.5) * Math.PI;
    for (let x = 0; x < TEX_W; x++) {
      const lon = (x / TEX_W) * TAU;
      // Sample noise on the sphere itself so the map wraps around seamlessly.
      const px = Math.cos(lat) * Math.cos(lon);
      const py = Math.sin(lat);
      const pz = Math.cos(lat) * Math.sin(lon);
      const t = Math.min(Math.max(surfaceValue(cfg, fbm, px, py, pz), 0), 1.4);

      const i = (y * TEX_W + x) * 3;
      if (cfg.lava) {
        const glow = t ** 3;
        texture[i] = r2 + (r1 - r2) * glow + 40 * glow;
        texture[i + 1] = g2 + (g1 - g2) * glow;
        texture[i + 2] = b2 + (b1 - b2) * glow * 0.6;
      } else if (t > 1) {
        const white = (t - 1) * 2; // clouds and ice caps
        texture[i] = r1 + (255 - r1) * white;
        texture[i + 1] = g1 + (255 - g1) * white;
        texture[i + 2] = b1 + (255 - b1) * white;
      } else {
        texture[i] = r2 + (r1 - r2) * t;
        texture[i + 1] = g2 + (g1 - g2) * t;
        texture[i + 2] = b2 + (b1 - b2) * t;
      }
    }
  }
  return texture;
}

/** For each pixel inside the disc: which map spot it shows, and its lighting. */
function buildLookup(size, tilt) {
  const pixel = [], longitude = [], row = [], light = [];
  const sun = normalize([-0.62, -0.42, 0.66]); // light from the upper left, towards the viewer
  const cosTilt = Math.cos(tilt), sinTilt = Math.sin(tilt);

  for (let k = 0; k < size * size; k++) {
    const px = ((k % size) + 0.5) / size * 2 - 1;
    const py = (Math.floor(k / size) + 0.5) / size * 2 - 1;
    const r2 = px * px + py * py;
    if (r2 > 1) continue; // outside the planet

    const pz = Math.sqrt(1 - r2); // how much this point faces us
    const tx = px * cosTilt - py * sinTilt; // apply axial tilt
    const ty = px * sinTilt + py * cosTilt;
    const lat = Math.asin(Math.max(-1, Math.min(1, ty)));

    const diffuse = Math.max(px * sun[0] + py * sun[1] + pz * sun[2], 0);
    const limbDarkening = pz ** 0.35;
    const antialias = 1 - Math.min(Math.max((Math.sqrt(r2) - 0.985) / 0.015, 0), 1);

    pixel.push(k);
    longitude.push(Math.atan2(tx, pz));
    row.push(Math.round((lat / Math.PI + 0.5) * (TEX_H - 1)));
    light.push((0.05 + diffuse * 1.05) * limbDarkening * antialias);
  }
  return {
    pixel: Int32Array.from(pixel),
    longitude: Float32Array.from(longitude),
    row: Int32Array.from(row),
    light: Float32Array.from(light),
  };
}

function normalize(v) {
  const length = Math.hypot(...v);
  return v.map((x) => x / length);
}

/**
 * Draw a rotating planet on `canvas`.
 * cfg comes from PROJECTS[].planet in data.js. Returns { hover(on) }.
 */
export function mountPlanet(canvas, cfg, seed = 7, { reducedMotion = false } = {}) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = Math.round((canvas.clientWidth || 160) * dpr);
  canvas.width = W;
  canvas.height = W;

  // The planet body is rendered small, then scaled up smoothly.
  const bodyShare = cfg.rings ? 0.5 : 0.7; // ringed planets leave room for the rings
  const radius = (W * bodyShare) / 2;
  const centre = W / 2;
  const res = Math.min(Math.round(W * bodyShare), 180);
  const body = document.createElement("canvas");
  body.width = res;
  body.height = res;
  const bodyCtx = body.getContext("2d");
  const image = bodyCtx.createImageData(res, res);

  const texture = buildTexture(cfg, seed);
  const lookup = buildLookup(res, cfg.tilt || 0);
  const [ar, ag, ab] = cfg.hue; // atmosphere tint

  let rotation = Math.random() * TAU;
  let hoverBoost = 0;
  let hovering = false;

  function paintBody() {
    const data = image.data;
    const { pixel, longitude, row, light } = lookup;
    for (let i = 0; i < pixel.length; i++) {
      let u = (longitude[i] + rotation) / TAU;
      u -= Math.floor(u);
      const t = (row[i] * TEX_W + ((u * TEX_W) | 0)) * 3;
      const o = pixel[i] * 4;
      data[o] = texture[t] * light[i];
      data[o + 1] = texture[t + 1] * light[i];
      data[o + 2] = texture[t + 2] * light[i];
      data[o + 3] = 255;
    }
    bodyCtx.putImageData(image, 0, 0);
  }

  /** Draw the back half (front=false) or front half (front=true) of the rings. */
  function drawRings(front) {
    ctx.save();
    ctx.translate(centre, centre);
    ctx.rotate(cfg.tilt || 0);
    ctx.beginPath();
    ctx.rect(-W, front ? 0 : -W, W * 2, W); // clip to the lower or upper half
    ctx.clip();
    const bands = [
      // [inner, outer, opacity] as multiples of the planet radius
      [1.32, 1.5, 0.34],
      [1.53, 1.78, 0.6],
      [1.82, 1.9, 0.22],
      [1.93, 2.0, 0.38],
    ];
    for (const [inner, outer, alpha] of bands) {
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * outer, radius * outer * 0.24, 0, 0, TAU);
      ctx.ellipse(0, 0, radius * inner, radius * inner * 0.24, 0, 0, TAU, true);
      ctx.fillStyle = `rgba(${ar}, ${Math.round(ag * 0.92)}, ${Math.round(ab * 0.8)}, ${alpha})`;
      ctx.fill("evenodd");
    }
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, W);

    // Atmosphere glow behind the planet.
    const halo = ctx.createRadialGradient(centre, centre, radius * 0.9, centre, centre, radius * 1.45);
    halo.addColorStop(0, `rgba(${ar}, ${ag}, ${ab}, 0.32)`);
    halo.addColorStop(1, `rgba(${ar}, ${ag}, ${ab}, 0)`);
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, W);

    if (cfg.rings) drawRings(false);

    paintBody();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(body, centre - radius, centre - radius, radius * 2, radius * 2);

    // Thin bright rim on the lit edge.
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const rim = ctx.createRadialGradient(centre - radius * 0.3, centre - radius * 0.25, radius * 0.7, centre, centre, radius * 1.02);
    rim.addColorStop(0.85, "rgba(0,0,0,0)");
    rim.addColorStop(1, `rgba(${ar}, ${ag}, ${ab}, 0.35)`);
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(centre, centre, radius * 1.02, 0, TAU);
    ctx.fill();
    ctx.restore();

    if (cfg.rings) drawRings(true);
  }

  draw();

  if (!reducedMotion) {
    const loop = throttledLoop((dt) => {
      hoverBoost += ((hovering ? 1 : 0) - hoverBoost) * Math.min(dt * 4, 1);
      rotation += ((cfg.speed || 0.01) + hoverBoost * 0.09) * dt * 6; // spins faster on hover
      draw();
    }, 30);
    whenVisible(canvas, (visible) => (visible ? loop.start() : loop.stop()));
  }

  return {
    hover(on) { hovering = on; },
  };
}
