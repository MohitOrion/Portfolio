# Orion: Mohit Rai's portfolio

An astrophysics-themed portfolio. The page opens at the event horizon of a black hole at the centre of a spiral galaxy, and the camera pulls back as you scroll.

| Section | What it shows |
| --- | --- |
| Hero | A real-time black hole (lensed accretion disk, photon ring, Doppler beaming) in a 70,000-particle spiral galaxy |
| About | The Orion constellation plotted from real sky coordinates. Each star carries a fact about me |
| Skills | Rings of skills orbiting a central star |
| Projects | An exoplanet catalogue with a procedurally drawn planet per project |
| Journey | My path told as a star's life cycle |
| Contact | A live pulsar plot after PSR B1919+21, ticking at its real 1.3373 s period, plus the contact form |

The rainbow progress bar under the navigation is a stellar spectrum: its dark absorption lines shift towards red as you scroll away (redshift).

Built with plain JavaScript (no framework), [three.js](https://threejs.org) for the 3D scene, [GSAP](https://gsap.com) for scroll animation, and [Vite](https://vite.dev) to run and bundle it.

## Run it

```bash
npm install
npm run dev       # local dev server with live reload
npm run build     # production build into dist/
npm run preview   # serve the production build locally
npm run lint      # check the code for mistakes
```

## Change your details

Everything personal lives in **[`src/data.js`](src/data.js)**: profile, socials, the Orion facts, skills, projects, timeline and contact-form topics. Edit it and the page updates. You don't need to touch any other file for content changes.

## How the code is organised

Each part of the page has its own JavaScript file and its own CSS file, with matching names.

```
index.html                 page structure for the portfolio
inbox/index.html           page structure for the private inbox (/inbox)

src/
  main.js                  entry point: builds each section, then starts the 3D sky
  data.js                  ← your content
  config.js                optional contact backend (see below)

  sections/                one file per page section
    hero.js                  name animation on load, fade-out on scroll
    origin.js                About: Orion star chart + fact list
    orbits.js                Skills: orbit rings + skill groups
    catalogue.js             Projects: cards, filters, hover tilt
    evolution.js             Journey: timeline and its scroll-driven beam
    signal.js                Contact: details, copy buttons, form

  ui/                      things that span the whole page
    nav.js                   menu, current-section highlight, India clock
    progress.js              spectrum progress bar, redshift readout, camera position
    reveals.js               fade-in as content scrolls into view
    cursor.js                custom cursor and magnetic buttons

  cosmos/                  the WebGL background
    scene.js                 builds the galaxy, stars and black hole; camera path; render loop
    shaders.js               GPU programs (with comments explaining the physics)

  canvas/                  small 2D animations
    planets.js               rotating planets on project cards
    pulsar.js                the pulsar plot

  lib/                     small helpers shared by everything
    dom.js                   create elements, copy to clipboard
    motion.js                reduced-motion check, GSAP setup, frame-rate limiter
    scramble.js              "decoding" text effect

  inbox/inbox.js           the /inbox page logic

  styles/                  CSS, split the same way as the JavaScript
    tokens.css               every colour, font and size (start here to restyle)
    index.css                imports the portfolio's stylesheets in order
```

Each file starts with a comment explaining what it does. The deployed site is minified by Vite, but the source in this repository stays readable.

## Contact form and inbox

The form works with or without a backend:

- **With a backend:** set `VITE_BACKEND_URL` to your API's base URL (in Vercel: Project → Settings → Environment Variables, then redeploy). The form POSTs `{ name, email, role_interest, message }` to `/api/contact`, the same request the previous version of the site sent. Messages can be read at **`/inbox`**, which signs in with `/api/auth/login`.
- **Without one:** the form opens the visitor's email app with the message already written.

For local development, copy `.env.example` to `.env`.

## Performance

- The nebula sky is rendered once into a texture instead of every frame.
- The 3D scene is capped at 60 fps, so 120/144 Hz monitors don't do double the work.
- If frames are slow, the canvas resolution drops automatically until the animation is smooth.
- The planet and pulsar animations run at 30 fps and pause when scrolled out of view.
- No `backdrop-filter` blur over the moving background, which is expensive to redraw.
- three.js loads separately from the page text, so content appears before the 3D scene.

## Accessibility and fallbacks

- Respects the "reduce motion" setting: the scene renders still and animations are skipped.
- If WebGL isn't available, a painted CSS sky replaces the 3D scene and all content stays readable.

## Deploy

The Vercel project builds this repository with `npm run build` and serves `dist/`. No settings need changing. `vercel.json` only adds a rewrite so `/inbox` works.
