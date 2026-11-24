// ---------------------------------------------------------------------------
//  All personal content for the site lives here.
//  Edit this file to update text, links, skills, projects or the timeline.
// ---------------------------------------------------------------------------

export const PROFILE = {
  name: "Mohit Rai",
  handle: "MohitOrion",
  roles: ["Full-Stack Developer", "Data Analyst"],
  school: "IIT Madras",
  program: "BS in Data Science & Programming",
  year: "2nd year",
  location: "India · open to remote",
  email: "mohitroy319@gmail.com",
  phone: "+91 80769 00814",
  phoneHref: "+918076900814",
};

export const SOCIALS = [
  { id: "github", label: "GitHub", handle: "MohitOrion", href: "https://github.com/MohitOrion" },
  { id: "linkedin", label: "LinkedIn", handle: "mohitrai", href: "https://www.linkedin.com/in/mohitrai" },
  { id: "leetcode", label: "LeetCode", handle: "MohitOrion", href: "https://leetcode.com/u/MohitOrion" },
  { id: "instagram", label: "Instagram", handle: "mohitroyfbd", href: "https://instagram.com/mohitroyfbd" },
  { id: "discord", label: "Discord", handle: "mohitorion", href: "https://discord.gg/mohitorion" },
];

// The Orion constellation, with each star carrying one fact.
// x/y are real sky offsets in degrees from the Orion Nebula (RA 5h35m, Dec −5.4°),
// with east to the left as on a star chart. mag = apparent visual magnitude.
export const ORION = [
  { id: "meissa", name: "Meissa", bayer: "λ Ori", type: "O8 III", dist: "~1,100 ly", mag: 3.3, x: 0.0, y: 9.9, color: "#cfe0ff",
    key: "Studying", fact: "BS in Data Science & Programming at IIT Madras, now in my 2nd year." },
  { id: "betelgeuse", name: "Betelgeuse", bayer: "α Ori", type: "M1 Ia", dist: "~550 ly", mag: 0.5, x: -5.0, y: 7.4, color: "#ffb27a",
    key: "Builds", fact: "Full-stack web apps with React, Node.js, FastAPI and Flask." },
  { id: "bellatrix", name: "Bellatrix", bayer: "γ Ori", type: "B2 III", dist: "~250 ly", mag: 1.6, x: 2.5, y: 6.35, color: "#d6e4ff",
    key: "Analyses", fact: "Datasets with Python, SQL and Power BI, from raw rows to decisions." },
  { id: "alnitak", name: "Alnitak", bayer: "ζ Ori", type: "O9.7 Ib", dist: "~1,260 ly", mag: 1.8, x: -1.4, y: -1.94, color: "#c8dcff",
    key: "Currently", fact: "Working on full-stack development." },
  { id: "alnilam", name: "Alnilam", bayer: "ε Ori", type: "B0 Ia", dist: "~2,000 ly", mag: 1.7, x: -0.25, y: -1.2, color: "#cfe0ff",
    key: "Collaborate", fact: "Happy to build together on Flask projects." },
  { id: "mintaka", name: "Mintaka", bayer: "δ Ori", type: "O9.5 II", dist: "~1,200 ly", mag: 2.2, x: 0.8, y: -0.3, color: "#c8dcff",
    key: "Seeking", fact: "Internships in software engineering or data analytics." },
  { id: "m42", name: "Orion Nebula", bayer: "M42", type: "Stellar nursery", dist: "~1,344 ly", mag: 4.0, x: 0.0, y: -5.4, color: "#f3b6ff", nebula: true,
    key: "Dream", fact: "A profession that merges astronomy and technology." },
  { id: "saiph", name: "Saiph", bayer: "κ Ori", type: "B0.5 Ia", dist: "~650 ly", mag: 2.1, x: -3.15, y: -9.67, color: "#cfe0ff",
    key: "Based in", fact: "India, and open to remote work." },
  { id: "rigel", name: "Rigel", bayer: "β Ori", type: "B8 Ia", dist: "~860 ly", mag: 0.1, x: 5.2, y: -8.2, color: "#b9d3ff",
    key: "Brightest build", fact: "Nexora, an AI opportunity matcher for students." },
];

export const ORION_LINES = [
  ["meissa", "betelgeuse"], ["meissa", "bellatrix"], ["betelgeuse", "bellatrix"],
  ["betelgeuse", "alnitak"], ["bellatrix", "mintaka"],
  ["alnitak", "alnilam"], ["alnilam", "mintaka"],
  ["alnitak", "saiph"], ["mintaka", "rigel"],
];

