// ---------------------------------------------------------------------------
//  Journey ("Stellar evolution"): a timeline where each stage of my life so
//  far is a stage in a star's life. A glowing beam fills the line as you
//  scroll, and each star lights up when the beam reaches it.
// ---------------------------------------------------------------------------
import { $, $$, h } from "../lib/dom.js";
import { animate, gsap } from "../lib/motion.js";
import { EVOLUTION } from "../data.js";

export function renderEvolution() {
  const list = $("#timeline");

  for (const stage of EVOLUTION) {
    list.append(
      h("li", { class: "stage" },
        h("div", { class: "stage-when" },
          h("b", { text: stage.stage }),
          h("span", { text: stage.when })),
        h("div", { class: "stage-star", "aria-hidden": "true" },
          h("i", { class: `s-${stage.star}` })),
        h("div", { class: "stage-body" },
          h("h3", { text: stage.title }),
          h("p", { text: stage.body }))));
  }

  if (!animate) return;

  // The beam grows with scroll position (scrub ties it directly to the scrollbar).
  gsap.fromTo("#beam", { scaleY: 0 }, {
    scaleY: 1,
    ease: "none",
    scrollTrigger: { trigger: list, start: "top 60%", end: "bottom 60%", scrub: 0.6 },
  });

  for (const stage of $$(".stage", list)) {
    gsap.fromTo($(".stage-star i", stage), { scale: 0.45, opacity: 0.35 }, {
      scale: 1,
      opacity: 1,
      duration: 0.9,
      ease: "back.out(2.6)",
      scrollTrigger: { trigger: stage, start: "top 62%", toggleActions: "play none none reverse" },
    });
  }
}
