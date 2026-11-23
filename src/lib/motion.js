// ---------------------------------------------------------------------------
//  Motion settings shared by every animation on the site.
// ---------------------------------------------------------------------------
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** True when the visitor has asked their OS to reduce motion. We then skip decorative animation. */
export const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** True on devices with a mouse or trackpad (custom cursor, hover tilt and magnetic buttons). */
export const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/** Whether decorative animations should run at all. */
export const animate = !reducedMotion;

/** Shared easing: fast start, long soft landing. */
export const EASE = "expo.out";

export { gsap, ScrollTrigger };

/**
 * Run a callback at most `fps` times per second from requestAnimationFrame.
 * Used by the small 2D canvases so they don't compete with the WebGL sky.
 * Returns { start, stop }.
 */
export function throttledLoop(callback, fps = 30) {
  const minGap = 1000 / fps;
  let raf = 0;
  let last = 0;
  let running = false;

  const tick = (now) => {
    if (!running) return;
    raf = requestAnimationFrame(tick);
    const gap = now - last;
    if (gap < minGap - 1) return;
    // Pass seconds since the last drawn frame (capped so a long pause doesn't jump).
    callback(Math.min(gap / 1000, 0.1));
    last = now;
  };

  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
  };
}

/**
 * Call `onVisible(true/false)` whenever an element enters or leaves the screen.
 * Animations use this to pause while they are scrolled out of view.
 */
export function whenVisible(element, onVisible, rootMargin = "80px") {
  if (!("IntersectionObserver" in window)) {
    onVisible(true);
    return;
  }
  new IntersectionObserver((entries) => {
    for (const entry of entries) onVisible(entry.isIntersecting);
  }, { rootMargin }).observe(element);
}
