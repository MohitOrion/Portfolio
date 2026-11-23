// ---------------------------------------------------------------------------
//  The cosmos: a fixed WebGL scene behind the page.
//  A supermassive black hole (analytic lensing shader) sits at the centre of a
//  particle spiral galaxy. The camera pulls back from the event horizon as the
//  visitor scrolls, settling on one framing per section.
// ---------------------------------------------------------------------------
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";

const NOISE_GLSL = /* glsl */ `
  float hash3(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.13));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float vnoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash3(i + vec3(0,0,0)), hash3(i + vec3(1,0,0)), f.x),
          mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x),
          mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < OCTAVES; i++) { v += a * vnoise(p); p = p * 2.03 + vec3(1.7, 9.2, 4.1); a *= 0.5; }
    return v;
  }
`;

// --- Black hole: drawn on a camera-facing quad, in units of the shadow radius.
const BH_FRAG = /* glsl */ `
  #define OCTAVES 4
  uniform float uTime;
  uniform float uIncl;
  uniform float uIntro;
  uniform float uRoll;
  varying vec2 vUv;
  ${NOISE_GLSL}

  vec3 diskColor(float t) {
    vec3 hot  = vec3(1.00, 0.94, 0.84);
    vec3 mid  = vec3(1.00, 0.62, 0.26);
    vec3 cool = vec3(0.78, 0.22, 0.07);
    return mix(mix(hot, mid, smoothstep(0.0, 0.42, t)), cool, smoothstep(0.42, 1.0, t));
  }

  const float RIN = 1.5;
  const float ROUT = 4.7;

  float diskDensity(float r, float phi, float t) {
    if (r < RIN * 0.85 || r > ROUT * 1.05) return 0.0;
    float edge = smoothstep(RIN, RIN + 0.28, r) * (1.0 - smoothstep(ROUT - 1.9, ROUT, r));
    float omega = 1.9 * pow(r, -1.5);            // Keplerian: inner gas laps the outer gas
    float a = phi + t * omega;
    vec3 q = vec3(cos(a) * 1.25, sin(a) * 1.25, r * 2.7);
    float n = fbm(q * 1.35);
    float fine = vnoise(vec3(cos(a) * 5.0, sin(a) * 5.0, r * 11.0));
    float streaks = 0.35 + 1.1 * n * n + 0.25 * fine;
    float fall = pow(RIN / r, 1.35);
    return edge * streaks * fall;
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    vec2 p = uv * 5.6;
    float cr = cos(uRoll), sr = sin(uRoll);
    p = mat2(cr, sr, -sr, cr) * p;

    float d = length(p);
    float theta = atan(p.y, p.x);
    float si = max(sin(uIncl), 0.045);
    float ci = cos(uIncl);
    float t = uTime;

    vec3 col = vec3(0.0);
    float shadow = 1.0 - smoothstep(0.965, 1.02, d);

    // Direct image of the disk: the disk plane projected to an ellipse.
    float dz = p.y / si;
    float rd = length(vec2(p.x, dz));
    float phi = atan(dz, p.x);
    float dens = diskDensity(rd, phi, t);
    float beam = max(1.0 - 0.45 * cos(phi) * ci, 0.2);   // Doppler beaming: approaching side is brighter
    vec3 direct = diskColor(clamp((rd - RIN) / 3.0, 0.0, 1.0)) * dens * beam * beam;
    float farSide = step(0.0, dz);
    col += direct * mix(1.0, 1.0 - shadow, farSide);       // far half hides behind the shadow

    // Lensed image of the far side: bent over the top (and faintly under the bottom).
    float lr = (d - 1.03) / 0.95;
    if (lr > 0.0 && lr < 1.6) {
      float rdL = RIN + lr * 2.4;
      float densL = diskDensity(rdL, -theta + 1.3, t * 1.05);
      float faceOn = smoothstep(0.2, 1.25, uIncl);
      float topArc = smoothstep(-0.3, 0.6, sin(theta));
      float botArc = smoothstep(-0.05, 0.95, -sin(theta)) * 0.42;
      float env = mix(topArc + botArc, 0.55, faceOn);
      float thin = exp(-pow(lr * 1.15, 2.0));
      float beamL = max(1.0 - 0.4 * cos(theta) * ci, 0.2);
      col += diskColor(clamp(lr * 0.75, 0.0, 1.0)) * densL * env * thin * beamL * beamL * 1.9;
    }

    // Photon ring: light that orbited the hole before escaping.
    float ringBeam = max(1.0 - 0.45 * cos(theta) * ci, 0.35);
    float ring = exp(-pow((d - 1.032) / 0.016, 2.0)) * 1.4;
    float ringGlow = exp(-pow((d - 1.06) / 0.13, 2.0)) * 0.28;
    col += vec3(1.0, 0.87, 0.68) * (ring + ringGlow) * ringBeam;

    // Soft halo of scattered light.
    col += vec3(1.0, 0.52, 0.22) * exp(-d * 1.05) * 0.11 * (1.0 - shadow);

    col *= uIntro;
    col = 1.0 - exp(-col * 1.35);

    float e = max(abs(uv.x), abs(uv.y));
    float fade = 1.0 - smoothstep(0.82, 1.0, e);
    col *= fade;
    gl_FragColor = vec4(col, shadow * uIntro * fade);       // premultiplied alpha
  }
`;

