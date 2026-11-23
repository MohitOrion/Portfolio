// ---------------------------------------------------------------------------
//  Small DOM helpers used by every section.
// ---------------------------------------------------------------------------

/** Find the first element matching a CSS selector. */
export const $ = (selector, root = document) => root.querySelector(selector);

/** Find every element matching a CSS selector, as a real array. */
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

/**
 * Create an HTML element.
 *
 *   h("a", { href: "/", class: "link" }, "Home")
 *   → <a href="/" class="link">Home</a>
 *
 * Special attribute keys: `class`, `text` (sets textContent) and `style` (a CSS string).
 * Children can be strings, elements, arrays of either, or null (skipped).
 */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  setAttributes(el, attrs);
  appendChildren(el, children);
  return el;
}

/** Same as h(), but for SVG elements (they need the SVG namespace). */
export function svg(tag, attrs = {}, ...children) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  setAttributes(el, attrs);
  appendChildren(el, children);
  return el;
}

function setAttributes(el, attrs) {
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === "class") el.setAttribute("class", value);
    else if (key === "text") el.textContent = value;
    else if (key === "style") el.style.cssText = value;
    else el.setAttribute(key, value === true ? "" : value);
  }
}

function appendChildren(el, children) {
  for (const child of children.flat()) {
    if (child != null) el.append(child);
  }
}

/**
 * Copy text to the clipboard and show feedback on the button that was clicked.
 * If the browser refuses, select the nearby text so the visitor can copy it by hand.
 */
export async function copyText(text, button) {
  const original = button.dataset.label || button.textContent;
  button.dataset.label = original;

  const showLabel = (label, success) => {
    button.textContent = label;
    button.classList.toggle("done", success);
    clearTimeout(button._resetTimer);
    button._resetTimer = setTimeout(() => {
      button.textContent = original;
      button.classList.remove("done");
    }, 1800);
  };

  try {
    await navigator.clipboard.writeText(text);
    showLabel("Copied", true);
  } catch {
    const target = button.closest("[data-copy-scope]")?.querySelector("[data-copy-target]");
    if (target) {
      const range = document.createRange();
      range.selectNodeContents(target);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
    showLabel("Press Ctrl+C", false);
  }
}
