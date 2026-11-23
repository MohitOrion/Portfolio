// ---------------------------------------------------------------------------
//  "Decoding" text effect: random characters resolve into the real text,
//  left to right, like a signal being received. Used on small mono labels.
// ---------------------------------------------------------------------------
import { reducedMotion } from "./motion.js";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·+−°";

export function scramble(element, duration = 900) {
  if (reducedMotion || !element) return;

  const finalText = element.textContent;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const revealed = Math.floor(progress * finalText.length);

    let text = "";
    for (let i = 0; i < finalText.length; i++) {
      const char = finalText[i];
      const keep = i < revealed || char === " ";
      text += keep ? char : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    }
    element.textContent = text;

    if (progress < 1) requestAnimationFrame(tick);
    else element.textContent = finalText;
  };

  requestAnimationFrame(tick);
}
