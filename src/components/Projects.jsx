import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Code2, ExternalLink } from "lucide-react";
import { Chapter } from "@/components/Chapter";

const TABS = [
  { id: "all", label: "All Projects", testid: "project-filter-all" },
  { id: "web", label: "Full-Stack Web", testid: "project-filter-web" },
  { id: "analytics", label: "Data Analytics", testid: "project-filter-analytics" },
];

const PROJECTS = [
  {
    id: "proj-1",
    title: "CosmoPulse — Real-time Analytics Platform",
    cat: "web",
    catLabel: "Full-Stack Web",
    tech: ["React", "Node.js", "MongoDB", "FastAPI", "Tailwind"],
    summary:
      "Full-stack dashboard serving real-time system metrics, automated telemetry analysis, and user management secured with JWT auth.",
    image:
      "https://images.unsplash.com/photo-1720962158937-7ea890052166?crop=entropy&cs=srgb&fm=jpg&ixid=M3w8NTYxODF8MHwxfHNlYXJjaHw0fHxkYXRhJTIwYW5hbHl0aWNzJTIwZGFzaGJvYXJkJTIwdGVjaG5vbG9neSUyMGRhcmslMjB1aXxlbnwwfHx8fDE3ODkzOTEyNTZ8MA&ixlib=rb-4.1.0&q=85",
    github: "https://github.com/mohitroy319/cosmopulse",
    demo: "https://cosmopulse-demo.app",
  },
  {
    id: "proj-2",
    title: "Predictive Customer Churn Model",
    cat: "analytics",
    catLabel: "Data Analytics",
    tech: ["Python", "Pandas", "Scikit-Learn", "Matplotlib", "SQL"],
    summary:
      "Machine-learning workflow classifying churn risk at 92% accuracy, with automated feature-importance visualization and a full EDA report.",
    image:
      "https://images.unsplash.com/photo-1720962158789-9389a4f399da?crop=entropy&cs=srgb&fm=jpg&ixid=M3w8NTYxODF8MHwxfHNlYXJjaHwyfHxkYXRhJTIwYW5hbHl0aWNzJTIwZGFzaGJvYXJkJTIwdGVjaG5vbG9neSUyMGRhcmslMjB1aXxlbnwwfHx8fDE3ODkzOTEyNTZ8MA&ixlib=rb-4.1.0&q=85",
    github: "https://github.com/mohitroy319/churn-analytics",
    demo: "https://churn-analytics.app",
  },
  {
    id: "proj-3",
    title: "OrbitStore — MERN E-Commerce Engine",
    cat: "web",
    catLabel: "Full-Stack Web",
    tech: ["MongoDB", "Express", "React", "Node.js", "Redux"],
    summary:
      "End-to-end e-commerce store with product search, persistent carts, payment simulation, and an admin inventory control panel.",
    image:
      "https://images.unsplash.com/photo-1475139441338-693e7dbe20b6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwzfHxzcGFjZSUyMG5lYnVsYSUyMHN0YXJzJTIwZGFyayUyMHVuaXZlcnNlJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3ODkzOTEyNDh8MA&ixlib=rb-4.1.0&q=85",
    github: "https://github.com/mohitroy319/orbitstore",
    demo: "https://orbitstore-demo.app",
  },
  {
    id: "proj-4",
    title: "Financial Time-Series Forecasting",
    cat: "analytics",
    catLabel: "Data Analytics",
    tech: ["Python", "Statsmodels", "Streamlit", "Plotly", "Pandas"],
    summary:
      "Interactive financial dashboard forecasting stock volatility with ARIMA models and live candlestick telemetry.",
    image:
      "https://images.unsplash.com/photo-1720962158813-29b66b8e23e1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w8NTYxODF8MHwxfHNlYXJjaHwxfHxkYXRhJTIwYW5hbHl0aWNzJTIwZGFzaGJvYXJkJTIwdGVjaG5vbG9neSUyMGRhcmslMjB1aXxlbnwwfHx8fDE3ODkzOTEyNTZ8MA&ixlib=rb-4.1.0&q=85",
    github: "https://github.com/mohitroy319/financial-forecasting",
    demo: "https://financial-forecast.app",
  },
];

export default function Projects() {
  const [tab, setTab] = useState("all");
  const filtered = tab === "all" ? PROJECTS : PROJECTS.filter((p) => p.cat === tab);

  return (
    <section id="projects" data-testid="projects-section" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Chapter number="03" name="Featured Constellations" title="Projects That Speak for Me" />

        <div className="mb-12 flex flex-wrap gap-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              data-testid={t.testid}
              onClick={() => setTab(t.id)}
              className={`rounded-full px-5 py-2.5 font-mono text-xs uppercase tracking-[0.15em] transition-all duration-300 ${
                tab === t.id
                  ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.35)]"
                  : "border border-white/10 bg-slate-900/50 text-slate-400 hover:border-cyan-500/30 hover:text-cyan-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <motion.div layout className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {filtered.map((p) => (
              <motion.article
                layout
                key={p.id}
                data-testid={`project-card-${p.id}`}
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="group relative overflow-hidden rounded-3xl border border-white/8 bg-slate-900/50 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-[0_20px_60px_rgba(6,182,212,0.1)]"
              >
                <div className="signal-line absolute left-0 right-0 top-0 z-10 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
                  <span className="absolute left-5 top-5 rounded-full border border-cyan-400/30 bg-[#030712]/80 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300 backdrop-blur-md">
                    {p.catLabel}
                  </span>
                </div>

                <div className="p-7">
                  <h3 className="font-display text-xl font-bold text-white transition-colors duration-300 group-hover:text-cyan-200">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{p.summary}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {p.tech.map((t) => (
                      <span key={t} className="rounded-md bg-slate-950/70 px-2.5 py-1 font-mono text-[11px] text-slate-400">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center gap-4 border-t border-white/5 pt-5">
                    <a
                      href={p.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`project-github-${p.id}`}
                      className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-cyan-300"
                    >
                      <Code2 size={16} /> Code
                    </a>
                    <a
                      href={p.demo}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`project-demo-${p.id}`}
                      className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-cyan-300"
                    >
                      <ExternalLink size={16} /> Live Demo
                    </a>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
