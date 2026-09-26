import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const INTERACTIVE = "a, button, input, textarea, select, [role='button'], [data-cursor-hover]";

export default function CustomCursor() {
  const [enabled] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches
  );
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 220, damping: 22, mass: 0.55 });
  const ringY = useSpring(y, { stiffness: 220, damping: 22, mass: 0.55 });

  useEffect(() => {
    if (!enabled) return;
    const move = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    };
    const over = (e) => setHovering(!!e.target.closest(INTERACTIVE));
    const leave = () => setVisible(false);
    const down = () => setHovering(true);
    const up = () => setHovering(false);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("mouseover", over, { passive: true });
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    document.documentElement.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <>
      <motion.div
        data-testid="custom-cursor-dot"
        className="pointer-events-none fixed left-0 top-0 z-[100]"
        style={{ x, y, opacity: visible ? 1 : 0 }}
      >
        <div className="h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_12px_#06b6d4,0_0_30px_rgba(6,182,212,0.5)]" />
      </motion.div>
      <motion.div
        data-testid="custom-cursor-ring"
        className="pointer-events-none fixed left-0 top-0 z-[99]"
        style={{ x: ringX, y: ringY, opacity: visible ? 1 : 0 }}
      >
        <motion.div
          className="-translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/40"
          animate={{
            width: hovering ? 56 : 36,
            height: hovering ? 56 : 36,
            backgroundColor: hovering ? "rgba(6,182,212,0.10)" : "rgba(6,182,212,0)",
            borderColor: hovering ? "rgba(6,182,212,0.7)" : "rgba(6,182,212,0.4)",
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        />
      </motion.div>
    </>
  );
}
