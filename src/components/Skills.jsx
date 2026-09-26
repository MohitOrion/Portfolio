import { BarChart3, Code2 } from "lucide-react";
import { Chapter, Reveal } from "@/components/Chapter";

const ROLES = [
  {
    icon: Code2,
    testid: "fullstack-intro-box",
    title: "The Full-Stack Developer",
    gradient: "from-cyan-500/40 to-transparent",
    accent: "text-cyan-300",
    intro:
      "I don't just write code — I build complete products people love to use. Hand me a blank screen and an idea, and I'll architect the database, wire up the APIs, and craft an interface that feels effortless. The MERN stack and FastAPI are my home turf, and clean, scalable architecture is my signature. I'm the developer who asks \"why\" before \"how\", sweats the details others skip, and treats your product like it's my own — because the moment we start working together, it is.",
    skills: ["React.js", "Node.js", "Express.js", "MongoDB", "Python FastAPI", "Tailwind CSS", "REST APIs", "Git & GitHub"],
  },
  {
    icon: BarChart3,
    testid: "data-analyst-intro-box",
    title: "The Data Analyst",
    gradient: "from-indigo-500/40 to-transparent",
    accent: "text-indigo-300",
    intro:
      "Every dataset is hiding a story worth hearing — my job is to find it and tell it beautifully. With Python, SQL, and a statistician's toolkit sharpened at IIT Madras, I dig through messy numbers, surface the patterns others walk right past, and turn them into decisions that actually move the needle. Dashboards, forecasts, machine-learning models — whatever helps you see clearly, I build it. Bring me your data, and watch it finally start pulling its weight.",
    skills: ["Python", "Pandas & NumPy", "SQL & Databases", "Scikit-Learn", "Data Visualization", "Statistical Analysis", "Tableau / Power BI", "Jupyter Notebooks"],
  },
];

export default function Skills() {
  return (
    <section id="skills" data-testid="skills-section" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Chapter number="02" name="Dual Capabilities" title="Two Skill Sets, One Obsession" />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {ROLES.map((role, i) => (
            <Reveal key={role.title} delay={i * 0.12}>
              <div
                data-testid={role.testid}
                className="group relative h-full overflow-hidden rounded-3xl border border-white/8 bg-slate-900/50 p-8 backdrop-blur-md transition-all duration-500 hover:border-cyan-500/25 sm:p-10"
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                />
                <div className="relative">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70">
                      <role.icon size={22} className={role.accent} />
                    </div>
                    <h3 className="font-display text-2xl font-bold text-white">{role.title}</h3>
                  </div>
                  <p className="mt-6 text-base leading-relaxed text-slate-300">{role.intro}</p>
                  <div className="mt-8 flex flex-wrap gap-2">
                    {role.skills.map((s) => (
                      <span
                        key={s}
                        data-cursor-hover
                        className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-1.5 font-mono text-xs text-slate-300 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/40 hover:text-cyan-200"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2} className="mt-10">
          <div className="rounded-2xl border border-white/5 bg-slate-950/40 px-6 py-5 text-center backdrop-blur-sm">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">
              Why hire a developer who understands data, or an analyst who can ship code —{" "}
              <span className="text-cyan-300">when you can hire both?</span>
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
