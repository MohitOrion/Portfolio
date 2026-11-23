// ---------------------------------------------------------------------------
//  GLSL shader programs for the WebGL sky.
//
//  A shader is a tiny program that runs on the graphics card. A "vertex"
//  shader places each point or corner on screen; a "fragment" shader decides
//  the colour of each pixel. These are plain strings that three.js compiles.
// ---------------------------------------------------------------------------

// Value noise + fractal Brownian motion (fbm): smooth random "clouds".
// fbm adds several layers ("octaves") of noise, each finer and fainter.
// The including shader must #define OCTAVES before this block.
const NOISE = /* glsl */ `
  float hash3(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.13));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float valueNoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);                  // smooth the interpolation
    return mix(
      mix(mix(hash3(i + vec3(0,0,0)), hash3(i + vec3(1,0,0)), f.x),
          mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x),
          mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z);
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < OCTAVES; i++) {
      value += amplitude * valueNoise(p);
      p = p * 2.03 + vec3(1.7, 9.2, 4.1);
      amplitude *= 0.5;
    }
    return value;
  }
`;

// Shared vertex shader for flat quads (black hole, glow, sky bake).
export const QUAD_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// ---------------------------------------------------------------------------
//  Black hole
//
//  Drawn on a square that always faces the camera. Everything is measured in
//  units of the shadow radius (the dark disc = radius 1). The look is built
//  from four layers, each a simplified version of real physics:
//
//   1. Shadow        light that falls in never comes back: a black disc.
//   2. Direct disk   the glowing accretion disk, squashed into an ellipse
//                    by the viewing angle (uIncl). Its far half hides behind
//                    the shadow; its near half passes in front.
//   3. Lensed arc    gravity bends light from the far side of the disk up
//                    and over the top of the shadow (and faintly under it).
//   4. Photon ring   a thin bright ring of light that orbited the hole once.
//
//  Doppler beaming: gas moving towards us looks brighter, so the left side of
//  the disk (moving towards the camera) is brighter than the right.
// ---------------------------------------------------------------------------
export const BLACK_HOLE_FRAG = /* glsl */ `
  #define OCTAVES 3
  uniform float uTime;    // seconds, drives the swirl
  uniform float uIncl;    // viewing angle above the disk plane (radians)
  uniform float uIntro;   // 0 → 1 fade-in when the page loads
  uniform float uRoll;    // tilt, to match the camera's roll
  varying vec2 vUv;
  ${NOISE}

  const float INNER = 1.5;   // inner edge of the disk
  const float OUTER = 4.7;   // outer edge of the disk

  // Hot gas is white-yellow near the hole and cools to deep orange outside.
  vec3 diskColor(float t) {
    vec3 hot  = vec3(1.00, 0.94, 0.84);
    vec3 warm = vec3(1.00, 0.62, 0.26);
    vec3 cool = vec3(0.78, 0.22, 0.07);
    return mix(mix(hot, warm, smoothstep(0.0, 0.42, t)), cool, smoothstep(0.42, 1.0, t));
  }

  // Brightness of the disk at radius r and angle phi.
  float diskDensity(float r, float phi) {
    if (r < INNER * 0.85 || r > OUTER * 1.05) return 0.0;
    float edges = smoothstep(INNER, INNER + 0.28, r) * (1.0 - smoothstep(OUTER - 1.9, OUTER, r));
    // Kepler's law: inner gas orbits faster than outer gas, which shears
    // the noise into streaks.
    float angle = phi + uTime * 1.9 * pow(r, -1.5);
    vec3 q = vec3(cos(angle) * 1.25, sin(angle) * 1.25, r * 2.7);
    float clouds = fbm(q * 1.35);
    float detail = valueNoise(vec3(cos(angle) * 5.0, sin(angle) * 5.0, r * 11.0));
    float streaks = 0.35 + 1.1 * clouds * clouds + 0.25 * detail;
    float falloff = pow(INNER / r, 1.35);
    return edges * streaks * falloff;
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;               // -1..1 across the square
    vec2 p = uv * 5.6;                        // in shadow radii
    float cr = cos(uRoll), sr = sin(uRoll);
    p = mat2(cr, sr, -sr, cr) * p;

    float d = length(p);                      // distance from the centre
    float theta = atan(p.y, p.x);             // angle around the centre
    float sinIncl = max(sin(uIncl), 0.045);
    float cosIncl = cos(uIncl);

    vec3 color = vec3(0.0);
    float shadow = 1.0 - smoothstep(0.965, 1.02, d);

    // 2. Direct image of the disk. Undo the squash to find the disk radius.
    float dz = p.y / sinIncl;
    float diskR = length(vec2(p.x, dz));
    float phi = atan(dz, p.x);
    bool hiddenBehindShadow = dz > 0.0 && shadow > 0.99;
    if (!hiddenBehindShadow) {
      float density = diskDensity(diskR, phi);
      float beam = max(1.0 - 0.45 * cos(phi) * cosIncl, 0.2);
      vec3 direct = diskColor(clamp((diskR - INNER) / 3.0, 0.0, 1.0)) * density * beam * beam;
      float farSide = step(0.0, dz);
      color += direct * mix(1.0, 1.0 - shadow, farSide);
    }

    // 3. Lensed arc: map distance from the shadow edge onto the far disk.
    float lr = (d - 1.03) / 0.95;
    if (lr > 0.0 && lr < 1.6) {
      float density = diskDensity(INNER + lr * 2.4, -theta + 1.3);
      float faceOn = smoothstep(0.2, 1.25, uIncl);           // seen from above, the arc becomes a ring
      float topArc = smoothstep(-0.3, 0.6, sin(theta));
      float bottomArc = smoothstep(-0.05, 0.95, -sin(theta)) * 0.42;
      float shape = mix(topArc + bottomArc, 0.55, faceOn);
      float thinness = exp(-pow(lr * 1.15, 2.0));
      float beam = max(1.0 - 0.4 * cos(theta) * cosIncl, 0.2);
      color += diskColor(clamp(lr * 0.75, 0.0, 1.0)) * density * shape * thinness * beam * beam * 1.9;
    }

    // 4. Photon ring and its soft glow.
    float ringBeam = max(1.0 - 0.45 * cos(theta) * cosIncl, 0.35);
    float ring = exp(-pow((d - 1.032) / 0.016, 2.0)) * 1.4;
    float ringGlow = exp(-pow((d - 1.06) / 0.13, 2.0)) * 0.28;
    color += vec3(1.0, 0.87, 0.68) * (ring + ringGlow) * ringBeam;

    // Faint halo of scattered light around everything.
    color += vec3(1.0, 0.52, 0.22) * exp(-d * 1.05) * 0.11 * (1.0 - shadow);

    color *= uIntro;
    color = 1.0 - exp(-color * 1.35);         // soft tone mapping, avoids harsh clipping

    // Fade out towards the edges of the square so it never shows a border.
    float edge = max(abs(uv.x), abs(uv.y));
    float fade = 1.0 - smoothstep(0.82, 1.0, edge);
    color *= fade;

    // Premultiplied alpha: the shadow (alpha 1) blocks what's behind it,
    // the glow (alpha 0) adds light on top of it.
    gl_FragColor = vec4(color, shadow * uIntro * fade);
  }
`;

