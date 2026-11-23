// ---------------------------------------------------------------------------
//  The cosmos: a fixed WebGL scene behind the whole page.
//
//  A supermassive black hole sits at the centre of a spiral galaxy. The
//  camera starts next to the event horizon and pulls back as the visitor
//  scrolls, settling on one framing per section (see FRAMES below).
//
//  Performance notes (why the code looks the way it does):
//   • The nebula sky is rendered once into a texture, not every frame.
//   • Frames are capped at 60 per second, so 120/144 Hz screens don't
//     do double the work.
//   • If frames take too long, the canvas resolution is lowered step by step
//     (AdaptiveQuality) until the animation is smooth again.
// ---------------------------------------------------------------------------
import {
  AdditiveBlending, AddEquation, BackSide, BufferAttribute, BufferGeometry, Color, CustomBlending,
  HalfFloatType, LinearFilter, MathUtils, Mesh, OneFactor, OneMinusSrcAlphaFactor,
  OrthographicCamera, PerspectiveCamera, PlaneGeometry, Points, RepeatWrapping, Scene, ShaderMaterial,
  Sphere, SphereGeometry, Vector3, WebGLRenderTarget, WebGLRenderer,
} from "three";
import {
  BLACK_HOLE_FRAG, GALAXY_FRAG, GALAXY_VERT, GLOW_FRAG, QUAD_VERT,
  SKY_BAKE_FRAG, SKY_FRAG, SKY_VERT, STAR_FRAG, STAR_VERT,
} from "./shaders.js";

// One camera framing per page section, in order:
// hero, about, skills, projects, journey, contact.
// pos = where the camera is, tgt = what it looks at, roll = tilt in radians.
// The black hole is at (0, 0, 0) and the galaxy lies flat in the x/z plane.
const FRAMES = [
  { pos: [0, 1.6, 9.5], tgt: [0, 0, 0], roll: -0.08 },          // right at the event horizon
  { pos: [6, 4, 32], tgt: [-6.5, -4.2, 0], roll: -0.03 },       // hole drifts to the top right
  { pos: [-26, 15, 64], tgt: [-26, -12, -13], roll: 0.03 },     // galaxy band comes into view
  { pos: [44, 58, 150], tgt: [-47, -12, 19], roll: 0 },         // looking across the disk
  { pos: [-78, 128, 196], tgt: [-82, 0, -37], roll: 0 },        // rising above it
  { pos: [0, 250, 170], tgt: [-95, -70, 40], roll: 0 },         // the whole spiral
];

const GALAXY_RADIUS = 150;
const SHADOW_RADIUS = 1.0; // size of the black hole's dark disc, in world units
const FRAME_MS = 1000 / 60;

// Approximate star colours by spectral class, with how common each is here.
const SPECTRAL_CLASSES = [
  { name: "O", color: [0.61, 0.69, 1.0], share: 0.08 },
  { name: "B", color: [0.67, 0.75, 1.0], share: 0.14 },
  { name: "A", color: [0.79, 0.84, 1.0], share: 0.18 },
  { name: "F", color: [0.97, 0.97, 1.0], share: 0.2 },
  { name: "G", color: [1.0, 0.96, 0.92], share: 0.18 },
  { name: "K", color: [1.0, 0.82, 0.63], share: 0.14 },
  { name: "M", color: [1.0, 0.68, 0.45], share: 0.08 },
];

// ----- small maths helpers ---------------------------------------------------

const lerp = (a, b, t) => a + (b - a) * t;

/** Ease in and out with zero speed at both ends (Ken Perlin's "smootherstep"). */
const smootherstep = (t) => t * t * t * (t * (t * 6 - 15) + 10);

/** Random number with a bell-curve (normal) distribution, mean 0. */
function gaussian() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function randomStarColor() {
  let roll = Math.random();
  for (const cls of SPECTRAL_CLASSES) {
    roll -= cls.share;
    if (roll <= 0) return cls.color;
  }
  return SPECTRAL_CLASSES[3].color;
}