// Skills, as concentric orbits (inner → outer).
export const ORBITS = [
  { id: "lang", label: "Languages", period: 70, items: ["Python", "JavaScript", "SQL", "C", "Java", "Bash"] },
  { id: "front", label: "Frontend", period: 95, items: ["React", "Vite", "Tailwind CSS", "HTML5", "CSS3", "Bootstrap", "Jinja", "Vue.js"] },
  { id: "back", label: "Backend & databases", period: 125, items: ["Node.js", "Express", "FastAPI", "Flask", "Django", "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Firebase"] },
  { id: "data", label: "Data, AI & cloud", period: 160, items: ["Pandas", "NumPy", "Matplotlib", "Scikit-learn", "Power BI", "Jupyter", "Gemma LLM", "Git", "GitHub Actions", "AWS", "Azure", "Vercel", "Netlify"] },
];

export const ROLES = [
  {
    id: "dev",
    title: "As a developer",
    body: "I build complete products: the database schema, the API and the interface on top. React and FastAPI are my default stack, and I've shipped apps with Flask, Node.js and Express. I ask why before how, and I care about the details other people skip.",
  },
  {
    id: "analyst",
    title: "As an analyst",
    body: "I clean messy datasets, query them with SQL and turn what I find into dashboards and recommendations people can act on. Python, Pandas and Power BI do most of the work, and the statistics I study at IIT Madras keep the conclusions honest.",
  },
];

// Projects, logged like exoplanet discoveries.
// planet: how the card's planet looks. hue = bright colour, hue2 = dark colour (RGB),
//         bands = stripe count, tilt = axial tilt (radians), speed = spin speed,
//         plus one optional style flag: rings, rocky, lava or ocean.
export const PROJECTS = [
  {
    id: "nexora",
    featured: true,
    name: "Nexora",
    designation: "MRO-2026-05 b",
    kinds: ["fullstack", "data"],
    kindLabel: "AI · Full-stack",
    discovered: "Oct 2026",
    planetType: "Ringed gas giant",
    summary:
      "An AI opportunity radar for students. Crawlers collect scholarships, hackathons and grants from Buddy4Study, Devfolio, Unstop and government PDFs; Gemma extracts the details; a matching engine ranks every opportunity against a student's profile.",
    highlights: [
      "4-factor match engine scores eligibility in under 50 ms with no live LLM calls",
      "Policy Conflict Shield flags tuition grants that can't be combined",
      "Exports deadlines as RFC 5545 calendar files with 72 h and 24 h alarms",
      "“Ask Aventra” assistant explains each score with retrieval-augmented answers",
    ],
    formula: "score = 35·academic + 25·domicile + 25·skills + 15·gates",
    stack: ["FastAPI", "React", "Vite", "PostgreSQL (Neon)", "SQLAlchemy", "Gemma", "PyMuPDF", "Supabase"],
    links: [{ label: "Source", href: "https://github.com/MohitOrion/Nexora" }],
    planet: { hue: [255, 176, 96], hue2: [140, 72, 40], bands: 9, rings: true, tilt: -0.35, speed: 0.012 },
  },
  {
    id: "customer",
    name: "Customer Behavior Analysis",
    designation: "MRO-2026-04 b",
    kinds: ["data"],
    kindLabel: "Data analytics",
    discovered: "Oct 2026",
    planetType: "Ocean world",
    summary:
      "An end-to-end analytics workflow on 3,900 retail purchases: cleaning and EDA in Python, business questions answered in SQL, and an interactive Power BI dashboard with a written report and deck.",
    highlights: [
      "Segments customers by spend, loyalty and subscription behaviour",
      "SQL queries answer concrete business questions on product and channel",
    ],
    stack: ["Python", "Pandas", "PostgreSQL", "Power BI", "Excel"],
    links: [
      { label: "Source", href: "https://github.com/MohitOrion/Projects/tree/main/Data-Analysis" },
      { label: "Presentation", href: "https://docs.google.com/presentation/d/1DiZGOmRbsc9rOzNnwRAttsT5OmrF7IB-/edit?usp=sharing&ouid=108632968501610087936&rtpof=true&sd=true" },
    ],
    planet: { hue: [96, 178, 255], hue2: [20, 50, 120], bands: 5, rings: false, tilt: 0.2, speed: 0.008, ocean: true },
  },
  {
    id: "hms",
    name: "Hospital Management System",
    designation: "MRO-2026-01 b",
    kinds: ["fullstack"],
    kindLabel: "Full-stack",
    discovered: "Jul 2026",
    planetType: "Rocky world",
    summary:
      "A Flask web app with separate dashboards for admins, doctors and patients. Admins approve doctors, doctors publish availability by session, and patients book appointments and keep a running medical history.",
    highlights: [
      "Role-based access with Flask-Login",
      "Relational schema for profiles, availability, appointments and history",
    ],
    stack: ["Flask", "SQLAlchemy", "SQLite", "Jinja", "Flask-Login"],
    links: [],
    note: "Source private (IIT Madras coursework)",
    planet: { hue: [214, 132, 100], hue2: [70, 40, 36], bands: 14, rings: false, tilt: 0.1, speed: 0.006, rocky: true },
  },
  {
    id: "showcase",
    name: "Project Showcase",
    designation: "MRO-2026-02 b",
    kinds: ["web"],
    kindLabel: "Web",
    discovered: "Sep 2026",
    planetType: "Ice giant",
    summary:
      "A hub for my small browser builds: Rock Paper Scissors, Tic-Tac-Toe and an animated checkbox, plus a Python Minesweeper. Deployed to GitHub Pages by a GitHub Actions workflow.",
    highlights: [],
    stack: ["HTML", "CSS", "JavaScript", "Bootstrap", "GitHub Actions"],
    links: [
      { label: "Live", href: "https://mohitorion.github.io/Projects/" },
      { label: "Source", href: "https://github.com/MohitOrion/Projects/tree/main/Small%20Projects" },
    ],
    planet: { hue: [150, 236, 230], hue2: [40, 90, 120], bands: 6, rings: false, tilt: -0.15, speed: 0.01 },
  },
  {
    id: "stargazers",
    name: "Stargazers Log",
    designation: "MRO-2026-03 b",
    kinds: ["web"],
    kindLabel: "Web",
    discovered: "Sep 2026",
    planetType: "Lava world",
    summary:
      "A browsable archive of the GitHub repositories I've starred, rendered from a JSON log with language and topic tags. Deployed to GitHub Pages.",
    highlights: [],
    stack: ["JavaScript", "JSON", "CSS", "GitHub Pages"],
    links: [
      { label: "Live", href: "https://mohitorion.github.io/stargazers-log/" },
      { label: "Source", href: "https://github.com/MohitOrion/stargazers-log" },
    ],
    planet: { hue: [255, 110, 70], hue2: [60, 14, 20], bands: 11, rings: false, tilt: 0.25, speed: 0.009, lava: true },
  },
];

