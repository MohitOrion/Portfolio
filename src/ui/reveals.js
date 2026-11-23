// ---------------------------------------------------------------------------
//  Scroll reveals. Content starts readable but faint and slightly lower,
//  then settles into place as it enters the screen.
//
//  Only opacity and position are animated: both are cheap for the browser.
//  (Blur looked nice but forced a full repaint every frame on big blocks.)
// ---------------------------------------------------------------------------
import { $$ } from "../lib/dom.js";
import { animate, EASE, gsap, ScrollTrigger } from "../lib/motion.js";
import { scramble } from "../lib/scramble.js";

export function setupReveals() {
  if (!animate) return;

  // Section labels ("ORIGIN", "ORBITS"…) decode like a received signal.
  for (const label of $$(".plate .eyebrow span")) {
    ScrollTrigger.create({ trigger: label, start: "top 88%", once: true, onEnter: () => scramble(label, 700) });
  }

  const from = { opacity: 0.3, y: 40 };

  // Section headers, intro blocks and charts: one by one.
  for (const el of $$("[data-reveal]")) {
    gsap.from(el, {
      ...from,
      duration: 1.2,
      ease: EASE,
      clearProps: "transform",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  }

  // Repeated items: in small staggered groups as they appear.
  ScrollTrigger.batch(".card, .skill-group, .star-row, .channel", {
    start: "top 92%",
    once: true,
    onEnter: (batch) => gsap.from(batch, { ...from, y: 28, duration: 1, ease: EASE, stagger: 0.07, clearProps: "transform" }),
  });

  ScrollTrigger.batch(".stage-body, .stage-when", {
    start: "top 88%",
    once: true,
    onEnter: (batch) => gsap.from(batch, { opacity: 0.3, x: 24, duration: 1, ease: EASE, stagger: 0.05, clearProps: "transform" }),
  });

  gsap.from(".orbit", {
    scale: 0.86,
    rotate: -18,
    opacity: 0.3,
    duration: 1.8,
    ease: EASE,
    scrollTrigger: { trigger: ".orbit", start: "top 85%", once: true },
  });
}
