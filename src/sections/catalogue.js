// ---------------------------------------------------------------------------
//  Projects ("Catalogue"): project cards logged like exoplanet discoveries,
//  each with its own rotating planet, plus filter buttons.
// ---------------------------------------------------------------------------
import { $, $$, h } from "../lib/dom.js";
import { animate, finePointer, gsap, reducedMotion, ScrollTrigger } from "../lib/motion.js";
import { mountPlanet } from "../canvas/planets.js";
import { PROJECT_FILTERS, PROJECTS } from "../data.js";

export function renderCatalogue() {
  const filters = $("#filters");
  const cards = $("#cards");

  for (const filter of PROJECT_FILTERS) filters.append(createFilterButton(filter));

  const planets = PROJECTS.map((project, i) => {
    const card = createCard(project);
    cards.append(card);
    return { card, project, seed: 101 + i * 37 };
  });

  // Planets need their real on-screen size, so draw them after layout.
  requestAnimationFrame(() => {
    for (const { card, project, seed } of planets) {
      const planet = mountPlanet($("canvas", card), project.planet, seed, { reducedMotion });
      if (!planet) continue;
      card.addEventListener("pointerenter", () => planet.hover(true));
      card.addEventListener("pointerleave", () => planet.hover(false));
    }
  });

  filters.addEventListener("click", (e) => {
    const button = e.target.closest(".filter");
    if (button) applyFilter(button.dataset.filter, filters, cards);
  });

  if (finePointer && animate) addTilt($$(".card", cards));
}

function createFilterButton(filter) {
  const count = filter.id === "all"
    ? PROJECTS.length
    : PROJECTS.filter((p) => p.kinds.includes(filter.id)).length;
  return h("button", {
    class: "filter",
    type: "button",
    "data-filter": filter.id,
    "aria-pressed": filter.id === "all" ? "true" : "false",
  }, filter.label, h("b", { text: String(count) }));
}

function createCard(project) {
  const links = h("div", { class: "card-links" },
    project.links.map((link) => h("a", { href: link.href, target: "_blank", rel: "noopener noreferrer" }, `${link.label} ↗`)),
    project.note ? h("span", { class: "note", text: project.note }) : null);

  return h("article", {
    class: project.featured ? "card featured" : "card",
    "data-kinds": project.kinds.join(" "),
    "data-id": project.id,
    "data-featured": project.featured ? "true" : null,
  },
    h("div", { class: "card-top" },
      h("span", { class: "desig", text: project.designation }),
      h("span", { text: `${project.kindLabel} · Discovered ${project.discovered}` })),

    h("div", { class: "card-planet" },
      h("canvas", { "aria-hidden": "true" }),
      h("div", {},
        h("h3", { text: project.name }),
        h("p", { class: "ptype", text: project.planetType }))),

    h("div", { class: "card-main" },
      h("div", { class: "card-body" },
        h("p", { text: project.summary }),
        project.highlights.length
          ? h("ul", { class: "points" }, project.highlights.map((point) => h("li", { text: point })))
          : null,
        project.formula ? h("p", { class: "formula", text: project.formula }) : null),
      h("div", { class: "card-foot" },
        h("ul", { class: "tags", "aria-label": "Built with" }, project.stack.map((tech) => h("li", { text: tech }))),
        links)));
}

function applyFilter(id, filters, cards) {
  $$(".filter", filters).forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.filter === id)));

  const shown = [];
  for (const card of $$(".card", cards)) {
    const match = id === "all" || card.dataset.kinds.split(" ").includes(id);
    card.hidden = !match;
    // The big featured layout is only used when every project is showing,
    // so a filtered list never leaves one card alone on a row.
    if (card.dataset.featured) card.classList.toggle("featured", id === "all");
    if (match) shown.push(card);
  }

  if (animate) {
    gsap.fromTo(shown, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: "expo.out", stagger: 0.06, clearProps: "transform" });
  }
  ScrollTrigger.refresh(); // the page height changed
}

/** Cards lean slightly towards the mouse. */
function addTilt(cards) {
  for (const card of cards) {
    card.addEventListener("pointermove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(1200px) rotateX(${(-y * 3).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg)`;
    });
    card.addEventListener("pointerleave", () => {
      card.classList.add("settling");
      card.style.transform = "";
      setTimeout(() => card.classList.remove("settling"), 600);
    });
  }
}
