// ---------------------------------------------------------------------------
//  Custom cursor (a dot with a trailing ring) and "magnetic" buttons that
//  lean towards the pointer. Only on devices with a mouse or trackpad.
// ---------------------------------------------------------------------------
import { $, $$ } from "../lib/dom.js";
import { animate, finePointer } from "../lib/motion.js";

const HOVER_TARGETS = "a, button, [role='button'], .star-g, .skill-group, .card";

export function setupCursor() {
  if (!finePointer || !animate) return;

  document.body.classList.add("cursor-on");
  const dot = $(".cursor-dot");
  const ring = $(".cursor-ring");
  const place = (el, x, y) => { el.style.transform = `translate3d(${x}px, ${y}px, 0)`; };

  let x = -100, y = -100;          // pointer position
  let ringX = -100, ringY = -100;  // ring position, which trails behind
  let raf = 0;

  // The ring eases towards the pointer and the loop stops once it arrives,
  // so the cursor costs nothing while the mouse is still.
  const follow = () => {
    ringX += (x - ringX) * 0.18;
    ringY += (y - ringY) * 0.18;
    place(ring, ringX, ringY);
    raf = Math.abs(x - ringX) + Math.abs(y - ringY) > 0.3 ? requestAnimationFrame(follow) : 0;
  };

  window.addEventListener("pointermove", (e) => {
    x = e.clientX;
    y = e.clientY;
    place(dot, x, y);
    if (!raf) raf = requestAnimationFrame(follow);
  }, { passive: true });

  document.addEventListener("pointerover", (e) => {
    document.body.classList.toggle("cursor-hover", Boolean(e.target.closest(HOVER_TARGETS)));
  });
  document.documentElement.addEventListener("pointerleave", () => {
    x = y = ringX = ringY = -100;
    place(dot, x, y);
    place(ring, x, y);
  });

  setupMagneticButtons();
}

function setupMagneticButtons() {
  for (const button of $$("[data-magnetic]")) {
    button.addEventListener("pointermove", (e) => {
      const rect = button.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      button.style.transform = `translate(${dx * 0.22}px, ${dy * 0.32}px)`;
    });
    button.addEventListener("pointerleave", () => {
      button.classList.add("settling");
      button.style.transform = "";
      setTimeout(() => button.classList.remove("settling"), 500);
    });
  }
}
