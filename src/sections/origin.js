// ---------------------------------------------------------------------------
//  About ("Origin"): the Orion constellation chart and the fact list beside it.
//  Hovering a star highlights its fact, and the other way round.
// ---------------------------------------------------------------------------
import { $, $$, h, svg } from "../lib/dom.js";
import { animate, gsap } from "../lib/motion.js";
import { ORION, ORION_LINES } from "../data.js";

// Chart area in sky degrees (x = east/west offset, y = declination offset).
const SCALE = 30; // SVG units per degree
const X_MIN = -6.8, X_MAX = 6.8, Y_MIN = -11.4, Y_MAX = 11.6;
const toX = (x) => (x - X_MIN) * SCALE;
const toY = (y) => (Y_MAX - y) * SCALE; // SVG y grows downwards

// Stars whose label goes on the left so it doesn't run off the chart or overlap.
const LABEL_ON_LEFT = new Set(["rigel", "alnitak"]);

export function renderOrigin() {
  const chart = $("#orionChart");
  const table = $("#starTable");
  const width = (X_MAX - X_MIN) * SCALE;
  const height = (Y_MAX - Y_MIN) * SCALE;
  chart.setAttribute("viewBox", `0 0 ${width} ${height}`);

  chart.append(createGradients());
  chart.append(createGraticule(width, height));
  const lines = createConstellationLines();
  chart.append(svg("g", {}, lines));

  const starEls = {};
  const rowEls = {};
  for (const star of ORION) {
    starEls[star.id] = createStar(star);
    chart.append(starEls[star.id]);
    rowEls[star.id] = createFactRow(star);
    table.append(rowEls[star.id]);
  }

  // ----- linked highlighting -----
  let active = null;
  const highlight = (id) => {
    if (active === id) return;
    active = id;
    for (const [key, el] of Object.entries(starEls)) el.classList.toggle("active", key === id);
    for (const [key, el] of Object.entries(rowEls)) el.classList.toggle("active", key === id);
    for (const line of lines) {
      line.classList.toggle("lit", id != null && (line.dataset.a === id || line.dataset.b === id));
    }
  };
  for (const star of ORION) {
    for (const el of [starEls[star.id], rowEls[star.id]]) {
      el.addEventListener("pointerenter", () => highlight(star.id));
      el.addEventListener("focus", () => highlight(star.id));
      el.addEventListener("click", () => highlight(star.id));
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          highlight(star.id);
        }
      });
    }
  }
  chart.addEventListener("pointerleave", () => highlight(null));
  table.addEventListener("pointerleave", () => highlight(null));

  if (animate) animateChart(chart, lines);
}

/** Radial glow gradients, one per star colour, plus a blur for the nebula. */
function createGradients() {
  const defs = svg("defs");
  colorsInUse().forEach((color, i) => {
    defs.append(svg("radialGradient", { id: `halo${i}` },
      svg("stop", { offset: "0%", "stop-color": color, "stop-opacity": "0.9" }),
      svg("stop", { offset: "35%", "stop-color": color, "stop-opacity": "0.28" }),
      svg("stop", { offset: "100%", "stop-color": color, "stop-opacity": "0" })));
  });
  defs.append(svg("filter", { id: "nebulaBlur", x: "-50%", y: "-50%", width: "200%", height: "200%" },
    svg("feGaussianBlur", { stdDeviation: "6" })));
  return defs;
}

function colorsInUse() {
  return [...new Set(ORION.map((star) => star.color))];
}

/** Grid lines like a real star chart: declination every 5°, right ascension every 15 min. */
function createGraticule(width, height) {
  const group = svg("g");
  for (const dec of [-10, -5, 0, 5, 10]) {
    const sign = dec > 0 ? "+" : dec < 0 ? "−" : "";
    group.append(
      svg("line", { class: "grat", x1: 0, x2: width, y1: toY(dec), y2: toY(dec) }),
      svg("text", { class: "grat-label", x: 4, y: toY(dec) - 5 }, `${sign}${Math.abs(dec)}°`));
  }
  // x offsets (degrees) of each right-ascension line from the chart centre (RA 5h35m).
  const raLines = [["5h15m", 5.07], ["5h30m", 1.32], ["5h45m", -2.43], ["6h00m", -6.18]];
  for (const [label, x] of raLines) {
    group.append(
      svg("line", { class: "grat", x1: toX(x), x2: toX(x), y1: 0, y2: height }),
      svg("text", { class: "grat-label", x: toX(x) + 4, y: 12 }, label));
  }
  return group;
}

