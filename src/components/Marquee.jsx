const ITEMS = [
  "FULL-STACK MERN ARCHITECTURE",
  "DATA SCIENCE & STATISTICAL MODELING",
  "IIT MADRAS BS PROGRAMMING",
  "PYTHON & FASTAPI MICROSERVICES",
  "PREDICTIVE ANALYTICS & MACHINE LEARNING",
  "REAL-TIME DATA PIPELINES",
];

export default function Marquee() {
  return (
    <div data-testid="editorial-marquee" className="relative overflow-hidden border-y border-white/5 bg-slate-950/50 py-5 backdrop-blur-sm">
      <div className="marquee-track flex items-center gap-14 whitespace-nowrap">
        {[...ITEMS, ...ITEMS].map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-14 font-mono text-sm uppercase tracking-[0.25em] text-cyan-400/60"
          >
            {item}
            <span className="text-indigo-400/50">✦</span>
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#030712] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#030712] to-transparent" />
    </div>
  );
}