export const PROJECT_FILTERS = [
  { id: "all", label: "All" },
  { id: "fullstack", label: "Full-stack" },
  { id: "data", label: "Data & AI" },
  { id: "web", label: "Web" },
];

// Journey, told as stellar evolution.
export const EVOLUTION = [
  {
    stage: "Nebula",
    when: "2023",
    title: "First light on GitHub",
    body: "Joined GitHub as MohitOrion. Wrote my first programs in C and Java and my first web pages in HTML, CSS and JavaScript.",
    star: "nebula",
  },
  {
    stage: "Protostar",
    when: "2023 – 24",
    title: "Teaching myself the full stack",
    body: "Built small React, Node.js, Express, MongoDB and FastAPI apps to learn REST API design, schema modelling and responsive frontends.",
    star: "protostar",
  },
  {
    stage: "Ignition",
    when: "IIT Madras",
    title: "BS in Data Science & Programming",
    body: "Coursework in statistics, Python, data structures and algorithms, databases, machine learning foundations and application development. Now in my 2nd year.",
    star: "ignition",
  },
  {
    stage: "Main sequence",
    when: "Jul 2026",
    title: "Algorithms and a Flask app",
    body: "Weekly DSA practice in Python: searching and sorting, linked lists, stacks and queues, BFS and DFS, union-find, Kruskal's algorithm and heaps. Built a hospital management system in Flask for coursework.",
    star: "main",
  },
  {
    stage: "Main sequence",
    when: "Sep – Oct 2026",
    title: "Shipping in public",
    body: "Launched the Project Showcase and Stargazers Log on GitHub Pages, completed the Customer Behavior Analysis, and deployed my first portfolio on Vercel.",
    star: "main",
  },
  {
    stage: "Luminous",
    when: "Oct 2026",
    title: "Nexora",
    body: "Built an AI opportunity matcher end to end: crawlers, Gemma-powered extraction, a FastAPI backend on Neon Postgres and a React frontend.",
    star: "luminous",
  },
  {
    stage: "Next",
    when: "Ahead",
    title: "Looking for my first internship",
    body: "I want to join a team where I can ship real software and work with real data. In the long run, I want a career where astronomy and technology meet.",
    star: "next",
  },
];

// Topics for the contact form. The four after "Internship" match the options the
// contact backend has always received, so existing messages stay consistent.
export const CONTACT_TOPICS = ["Internship Opportunity", "Full-Stack Developer Role", "Data Analyst Role", "Freelance Project", "General Inquiry"];
