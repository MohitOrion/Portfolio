import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, Send, Telescope } from "lucide-react";
import { scrollToId } from "@/lib/scroll";
import { SOCIALS } from "@/lib/socials";

const BADGES = ["IIT Madras BS Student", "Full-Stack MERN", "Data Science & Analytics", "Open for Opportunities"];
const EASE = [0.16, 1, 0.3, 1];

const MaskedLine = ({ children, delay, className = "" }) => (
  <span className={`block overflow-hidden ${className}`}>
    <motion.span
      className="block"
      initial={{ y: "115%" }}
      animate={{ y: "0%" }}
      transition={{ duration: 1, delay, ease: EASE }}
    >
      {children}
    </motion.span>
  </span>
);

export default function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 170]);
  const planetY = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section id="home" data-testid="hero-section" ref={ref} className="relative flex min-h-screen items-center overflow-hidden">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-16 px-4 pb-24 pt-32 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
        <motion.div style={{ y: contentY, opacity: fade }}>
          <MaskedLine delay={0.15}>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300/90">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
              System online · Hello, universe
            </span>
          </MaskedLine>

          <h1 className="mt-4 font-display font-extrabold leading-[0.95] tracking-tight">
            <MaskedLine delay={0.3}>
              <span className="text-glow-cyan bg-gradient-to-r from-white via-cyan-100 to-indigo-300 bg-clip-text text-7xl text-transparent sm:text-8xl lg:text-9xl">
                MOHIT
              </span>
            </MaskedLine>
            <MaskedLine delay={0.45}>
              <span className="mt-3 block bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl lg:text-5xl">
                Full-Stack Engineer
              </span>
            </MaskedLine>
            <MaskedLine delay={0.58}>
              <span className="mt-1 block text-3xl font-bold text-slate-300 sm:text-4xl lg:text-5xl">
                & Data Analyst
              </span>
            </MaskedLine>
          </h1>

          <MaskedLine delay={0.75} className="mt-7">
            <p className="max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
              22-year-old builder and number-whisperer, currently in my 2nd year of the
              BS in Data Science & Programming at{" "}
              <span className="font-medium text-cyan-300">IIT Madras</span>. I turn ideas into
              products and raw data into decisions.
            </p>
          </MaskedLine>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.95, ease: EASE }}
            className="mt-8 flex flex-wrap gap-2.5"
          >
            {BADGES.map((b) => (
              <span
                key={b}
                className="rounded-full border border-cyan-500/25 bg-cyan-950/30 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-cyan-300/90"
              >
                {b}
              </span>
            ))}
            <div className="glass-panel absolute -bottom-20 -right-16 hidden w-56 rounded-2xl p-4 xl:block">
              <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
                <span>Orbit telemetry</span>
                <span className="text-emerald-300">Nominal</span>
              </div>
              <div className="mt-3 flex items-end gap-1">
                {[18, 30, 24, 42, 28, 36, 48, 34, 52, 44, 60].map((height, i) => (
                  <span key={i} className="w-1.5 rounded-full bg-gradient-to-t from-cyan-500/30 to-cyan-300" style={{ height }} />
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between font-mono text-[9px] text-slate-500">
                <span>signal strength</span>
                <span className="text-cyan-300">98.4%</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1, ease: EASE }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <button
              data-testid="hero-cta-projects"
              onClick={() => scrollToId("projects")}
              className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 px-7 py-3.5 font-medium text-white shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all duration-300 hover:shadow-[0_0_45px_rgba(6,182,212,0.6)]"
            >
              <Telescope size={18} className="transition-transform duration-300 group-hover:rotate-12" />
              Explore Works
            </button>
            <button
              data-testid="hero-cta-contact"
              onClick={() => scrollToId("contact")}
              className="group inline-flex items-center gap-2.5 rounded-full border border-cyan-500/30 bg-slate-900/50 px-7 py-3.5 font-medium text-cyan-300 transition-all duration-300 hover:border-cyan-400 hover:bg-cyan-950/40"
            >
              <Send size={18} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5" />
              Transmit Message
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.25, ease: EASE }}
            className="mt-9 flex items-center gap-3"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500">
              Find me on
            </span>
            <div className="h-px w-10 bg-white/10" />
            {SOCIALS.map(({ id, label, href, Icon }) => (
              <a
                key={id}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`hero-social-${id}`}
                aria-label={label}
                title={label}
                className="rounded-full border border-white/10 bg-slate-900/50 p-2.5 text-slate-400 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/50 hover:text-cyan-300 hover:shadow-[0_0_18px_rgba(6,182,212,0.35)]"
              >
                <Icon size={17} />
              </a>
            ))}
          </motion.div>
        </motion.div>

        <motion.div style={{ y: planetY }} className="relative hidden items-center justify-center lg:flex">
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, delay: 0.5, ease: EASE }}
            className="relative"
          >
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="relative h-72 w-72 rounded-full xl:h-80 xl:w-80"
              style={{
                background:
                  "radial-gradient(circle at 32% 28%, rgba(165,243,252,0.95) 0%, rgba(34,211,238,0.55) 22%, rgba(99,102,241,0.45) 48%, rgba(15,23,42,0.95) 78%)",
                boxShadow:
                  "0 0 90px rgba(6,182,212,0.35), 0 0 180px rgba(99,102,241,0.22), inset -30px -30px 80px rgba(3,7,18,0.9)",
              }}
            />
            <div
              className="animate-orbit absolute -inset-10 rounded-full border border-dashed border-cyan-400/20"
            >
              <span className="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-amber-400 shadow-[0_0_14px_#f59e0b]" />
            </div>
            <div className="absolute -inset-20 rounded-full border border-indigo-400/10" />
            {["React", "Python", "MongoDB"].map((chip, i) => (
              <motion.span
                key={chip}
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.8 }}
                className={`absolute rounded-lg border border-white/10 bg-slate-900/80 px-3 py-1.5 font-mono text-[11px] tracking-wider text-cyan-200 backdrop-blur-md ${
                  i === 0 ? "-left-16 top-10" : i === 1 ? "-right-14 top-1/3" : "-bottom-4 left-8"
                }`}
              >
                {chip}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <motion.button
        data-testid="hero-scroll-indicator"
        onClick={() => scrollToId("about")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-cyan-400/70 transition-colors hover:text-cyan-300"
        aria-label="Scroll to about"
      >
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
          <ArrowDown size={22} />
          <div className="pointer-events-none absolute inset-0 rounded-full border border-white/15" />
        </motion.div>
      </motion.button>
    </section>
  );
}
