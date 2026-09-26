import { motion } from "framer-motion";

export const Chapter = ({ number, name, title }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    className="mb-14"
  >
    <div className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-cyan-400/80">
      Chapter {number} — {name}
    </div>
    <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
      {title}
    </h2>
    <div className="mt-5 h-px w-28 bg-gradient-to-r from-cyan-400 via-indigo-500 to-transparent" />
  </motion.div>
);

export const Reveal = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 36 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);