const BH_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAG = (octaves) => /* glsl */ `
  #define OCTAVES ${octaves}
  uniform float uTime;
  varying vec3 vDir;
  ${NOISE_GLSL}
  void main() {
    vec3 d = normalize(vDir);
    float n = fbm(d * 2.1 + vec3(0.0, uTime * 0.003, 0.0));
    float n2 = fbm(d * 4.2 + n * 1.6);
    float neb = smoothstep(0.42, 0.86, n2);
    vec3 violet = vec3(0.36, 0.20, 0.62);
    vec3 teal = vec3(0.08, 0.30, 0.46);
    vec3 ember = vec3(0.62, 0.24, 0.12);
    vec3 col = mix(violet, teal, smoothstep(0.32, 0.68, n));
    col = mix(col, ember, smoothstep(0.6, 0.9, fbm(d * 3.0 + 7.0)) * 0.55);
    col *= neb * 0.15;
    col += vec3(0.010, 0.012, 0.026);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const STAR_VERT = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aPhase;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vTw;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float tw = 0.62 + 0.38 * sin(uTime * (0.6 + aPhase * 1.7) + aPhase * 6.2831);
    vTw = tw;
    vColor = aColor;
    gl_PointSize = aSize * uPixelRatio * (0.85 + 0.3 * tw);
  }
`;

const STAR_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vTw;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a = a * a * a;
    gl_FragColor = vec4(vColor * a * vTw, 1.0);
  }
`;

const GALAXY_VERT = /* glsl */ `
  attribute float aRadius;
  attribute float aAngle;
  attribute float aY;
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aRand;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uIntro;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float omega = 0.03 / (1.0 + aRadius * 0.03);
    float ang = aAngle + uTime * omega;
    vec3 pos = vec3(cos(ang) * aRadius, aY, sin(ang) * aRadius);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = max(-mv.z, 0.001);
    float size = aSize * uPixelRatio * (110.0 / dist);
    float maxSize = 4.0 * uPixelRatio;
    vAlpha = smoothstep(2.0, 16.0, dist) * (0.45 + 0.55 * aRand) * uIntro;
    // Near particles spread their light over a bigger, fainter disc instead of becoming confetti.
    if (size > 1.6 * uPixelRatio) vAlpha *= (1.6 * uPixelRatio) / size;
    if (size < 1.0) { vAlpha *= size; size = 1.0; }
    gl_PointSize = min(size, maxSize);
    vColor = aColor;
  }
`;

const GALAXY_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    gl_FragColor = vec4(vColor * a * vAlpha * 1.7, 1.0);
  }
`;

const GLOW_FRAG = /* glsl */ `
  uniform float uOpacity;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float a = exp(-d * d * 5.0) * (1.0 - smoothstep(0.85, 1.0, d));
    gl_FragColor = vec4(uColor * a * uOpacity, 1.0);
  }
`;

