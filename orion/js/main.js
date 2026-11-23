// ---------------------------------------------------------------------------
//  Page logic: renders content from data.js, then layers on motion.
//  Every animation starts from a readable state, and the page works without
//  GSAP or WebGL (it simply shows the static version).
// ---------------------------------------------------------------------------
import {
  PROFILE, SOCIALS, ORION, ORION_LINES, ORBITS, ROLES,
  PROJECTS, PROJECT_FILTERS, EVOLUTION, CONTACT_TOPICS,
} from "./data.js";
import { mountPlanet } from "./planets.js";
import { mountPulsar } from "./pulsar.js";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const motion = Boolean(gsap && ScrollTrigger && !reduced);
if (motion) gsap.registerPlugin(ScrollTrigger);

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const SVGNS = "http://www.w3.org/2000/svg";

function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k === "html") node.innerHTML = v;
    else if (k === "style") node.style.cssText = v;
    else node.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) if (c != null) node.append(c);
  return node;
}

function s(tag, attrs = {}, ...children) {
  const node = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) node.setAttribute(k, v);
  for (const c of children.flat()) if (c != null) node.append(c);
  return node;
}

async function copyText(text, button) {
  const done = (label) => {
    if (!button) return;
    const original = button.dataset.label || button.textContent;
    button.dataset.label = original;
    button.textContent = label;
    button.classList.toggle("done", label === "Copied");
    clearTimeout(button._t);
    button._t = setTimeout(() => { button.textContent = original; button.classList.remove("done"); }, 1800);
  };
  try {
    await navigator.clipboard.writeText(text);
    done("Copied");
  } catch {
    // Fall back to selecting the text so the visitor can copy it themselves.
    const target = button?.closest("[data-copy-scope]")?.querySelector("[data-copy-target]");
    if (target) {
      const range = document.createRange();
      range.selectNodeContents(target);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
    done("Press ⌘/Ctrl+C");
  }
}

// ----- Text scramble (used on mono labels) ----------------------------------
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·+−°";
function scramble(node, duration = 900) {
  if (reduced || !node) return;
  const final = node.textContent;
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min((now - start) / duration, 1);
    const reveal = Math.floor(t * final.length);
    let out = "";
    for (let i = 0; i < final.length; i++) {
      const ch = final[i];
      out += i < reveal || ch === " " ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    node.textContent = out;
    if (t < 1) requestAnimationFrame(tick);
    else node.textContent = final;
  };
  requestAnimationFrame(tick);
}

// ----- Origin: Orion chart + fact table ---------------------------------------
function renderOrigin() {
  const svg = $("#orionChart");
  const table = $("#starTable");
  const S = 30;
  const xmin = -6.8, xmax = 6.8, ymin = -11.4, ymax = 11.6;
  const W = (xmax - xmin) * S;
  const H = (ymax - ymin) * S;
  const X = (x) => (x - xmin) * S;
  const Y = (y) => (ymax - y) * S;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

  const defs = s("defs");
  const colors = [...new Set(ORION.map((st) => st.color))];
  colors.forEach((c, i) => {
    const g = s("radialGradient", { id: `halo${i}` },
      s("stop", { offset: "0%", "stop-color": c, "stop-opacity": "0.9" }),
      s("stop", { offset: "35%", "stop-color": c, "stop-opacity": "0.28" }),
      s("stop", { offset: "100%", "stop-color": c, "stop-opacity": "0" }));
    defs.append(g);
  });
  defs.append(s("filter", { id: "neb", x: "-50%", y: "-50%", width: "200%", height: "200%" }, s("feGaussianBlur", { stdDeviation: "6" })));
  svg.append(defs);

  // Graticule: declination every 5°, right ascension every 15 minutes.
  const grat = s("g");
  for (const dec of [-10, -5, 0, 5, 10]) {
    grat.append(s("line", { class: "grat", x1: 0, x2: W, y1: Y(dec), y2: Y(dec) }));
    const label = s("text", { class: "grat-label", x: 4, y: Y(dec) - 5 });
    label.textContent = `${dec > 0 ? "+" : dec < 0 ? "−" : ""}${Math.abs(dec)}°`;
    grat.append(label);
  }
  for (const [lbl, x] of [["5h15m", 5.07], ["5h30m", 1.32], ["5h45m", -2.43], ["6h00m", -6.18]]) {
    grat.append(s("line", { class: "grat", x1: X(x), x2: X(x), y1: 0, y2: H }));
    const label = s("text", { class: "grat-label", x: X(x) + 4, y: 12 });
    label.textContent = lbl;
    grat.append(label);
  }
  svg.append(grat);

  const byId = Object.fromEntries(ORION.map((st) => [st.id, st]));
  const lines = s("g");
  const lineEls = ORION_LINES.map(([a, b]) => {
    const A = byId[a], B = byId[b];
    const l = s("line", { class: "con-line", x1: X(A.x), y1: Y(A.y), x2: X(B.x), y2: Y(B.y), "data-a": a, "data-b": b });
    lines.append(l);
    return l;
  });
  svg.append(lines);

  const leftLabels = new Set(["rigel", "alnitak"]);
  const starEls = {};
  const rowEls = {};
  for (const st of ORION) {
    const r = st.nebula ? 2.4 : Math.max(2.2, 2.4 + (3.6 - st.mag) * 1.25);
    const ci = colors.indexOf(st.color);
    const g = s("g", { class: "star-g", tabindex: "0", role: "button", "data-star": st.id, "aria-label": `${st.name}: ${st.key}, ${st.fact}` });
    if (st.nebula) {
      g.append(s("ellipse", { cx: X(st.x), cy: Y(st.y), rx: 22, ry: 15, fill: "rgba(243,182,255,0.35)", filter: "url(#neb)" }));
    }
    const halo = s("circle", { class: "halo", cx: X(st.x), cy: Y(st.y), r: r * 4.2, fill: `url(#halo${ci})` });
    halo.style.setProperty("--tw-dur", `${(3 + Math.random() * 3).toFixed(2)}s`);
    halo.style.setProperty("--tw-delay", `${(Math.random() * 3).toFixed(2)}s`);
    g.append(halo);
    g.append(s("circle", { class: "core", cx: X(st.x), cy: Y(st.y), r, fill: st.color }));
    const left = leftLabels.has(st.id);
    const lx = X(st.x) + (left ? -(r + 9) : r + 9);
    const anchor = left ? "end" : "start";
    const name = s("text", { class: "label", x: lx, y: Y(st.y) + 1, "text-anchor": anchor });
    name.textContent = st.name;
    const sub = s("text", { class: "sub", x: lx, y: Y(st.y) + 14, "text-anchor": anchor });
    sub.textContent = `${st.type} · ${st.dist}`;
    g.append(name, sub);
    svg.append(g);
    starEls[st.id] = g;

    const row = h("button", { class: "star-row", type: "button", role: "listitem", "data-star": st.id },
      h("span", { class: "swatch", style: `color:${st.color}` }),
      h("span", { class: "key", text: st.key }),
      h("span", { class: "fact" }, st.fact, h("small", { text: `${st.name} · ${st.bayer} · ${st.dist}` })));
    table.append(row);
    rowEls[st.id] = row;
  }

  let active = null;
  const activate = (id) => {
    if (active === id) return;
    active = id;
    for (const [k, el] of Object.entries(starEls)) el.classList.toggle("active", k === id);
    for (const [k, el] of Object.entries(rowEls)) el.classList.toggle("active", k === id);
    for (const l of lineEls) l.classList.toggle("lit", id != null && (l.dataset.a === id || l.dataset.b === id));
  };
  const bind = (el, id) => {
    el.addEventListener("pointerenter", () => activate(id));
    el.addEventListener("focus", () => activate(id));
    el.addEventListener("click", () => activate(id));
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(id); } });
  };
  for (const st of ORION) { bind(starEls[st.id], st.id); bind(rowEls[st.id], st.id); }
  svg.addEventListener("pointerleave", () => activate(null));
  table.addEventListener("pointerleave", () => activate(null));

  if (motion) {
    for (const l of lineEls) {
      const len = Math.hypot(l.x2.baseVal.value - l.x1.baseVal.value, l.y2.baseVal.value - l.y1.baseVal.value);
      l.style.strokeDasharray = `${len}`;
    }
    gsap.from(lineEls, {
      strokeDashoffset: (i, el) => el.style.strokeDasharray,
      duration: 1.6,
      ease: "power2.inOut",
      stagger: 0.12,
      scrollTrigger: { trigger: svg, start: "top 75%", once: true },
    });
    gsap.from($$(".star-g .core", svg), {
      scale: 0,
      transformOrigin: "50% 50%",
      duration: 0.9,
      ease: "back.out(3)",
      stagger: 0.08,
      scrollTrigger: { trigger: svg, start: "top 75%", once: true },
    });
  }
}