// ---------------------------------------------------------------------------
//  Sky: a faint nebula painted on the inside of a huge sphere.
//  The noise is expensive, so it is rendered ONCE into a texture at start-up
//  (SKY_BAKE_FRAG) and the sphere just looks the colour up every frame.
// ---------------------------------------------------------------------------

// Bake pass: each pixel of a 2:1 texture is a direction in the sky
// (longitude across, latitude up), like a world map.
export const SKY_BAKE_FRAG = (octaves) => /* glsl */ `
  #define OCTAVES ${octaves}
  varying vec2 vUv;
  ${NOISE}
  void main() {
    float lon = (vUv.x - 0.5) * 6.2831853;
    float lat = (vUv.y - 0.5) * 3.1415926;
    vec3 dir = vec3(cos(lat) * cos(lon), sin(lat), cos(lat) * sin(lon));

    float n = fbm(dir * 2.1);
    float n2 = fbm(dir * 4.2 + n * 1.6);
    float nebula = smoothstep(0.42, 0.86, n2);

    vec3 violet = vec3(0.36, 0.20, 0.62);
    vec3 teal = vec3(0.08, 0.30, 0.46);
    vec3 ember = vec3(0.62, 0.24, 0.12);
    vec3 color = mix(violet, teal, smoothstep(0.32, 0.68, n));
    color = mix(color, ember, smoothstep(0.6, 0.9, fbm(dir * 3.0 + 7.0)) * 0.55);
    color *= nebula * 0.15;
    color += vec3(0.010, 0.012, 0.026);       // the darkest the sky ever gets
    gl_FragColor = vec4(color, 1.0);
  }
`;

