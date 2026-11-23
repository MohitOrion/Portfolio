// ---------------------------------------------------------------------------
//  Scroll progress, in three forms:
//   • the rainbow bar under the nav is a stellar spectrum. Its dark
//     absorption lines shift towards red as you scroll, like the light of a
//     galaxy moving away from us (redshift).
//   • the "z = 0.0000" readout in the hero shows that redshift as a number.
//   • the WebGL camera is told where you are, so it can pull back.
// ---------------------------------------------------------------------------
import { $ } from "../lib/dom.js";
import { SECTION_IDS } from "./nav.js";

// Rest wavelengths (nanometres) of strong absorption lines in starlight:
// calcium K and H, hydrogen delta/gamma/beta, magnesium b, sodium D, hydrogen alpha.
const ABSORPTION_LINES_NM = [393.4, 396.8, 410.2, 434.0, 486.1, 517.3, 589.0, 656.3];
const VISIBLE_NM = [380, 750]; // the spectrum bar spans violet → red
const MAX_REDSHIFT = 0.1;      // z at the bottom of the page

/**
 * cosmosRef.api is the WebGL scene (or null until it has loaded / if WebGL is missing).
 * Returns { refresh() } to recalculate after the scene loads.
 */
export function setupProgress(cosmosRef) {
  const nav = $("#nav");
  const fill = $("#spectrumFill");
  const readout = $("#zRead");
  const lineBox = $("#spectrumLines");
  const lines = ABSORPTION_LINES_NM.map(() => lineBox.appendChild(document.createElement("i")));

  const maxScroll = () => Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);

  /** Scroll progress (0..1) at which each section reaches the top of the screen. */
  function updateCameraStops() {
    const max = maxScroll();
    let previous = -1;
    const stops = SECTION_IDS.map((id, i) => {
      if (i === 0) return (previous = 0);
      const top = document.getElementById(id).getBoundingClientRect().top + window.scrollY;
      let p = Math.min(top - window.innerHeight * 0.08, max) / max;
      p = Math.min(Math.max(p, previous + 0.02), 1); // always increasing
      previous = p;
      return p;
    });
    cosmosRef.api?.setStops(stops);
  }

  let queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const p = Math.min(Math.max(window.scrollY / maxScroll(), 0), 1);
      nav.classList.toggle("scrolled", window.scrollY > 30);

      fill.style.transform = `scaleX(${p})`;
      const z = p * MAX_REDSHIFT;
      readout.textContent = z.toFixed(4);
      // Observed wavelength = rest wavelength × (1 + z)
      ABSORPTION_LINES_NM.forEach((nm, i) => {
        const x = (nm * (1 + z) - VISIBLE_NM[0]) / (VISIBLE_NM[1] - VISIBLE_NM[0]);
        lines[i].style.left = `${x * 100}%`;
      });

      cosmosRef.api?.setProgress(p);
    });
  }

  const refresh = () => {
    updateCameraStops();
    onScroll();
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", refresh);
  // Content can change height after load (fonts, images, filters).
  if ("ResizeObserver" in window) new ResizeObserver(refresh).observe(document.body);
  refresh();

  return { refresh };
}
