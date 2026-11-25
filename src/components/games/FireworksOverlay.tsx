import React, { useEffect, useRef } from 'react';
import { gameSound } from './RoarGamesSound';

interface FireworksOverlayProps {
  active: boolean;
  className?: string;
  withSound?: boolean;
}

interface FireworkRocket {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetY: number;
  color: string;
}

interface FireworkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  decay: number;
  size: number;
}

const FIREWORK_PALETTE = [
  '#FDE047',
  '#F97316',
  '#EC4899',
  '#38BDF8',
  '#34D399',
  '#A855F7',
  '#FFFFFF',
  '#C6A667',
];

export const FireworksOverlay: React.FC<FireworksOverlayProps> = ({
  active,
  className = '',
  withSound = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      const w = parent?.clientWidth || 360;
      const h = parent?.clientHeight || 360;
      canvas.width = w;
      canvas.height = h;
    };
    resize();

    const rockets: FireworkRocket[] = [];
    const particles: FireworkParticle[] = [];
    let raf = 0;
    let lastTs = performance.now();
    let burstCount = 0;

    const spawnBurstAt = (cx: number, cy: number, color: string) => {
      const count = 42;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
        const speed = 75 + Math.random() * 175;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: i % 4 === 0 ? '#FFFFFF' : color,
          alpha: 1,
          decay: 0.72 + Math.random() * 0.55,
          size: 2 + Math.random() * 2.5,
        });
      }
      if (withSound) {
        gameSound.fireworkBurst(burstCount % 4);
      }
      burstCount += 1;
    };

    const launchRocket = () => {
      const w = canvas.width || 360;
      const h = canvas.height || 360;
      const color = FIREWORK_PALETTE[Math.floor(Math.random() * FIREWORK_PALETTE.length)];
      rockets.push({
        x: w * (0.18 + Math.random() * 0.64),
        y: h + 8,
        vx: (Math.random() - 0.5) * 55,
        vy: -(240 + Math.random() * 110),
        targetY: h * (0.16 + Math.random() * 0.36),
        color,
      });
    };

    // Immediate opening trio bursts + scheduled launches
    spawnBurstAt(canvas.width * 0.28, canvas.height * 0.28, '#FDE047');
    spawnBurstAt(canvas.width * 0.72, canvas.height * 0.25, '#EC4899');
    launchRocket();
    const intervalId = window.setInterval(() => {
      if (rockets.length < 4) launchRocket();
    }, 520);

    const step = (now: number) => {
      const dt = Math.min(0.04, (now - lastTs) / 1000);
      lastTs = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.x += r.vx * dt;
        r.y += r.vy * dt;
        r.vy += 90 * dt;

        ctx.fillStyle = r.color;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
        ctx.fill();

        if (r.y <= r.targetY || r.vy >= -25) {
          spawnBurstAt(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vx *= Math.exp(-1.9 * dt);
        p.vy = p.vy * Math.exp(-1.6 * dt) + 125 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha -= p.decay * dt;

        if (p.alpha <= 0.02) {
          particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      raf = window.requestAnimationFrame(step);
    };

    raf = window.requestAnimationFrame(step);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearInterval(intervalId);
    };
  }, [active, withSound]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 w-full h-full z-20 ${className}`}
    />
  );
};
