import { Chapter, Reveal } from "@/components/Chapter";

const EVENTS = [
  {
    year: "2024 — Present",
    role: "BS in Data Science & Programming (2nd Year)",
    institution: "Indian Institute of Technology Madras",
    details:
      "Coursework in Statistics, Python & Data Structures, Machine Learning Foundations, Database Management Systems, Application Development, and Mathematical Modeling.",
  },
  {
    year: "2023 — 2024",
    role: "Full-Stack MERN & Web Architecture Mastery",
    institution: "Self-Directed, Hands-on Projects",
    details:
      "Built multiple full-stack React + Node/Express and FastAPI applications, mastering REST API design, MongoDB schema modeling, and modern responsive frontends.",
  },
  {
    year: "Ongoing",
    role: "Open Source & Freelance Exploration",
    institution: "Remote",
    details:
      "Contributing to open-source projects and taking on freelance builds — always shipping, always learning, always looking for the next hard problem.",
  },
];

export default function Timeline() {
  return (
    <section id="journey" data-testid="timeline-section" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Chapter number="04" name="Flight Log & Milestones" title="The Journey So Far" />

        <div className="relative mx-auto max-w-3xl">
          <div className="absolute bottom-2 left-[7px] top-2 w-px bg-gradient-to-b from-cyan-400/60 via-indigo-500/40 to-transparent" />
          <div className="space-y-12">
            {EVENTS.map((e, i) => (
              <Reveal key={e.role} delay={i * 0.12} className="relative pl-12">
                <span className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-cyan-400 bg-[#030712] shadow-[0_0_14px_rgba(6,182,212,0.6)]" />
                <div className="rounded-2xl border border-white/8 bg-slate-900/50 p-7 backdrop-blur-md transition-colors duration-300 hover:border-cyan-500/25">
                  <div className="font-mono text-xs uppercase tracking-[0.25em] text-cyan-400/80">
                    {e.year}
                  </div>
                  <h3 className="mt-3 font-display text-xl font-bold text-white">{e.role}</h3>
                  <div className="mt-1 text-sm font-medium text-indigo-300">{e.institution}</div>
                  <p className="mt-4 text-sm leading-relaxed text-slate-400">{e.details}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
