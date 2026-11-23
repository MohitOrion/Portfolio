// ---------------------------------------------------------------------------
//  Top navigation: mobile menu, highlighting the current section, and the
//  live clock showing my local time in India.
// ---------------------------------------------------------------------------
import { $, $$ } from "../lib/dom.js";

export const SECTION_IDS = ["hero", "origin", "orbits", "catalogue", "evolution", "signal"];

export function setupNav() {
  setupMobileMenu();
  highlightCurrentSection();
  startClock();
}

function setupMobileMenu() {
  const nav = $("#nav");
  const button = $("#menuBtn");
  const menu = $("#mobileMenu");

  const setOpen = (open) => {
    button.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
    nav.classList.toggle("menu-open", open);
  };

  button.addEventListener("click", () => setOpen(menu.hidden));
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) {
      setOpen(false);
      button.focus();
    }
  });
}

/** Mark the nav link of whichever section is in the middle of the screen. */
function highlightCurrentSection() {
  const links = $$("[data-nav]");
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const link of links) link.classList.toggle("active", link.dataset.nav === entry.target.id);
    }
  }, { rootMargin: "-45% 0px -50% 0px" }); // a thin band across the middle of the screen
  for (const id of SECTION_IDS) observer.observe(document.getElementById(id));
}

function startClock() {
  const clock = $("#clock");
  const format = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const tick = () => { clock.textContent = format.format(new Date()); };
  tick();
  setInterval(tick, 1000);
}