// Rough stellar colours by spectral class (O B A F G K M).
const SPECTRAL = [
  { c: [0.61, 0.69, 1.0], w: 0.08 },
  { c: [0.67, 0.75, 1.0], w: 0.14 },
  { c: [0.79, 0.84, 1.0], w: 0.18 },
  { c: [0.97, 0.97, 1.0], w: 0.2 },
  { c: [1.0, 0.96, 0.92], w: 0.18 },
  { c: [1.0, 0.82, 0.63], w: 0.14 },
  { c: [1.0, 0.68, 0.45], w: 0.08 },
];

function pickSpectral() {
  let r = Math.random();
  for (const s of SPECTRAL) { if ((r -= s.w) <= 0) return s.c; }
  return SPECTRAL[3].c;
}

function gauss() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Camera framings, one per section (hero first). pos/tgt in world units.
const FRAMES = [
  { pos: [0, 1.6, 9.5], tgt: [0, 0, 0], roll: -0.08 },
  { pos: [6, 4, 32], tgt: [-6.5, -4.2, 0], roll: -0.03 },
  { pos: [-26, 15, 64], tgt: [-26, -12, -13], roll: 0.03 },
  { pos: [44, 58, 150], tgt: [-47, -12, 19], roll: 0 },
  { pos: [-78, 128, 196], tgt: [-82, 0, -37], roll: 0 },
  { pos: [0, 250, 170], tgt: [-95, -70, 40], roll: 0 },
];

const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + (b - a) * t;

