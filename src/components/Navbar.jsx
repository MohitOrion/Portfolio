import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { scrollToId } from "@/lib/scroll";

const LINKS = [
  { id: "home", label: "Home", testid: "nav-home-link" },
  { id: "about", label: "About", testid: "nav-about-link" },
  { id: "skills", label: "Skills", testid: "nav-skills-link" },
  { id: "projects", label: "Projects", testid: "nav-projects-link" },
  { id: "journey", label: "Journey", testid: "nav-timeline-link" },
  { id: "contact", label: "Contact", testid: "nav-contact-link" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id) => {
    setOpen(false);
    scrollToId(id);
  };

  return (
    <motion.header
      data-testid="portfolio-navbar"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "border-b border-white/5 bg-[#030712]/75 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          data-testid="nav-logo"
          onClick={() => go("home")}
          className="font-mono text-sm font-semibold tracking-[0.2em] text-white transition-opacity hover:opacity-80"
        >
          MOHIT<span className="text-cyan-400">.DEV</span>
        </button>

        <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-slate-950/35 px-2 py-1.5 backdrop-blur-md md:flex">
          {LINKS.map((l) => (
            <button
              key={l.id}
              data-testid={l.testid}
              onClick={() => go(l.id)}
              className="group relative rounded-full px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400 transition-all duration-200 hover:bg-white/5 hover:text-cyan-300"
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-cyan-400 transition-all duration-300 group-hover:w-full" />
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300/80 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
            Available for work
          </div>
          <button
            data-testid="nav-mobile-menu-button"
            onClick={() => setOpen(!open)}
            className="text-slate-300 md:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-white/5 bg-[#030712]/95 px-6 py-4 backdrop-blur-xl md:hidden"
        >
          {LINKS.map((l) => (
            <button
              key={l.id}
              data-testid={`mobile-${l.testid}`}
              onClick={() => go(l.id)}
              className="block w-full py-3 text-left font-mono text-xs uppercase tracking-[0.2em] text-slate-300 hover:text-cyan-300"
            >
              {l.label}
            </button>
          ))}
        </motion.nav>
      )}
    </motion.header>
  );
}
