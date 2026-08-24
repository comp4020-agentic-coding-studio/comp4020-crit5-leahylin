// A lightweight canvas particle burst for the win celebration — no library,
// just gravity + a little horizontal sway on a handful of rects/circles/
// triangles. Deliberately its own RAF loop rather than piggybacking on the
// main game loop: it's a one-shot cosmetic effect with nothing to do with
// game state, so it starts, runs for DURATION_MS, and cleans up after itself.

const DURATION_MS = 3200;
const GRAVITY_PX_PER_S2 = 780;
const SWAY_PX_PER_S = 40;
const PARTICLES_PER_BURST = 16;
const BURST_ORIGINS = 5; // spread across the width so it doesn't read as one single cannon

const COLORS = ["#ffb454", "#ff6b81", "#6bcf7f", "#5aa9e6", "#f7d354", "#c77dff"];

type Shape = "rect" | "circle" | "triangle";
const SHAPES: Shape[] = ["rect", "circle", "triangle"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  shape: Shape;
  rotation: number;
  rotationSpeed: number;
  swayPhase: number;
}

export interface ConfettiEngine {
  burst(): void;
  stop(): void;
}

export function createConfetti(canvas: HTMLCanvasElement): ConfettiEngine {
  const context = canvas.getContext("2d");
  if (!context) return { burst() {}, stop() {} };
  const ctx: CanvasRenderingContext2D = context;

  let width = 0;
  let height = 0;
  let particles: Particle[] = [];
  let startMs = 0;
  let lastMs = 0;
  let rafId: number | null = null;

  function resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener("resize", resize);
  resize();

  function spawnParticles(): Particle[] {
    const spawned: Particle[] = [];
    for (let originIndex = 0; originIndex < BURST_ORIGINS; originIndex++) {
      const originX = ((originIndex + 0.5) / BURST_ORIGINS) * width;
      const originY = height * (0.15 + Math.random() * 0.15);

      for (let i = 0; i < PARTICLES_PER_BURST; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9; // mostly upward/outward
        const speed = 160 + Math.random() * 220;
        spawned.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 5 + Math.random() * 5,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 8,
          swayPhase: Math.random() * Math.PI * 2,
        });
      }
    }
    return spawned;
  }

  function drawParticle(p: Particle): void {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;

    if (p.shape === "circle") {
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === "triangle") {
      ctx.beginPath();
      ctx.moveTo(0, -p.size / 2);
      ctx.lineTo(p.size / 2, p.size / 2);
      ctx.lineTo(-p.size / 2, p.size / 2);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    }

    ctx.restore();
  }

  function stop(): void {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    particles = [];
    ctx.clearRect(0, 0, width, height);
  }

  function loop(now: number): void {
    const dtS = Math.min((now - lastMs) / 1000, 0.05); // clamp so a stalled tab can't cause a huge leap
    lastMs = now;

    for (const p of particles) {
      p.vy += GRAVITY_PX_PER_S2 * dtS;
      p.x += p.vx * dtS + Math.sin(now / 350 + p.swayPhase) * SWAY_PX_PER_S * dtS;
      p.y += p.vy * dtS;
      p.rotation += p.rotationSpeed * dtS;
    }
    particles = particles.filter((p) => p.y < height + 40);

    ctx.clearRect(0, 0, width, height);
    for (const p of particles) drawParticle(p);

    const elapsed = now - startMs;
    if (particles.length > 0 && elapsed < DURATION_MS) {
      rafId = requestAnimationFrame(loop);
    } else {
      stop();
    }
  }

  return {
    burst() {
      stop();
      particles = spawnParticles();
      startMs = lastMs = performance.now();
      rafId = requestAnimationFrame(loop);
    },
    stop,
  };
}