// ----- Orbits: skills ---------------------------------------------------------
const RING_RADII = [15, 25, 35.5, 46.5];
const RING_DOTS = ["var(--accretion)", "var(--ion)", "var(--nebula)", "#7ef0b0"];

function renderOrbits() {
  const orbit = $("#orbit");
  ORBITS.forEach((ring, i) => {
    const dir = i % 2 === 0 ? "normal" : "reverse";
    const el = h("div", {
      class: "ring",
      "data-ring": ring.id,
      style: `--r:${RING_RADII[i]}cqw;--period:${ring.period};--dir:${dir};--counter:${dir === "normal" ? "reverse" : "normal"};--dot:${RING_DOTS[i]}`,
    }, h("span", { class: "ring-label", text: ring.label }));
    const offset = i * 23;
    ring.items.forEach((item, j) => {
      const a = offset + (360 / ring.items.length) * j;
      el.append(h("div", { class: "chip", style: `--a:${a}deg` },
        h("div", { class: "chip-spin" }, h("span", { class: "chip-label", text: item }))));
    });
    orbit.append(el);
  });

  const roles = $("#roles");
  for (const r of ROLES) {
    const [first, ...rest] = r.title.split(" ");
    roles.append(h("article", { class: "role", "data-reveal": true },
      h("h3", {}, `${first} ${rest.slice(0, -1).join(" ")} `, h("em", { text: rest.at(-1) })),
      h("p", { text: r.body })));
  }

  const groups = $("#skillGroups");
  ORBITS.forEach((ring, i) => {
    const g = h("div", { class: "skill-group", "data-ring": ring.id, tabindex: "0" },
      h("h4", {}, h("span", { style: `display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:10px;background:${RING_DOTS[i]};box-shadow:0 0 8px ${RING_DOTS[i]}` }), ring.label),
      h("ul", { class: "tags" }, ring.items.map((it) => h("li", { text: it }))));
    const on = () => {
      orbit.dataset.active = ring.id;
      $$(".ring", orbit).forEach((el) => el.classList.toggle("on", el.dataset.ring === ring.id));
    };
    const off = () => {
      delete orbit.dataset.active;
      $$(".ring", orbit).forEach((el) => el.classList.remove("on"));
    };
    g.addEventListener("pointerenter", on);
    g.addEventListener("focus", on);
    g.addEventListener("pointerleave", off);
    g.addEventListener("blur", off);
    groups.append(g);
  });
}