function createConstellationLines() {
  const byId = Object.fromEntries(ORION.map((star) => [star.id, star]));
  return ORION_LINES.map(([a, b]) => svg("line", {
    class: "con-line",
    x1: toX(byId[a].x), y1: toY(byId[a].y),
    x2: toX(byId[b].x), y2: toY(byId[b].y),
    "data-a": a,
    "data-b": b,
  }));
}

/** One star: glow, bright core, name and spectral type. Brighter stars are bigger. */
function createStar(star) {
  const x = toX(star.x);
  const y = toY(star.y);
  // Astronomical magnitude is "backwards": smaller numbers are brighter.
  const r = star.nebula ? 2.4 : Math.max(2.2, 2.4 + (3.6 - star.mag) * 1.25);
  const gradient = colorsInUse().indexOf(star.color);

  const group = svg("g", {
    class: "star-g",
    tabindex: "0",
    role: "button",
    "data-star": star.id,
    "aria-label": `${star.name}: ${star.key}, ${star.fact}`,
  });

  if (star.nebula) {
    group.append(svg("ellipse", { cx: x, cy: y, rx: 22, ry: 15, fill: "rgba(243,182,255,0.35)", filter: "url(#nebulaBlur)" }));
  }

  const halo = svg("circle", { class: "halo", cx: x, cy: y, r: r * 4.2, fill: `url(#halo${gradient})` });
  // Each star twinkles at its own pace (CSS animation reads these variables).
  halo.style.setProperty("--tw-dur", `${(3 + Math.random() * 3).toFixed(2)}s`);
  halo.style.setProperty("--tw-delay", `${(Math.random() * 3).toFixed(2)}s`);

  const left = LABEL_ON_LEFT.has(star.id);
  const labelX = x + (left ? -(r + 9) : r + 9);
  const anchor = left ? "end" : "start";

  group.append(
    halo,
    svg("circle", { class: "core", cx: x, cy: y, r, fill: star.color }),
    svg("text", { class: "label", x: labelX, y: y + 1, "text-anchor": anchor }, star.name),
    svg("text", { class: "sub", x: labelX, y: y + 14, "text-anchor": anchor }, `${star.type} · ${star.dist}`));
  return group;
}

/** The matching row in the fact list. */
function createFactRow(star) {
  return h("button", { class: "star-row", type: "button", role: "listitem", "data-star": star.id },
    h("span", { class: "swatch", style: `color:${star.color}` }),
    h("span", { class: "key", text: star.key }),
    h("span", { class: "fact" },
      star.fact,
      h("small", { text: `${star.name} · ${star.bayer} · ${star.dist}` })));
}

/** Draw the constellation lines and pop in the stars when the chart scrolls into view. */
function animateChart(chart, lines) {
  for (const line of lines) {
    const length = Math.hypot(line.x2.baseVal.value - line.x1.baseVal.value, line.y2.baseVal.value - line.y1.baseVal.value);
    line.style.strokeDasharray = `${length}`;
  }
  const trigger = { trigger: chart, start: "top 75%", once: true };
  gsap.from(lines, {
    strokeDashoffset: (i, line) => line.style.strokeDasharray,
    duration: 1.6,
    ease: "power2.inOut",
    stagger: 0.12,
    scrollTrigger: trigger,
  });
  gsap.from($$(".star-g .core", chart), {
    scale: 0,
    transformOrigin: "50% 50%",
    duration: 0.9,
    ease: "back.out(3)",
    stagger: 0.08,
    scrollTrigger: trigger,
  });
}