// ----- scene pieces -------------------------------------------------------------

/** Render the nebula once into a texture and wrap it around a huge sphere. */
function createSky(renderer, small) {
  const width = small ? 1024 : 2048;
  const target = new WebGLRenderTarget(width, width / 2, {
    type: HalfFloatType,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    generateMipmaps: false,
  });
  target.texture.wrapS = RepeatWrapping;

  const bakeScene = new Scene();
  const bakeQuad = new Mesh(
    new PlaneGeometry(2, 2),
    new ShaderMaterial({ vertexShader: QUAD_VERT, fragmentShader: SKY_BAKE_FRAG(small ? 4 : 5), depthTest: false })
  );
  bakeScene.add(bakeQuad);
  renderer.setRenderTarget(target);
  renderer.render(bakeScene, new OrthographicCamera(-1, 1, 1, -1, 0, 1));
  renderer.setRenderTarget(null);
  bakeQuad.geometry.dispose();
  bakeQuad.material.dispose();

  return new Mesh(
    new SphereGeometry(2400, 48, 24),
    new ShaderMaterial({
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      uniforms: { uSky: { value: target.texture } },
      side: BackSide,
      depthWrite: false,
    })
  );
}

/** Thousands of distant stars on a big shell around everything. */
function createStars(count, pixelRatio) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // Uniform random direction on a sphere, at a random far distance.
    const y = Math.random() * 2 - 1;
    const angle = Math.random() * Math.PI * 2;
    const ring = Math.sqrt(1 - y * y);
    const distance = 900 + Math.random() * 1200;
    positions.set([Math.cos(angle) * ring * distance, y * distance, Math.sin(angle) * ring * distance], i * 3);
    colors.set(randomStarColor(), i * 3);
    sizes[i] = 0.8 + Math.pow(Math.random(), 7) * 3.6; // mostly tiny, a few bright
    phases[i] = Math.random();
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aColor", new BufferAttribute(colors, 3));
  geometry.setAttribute("aSize", new BufferAttribute(sizes, 1));
  geometry.setAttribute("aPhase", new BufferAttribute(phases, 1));

  return new Points(
    geometry,
    new ShaderMaterial({
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: pixelRatio } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })
  );
}

/**
 * A four-armed spiral galaxy. Two arms are tight and bright, two are looser
 * spurs, there is a warm central bulge, and a faint disc between the arms.
 */
