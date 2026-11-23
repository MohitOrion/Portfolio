// ---------------------------------------------------------------------------
//  Skills ("Orbits"): rings of skills circling a central star, plus the two
//  role descriptions and the grouped skill lists. Hovering a group highlights
//  its ring.
//
//  The spinning is pure CSS (see styles/orbits.css). Each ring rotates, and
//  each label counter-rotates at the same speed so the text stays upright.
// ---------------------------------------------------------------------------
import { $, $$, h } from "../lib/dom.js";
import { ORBITS, ROLES } from "../data.js";

// Ring radius as a % of the orbit's width (cqw = container query width units).
const RING_RADII = [15, 25, 35.5, 46.5];
const RING_COLORS = ["var(--accretion)", "var(--ion)", "var(--nebula)", "var(--aurora)"];

export function renderOrbits() {
  const orbit = $("#orbit");
  ORBITS.forEach((ring, i) => orbit.append(createRing(ring, i)));

  const roles = $("#roles");
  for (const role of ROLES) roles.append(createRole(role));

  const groups = $("#skillGroups");
  ORBITS.forEach((ring, i) => {
    const group = createSkillGroup(ring, i);
    const on = () => {
      orbit.dataset.active = ring.id;
      $$(".ring", orbit).forEach((el) => el.classList.toggle("on", el.dataset.ring === ring.id));
    };
    const off = () => {
      delete orbit.dataset.active;
      $$(".ring", orbit).forEach((el) => el.classList.remove("on"));
    };
    group.addEventListener("pointerenter", on);
    group.addEventListener("focus", on);
    group.addEventListener("pointerleave", off);
    group.addEventListener("blur", off);
    groups.append(group);
  });
}

function createRing(ring, index) {
  const direction = index % 2 === 0 ? "normal" : "reverse"; // alternate rings spin opposite ways
  const counter = direction === "normal" ? "reverse" : "normal";
  const el = h("div", {
    class: "ring",
    "data-ring": ring.id,
    style: [
      `--r:${RING_RADII[index]}cqw`,
      `--period:${ring.period}`,
      `--dir:${direction}`,
      `--counter:${counter}`,
      `--dot:${RING_COLORS[index]}`,
    ].join(";"),
  });

  const offset = index * 23; // stagger rings so labels don't line up
  ring.items.forEach((skill, j) => {
    const angle = offset + (360 / ring.items.length) * j;
    el.append(
      h("div", { class: "chip", style: `--a:${angle}deg` },
        h("div", { class: "chip-spin" },
          h("span", { class: "chip-label", text: skill }))));
  });
  return el;
}

/** "As a developer" → "As a <em>developer</em>" */
function createRole(role) {
  const words = role.title.split(" ");
  const last = words.pop();
  return h("article", { class: "role", "data-reveal": true },
    h("h3", {}, `${words.join(" ")} `, h("em", { text: last })),
    h("p", { text: role.body }));
}

function createSkillGroup(ring, index) {
  return h("div", { class: "skill-group", "data-ring": ring.id, tabindex: "0" },
    h("h4", {},
      h("span", { class: "group-dot", style: `--dot:${RING_COLORS[index]}` }),
      ring.label),
    h("ul", { class: "tags" }, ring.items.map((skill) => h("li", { text: skill }))));
}
