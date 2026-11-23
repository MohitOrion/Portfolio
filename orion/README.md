# Orion — Mohit Rai's portfolio

An astrophysics-themed portfolio. The page opens at the event horizon of a black hole at the centre of a spiral galaxy, and the camera pulls back as you scroll.

- **Hero**: a real-time black hole (WebGL shader with a lensed accretion disk, photon ring and Doppler beaming) inside a 90,000-particle spiral galaxy.
- **About**: the Orion constellation plotted from real sky coordinates. Each star carries a fact about me.
- **Skills**: concentric orbits, one ring per part of the stack.
- **Projects**: an exoplanet catalogue with procedurally rendered planets.
- **Journey**: stellar evolution, from nebula to main sequence.
- **Contact**: a live pulsar plot after PSR B1919+21, ticking at its real 1.3373 s period.
- **Progress bar**: a stellar spectrum whose absorption lines redshift as you scroll away.

No build step. It is plain HTML, CSS and JavaScript modules, with Three.js and GSAP loaded from CDNs.

## Edit your details

Everything personal lives in [`js/data.js`](js/data.js): profile, socials, the Orion facts, skills, projects, timeline and contact topics. Change it there and the page updates.

## Run locally

ES modules need a local server (opening the file directly won't work):

```bash
cd orion
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

**Vercel**: in the project settings, set *Root Directory* to `orion` and *Framework Preset* to *Other*. No build command is needed.

**GitHub Pages**: publish the `orion` folder (for example with `actions/upload-pages-artifact` and `path: orion`).

## Files

| File | What it does |
| --- | --- |
| `index.html` | Page structure |
| `css/style.css` | All styles and design tokens |
| `js/data.js` | Your content |
| `js/main.js` | Renders content, navigation, scroll animations, cursor, contact form |
| `js/cosmos.js` | The WebGL black hole, galaxy and camera path |
| `js/planets.js` | Procedural planets on the project cards |
| `js/pulsar.js` | The pulsar plot in the contact section |

## Accessibility and fallbacks

- Respects `prefers-reduced-motion`: the scene renders still and animations are skipped.
- Works without WebGL or if a CDN is blocked: a CSS sky replaces the 3D scene and all content stays readable.
- The contact form opens the visitor's email app with the message filled in. There is no backend.