// ----- Catalogue: projects ----------------------------------------------------
function renderCatalogue() {
  const filters = $("#filters");
  const cards = $("#cards");
  const planets = [];

  for (const f of PROJECT_FILTERS) {
    const count = f.id === "all" ? PROJECTS.length : PROJECTS.filter((p) => p.kinds.includes(f.id)).length;
    filters.append(h("button", { class: "filter", type: "button", "data-filter": f.id, "aria-pressed": f.id === "all" ? "true" : "false" },
      f.label, h("b", { text: String(count) })));
  }

  PROJECTS.forEach((p, i) => {
    const canvas = h("canvas", { "aria-hidden": "true" });
    const links = h("div", { class: "card-links" },
      p.links.map((l) => h("a", { href: l.href, target: "_blank", rel: "noopener noreferrer" }, `${l.label} ↗`)),
      p.note ? h("span", { class: "note", text: p.note }) : null);
    const card = h("article", { class: `card${p.featured ? " featured" : ""}`, "data-kinds": p.kinds.join(" "), "data-id": p.id },
      h("div", { class: "card-top" },
        h("span", { class: "desig", text: p.designation }),
        h("span", { text: `${p.kindLabel} · Discovered ${p.discovered}` })),
      h("div", { class: "card-planet" }, canvas,
        h("div", {}, h("h3", { text: p.name }), h("p", { class: "ptype", text: p.planetType }))),
      h("div", { class: "card-main" },
        h("div", { class: "card-body" },
          h("p", { text: p.summary }),
          p.highlights.length ? h("ul", { class: "points" }, p.highlights.map((x) => h("li", { text: x }))) : null,
          p.formula ? h("p", { class: "formula", text: p.formula }) : null),
        h("div", { class: "card-foot" },
          h("ul", { class: "tags", "aria-label": "Built with" }, p.stack.map((t) => h("li", { text: t }))),
          links)));
    cards.append(card);
    planets.push({ canvas, cfg: p.planet, seed: 101 + i * 37, card });
  });

  // Planets need real layout sizes, so mount them after the cards are in the DOM.
  requestAnimationFrame(() => {
    for (const pl of planets) {
      const api = mountPlanet(pl.canvas, pl.cfg, pl.seed, { reducedMotion: reduced });
      if (!api) continue;
      pl.card.addEventListener("pointerenter", () => api.hover(true));
      pl.card.addEventListener("pointerleave", () => api.hover(false));
    }
  });

  filters.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter");
    if (!btn) return;
    const id = btn.dataset.filter;
    $$(".filter", filters).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    const shown = [];
    for (const card of $$(".card", cards)) {
      const match = id === "all" || card.dataset.kinds.split(" ").includes(id);
      card.hidden = !match;
      // The featured layout is only used when every project is showing.
      if (card.dataset.id === "nexora") card.classList.toggle("featured", id === "all");
      if (match) shown.push(card);
    }
    if (motion) gsap.fromTo(shown, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: "expo.out", stagger: 0.06, clearProps: "transform" });
    if (ScrollTrigger) ScrollTrigger.refresh();
  });

  if (finePointer && !reduced) {
    for (const card of $$(".card", cards)) {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(1200px) rotateX(${(-y * 3).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transition = "transform 0.6s cubic-bezier(0.16,1,0.3,1), border-color 0.4s, box-shadow 0.5s";
        card.style.transform = "";
        setTimeout(() => { card.style.transition = ""; }, 600);
      });
    }
  }
}

