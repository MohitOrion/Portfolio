import { useEffect, useRef } from "react";

export default function Starfield() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    let raf;
    let t = 0;
    let stars = [];
    let shooting = null;
    const mouse = { x: 0, y: 0 };

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      stars = Array.from({ length: 220 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.3,
        depth: Math.random() * 0.8 + 0.2,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.004,
      }));
    };

    const onMouse = (e) => {
      mouse.x = e.clientX / w - 0.5;
      mouse.y = e.clientY / h - 0.5;
    };

    const draw = () => {
      t += 1;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const tw = 0.5 + 0.5 * Math.sin(s.phase + t * s.speed * 3);
        const px = s.x + mouse.x * 46 * s.depth;
        const py = ((s.y + t * s.speed * 2 * s.depth) % h) + mouse.y * 46 * s.depth;
        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(199, 232, 255, ${0.2 + tw * 0.7 * s.depth})`;
        ctx.fill();
      }

      if (!shooting && Math.random() < 0.0035) {
        shooting = {
          x: Math.random() * w * 0.7 + w * 0.1,
          y: Math.random() * h * 0.35,
          len: 0,
          max: 110 + Math.random() * 130,
        };
      }
      if (shooting) {
        shooting.len += 9;
        shooting.x += 11;
        shooting.y += 5.5;
        const grad = ctx.createLinearGradient(
          shooting.x,
          shooting.y,
          shooting.x - shooting.len,
          shooting.y - shooting.len * 0.5
        );
        grad.addColorStop(0, "rgba(165,243,252,0.95)");
        grad.addColorStop(1, "rgba(165,243,252,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(shooting.x, shooting.y);
        ctx.lineTo(shooting.x - shooting.len, shooting.y - shooting.len * 0.5);
        ctx.stroke();
        if (shooting.len > shooting.max || shooting.x > w + 220) shooting = null;
      }
      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMouse, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMouse);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.16) 0%, transparent 50%)" }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle at 80% 70%, rgba(6,182,212,0.13) 0%, transparent 50%)" }}
      />
      <div
        className="animate-nebula-drift absolute inset-0"
        style={{ background: "radial-gradient(circle at 60% 8%, rgba(139,92,246,0.10) 0%, transparent 45%)" }}
      />
      <canvas ref={canvasRef} className="absolute inset-0" data-testid="starfield-canvas" />
    </div>
  );
}