function createGalaxy(count, pixelRatio) {
  const radius = new Float32Array(count);
  const angle = new Float32Array(count);
  const height = new Float32Array(count);
  const size = new Float32Array(count);
  const color = new Float32Array(count * 3);
  const random = new Float32Array(count);

  const coreColor = [1.0, 0.8, 0.58];
  const armColor = [0.6, 0.74, 1.0];
  const nebulaPink = [1.0, 0.5, 0.7]; // star-forming regions glow pink (hydrogen-alpha)

  for (let i = 0; i < count; i++) {
    let r, a, y, c, s;

    if (Math.random() < 0.12) {
      // Central bulge: old, warm stars in a thick puffy cloud.
      r = 7 + Math.pow(Math.random(), 1.7) * 26;
      a = Math.random() * Math.PI * 2;
      y = gaussian() * (1.2 + 7.5 * (1 - (r - 7) / 26));
      const k = Math.random() * 0.4;
      c = [coreColor[0], coreColor[1] - k * 0.15, coreColor[2] - k * 0.2];
      s = 1.1 + Math.random() * 1.4;
    } else {
      // Disk: young blue stars along logarithmic spiral arms.
      r = 9 + Math.pow(Math.random(), 0.85) * GALAXY_RADIUS;
      r += gaussian() * r * 0.04;
      const arm = i % 4;
      if (Math.random() < 0.18) {
        a = Math.random() * Math.PI * 2; // the faint disc between the arms
      } else {
        const spread = arm % 2 === 0 ? 0.07 + 4 / r : 0.12 + 6 / r;
        a = arm * (Math.PI / 2) + Math.log(r / 6) * 2.35 + gaussian() * spread;
      }
      y = gaussian() * (0.9 + (1 - r / GALAXY_RADIUS) * 2.6);
      const t = Math.min(r / (GALAXY_RADIUS * 0.75), 1);
      c = [lerp(coreColor[0], armColor[0], t), lerp(coreColor[1], armColor[1], t), lerp(coreColor[2], armColor[2], t)];
      const roll = Math.random();
      if (roll < 0.06 && r > 30) c = nebulaPink;
      else if (roll < 0.12) c = [0.95, 0.95, 1.0];
      s = 0.7 + Math.pow(Math.random(), 3) * 2.4;
    }

    radius[i] = Math.max(r, 7); // keep a clear space around the black hole
    angle[i] = a;
    height[i] = y;
    size[i] = s;
    color.set(c, i * 3);
    random[i] = Math.random();
  }

  const geometry = new BufferGeometry();
  // three.js requires a position attribute; real positions are computed in the shader.
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute("aRadius", new BufferAttribute(radius, 1));
  geometry.setAttribute("aAngle", new BufferAttribute(angle, 1));
  geometry.setAttribute("aY", new BufferAttribute(height, 1));
  geometry.setAttribute("aSize", new BufferAttribute(size, 1));
  geometry.setAttribute("aColor", new BufferAttribute(color, 3));
  geometry.setAttribute("aRand", new BufferAttribute(random, 1));
  geometry.boundingSphere = new Sphere(new Vector3(), GALAXY_RADIUS * 1.3);

  const points = new Points(
    geometry,
    new ShaderMaterial({
      vertexShader: GALAXY_VERT,
      fragmentShader: GALAXY_FRAG,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: pixelRatio }, uIntro: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })
  );
  points.frustumCulled = false;
  return points;
}

/** The black hole: a camera-facing square drawn by BLACK_HOLE_FRAG. */
function createBlackHole() {
  const mesh = new Mesh(
    new PlaneGeometry(2, 2),
    new ShaderMaterial({
      vertexShader: QUAD_VERT,
      fragmentShader: BLACK_HOLE_FRAG,
      uniforms: { uTime: { value: 0 }, uIncl: { value: 0.12 }, uIntro: { value: 0 }, uRoll: { value: 0 } },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      // Premultiplied alpha: result = shaderColor + background * (1 - shaderAlpha)
      blending: CustomBlending,
      blendEquation: AddEquation,
      blendSrc: OneFactor,
      blendDst: OneMinusSrcAlphaFactor,
    })
  );
  mesh.scale.setScalar(5.6 * SHADOW_RADIUS);
  mesh.renderOrder = 10; // draw after the galaxy
  return mesh;
}

/** A soft warm glow over the galaxy's core. */
function createBulgeGlow() {
  const mesh = new Mesh(
    new PlaneGeometry(2, 2),
    new ShaderMaterial({
      vertexShader: QUAD_VERT,
      fragmentShader: GLOW_FRAG,
      uniforms: { uOpacity: { value: 0 }, uColor: { value: new Color(1.0, 0.72, 0.45) } },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
    })
  );
  mesh.scale.setScalar(70);
  mesh.renderOrder = 5;
  return mesh;
}

// ----- adaptive quality ------------------------------------------------------------

/**
 * Watches how long frames take. If the average stays above ~40 ms (under
 * ~25 fps) or ~24 ms (under ~42 fps) for a while, it lowers the canvas
 * resolution by 15%, down to a floor. It never raises it again, so the
 * picture doesn't flicker between sharp and soft.
 */