// ----- Evolution: journey ----------------------------------------------------
function renderEvolution() {
  const list = $("#timeline");
  for (const e of EVOLUTION) {
    list.append(h("li", { class: "stage" },
      h("div", { class: "stage-when" }, h("b", { text: e.stage }), h("span", { text: e.when })),
      h("div", { class: "stage-star", "aria-hidden": "true" }, h("i", { class: `s-${e.star}` })),
      h("div", { class: "stage-body" }, h("h3", { text: e.title }), h("p", { text: e.body }))));
  }
  if (motion) {
    gsap.fromTo("#beam", { scaleY: 0 }, {
      scaleY: 1,
      ease: "none",
      scrollTrigger: { trigger: list, start: "top 60%", end: "bottom 60%", scrub: 0.6 },
    });
    for (const st of $$(".stage", list)) {
      const star = $(".stage-star i", st);
      gsap.fromTo(star, { scale: 0.45, opacity: 0.35 }, {
        scale: 1,
        opacity: 1,
        duration: 0.9,
        ease: "back.out(2.6)",
        scrollTrigger: { trigger: st, start: "top 62%", toggleActions: "play none none reverse" },
      });
    }
  }
}

// ----- Signal: contact ----------------------------------------------------------
function renderSignal() {
  const channels = $("#channels");
  const rows = [
    { k: "Email", v: PROFILE.email, href: `mailto:${PROFILE.email}`, copy: PROFILE.email },
    { k: "Phone", v: PROFILE.phone, href: `tel:${PROFILE.phoneHref}`, copy: PROFILE.phoneHref },
    { k: "Based in", v: PROFILE.location },
  ];
  for (const r of rows) {
    const value = r.href ? h("a", { href: r.href, "data-copy-target": true, text: r.v }) : h("span", { text: r.v });
    const li = h("li", { class: "channel", "data-copy-scope": true },
      h("span", { class: "k", text: r.k }),
      h("span", { class: "v" }, value),
      r.copy ? h("button", { class: "copy", type: "button", "aria-label": `Copy ${r.k.toLowerCase()}`, text: "Copy" }) : h("span"));
    const btn = $(".copy", li);
    if (btn) btn.addEventListener("click", () => copyText(r.copy, btn));
    channels.append(li);
  }

  const socials = $("#socials");
  for (const so of SOCIALS) {
    socials.append(h("li", {}, h("a", { href: so.href, target: "_blank", rel: "noopener noreferrer" }, so.label, h("small", { text: so.handle }))));
  }

  const topic = $("#cf-topic");
  for (const t of CONTACT_TOPICS) topic.append(h("option", { value: t, text: t }));

  const form = $("#contactForm");
  const status = $("#formStatus");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#cf-name").value.trim();
    const email = $("#cf-email").value.trim();
    const message = $("#cf-message").value.trim();
    const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    $("#cf-name").setAttribute("aria-invalid", String(!name));
    $("#cf-email").setAttribute("aria-invalid", String(!okEmail));
    $("#cf-message").setAttribute("aria-invalid", String(!message));
    if (!name || !okEmail || !message) {
      status.textContent = !name ? "Add your name so I know who's writing." : !okEmail ? "Check your email address so I can reply." : "Add a short message before sending.";
      return;
    }
    const subject = `[Portfolio] ${topic.value} from ${name}`;
    const body = `${message}\n\n${name}\n${email}`;
    const full = `To: ${PROFILE.email}\nSubject: ${subject}\n\n${body}`;
    status.replaceChildren(
      "Your email app should open with this message ready to send. If nothing opened, copy it and email ",
      h("span", { style: "color:var(--ink)", text: PROFILE.email }), ".");
    const copyBtn = h("button", { class: "copy", type: "button", text: "Copy message" });
    copyBtn.addEventListener("click", () => copyText(full, copyBtn));
    status.append(copyBtn);
    window.location.href = `mailto:${PROFILE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  const css = getComputedStyle(document.documentElement);
  mountPulsar($("#pulsar"), {
    reducedMotion: reduced,
    ink: css.getPropertyValue("--ink").trim() || "#eceef6",
    accent: css.getPropertyValue("--accretion").trim() || "#ffb46a",
  });
}

// ----- Nav, clock, spectrum ---------------------------------------------------
const SECTION_IDS = ["hero", "origin", "orbits", "catalogue", "evolution", "signal"];
// Rest wavelengths (nm) of strong absorption lines: Ca K, Ca H, Hδ, Hγ, Hβ, Mg b, Na D, Hα.
const LINES_NM = [393.4, 396.8, 410.2, 434.0, 486.1, 517.3, 589.0, 656.3];
const Z_MAX = 0.1;

function setupChrome(cosmosRef) {
  const nav = $("#nav");
  const menuBtn = $("#menuBtn");
  const menu = $("#mobileMenu");
  menuBtn.addEventListener("click", () => {
    const open = menuBtn.getAttribute("aria-expanded") !== "true";
    menuBtn.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
    nav.classList.add("scrolled");
  });
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) { menuBtn.setAttribute("aria-expanded", "false"); menu.hidden = true; }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) { menu.hidden = true; menuBtn.setAttribute("aria-expanded", "false"); menuBtn.focus(); }
  });

  const links = $$("[data-nav]");
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      const id = en.target.id;
      links.forEach((a) => a.classList.toggle("active", a.dataset.nav === id));
    }
  }, { rootMargin: "-45% 0px -50% 0px" });
  SECTION_IDS.forEach((id) => io.observe(document.getElementById(id)));

  const clock = $("#clock");
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const tickClock = () => { clock.textContent = fmt.format(new Date()); };
  tickClock();
  setInterval(tickClock, 1000);

  const lineBox = $("#spectrumLines");
  const lineEls = LINES_NM.map(() => { const i = document.createElement("i"); lineBox.append(i); return i; });
  const fill = $("#spectrumFill");
  const zRead = $("#zRead");

  let stops = [];
  const computeStops = () => {
    const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    let prev = -1;
    stops = SECTION_IDS.map((id, i) => {
      const el = document.getElementById(id);
      let p = i === 0 ? 0 : Math.min(el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.08, max) / max;
      p = Math.max(p, prev + 0.02);
      prev = p;
      return Math.min(p, 1);
    });
    cosmosRef.api?.setStops(stops);
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const p = Math.min(Math.max(window.scrollY / max, 0), 1);
      nav.classList.toggle("scrolled", window.scrollY > 30 || !menu.hidden);
      fill.style.transform = `scaleX(${p})`;
      const z = p * Z_MAX;
      zRead.textContent = z.toFixed(4);
      LINES_NM.forEach((nm, i) => {
        const x = ((nm * (1 + z) - 380) / (750 - 380)) * 100;
        lineEls[i].style.left = `${x}%`;
      });
      cosmosRef.api?.setProgress(p);
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { computeStops(); onScroll(); });
  if ("ResizeObserver" in window) new ResizeObserver(() => { computeStops(); onScroll(); }).observe(document.body);
  computeStops();
  onScroll();
  return { refresh() { computeStops(); onScroll(); } };
}

// ----- Hero intro ----------------------------------------------------------------
function splitChars(node) {
  const text = node.textContent;
  node.textContent = "";
  for (const ch of text) node.append(h("span", { class: "char", text: ch }));
}

function heroIntro() {
  splitChars($(".hero-first"));
  splitChars($(".hero-last"));
  scramble($(".hero-eyebrow"), 1200);
  if (!motion) return;
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(".nav-inner", { opacity: 0, y: -14, duration: 1.2 }, 0.5)
    .from(".hero-eyebrow", { opacity: 0, y: 10, duration: 1 }, 0.15)
    .from(".hero-name .char", { yPercent: 34, opacity: 0, filter: "blur(18px)", duration: 1.6, stagger: 0.065, clearProps: "filter" }, 0.3)
    .from([".hero-role", ".hero-sub"], { opacity: 0, y: 18, duration: 1.1, stagger: 0.1 }, 0.95)
    .from(".hero-cta .btn", { opacity: 0, y: 18, duration: 1, stagger: 0.08 }, 1.1)
    .from(".hud", { opacity: 0, duration: 1.4 }, 1.3);

  // As the visitor scrolls out of the hero, the title drifts up and dims.
  const out = { trigger: "#hero", start: "top top", end: "bottom 20%", scrub: true };
  gsap.to(".hero-name", { yPercent: -28, opacity: 0.15, ease: "none", scrollTrigger: out });
  gsap.to([".hero-eyebrow", ".hero-role", ".hero-sub", ".hero-cta"], { y: -60, opacity: 0, ease: "none", scrollTrigger: out });
  gsap.to(".hud", { opacity: 0, ease: "none", scrollTrigger: { ...out, end: "30% top" } });
}

// ----- Reveals ---------------------------------------------------------------------
// A "focus pull": content starts readable but soft, then sharpens like a telescope.
function reveals() {
  for (const eb of $$(".plate .eyebrow")) {
    const label = eb.querySelector("span");
    if (!label) continue;
    if (motion) ScrollTrigger.create({ trigger: eb, start: "top 88%", once: true, onEnter: () => scramble(label, 700) });
  }
  if (!motion) return;
  const focus = { opacity: 0.3, y: 40, filter: "blur(10px)" };
  for (const el of $$("[data-reveal]")) {
    gsap.from(el, { ...focus, duration: 1.3, ease: "expo.out", clearProps: "filter,transform", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
  }
  ScrollTrigger.batch(".card, .skill-group, .star-row, .channel", {
    start: "top 92%",
    once: true,
    onEnter: (batch) => gsap.from(batch, { ...focus, y: 28, duration: 1.1, ease: "expo.out", stagger: 0.07, clearProps: "filter,transform" }),
  });
  ScrollTrigger.batch(".stage-body, .stage-when", {
    start: "top 88%",
    once: true,
    onEnter: (batch) => gsap.from(batch, { opacity: 0.3, x: 24, filter: "blur(6px)", duration: 1, ease: "expo.out", stagger: 0.05, clearProps: "filter,transform" }),
  });
  gsap.from(".orbit", { scale: 0.86, rotate: -18, opacity: 0.3, duration: 1.8, ease: "expo.out", scrollTrigger: { trigger: ".orbit", start: "top 85%", once: true } });
}

// ----- Cursor and magnetic buttons ------------------------------------------------
function cursor() {
  if (!finePointer || reduced) return;
  document.body.classList.add("cursor-on");
  const dot = $(".cursor-dot");
  const ring = $(".cursor-ring");
  let x = -100, y = -100, rx = -100, ry = -100;
  window.addEventListener("pointermove", (e) => {
    x = e.clientX; y = e.clientY;
    dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, { passive: true });
  const loop = () => {
    rx += (x - rx) * 0.18;
    ry += (y - ry) * 0.18;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    requestAnimationFrame(loop);
  };
  loop();
  const hoverSel = "a, button, [role='button'], .star-g, .skill-group, .card";
  document.addEventListener("pointerover", (e) => {
    document.body.classList.toggle("cursor-hover", Boolean(e.target.closest(hoverSel)));
  });
  document.addEventListener("pointerleave", () => { dot.style.transform = ring.style.transform = "translate3d(-100px,-100px,0)"; });

  for (const btn of $$("[data-magnetic]")) {
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      btn.style.transform = `translate(${dx * 0.22}px, ${dy * 0.32}px)`;
    });
    btn.addEventListener("pointerleave", () => {
      btn.style.transition = "transform 0.5s cubic-bezier(0.16,1,0.3,1), background-color 0.3s, box-shadow 0.4s";
      btn.style.transform = "";
      setTimeout(() => { btn.style.transition = ""; }, 500);
    });
  }
}

// ----- Boot -------------------------------------------------------------------------
async function startCosmos() {
  try {
    const { initCosmos } = await import("./cosmos.js");
    const api = initCosmos($("#cosmos"), { reducedMotion: reduced });
    if (api) document.body.classList.add("has-webgl");
    return api;
  } catch (err) {
    console.warn("WebGL scene unavailable, showing the static sky.", err);
    return null;
  }
}

renderOrigin();
renderOrbits();
renderCatalogue();
renderEvolution();
renderSignal();
heroIntro();
reveals();
cursor();

const cosmosRef = { api: null };
const chrome = setupChrome(cosmosRef);
startCosmos().then((api) => {
  cosmosRef.api = api;
  chrome.refresh();
  if (ScrollTrigger) ScrollTrigger.refresh();
});

if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger?.refresh());
