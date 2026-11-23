// ---------------------------------------------------------------------------
//  Hero: the opening screen with the name over the black hole.
// ---------------------------------------------------------------------------
import { $, h } from "../lib/dom.js";
import { animate, EASE, gsap } from "../lib/motion.js";
import { scramble } from "../lib/scramble.js";

/** Wrap each letter in a <span class="char"> so letters can animate one by one. */
function splitLetters(element) {
  const text = element.textContent;
  element.textContent = "";
  for (const letter of text) element.append(h("span", { class: "char", text: letter }));
}

export function setupHero() {
  splitLetters($(".hero-first"));
  splitLetters($(".hero-last"));
  scramble($(".hero-eyebrow"), 1200);

  if (!animate) return;

  // Page-load sequence. Everything is visible without JavaScript;
  // these tweens only animate *from* a hidden state into the final one.
  gsap.timeline({ defaults: { ease: EASE } })
    .from(".hero-eyebrow", { opacity: 0, y: 10, duration: 1 }, 0.15)
    .from(".hero-name .char", { yPercent: 34, opacity: 0, filter: "blur(18px)", duration: 1.6, stagger: 0.065, clearProps: "filter" }, 0.3)
    .from(".nav-inner", { opacity: 0, y: -14, duration: 1.2 }, 0.5)
    .from([".hero-role", ".hero-sub"], { opacity: 0, y: 18, duration: 1.1, stagger: 0.1 }, 0.95)
    .from(".hero-cta .btn", { opacity: 0, y: 18, duration: 1, stagger: 0.08 }, 1.1)
    .from(".hud", { opacity: 0, duration: 1.4 }, 1.3);

  // While scrolling out of the hero, the title drifts up and dims.
  const scrollOut = { trigger: "#hero", start: "top top", end: "bottom 20%", scrub: true };
  gsap.to(".hero-name", { yPercent: -28, opacity: 0.15, ease: "none", scrollTrigger: scrollOut });
  gsap.to([".hero-eyebrow", ".hero-role", ".hero-sub", ".hero-cta"], { y: -60, opacity: 0, ease: "none", scrollTrigger: scrollOut });
  gsap.to(".hud", { opacity: 0, ease: "none", scrollTrigger: { ...scrollOut, end: "30% top" } });
}
