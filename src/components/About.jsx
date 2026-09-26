import { GraduationCap, MapPin, User } from "lucide-react";
import { Chapter, Reveal } from "@/components/Chapter";

const STATS = [
  { value: "2nd Year", label: "BS Data Science @ IIT Madras" },
  { value: "22 Yrs", label: "Age / India based" },
  { value: "Dual Focus", label: "Full-Stack Dev + Data Analyst" },
];

const FACTS = [
  { icon: User, label: "Name", value: "Mohit, 22 (He/Him)" },
  { icon: GraduationCap, label: "Education", value: "BS Data Science & Programming, IIT Madras" },
  { icon: MapPin, label: "Base", value: "India · Open to Remote" },
];

export default function About() {
  return (
    <section id="about" data-testid="about-section" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Chapter number="01" name="Cosmic Origin" title="About Mohit" />

        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <div className="group relative mx-auto max-w-md">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-cyan-500/20 via-indigo-500/10 to-transparent blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1631624210938-539575f92e3c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MjJ8MHwxfHNlYXJjaHwxfHxkZXZlbG9wZXIlMjBwb3J0cmFpdCUyMHlvdW5nJTIwbWFsZSUyMGNvZGluZyUyMGNvbXB1dGVyfGVufDB8fHx8MTc4OTM5MTI0OHww&ixlib=rb-4.1.0&q=85"
                  alt="Mohit coding at his workstation"
                  className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030712]/85 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-cyan-300/90">
                    Currently orbiting
                  </div>
                  <div className="mt-1 font-display text-xl font-bold text-white">
                    IIT Madras · BS Data Science
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <div>
            <Reveal delay={0.1}>
              <p className="text-lg leading-relaxed text-slate-300">
                I'm Mohit — a 22-year-old from India who fell in love with two things that most
                people keep in separate boxes: <span className="text-cyan-300">building software</span> and{" "}
                <span className="text-indigo-300">understanding data</span>. Right now I'm in the 2nd year
                of my BS in Data Science & Programming at IIT Madras, spending my days between
                statistics lectures and late-night coding sessions.
              </p>
              <p className="mt-5 text-base leading-relaxed text-slate-400">
                What makes me different? I don't just build apps that work — I build apps that make
                sense of the data flowing through them. Whether it's a full-stack platform or a
                machine-learning pipeline, I bring engineering rigor and analytical curiosity to
                everything I ship.
              </p>
            </Reveal>

            <Reveal delay={0.2} className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-white/8 bg-slate-900/50 p-5 backdrop-blur-md transition-colors duration-300 hover:border-cyan-500/30"
                >
                  <div className="font-display text-2xl font-bold text-cyan-300">{s.value}</div>
                  <div className="mt-1.5 text-xs leading-relaxed text-slate-400">{s.label}</div>
                </div>
              ))}
            </Reveal>

            <Reveal delay={0.3} className="mt-8 space-y-3">
              {FACTS.map((f) => (
                <div key={f.label} className="flex items-center gap-4 rounded-xl border border-white/5 bg-slate-900/30 px-5 py-3.5">
                  <f.icon size={18} className="shrink-0 text-cyan-400" />
                  <span className="w-24 shrink-0 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
                    {f.label}
                  </span>
                  <span className="text-sm text-slate-200">{f.value}</span>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