export const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Display pass: turn the view direction back into map coordinates.
export const SKY_FRAG = /* glsl */ `
  uniform sampler2D uSky;
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir);
    vec2 uv = vec2(atan(d.z, d.x) / 6.2831853 + 0.5, asin(clamp(d.y, -1.0, 1.0)) / 3.1415926 + 0.5);
    vec3 color = texture2D(uSky, uv).rgb;
    // A touch of noise ("dithering") hides colour banding in the dark gradients.
    float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    color += (grain - 0.5) / 255.0;
    gl_FragColor = vec4(color, 1.0);
  }
`;

// ---------------------------------------------------------------------------
//  Distant stars: points that twinkle, coloured by spectral class.
// ---------------------------------------------------------------------------
export const STAR_VERT = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aPhase;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    float twinkle = 0.62 + 0.38 * sin(uTime * (0.6 + aPhase * 1.7) + aPhase * 6.2831);
    vTwinkle = twinkle;
    vColor = aColor;
    gl_PointSize = aSize * uPixelRatio * (0.85 + 0.3 * twinkle);
  }
`;

export const STAR_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    float d = length(gl_PointCoord - 0.5);    // distance from the point's centre
    float a = smoothstep(0.5, 0.0, d);
    a = a * a * a;                            // sharp core, soft edge
    gl_FragColor = vec4(vColor * a * vTwinkle, 1.0);
  }
`;

// ---------------------------------------------------------------------------
//  Galaxy: each particle stores its orbit (radius, angle, height) and the
//  shader moves it around the centre. Inner stars orbit faster.
// ---------------------------------------------------------------------------
export const GALAXY_VERT = /* glsl */ `
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
    float speed = 0.03 / (1.0 + aRadius * 0.03);
    float angle = aAngle + uTime * speed;
    vec3 pos = vec3(cos(angle) * aRadius, aY, sin(angle) * aRadius);
    vec4 viewPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * viewPos;

    float dist = max(-viewPos.z, 0.001);
    float size = aSize * uPixelRatio * (110.0 / dist);   // further away = smaller
    vAlpha = smoothstep(2.0, 16.0, dist) * (0.45 + 0.55 * aRand) * uIntro;
    // Close particles spread their light over a bigger, fainter disc
    // (like out-of-focus bokeh) instead of turning into confetti.
    if (size > 1.6 * uPixelRatio) vAlpha *= (1.6 * uPixelRatio) / size;
    // Particles smaller than a pixel fade out instead of flickering.
    if (size < 1.0) { vAlpha *= size; size = 1.0; }
    gl_PointSize = min(size, 4.0 * uPixelRatio);
    vColor = aColor;
  }
`;

export const GALAXY_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    gl_FragColor = vec4(vColor * a * vAlpha * 1.7, 1.0);
  }
`;

// Soft glow of the galaxy's central bulge, seen once the camera pulls back.
export const GLOW_FRAG = /* glsl */ `
  uniform float uOpacity;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float a = exp(-d * d * 5.0) * (1.0 - smoothstep(0.85, 1.0, d));
    gl_FragColor = vec4(uColor * a * uOpacity, 1.0);
  }
`;