export function initCosmos(canvas, { reducedMotion = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
  } catch (err) {
    return null;
  }
  if (!renderer.getContext()) return null;

  const small = Math.min(window.innerWidth, window.innerHeight) < 700 || (navigator.maxTouchPoints > 0 && window.innerWidth < 1100);
  const pixelRatio = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x04050b, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000);

  // Sky: a faint nebular haze on the inside of a huge sphere.
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(2400, 48, 24),
    new THREE.ShaderMaterial({
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG(small ? 4 : 5),
      uniforms: { uTime: { value: 0 } },
      side: THREE.BackSide,
      depthWrite: false,
    })
  );
  scene.add(sky);

  // Distant stars.
  let stars;
  {
    const count = small ? 3200 : 6500;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const phase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const r = 900 + Math.random() * 1200;
      const s = Math.sqrt(1 - u * u);
      pos.set([Math.cos(th) * s * r, u * r, Math.sin(th) * s * r], i * 3);
      col.set(pickSpectral(), i * 3);
      size[i] = 0.8 + Math.pow(Math.random(), 7) * 3.6;
      phase[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    stars = new THREE.Points(
      g,
      new THREE.ShaderMaterial({
        vertexShader: STAR_VERT,
        fragmentShader: STAR_FRAG,
        uniforms: { uTime: { value: 0 }, uPixelRatio: { value: pixelRatio } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    scene.add(stars);
  }

  // Spiral galaxy, with the black hole at its core.
  const R = 150;
  const galaxyMat = new THREE.ShaderMaterial({
    vertexShader: GALAXY_VERT,
    fragmentShader: GALAXY_FRAG,
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: pixelRatio }, uIntro: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  {
    const count = small ? 42000 : 90000;
    const rad = new Float32Array(count);
    const ang = new Float32Array(count);
    const y = new Float32Array(count);
    const size = new Float32Array(count);
    const col = new Float32Array(count * 3);
    const rnd = new Float32Array(count);
    const core = [1.0, 0.8, 0.58];
    const arm = [0.6, 0.74, 1.0];
    const hii = [1.0, 0.5, 0.7];
    const arms = 4;
    for (let i = 0; i < count; i++) {
      let r, a, h, c, s;
      if (Math.random() < 0.12) {
        r = 7 + Math.pow(Math.random(), 1.7) * 26;
        a = Math.random() * Math.PI * 2;
        h = gauss() * (1.2 + 7.5 * (1 - (r - 7) / 26));
        const k = Math.random() * 0.4;
        c = [core[0], core[1] - k * 0.15, core[2] - k * 0.2];
        s = 1.1 + Math.random() * 1.4;
      } else {
        r = 9 + Math.pow(Math.random(), 0.85) * R;
        r += gauss() * r * 0.04;
        const which = i % arms;
        if (Math.random() < 0.18) {
          // A smooth inter-arm disc so the arms sit on a faint glow.
          a = Math.random() * Math.PI * 2;
        } else {
          const spread = which % 2 === 0 ? 0.07 + 4 / r : 0.12 + 6 / r; // two strong arms, two looser spurs
          a = which * (Math.PI / 2) + Math.log(r / 6) * 2.35 + gauss() * spread;
        }
        h = gauss() * (0.9 + (1 - r / R) * 2.6);
        const t = Math.min(r / (R * 0.75), 1);
        c = [lerp(core[0], arm[0], t), lerp(core[1], arm[1], t), lerp(core[2], arm[2], t)];
        const roll = Math.random();
        if (roll < 0.06 && r > 30) c = hii;
        else if (roll < 0.12) c = [0.95, 0.95, 1.0];
        s = 0.7 + Math.pow(Math.random(), 3) * 2.4;
      }
      rad[i] = Math.max(r, 7);
      ang[i] = a;
      y[i] = h;
      size[i] = s;
      col.set(c, i * 3);
      rnd[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    // position is required by three.js for bounds; real positions are computed in the shader.
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute("aRadius", new THREE.BufferAttribute(rad, 1));
    g.setAttribute("aAngle", new THREE.BufferAttribute(ang, 1));
    g.setAttribute("aY", new THREE.BufferAttribute(y, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aRand", new THREE.BufferAttribute(rnd, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), R * 1.3);
    const galaxy = new THREE.Points(g, galaxyMat);
    galaxy.frustumCulled = false;
    scene.add(galaxy);
  }

  // Bulge glow, visible once the camera has pulled back.
  const glowMat = new THREE.ShaderMaterial({
    vertexShader: BH_VERT,
    fragmentShader: GLOW_FRAG,
    uniforms: { uOpacity: { value: 0 }, uColor: { value: new THREE.Color(1.0, 0.72, 0.45) } },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), glowMat);
  glow.scale.setScalar(70);
  scene.add(glow);

  // The black hole.
  const bhMat = new THREE.ShaderMaterial({
    vertexShader: BH_VERT,
    fragmentShader: BH_FRAG,
    uniforms: { uTime: { value: 0 }, uIncl: { value: 0.12 }, uIntro: { value: 0 }, uRoll: { value: 0 } },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
  });
  const bh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bhMat);
  const SHADOW_RADIUS = 1.0;
  bh.scale.setScalar(5.6 * SHADOW_RADIUS);
  bh.renderOrder = 10;
  glow.renderOrder = 5;
  scene.add(bh);

  // --- State ---------------------------------------------------------------
  let stops = [0, 0.2, 0.4, 0.6, 0.8, 1];
  let progressTarget = 0;
  let progress = 0;
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  let time = reducedMotion ? 24 : 0;
  let intro = reducedMotion ? 1 : 0;
  let dolly = reducedMotion ? 0 : 1;
  let heroScale = 1;
  const frames = FRAMES.map((f) => ({ ...f, pos: [...f.pos], tgt: [...f.tgt] }));
  let raf = 0;
  let running = true;

  const tmpPos = new THREE.Vector3();
  const tmpTgt = new THREE.Vector3();
  const toCam = new THREE.Vector3();

  // Narrow screens push the first two framings back so the disk still fits.
  const frameScale = (j) => (j === 0 ? heroScale : j === 1 ? (heroScale + 1) / 2 : 1);

  function framing(p) {
    // Find the segment between section stops and ease across it.
    let i = 0;
    while (i < stops.length - 2 && p > stops[i + 1]) i++;
    const a = stops[i];
    const b = stops[i + 1];
    const t = smoother(Math.min(Math.max((p - a) / Math.max(b - a, 1e-4), 0), 1));
    const A = frames[Math.min(i, frames.length - 1)];
    const B = frames[Math.min(i + 1, frames.length - 1)];
    const sA = frameScale(i);
    const sB = frameScale(i + 1);
    tmpPos.set(lerp(A.pos[0] * sA, B.pos[0] * sB, t), lerp(A.pos[1] * sA, B.pos[1] * sB, t), lerp(A.pos[2] * sA, B.pos[2] * sB, t));
    tmpTgt.set(lerp(A.tgt[0], B.tgt[0], t), lerp(A.tgt[1], B.tgt[1], t), lerp(A.tgt[2], B.tgt[2], t));
    return lerp(A.roll, B.roll, t);
  }

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // Keep the whole accretion disk in frame on tall, narrow screens.
    heroScale = Math.max(1, 12.6 / camera.aspect / 9.5);
    // Lift the black hole above the hero title (more on tall screens).
    const dist = FRAMES[0].pos[2] * heroScale;
    const visibleH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    frames[0].tgt[1] = -visibleH * (camera.aspect < 1 ? 0.24 : 0.18);
    // On portrait screens the About framing lifts the hole above the star chart.
    frames[1].tgt = camera.aspect < 1 ? [-2, -7.5, 0] : [...FRAMES[1].tgt];
  }

  function update(dt) {
    if (!reducedMotion) {
      time += dt;
      intro = Math.min(intro + dt / 2.6, 1);
      dolly = Math.max(dolly - dt / 3.2, 0);
    }
    const k = reducedMotion ? 1 : 1 - Math.pow(0.0025, dt);
    progress += (progressTarget - progress) * k;
    pointer.sx += (pointer.x - pointer.sx) * (reducedMotion ? 0 : 1 - Math.pow(0.02, dt));
    pointer.sy += (pointer.y - pointer.sy) * (reducedMotion ? 0 : 1 - Math.pow(0.02, dt));

    const roll = framing(progress);
    const dist = tmpPos.length();
    const easedDolly = dolly * dolly * (3 - 2 * dolly);
    tmpPos.multiplyScalar(1 + easedDolly * 0.85);
    const par = 0.05 * dist;
    tmpPos.x += pointer.sx * par;
    tmpPos.y += -pointer.sy * par * 0.6;
    camera.position.copy(tmpPos);
    camera.lookAt(tmpTgt);
    camera.rotateZ(roll);

    // Billboards face the camera.
    bh.quaternion.copy(camera.quaternion);
    glow.quaternion.copy(camera.quaternion);
    toCam.copy(camera.position).normalize();
    bhMat.uniforms.uIncl.value = Math.asin(Math.min(Math.max(toCam.y, -1), 1));
    bhMat.uniforms.uRoll.value = -roll;
    bhMat.uniforms.uTime.value = time;
    bhMat.uniforms.uIntro.value = intro * intro * (3 - 2 * intro);
    galaxyMat.uniforms.uTime.value = time;
    galaxyMat.uniforms.uIntro.value = Math.min(intro * 1.3, 1);
    stars.material.uniforms.uTime.value = time;
    sky.material.uniforms.uTime.value = time;
    glowMat.uniforms.uOpacity.value = THREE.MathUtils.smoothstep(dist, 18, 120) * 0.32 * intro;
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (running) {
      update(dt);
      renderer.render(scene, camera);
    }
    if (!reducedMotion) raf = requestAnimationFrame(frame);
  }

  function renderOnce() {
    if (!reducedMotion) return;
    update(0);
    renderer.render(scene, camera);
  }

  resize();
  window.addEventListener("resize", () => { resize(); renderOnce(); });
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    last = performance.now();
  });
  if (!reducedMotion) {
    window.addEventListener("pointermove", (e) => {
      pointer.x = e.clientX / window.innerWidth - 0.5;
      pointer.y = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });
    raf = requestAnimationFrame(frame);
  } else {
    renderOnce();
  }

  return {
    setStops(next) {
      if (Array.isArray(next) && next.length >= 2) stops = next;
      renderOnce();
    },
    setProgress(p) {
      progressTarget = Math.min(Math.max(p, 0), 1);
      renderOnce();
    },
    destroy() {
      cancelAnimationFrame(raf);
      renderer.dispose();
    },
  };
}
