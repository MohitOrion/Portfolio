// ---------------------------------------------------------------------------
//  Loading screen ("Calibrating telescope").
//
//  The overlay is plain HTML + CSS in index.html, so it appears with the very
//  first paint. This file moves its progress bar as real loading steps finish,
//  then plays the exit (the small black hole swallows the screen).
//
//  It never traps the visitor: it leaves after MAX_WAIT_MS even if something
//  is still loading, and the CSS hides it on its own if JavaScript fails.
// ---------------------------------------------------------------------------
import { $ } from "../lib/dom.js";
import { reducedMotion } from "../lib/motion.js";

// The steps, in the order they usually finish, with the label shown while waiting for each.
const STEPS = [
  { id: "charts", label: "Reading star charts" }, // page content built
  { id: "fonts", label: "Focusing optics" },      // web fonts loaded
  { id: "galaxy", label: "Building the galaxy" }, // 3D scene created
  { id: "light", label: "Waiting for first light" }, // first frame drawn
];

const MIN_VISIBLE_MS = 900;   // don't flash on and off on fast connections
const MAX_WAIT_MS = 8000;     // give up waiting and show the page anyway
const EXIT_MS = reducedMotion ? 300 : 900;

export function createLoader() {
  const root = $("#loader");
  const fill = $("#loaderFill");
  const label = $("#loaderStep");
  const percent = $("#loaderPct");

  const done = new Set();
  let shownPercent = 0;
  let finish;
  const finished = new Promise((resolve) => { finish = resolve; });

  // Count the percentage up smoothly towards the real value.
  let target = 0;
  const countUp = () => {
    shownPercent += Math.max((target - shownPercent) * 0.2, target > shownPercent ? 0.5 : 0);
    shownPercent = Math.min(shownPercent, target);
    if (percent) percent.textContent = `${Math.round(shownPercent)}%`;
    if (shownPercent < target) requestAnimationFrame(countUp);
  };

  function render() {
    target = (done.size / STEPS.length) * 100;
    if (fill) fill.style.transform = `scaleX(${target / 100})`;
    const next = STEPS.find((step) => !done.has(step.id));
    if (label) label.textContent = next ? next.label : "First light";
    requestAnimationFrame(countUp);
  }

  let leaving = false;
  function leave() {
    if (leaving || !root) return;
    leaving = true;
    const wait = Math.max(0, MIN_VISIBLE_MS - performance.now());
    setTimeout(() => {
      root.classList.add("loader-done");
      root.setAttribute("aria-busy", "false");
      finish(); // start the page's own intro while the loader fades
      setTimeout(() => root.remove(), EXIT_MS + 100);
    }, wait);
  }

  const giveUp = setTimeout(leave, Math.max(0, MAX_WAIT_MS - performance.now()));

  render();

  return {
    /** Mark a step as finished. Unknown or repeated ids are ignored. */
    complete(id) {
      if (done.has(id) || !STEPS.some((step) => step.id === id)) return;
      done.add(id);
      render();
      if (done.size === STEPS.length) {
        clearTimeout(giveUp);
        leave();
      }
    },
    /** Resolves when the loader starts leaving. */
    finished: root ? finished : Promise.resolve(),
  };
}