function createAdaptiveQuality({ start, floor, onChange }) {
  let ratio = start;
  let average = FRAME_MS;
  let slowFor = 0;
  let warmup = 2.5; // seconds to ignore while shaders compile

  return {
    get ratio() { return ratio; },
    sample(frameMs, dt) {
      if (warmup > 0) { warmup -= dt; return; }
      average = lerp(average, frameMs, 0.08);
      slowFor = average > 24 ? slowFor + dt : 0;
      const limit = average > 40 ? 0.6 : 1.5; // react faster when it's very slow
      if (slowFor > limit && ratio > floor) {
        ratio = Math.max(floor, +(ratio * 0.85).toFixed(2));
        slowFor = 0;
        average = FRAME_MS;
        onChange(ratio);
      }
    },
  };
}

// ----- main entry ---------------------------------------------------------------

/**
 * Start the scene on a <canvas>. Returns null if WebGL isn't available.
 * The returned object lets the page tell the scene where the visitor is:
 *   setStops([...])  scroll progress (0..1) at which each section starts
 *   setProgress(p)   current scroll progress (0..1)
 */
export function initCosmos(canvas, { reducedMotion = false } = {}) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  if (!renderer.getContext()) return null;

  const small = Math.min(window.innerWidth, window.innerHeight) < 700 || (navigator.maxTouchPoints > 0 && window.innerWidth < 1100);
  const startRatio = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(startRatio);
  renderer.setClearColor(0x04050b, 1);

  const scene = new Scene();
  const camera = new PerspectiveCamera(45, 1, 0.1, 5000);

  const sky = createSky(renderer, small);
  const stars = createStars(small ? 3200 : 6000, startRatio);
  const galaxy = createGalaxy(small ? 42000 : 70000, startRatio);
  const glow = createBulgeGlow();
  const blackHole = createBlackHole();
  scene.add(sky, stars, galaxy, glow, blackHole);

  const quality = createAdaptiveQuality({
    start: startRatio,
    floor: 0.6,
    onChange(ratio) {
      renderer.setPixelRatio(ratio);
      stars.material.uniforms.uPixelRatio.value = ratio;
      galaxy.material.uniforms.uPixelRatio.value = ratio;
    },
  });

  // ----- state -----
  const frames = FRAMES.map((f) => ({ ...f, pos: [...f.pos], tgt: [...f.tgt] }));
  let stops = [0, 0.2, 0.4, 0.6, 0.8, 1];
  let progressTarget = 0; // where the scroll is
  let progress = 0;       // where the camera is (eases towards the target)
  const pointer = { x: 0, y: 0, smoothX: 0, smoothY: 0 };
  let time = reducedMotion ? 24 : 0;
  let intro = reducedMotion ? 1 : 0; // fade-in on load, 0 → 1
  let dolly = reducedMotion ? 0 : 1; // camera glides in on load, 1 → 0
  let heroScale = 1;

  const camPos = new Vector3();
  const camTarget = new Vector3();
  const toCamera = new Vector3();

  // Narrow screens push the first two framings back so the whole disk still fits.
  const frameScale = (index) => (index === 0 ? heroScale : index === 1 ? (heroScale + 1) / 2 : 1);

  /** Set camPos/camTarget for scroll progress p, easing between section framings. */
  function placeCamera(p) {
    let i = 0;
    while (i < stops.length - 2 && p > stops[i + 1]) i++;
    const t = smootherstep(MathUtils.clamp((p - stops[i]) / Math.max(stops[i + 1] - stops[i], 1e-4), 0, 1));
    const a = frames[i];
    const b = frames[Math.min(i + 1, frames.length - 1)];
    const sa = frameScale(i);
    const sb = frameScale(i + 1);
    camPos.set(lerp(a.pos[0] * sa, b.pos[0] * sb, t), lerp(a.pos[1] * sa, b.pos[1] * sb, t), lerp(a.pos[2] * sa, b.pos[2] * sb, t));
    camTarget.set(lerp(a.tgt[0], b.tgt[0], t), lerp(a.tgt[1], b.tgt[1], t), lerp(a.tgt[2], b.tgt[2], t));
    return lerp(a.roll, b.roll, t);
  }

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    heroScale = Math.max(1, 12.6 / camera.aspect / 9.5);
    // Lift the black hole above the hero title (more on tall phone screens).
    const distance = FRAMES[0].pos[2] * heroScale;
    const visibleHeight = 2 * distance * Math.tan(MathUtils.degToRad(camera.fov / 2));
    frames[0].tgt[1] = -visibleHeight * (camera.aspect < 1 ? 0.24 : 0.18);
    // On portrait screens the About framing moves the hole into the empty
    // top-right corner, above the heading and star chart.
    frames[1].tgt = camera.aspect < 1 ? [-7.75, -20.25, 0] : [...FRAMES[1].tgt];
  }

  function update(dt) {
    if (!reducedMotion) {
      time += dt;
      intro = Math.min(intro + dt / 2.6, 1);
      dolly = Math.max(dolly - dt / 3.2, 0);
    }
    // Frame-rate independent easing towards the scroll position and pointer.
    const follow = reducedMotion ? 1 : 1 - Math.pow(0.0025, dt);
    const drift = reducedMotion ? 0 : 1 - Math.pow(0.02, dt);
    progress += (progressTarget - progress) * follow;
    pointer.smoothX += (pointer.x - pointer.smoothX) * drift;
    pointer.smoothY += (pointer.y - pointer.smoothY) * drift;

    const roll = placeCamera(progress);
    const distance = camPos.length();
    const glide = dolly * dolly * (3 - 2 * dolly);
    camPos.multiplyScalar(1 + glide * 0.85);
    camPos.x += pointer.smoothX * distance * 0.05;          // gentle mouse parallax
    camPos.y -= pointer.smoothY * distance * 0.03;
    camera.position.copy(camPos);
    camera.lookAt(camTarget);
    camera.rotateZ(roll);

    // Flat pieces always face the camera.
    blackHole.quaternion.copy(camera.quaternion);
    glow.quaternion.copy(camera.quaternion);

    // The disk looks more face-on as the camera rises above it.
    toCamera.copy(camera.position).normalize();
    const bh = blackHole.material.uniforms;
    bh.uIncl.value = Math.asin(MathUtils.clamp(toCamera.y, -1, 1));
    bh.uRoll.value = -roll;
    bh.uTime.value = time;
    bh.uIntro.value = intro * intro * (3 - 2 * intro);

    galaxy.material.uniforms.uTime.value = time;
    galaxy.material.uniforms.uIntro.value = Math.min(intro * 1.3, 1);
    stars.material.uniforms.uTime.value = time;
    glow.material.uniforms.uOpacity.value = MathUtils.smoothstep(distance, 18, 120) * 0.32 * intro;
  }

  // ----- render loop -----
  let raf = 0;
  let lastFrame = performance.now();
  let paused = false;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const elapsed = now - lastFrame;
    if (elapsed < FRAME_MS - 2) return; // cap at ~60 fps on high-refresh screens
    lastFrame = now;
    if (paused) return;
    const dt = Math.min(elapsed / 1000, 0.05);
    update(dt);
    renderer.render(scene, camera);
    quality.sample(elapsed, dt);
  }

  /** With reduced motion there's no loop: draw once whenever something changes. */
  function drawStill() {
    if (!reducedMotion) return;
    update(0);
    renderer.render(scene, camera);
  }

  resize();
  window.addEventListener("resize", () => { resize(); drawStill(); });
  document.addEventListener("visibilitychange", () => {
    paused = document.hidden;
    lastFrame = performance.now();
  });

  if (reducedMotion) {
    drawStill();
  } else {
    window.addEventListener("pointermove", (e) => {
      pointer.x = e.clientX / window.innerWidth - 0.5;
      pointer.y = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });
    raf = requestAnimationFrame(frame);
  }

  return {
    setStops(next) {
      if (Array.isArray(next) && next.length >= 2) stops = next;
      drawStill();
    },
    setProgress(p) {
      progressTarget = MathUtils.clamp(p, 0, 1);
      drawStill();
    },
    destroy() {
      cancelAnimationFrame(raf);
      renderer.dispose();
    },
  };
}
