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
api/                       contact backend (Vercel Functions): contact.js, auth/login.js, health.js

src/
  main.js                  entry point: builds each section, then starts the 3D sky
  data.js                  ← your content
  config.js                where the contact backend lives (default: this site's /api)

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

The contact backend lives in [`api/`](api) and runs as Vercel Functions alongside the site, so there is no separate server to host.

| Endpoint | Who | What it does |
| --- | --- | --- |
| `POST /api/contact` | anyone | saves a message from the form |
| `GET /api/contact` | signed in | lists messages, newest first |
| `DELETE /api/contact?id=N` | signed in | deletes a message |
| `POST /api/auth/login` | anyone | signs in to the inbox, returns a 7-day token |
| `GET /api/health` | anyone | shows which parts are set up (never shows secrets) |

Messages are stored in Postgres (the table is created automatically). Read and delete them at **`/inbox`**.

Built-in protection: a hidden spam-trap field, a limit of 5 messages per visitor per 15 minutes, input length limits, slowed-down wrong passwords, and signed tokens. If the backend can't be reached, the form opens the visitor's email app instead, so no message is lost.

### Setting it up on Vercel

1. **Database:** in your Vercel project, open **Storage**, create a **Neon** Postgres database (free plan) and connect it to this project. That sets `DATABASE_URL` for you. (Or create one in your own Neon account and add its connection string as `DATABASE_URL`.)
2. **Inbox login:** under **Settings → Environment Variables**, add `ADMIN_EMAIL` and `ADMIN_PASSWORD` (12+ characters, not used anywhere else).
3. **Optional email alerts:** add `RESEND_API_KEY` from [resend.com](https://resend.com) to get an email for each new message. They go to `NOTIFY_EMAIL`, or `ADMIN_EMAIL` if that isn't set.
4. **Redeploy** (environment variables only apply to new deployments).
5. Open `/api/health`. It should say `"contactForm": "ready"`. Then send yourself a test message and read it at `/inbox`.

### Running it locally

`npm run dev` serves the pages only; the form then falls back to email. To run the functions too, use the Vercel CLI (`npx vercel dev`) with the variables above in a `.env` file. See `.env.example`.

To use a backend hosted elsewhere instead, set `VITE_BACKEND_URL` to its base URL (see `src/config.js`).

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

The Vercel project builds this repository with `npm run build`, serves `dist/`, and deploys the functions in `api/` automatically. `vercel.json` only adds a rewrite so `/inbox` works.
