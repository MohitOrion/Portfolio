import { ArrowUp } from "lucide-react";
import { scrollToId } from "@/lib/scroll";
import { SOCIALS } from "@/lib/socials";

export default function Footer() {
  return (
    <footer data-testid="portfolio-footer" className="relative z-10 border-t border-white/5 bg-slate-950/60 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row sm:px-6 lg:px-8">
        <div className="text-center sm:text-left">
          <div className="font-mono text-sm font-semibold tracking-[0.2em] text-white">
            MOHIT<span className="text-cyan-400">.DEV</span>
          </div>
          <p className="mt-2 font-mono text-[11px] tracking-wider text-slate-500">
            Designed & built by Mohit · © 2026 · IIT Madras
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            {SOCIALS.map(({ id, label, href, Icon }) => (
              <a
                key={id}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`footer-social-${id}`}
                aria-label={label}
                title={label}
                className="rounded-full border border-white/10 p-2.5 text-slate-400 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-400/40 hover:text-cyan-300"
              >
                <Icon size={15} />
              </a>
            ))}
          </div>
          <span className="hidden h-4 w-px bg-white/10 sm:block" />
          <a href="tel:+918076900814" className="font-mono text-xs tracking-wider text-slate-400 transition-colors hover:text-cyan-300">
            +91 80769 00814
          </a>
          <a href="mailto:mohitroy319@gmail.com" className="font-mono text-xs tracking-wider text-slate-400 transition-colors hover:text-cyan-300">
            mohitroy319@gmail.com
          </a>
          <button
            data-testid="back-to-top-button"
            onClick={() => scrollToId("home")}
            className="rounded-full border border-white/10 p-2.5 text-slate-400 transition-all duration-300 hover:border-cyan-400/40 hover:text-cyan-300"
            aria-label="Back to top"
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </footer>
  );
}
