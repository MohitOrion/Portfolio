// ---------------------------------------------------------------------------
//  Entry point for the portfolio page (index.html).
//
//  Where to find things:
//    src/data.js            ← all the text, links, skills and projects
//    src/sections/*.js      one file per page section
//    src/ui/*.js            navigation, scroll progress, reveals, cursor
//    src/cosmos/*.js        the WebGL black hole and galaxy
//    src/canvas/*.js        the small planet and pulsar animations
//    src/styles/*.css       styles, split the same way
// ---------------------------------------------------------------------------
import { $ } from "./lib/dom.js";
import { reducedMotion, ScrollTrigger } from "./lib/motion.js";
import { setupHero } from "./sections/hero.js";
import { renderOrigin } from "./sections/origin.js";
import { renderOrbits } from "./sections/orbits.js";
import { renderCatalogue } from "./sections/catalogue.js";
import { renderEvolution } from "./sections/evolution.js";
import { renderSignal } from "./sections/signal.js";
import { setupNav } from "./ui/nav.js";
import { setupProgress } from "./ui/progress.js";
import { setupReveals } from "./ui/reveals.js";
import { setupCursor } from "./ui/cursor.js";

// 1. Build the page content from data.js.
renderOrigin();
renderOrbits();
renderCatalogue();
renderEvolution();
renderSignal();

// 2. Add interaction and motion.
setupHero();
setupNav();
setupReveals();
setupCursor();

// 3. Start the WebGL sky. three.js is loaded separately (a dynamic import),
//    so the page text appears first and the 3D scene fades in after.
const cosmosRef = { api: null };
const progress = setupProgress(cosmosRef);

import("./cosmos/scene.js")
  .then(({ initCosmos }) => {
    cosmosRef.api = initCosmos($("#cosmos"), { reducedMotion });
    if (cosmosRef.api) document.body.classList.add("has-webgl");
    progress.refresh();
  })
  .catch((error) => {
    // No WebGL (or it failed): the CSS fallback sky stays visible.
    console.warn("3D scene unavailable, showing the static sky instead.", error);
  });

// Web fonts change text size slightly; re-measure scroll positions once they load.
document.fonts?.ready.then(() => {
  ScrollTrigger.refresh();
  progress.refresh();
});
