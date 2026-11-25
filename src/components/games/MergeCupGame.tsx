import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Coins,
  Gift,
  Music,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Waves,
  Zap,
} from 'lucide-react';
import type { GameConfigRecord, GameRewardRecord } from '../../lib/gamesCatalog';
import { AdaptiveLogo } from '../AdaptiveLogo';
import { FireworksOverlay } from './FireworksOverlay';
import { gameSound } from './RoarGamesSound';

interface MergeCupGameProps {
  lang: string;
  config?: GameConfigRecord;
  rewards: GameRewardRecord[];
  remainingFreeToday: number;
  isSignedIn: boolean;
  userPoints: number;
  savedProgress?: { current_level: number; max_level: number; best_score: number; state_json?: any };
  onSaveProgress?: (payload: { currentLevel: number; maxLevel: number; bestScore: number; stateJson?: any }) => void;
  onPlayReal: (useExtraPoints: boolean, score: number) => Promise<any>;
  onRequireLogin: () => void;
  onDemoResult: (reward: GameRewardRecord) => void;
}

interface TierSpec {
  tier: number;
  nameVi: string;
  nameEn: string;
  shortVi: string;
  radius: number;
  pts: number;
  bg1: string;
  bg2: string;
  rim: string;
  accent: string;
  icon: string;
}

const TIERS: TierSpec[] = [
  {
    tier: 0,
    nameVi: 'Hạt Xanh',
    nameEn: 'Green Bean',
    shortVi: 'Xanh',
    radius: 17,
    pts: 4,
    bg1: '#84CC16',
    bg2: '#3F6212',
    rim: '#ECFCCB',
    accent: '#BEF264',
    icon: '🌱',
  },
  {
    tier: 1,
    nameVi: 'Hạt Rang Mộc',
    nameEn: 'Roasted Bean',
    shortVi: 'Rang',
    radius: 22,
    pts: 10,
    bg1: '#92400E',
    bg2: '#451A03',
    rim: '#FDE68A',
    accent: '#D97706',
    icon: '🫘',
  },
  {
    tier: 2,
    nameVi: 'Viên Cà Phê',
    nameEn: 'Coffee Pod',
    shortVi: 'Viên',
    radius: 28,
    pts: 18,
    bg1: '#D97706',
    bg2: '#78350F',
    rim: '#FEF3C7',
    accent: '#FBBF24',
    icon: '🟤',
  },
  {
    tier: 3,
    nameVi: 'Espresso Shot',
    nameEn: 'Espresso',
    shortVi: 'Esp',
    radius: 34,
    pts: 28,
    bg1: '#57534E',
    bg2: '#1C1917',
    rim: '#E7E5E4',
    accent: '#D6D3D1',
    icon: '☕',
  },
  {
    tier: 4,
    nameVi: 'Phin Sữa Đá',
    nameEn: 'Iced Phin Milk',
    shortVi: 'Phin',
    radius: 41,
    pts: 42,
    bg1: '#F59E0B',
    bg2: '#92400E',
    rim: '#FFFBEB',
    accent: '#FDE68A',
    icon: '🥛',
  },
  {
    tier: 5,
    nameVi: 'Cà Phê Muối',
    nameEn: 'Salted Cream',
    shortVi: 'Muối',
    radius: 49,
    pts: 62,
    bg1: '#EC4899',
    bg2: '#831843',
    rim: '#FCE7F3',
    accent: '#F9A8D4',
    icon: '🧁',
  },
  {
    tier: 6,
    nameVi: 'Cold Brew Cam Sả',
    nameEn: 'Citrus Cold Brew',
    shortVi: 'ColdBrew',
    radius: 57,
    pts: 88,
    bg1: '#0EA5E9',
    bg2: '#0C4A6E',
    rim: '#E0F2FE',
    accent: '#7DD3FC',
    icon: '🧊',
  },
  {
    tier: 7,
    nameVi: 'Latte Nghệ Thuật',
    nameEn: 'Artisan Latte',
    shortVi: 'Latte',
    radius: 65,
    pts: 120,
    bg1: '#10B981',
    bg2: '#064E3B',
    rim: '#D1FAE5',
    accent: '#6EE7B7',
    icon: '🌿',
  },
  {
    tier: 8,
    nameVi: 'ROAR Reserve Vàng',
    nameEn: 'ROAR Reserve',
    shortVi: 'Reserve',
    radius: 74,
    pts: 200,
    bg1: '#FACC15',
    bg2: '#854D0E',
    rim: '#FEF9C3',
    accent: '#FEF08A',
    icon: '👑',
  },
];

interface CupBody {
  id: number;
  tier: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angVel: number;
  r: number;
  bornAt: number;
  squash: number;
}

interface FoamParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface MergeRing {
  x: number;
  y: number;
  r: number;
  maxR: number;
  color: string;
  alpha: number;
}

interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
}

const ARENA_W = 420;
const ARENA_H = 540;
const WALL_L = 16;
const WALL_R = ARENA_W - 16;
const FLOOR_Y = ARENA_H - 18;
const DANGER_Y = 104;
const DROP_Y = 54;
const GUEST_STORAGE_KEY = 'roar_mergecup_best_v1';

export const MergeCupGame: React.FC<MergeCupGameProps> = ({
  lang,
  config,
  rewards,
  remainingFreeToday,
  isSignedIn,
  userPoints,
  savedProgress,
  onSaveProgress,
  onPlayReal,
  onRequireLogin,
  onDemoResult,
}) => {
  const isEn = lang === 'en';
  const minScore = Number(config?.min_score_to_win || 250);
  const extraCost = Number(config?.extra_play_cost_points || 20);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bodiesRef = useRef<CupBody[]>([]);
  const particlesRef = useRef<FoamParticle[]>([]);
  const ringsRef = useRef<MergeRing[]>([]);
  const textsRef = useRef<FloatingText[]>([]);
  const nextIdRef = useRef(1);
  const dangerSecRef = useRef(0);
  const aimXRef = useRef(ARENA_W / 2);
  const dropCooldownRef = useRef(0);
  const shakePowerRef = useRef(0);
  const scoreRef = useRef(0);
  const maxTierRef = useRef(0);
  const phaseRef = useRef<'playing' | 'ended'>('playing');

  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      const local = Number(window.localStorage.getItem(GUEST_STORAGE_KEY) || 0);
      return Math.max(local, Number(savedProgress?.best_score || 0));
    } catch {
      return Number(savedProgress?.best_score || 0);
    }
  });
  const [currentTier, setCurrentTier] = useState<number>(() => Math.floor(Math.random() * 4));
  const [nextTier, setNextTier] = useState<number>(() => Math.floor(Math.random() * 4));
  const currentTierRef = useRef(currentTier);
  currentTierRef.current = currentTier;
  const nextTierRef = useRef(nextTier);
  nextTierRef.current = nextTier;

  const [phase, setPhase] = useState<'playing' | 'ended'>('playing');
  const [maxTierReached, setMaxTierReached] = useState(0);
  const [shakeCharges, setShakeCharges] = useState(2);
  const [upgradeCharges, setUpgradeCharges] = useState(1);
  const [dangerWarning, setDangerWarning] = useState(false);
  const [muted, setMuted] = useState(gameSound.muted);
  const [lofiOn, setLofiOn] = useState(gameSound.lofiActive);
  const [submitting, setSubmitting] = useState(false);
  const [claimedThisRun, setClaimedThisRun] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);

  useEffect(() => {
    if (savedProgress?.best_score) {
      setBestScore((b) => Math.max(b, savedProgress.best_score));
    }
  }, [savedProgress?.best_score]);

  const spawnBurst = useCallback((x: number, y: number, color1: string, color2: string, tier: number) => {
    const count = 12 + tier * 2;
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const spd = 1.6 + Math.random() * (3.2 + tier * 0.35);
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 0.8,
        r: 2.5 + Math.random() * 4.5,
        color: i % 2 === 0 ? color1 : color2,
        alpha: 1,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.25,
      });
    }
    ringsRef.current.push({
      x,
      y,
      r: TIERS[tier]?.radius * 0.5 || 18,
      maxR: (TIERS[tier]?.radius || 24) * 2.1,
      color: color1,
      alpha: 0.85,
    });
  }, []);

  const addFloating = useCallback((x: number, y: number, text: string, color = '#FDE68A', scale = 1) => {
    textsRef.current.push({
      x,
      y,
      vy: -1.3,
      text,
      color,
      alpha: 1,
      scale,
    });
  }, []);

  const resetGame = useCallback(() => {
    bodiesRef.current = [];
    particlesRef.current = [];
    ringsRef.current = [];
    textsRef.current = [];
    dangerSecRef.current = 0;
    dropCooldownRef.current = 0;
    shakePowerRef.current = 0;
    scoreRef.current = 0;
    maxTierRef.current = 0;
    phaseRef.current = 'playing';

    setScore(0);
    setMaxTierReached(0);
    setPhase('playing');
    setShakeCharges(2);
    setUpgradeCharges(1);
    setDangerWarning(false);
    setClaimedThisRun(false);
    setShowFireworks(false);
    const t1 = Math.floor(Math.random() * 4);
    const t2 = Math.floor(Math.random() * 4);
    setCurrentTier(t1);
    setNextTier(t2);
  }, []);

  const dropCupAt = useCallback((rawX: number) => {
    if (phaseRef.current !== 'playing') return;
    const now = performance.now();
    if (now < dropCooldownRef.current) return;

    const tier = currentTierRef.current;
    const spec = TIERS[tier];
    const clampedX = Math.max(WALL_L + spec.radius + 3, Math.min(WALL_R - spec.radius - 3, rawX));
    aimXRef.current = clampedX;

    bodiesRef.current.push({
      id: nextIdRef.current++,
      tier,
      x: clampedX,
      y: DROP_Y,
      vx: (Math.random() - 0.5) * 0.25,
      vy: 1.5,
      angle: (Math.random() - 0.5) * 0.2,
      angVel: (Math.random() - 0.5) * 0.02,
      r: spec.radius,
      bornAt: now,
      squash: 1.12,
    });

    dropCooldownRef.current = now + 420;
    gameSound.mergeDrop();

    const upcoming = nextTierRef.current;
    const freshNext = Math.floor(Math.random() * 5);
    setCurrentTier(upcoming);
    setNextTier(freshNext);
  }, []);

  const handleShakeJar = () => {
    if (phase !== 'playing' || shakeCharges <= 0) return;
    setShakeCharges((c) => c - 1);
    shakePowerRef.current = 12;
    gameSound.rattle();
    bodiesRef.current.forEach((b) => {
      b.vx += (Math.random() - 0.5) * 7.5;
      b.vy -= 2.5 + Math.random() * 3.5;
      b.angVel += (Math.random() - 0.5) * 0.14;
    });
    addFloating(ARENA_W / 2, ARENA_H / 2, isEn ? 'BARISTA SHAKE!' : 'LẮC LY BÙNG NỔ!', '#FDE68A', 1.15);
  };

  const handleUpgradeSmallest = () => {
    if (phase !== 'playing' || upgradeCharges <= 0 || bodiesRef.current.length === 0) return;
    let target: CupBody | null = null;
    for (const b of bodiesRef.current) {
      if (b.tier < TIERS.length - 1 && (!target || b.tier < target.tier)) {
        target = b;
      }
    }
    if (!target) return;
    setUpgradeCharges((c) => c - 1);
    target.tier += 1;
    const newSpec = TIERS[target.tier];
    target.r = newSpec.radius;
    target.vy = -2.2;
    target.squash = 1.25;
    scoreRef.current += newSpec.pts;
    setScore(scoreRef.current);
    spawnBurst(target.x, target.y, newSpec.rim, newSpec.bg1, target.tier);
    addFloating(target.x, target.y - 12, `+${newSpec.pts} UP!`, '#6EE7B7', 1.1);
    gameSound.mergePop(target.tier);
  };

  // Main 60FPS Physics & Render Loop
  useEffect(() => {
    let rafId = 0;
    let lastTs = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.032, Math.max(0.008, (now - lastTs) / 1000));
      lastTs = now;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) {
        rafId = window.requestAnimationFrame(step);
        return;
      }

      if (phaseRef.current === 'playing') {
        const bodies = bodiesRef.current;
        const substeps = 4;
        const subDt = dt / substeps;
        const gravity = 820;

        for (let s = 0; s < substeps; s++) {
          for (let i = 0; i < bodies.length; i++) {
            const b = bodies[i];
            b.vy += gravity * subDt;
            b.x += b.vx * subDt * 60;
            b.y += b.vy * subDt * 60;
            b.vx *= 0.996;
            b.vy *= 0.998;
            b.angle += b.angVel * subDt * 60;
            b.angVel *= 0.96;

            // Walls
            if (b.x - b.r < WALL_L) {
              b.x = WALL_L + b.r;
              b.vx = Math.abs(b.vx) * 0.35;
              b.angVel += b.vy * 0.004;
            } else if (b.x + b.r > WALL_R) {
              b.x = WALL_R - b.r;
              b.vx = -Math.abs(b.vx) * 0.35;
              b.angVel -= b.vy * 0.004;
            }
            // Floor
            if (b.y + b.r > FLOOR_Y) {
              b.y = FLOOR_Y - b.r;
              if (Math.abs(b.vy) > 1.8) b.squash = 0.88;
              b.vy = -Math.abs(b.vy) * 0.24;
              b.vx *= 0.91;
              b.angVel = b.vx / Math.max(12, b.r);
            }
          }

          // Collisions & Merges
          const mergePairs: Array<[number, number]> = [];
          const mergedIds = new Set<number>();

          for (let i = 0; i < bodies.length; i++) {
            for (let j = i + 1; j < bodies.length; j++) {
              const a = bodies[i];
              const b = bodies[j];
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const minDist = a.r + b.r;
              const distSq = dx * dx + dy * dy;

              if (distSq < minDist * minDist) {
                const dist = Math.max(0.001, Math.sqrt(distSq));
                // Check same-tier merge
                if (a.tier === b.tier && !mergedIds.has(a.id) && !mergedIds.has(b.id)) {
                  mergedIds.add(a.id);
                  mergedIds.add(b.id);
                  mergePairs.push([a.id, b.id]);
                  continue;
                }

                const nx = dx / dist;
                const ny = dy / dist;
                const overlap = minDist - dist;
                const massA = a.r * a.r;
                const massB = b.r * b.r;
                const totalMass = massA + massB;
                a.x -= nx * overlap * (massB / totalMass);
                a.y -= ny * overlap * (massB / totalMass);
                b.x += nx * overlap * (massA / totalMass);
                b.y += ny * overlap * (massA / totalMass);

                const rvx = b.vx - a.vx;
                const rvy = b.vy - a.vy;
                const velAlongNormal = rvx * nx + rvy * ny;
                if (velAlongNormal < 0) {
                  const restitution = 0.22;
                  const imp = (-(1 + restitution) * velAlongNormal) / (1 / massA + 1 / massB);
                  a.vx -= (imp / massA) * nx;
                  a.vy -= (imp / massA) * ny;
                  b.vx += (imp / massB) * nx;
                  b.vy += (imp / massB) * ny;

                  // Tangential rolling friction
                  const tx = -ny;
                  const ty = nx;
                  const vt = rvx * tx + rvy * ty;
                  a.angVel -= vt * 0.003;
                  b.angVel += vt * 0.003;
                }
              }
            }
          }

          if (mergePairs.length > 0) {
            for (const [idA, idB] of mergePairs) {
              const idxA = bodies.findIndex((x) => x.id === idA);
              const idxB = bodies.findIndex((x) => x.id === idB);
              if (idxA === -1 || idxB === -1) continue;
              const a = bodies[idxA];
              const b = bodies[idxB];
              const mx = (a.x + b.x) / 2;
              const my = (a.y + b.y) / 2;
              const tier = a.tier;

              // Remove both
              const toRemove = new Set([idA, idB]);
              for (let k = bodies.length - 1; k >= 0; k--) {
                if (toRemove.has(bodies[k].id)) bodies.splice(k, 1);
              }

              if (tier < TIERS.length - 1) {
                const nextT = tier + 1;
                const spec = TIERS[nextT];
                bodies.push({
                  id: nextIdRef.current++,
                  tier: nextT,
                  x: mx,
                  y: my,
                  vx: (a.vx + b.vx) * 0.25,
                  vy: -1.8,
                  angle: 0,
                  angVel: (Math.random() - 0.5) * 0.04,
                  r: spec.radius,
                  bornAt: now,
                  squash: 1.28,
                });
                scoreRef.current += spec.pts;
                setScore(scoreRef.current);
                if (nextT > maxTierRef.current) {
                  maxTierRef.current = nextT;
                  setMaxTierReached(nextT);
                }
                if (nextT === TIERS.length - 1) {
                  setShowFireworks(true);
                  gameSound.win();
                  addFloating(mx, my - 18, 'ROAR RESERVE!', '#FDE047', 1.35);
                } else {
                  addFloating(mx, my - 10, `+${spec.pts}`, spec.rim, 1 + nextT * 0.04);
                }
                shakePowerRef.current = Math.max(shakePowerRef.current, Math.min(8, 2 + nextT * 0.7));
                spawnBurst(mx, my, spec.rim, spec.bg1, nextT);
                gameSound.mergePop(nextT);
              } else {
                // Two ROAR Reserve Cups collided -> Mega Cream Explosion!
                scoreRef.current += 300;
                setScore(scoreRef.current);
                setShowFireworks(true);
                shakePowerRef.current = 12;
                spawnBurst(mx, my, '#FEF08A', '#10B981', 8);
                addFloating(mx, my - 15, '+300 RESERVE BLAST!', '#FDE047', 1.4);
                gameSound.win();
              }
            }
          }
        }

        // Squash recovery & overflow check
        let anyOverLine = false;
        for (const b of bodies) {
          b.squash += (1 - b.squash) * 0.16;
          if (now - b.bornAt > 1200 && b.y - b.r < DANGER_Y && Math.abs(b.vy) < 2.2) {
            anyOverLine = true;
          }
        }

        if (anyOverLine) {
          dangerSecRef.current += dt;
          if (!dangerWarning && dangerSecRef.current > 0.4) setDangerWarning(true);
          if (dangerSecRef.current >= 2.2) {
            phaseRef.current = 'ended';
            setPhase('ended');
            gameSound.gameOver();
            const finalScore = scoreRef.current;
            setBestScore((prev) => {
              const nb = Math.max(prev, finalScore);
              try {
                window.localStorage.setItem(GUEST_STORAGE_KEY, String(nb));
              } catch {
                // ignore
              }
              return nb;
            });
            onSaveProgress?.({
              currentLevel: Math.max(1, maxTierRef.current + 1),
              maxLevel: Math.max(1, maxTierRef.current + 1),
              bestScore: finalScore,
            });
          }
        } else {
          dangerSecRef.current = Math.max(0, dangerSecRef.current - dt * 1.5);
          if (dangerWarning && dangerSecRef.current < 0.15) setDangerWarning(false);
        }
      }

      // Particles update
      particlesRef.current = particlesRef.current.filter((p) => {
        p.life += dt;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);
        return p.life < p.maxLife;
      });
      ringsRef.current = ringsRef.current.filter((rg) => {
        rg.r += (rg.maxR - rg.r) * 0.2;
        rg.alpha -= dt * 2.4;
        return rg.alpha > 0.02;
      });
      textsRef.current = textsRef.current.filter((tx) => {
        tx.y += tx.vy;
        tx.alpha -= dt * 1.15;
        return tx.alpha > 0.02;
      });
      shakePowerRef.current *= 0.86;

      // RENDER
      ctx.clearRect(0, 0, ARENA_W, ARENA_H);
      ctx.save();
      if (shakePowerRef.current > 0.25) {
        ctx.translate(
          (Math.random() - 0.5) * shakePowerRef.current,
          (Math.random() - 0.5) * shakePowerRef.current
        );
      }

      // Warm Roastery Glass Jar Backdrop
      const bgGrad = ctx.createLinearGradient(0, 0, 0, ARENA_H);
      bgGrad.addColorStop(0, '#1B120C');
      bgGrad.addColorStop(0.55, '#29190F');
      bgGrad.addColorStop(1, '#12241A');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, ARENA_W, ARENA_H);

      // Subtle ROAR Coffee Jar Glass Frame
      ctx.fillStyle = 'rgba(255, 248, 235, 0.04)';
      ctx.beginPath();
      ctx.roundRect(WALL_L, DANGER_Y - 12, WALL_R - WALL_L, FLOOR_Y - (DANGER_Y - 12), 18);
      ctx.fill();
      ctx.strokeStyle = dangerWarning ? 'rgba(239, 68, 68, 0.7)' : 'rgba(198, 166, 103, 0.35)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Danger Dashed Line
      ctx.save();
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = dangerWarning ? '#EF4444' : 'rgba(253, 230, 138, 0.35)';
      ctx.lineWidth = dangerWarning ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(WALL_L + 8, DANGER_Y);
      ctx.lineTo(WALL_R - 8, DANGER_Y);
      ctx.stroke();
      ctx.restore();

      // Aim Drop Guide & Ghost Preview
      if (phaseRef.current === 'playing') {
        const curSpec = TIERS[currentTierRef.current];
        const gx = Math.max(WALL_L + curSpec.radius + 3, Math.min(WALL_R - curSpec.radius - 3, aimXRef.current));
        ctx.save();
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = 'rgba(198, 166, 103, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(gx, DROP_Y + curSpec.radius);
        ctx.lineTo(gx, FLOOR_Y);
        ctx.stroke();
        ctx.restore();

        // Preview orb at top
        drawTierOrb(ctx, gx, DROP_Y, curSpec, 0, 1, now < dropCooldownRef.current ? 0.45 : 0.96);
      }

      // Draw Cup Bodies
      for (const b of bodiesRef.current) {
        const spec = TIERS[b.tier];
        drawTierOrb(ctx, b.x, b.y, spec, b.angle, b.squash, 1);
      }

      // Draw Rings
      for (const rg of ringsRef.current) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, rg.alpha);
        ctx.strokeStyle = rg.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(rg.x, rg.y, rg.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Draw Particles
      for (const p of particlesRef.current) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Floating Texts
      for (const tx of textsRef.current) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, tx.alpha);
        ctx.font = `800 ${Math.round(15 * tx.scale)}px "Plus Jakarta Sans", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000000';
        ctx.fillText(tx.text, tx.x + 1, tx.y + 1);
        ctx.fillStyle = tx.color;
        ctx.fillText(tx.text, tx.x, tx.y);
        ctx.restore();
      }

      ctx.restore();
      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [addFloating, dangerWarning, onSaveProgress, spawnBurst]);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * ARENA_W;
    aimXRef.current = x;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * ARENA_W;
    dropCupAt(x);
  };

  const handleClaimReward = async (useExtra: boolean) => {
    if (!isSignedIn) {
      onRequireLogin();
      return;
    }
    if (score < minScore) return;
    setSubmitting(true);
    try {
      const res = await onPlayReal(useExtra, score);
      if (res?.won) {
        setClaimedThisRun(true);
        setShowFireworks(true);
        gameSound.win();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoPlay = () => {
    const activeRewards = rewards.filter((r) => r.active);
    const chosen = activeRewards[Math.floor(Math.random() * activeRewards.length)] || rewards[0];
    if (chosen) onDemoResult(chosen);
  };

  const reachedTarget = score >= minScore;
  const currentSpec = TIERS[currentTier];
  const nextSpec = TIERS[nextTier];

  const tierProgressPct = useMemo(
    () => Math.min(100, Math.round((score / Math.max(1, minScore)) * 100)),
    [score, minScore]
  );

  return (
    <div className="relative rounded-2xl bg-gradient-to-b from-[#1E140E] via-[#151F19] to-[#0E1612] border border-[#C6A667]/30 p-3 sm:p-4 text-[#F8F5EF] overflow-hidden shadow-lg">
      {showFireworks && <FireworksOverlay active={showFireworks} />}

      {/* Compact Top HUD */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <AdaptiveLogo variant="horizontal" surface="dark" darkTone="gold" size="2xs" />
          <span className="text-xs font-extrabold tracking-wide text-[#FDE68A]">
            MERGE CUP
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="px-2.5 py-1 rounded-lg bg-black/35 border border-[#C6A667]/30 text-center">
            <div className="text-[10px] uppercase tracking-wider text-white/60">{isEn ? 'Score' : 'Điểm'}</div>
            <div className="text-sm font-black text-[#FDE68A] tabular-nums">{score.toLocaleString()}</div>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-black/35 border border-white/15 text-center">
            <div className="text-[10px] uppercase tracking-wider text-white/60">{isEn ? 'Best' : 'Kỷ lục'}</div>
            <div className="text-sm font-black text-emerald-300 tabular-nums">{Math.max(bestScore, score).toLocaleString()}</div>
          </div>
          <button
            type="button"
            onClick={() => setLofiOn(gameSound.toggleLofi())}
            aria-label="Toggle Music"
            className={`w-9 h-9 rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${
              lofiOn ? 'bg-[#C6A667] text-[#111111] border-[#FDE68A]' : 'bg-white/10 text-white/80 border-white/15 hover:bg-white/20'
            }`}
          >
            <Music className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              gameSound.muted = !muted;
              setMuted(gameSound.muted);
            }}
            aria-label="Toggle Sound"
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={resetGame}
            aria-label="Restart"
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Reward Goal Progress */}
      <div className="mt-2.5 flex items-center justify-between gap-3 text-xs">
        <span className="text-white/75 truncate">
          {isEn
            ? `Goal: ${minScore} pts to claim ROAR rewards`
            : `Mục tiêu: đạt ${minScore} điểm để mở khóa săn quà ROAR`}
        </span>
        <span className={`font-bold tabular-nums shrink-0 ${reachedTarget ? 'text-emerald-300' : 'text-[#FDE68A]'}`}>
          {reachedTarget ? (isEn ? 'Target Reached!' : 'Đủ điều kiện nhận quà!') : `${tierProgressPct}%`}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${reachedTarget ? 'bg-emerald-400' : 'bg-[#C6A667]'}`}
          style={{ width: `${tierProgressPct}%` }}
        />
      </div>

      {/* Main Play Area: Canvas + Right Control Rail */}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_210px] gap-3 items-start">
        {/* Glass Jar Canvas */}
        <div className="relative mx-auto w-full max-w-[400px]">
          <canvas
            ref={canvasRef}
            width={ARENA_W}
            height={ARENA_H}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="w-full h-auto rounded-2xl border border-[#C6A667]/30 shadow-inner touch-none cursor-crosshair select-none bg-[#1B120C]"
          />

          {dangerWarning && phase === 'playing' && (
            <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg bg-red-600/90 text-white text-[11px] font-extrabold animate-pulse shadow">
              {isEn ? 'WARNING: CUP NEAR TOP!' : 'CẢNH BÁO: SẮP TRÀN LY!'}
            </div>
          )}

          {phase === 'ended' && (
            <div className="absolute inset-0 rounded-2xl bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-5 text-center space-y-4">
              <Trophy className="w-11 h-11 text-[#C6A667]" />
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-[#C6A667]">
                  {isEn ? 'Brew Complete' : 'Kết Thúc Lượt Pha'}
                </div>
                <div className="text-3xl font-black text-white mt-1 tabular-nums">{score.toLocaleString()}</div>
                <div className="text-xs text-white/75 mt-1">
                  {isEn ? 'Highest Tier:' : 'Cấp cao nhất:'}{' '}
                  <span className="font-bold text-[#FDE68A]">
                    {TIERS[maxTierReached]?.icon} {isEn ? TIERS[maxTierReached]?.nameEn : TIERS[maxTierReached]?.nameVi}
                  </span>
                </div>
              </div>

              <div className="w-full max-w-[260px] space-y-2">
                {reachedTarget && !claimedThisRun && (
                  <>
                    {isSignedIn ? (
                      remainingFreeToday > 0 ? (
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => handleClaimReward(false)}
                          className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0B1F14] font-extrabold text-xs inline-flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Gift className="w-4 h-4" />
                          <span>{submitting ? (isEn ? 'Claiming...' : 'Đang nhận...') : (isEn ? `Claim Free Reward (${remainingFreeToday} left)` : `Nhận Quà Miễn Phí (còn ${remainingFreeToday})`)}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={submitting || userPoints < extraCost}
                          onClick={() => handleClaimReward(true)}
                          className="w-full py-2.5 px-4 rounded-xl bg-[#C6A667] hover:bg-[#b59454] text-[#111111] font-extrabold text-xs inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <Coins className="w-4 h-4" />
                          <span>{isEn ? `Exchange ${extraCost} pts to Claim` : `Đổi ${extraCost} điểm Nhận Quà`}</span>
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={onRequireLogin}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#C6A667] text-[#111111] font-extrabold text-xs cursor-pointer"
                      >
                        {isEn ? 'Sign In to Claim Real Gift' : 'Đăng Nhập Nhận Quà Thật'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleDemoPlay}
                      className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
                    >
                      {isEn ? 'Preview Reward Draw' : 'Xem Thử Quà Ngẫu Nhiên'}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={resetGame}
                  className="w-full py-2.5 px-4 rounded-xl bg-white text-[#111111] font-extrabold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Play Again' : 'Chơi Lại Ngay'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Side Rail: Next Cup, Boosters, Claim CTA & Merge Chain */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2.5">
            <div className="p-3 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/55">{isEn ? 'Current' : 'Đang thả'}</div>
                <div className="text-xs font-bold text-white mt-0.5">
                  {isEn ? currentSpec.nameEn : currentSpec.nameVi}
                </div>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-inner border border-white/25 shrink-0"
                style={{ background: `radial-gradient(circle at 30% 30%, ${currentSpec.bg1}, ${currentSpec.bg2})` }}
              >
                {currentSpec.icon}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/55">{isEn ? 'Up Next' : 'Kế tiếp'}</div>
                <div className="text-xs font-bold text-[#FDE68A] mt-0.5">
                  {isEn ? nextSpec.nameEn : nextSpec.nameVi}
                </div>
              </div>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-base border border-white/20 shrink-0"
                style={{ background: `radial-gradient(circle at 30% 30%, ${nextSpec.bg1}, ${nextSpec.bg2})` }}
              >
                {nextSpec.icon}
              </div>
            </div>
          </div>

          {/* Boosters */}
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
            <button
              type="button"
              disabled={phase !== 'playing' || shakeCharges <= 0}
              onClick={handleShakeJar}
              className="px-3 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/35 text-xs font-bold text-amber-200 flex items-center justify-between gap-2 cursor-pointer disabled:opacity-40"
            >
              <span className="inline-flex items-center gap-1.5">
                <Waves className="w-4 h-4" />
                <span>{isEn ? 'Shake Jar' : 'Lắc Ly'}</span>
              </span>
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-black/30">{shakeCharges}</span>
            </button>

            <button
              type="button"
              disabled={phase !== 'playing' || upgradeCharges <= 0}
              onClick={handleUpgradeSmallest}
              className="px-3 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/35 text-xs font-bold text-emerald-200 flex items-center justify-between gap-2 cursor-pointer disabled:opacity-40"
            >
              <span className="inline-flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                <span>{isEn ? 'Upgrade Tiny' : 'Nâng Hạt Nhỏ'}</span>
              </span>
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-black/30">{upgradeCharges}</span>
            </button>
          </div>

          {/* Early Reward Claim while still playing once target reached */}
          {reachedTarget && !claimedThisRun && phase === 'playing' && (
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleClaimReward(remainingFreeToday <= 0)}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#00552B] to-emerald-600 hover:brightness-110 border border-emerald-300/40 text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow"
            >
              <Sparkles className="w-4 h-4 text-[#FDE68A]" />
              <span>{isEn ? 'Claim Reward Now!' : 'Đủ Điểm · Nhận Quà Ngay!'}</span>
            </button>
          )}

          {/* Evolution Chain */}
          <div className="p-3 rounded-xl bg-black/25 border border-white/10 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#C6A667]">
              {isEn ? 'Merge Evolution (9 Tiers)' : 'Chuỗi Hợp Nhất (9 Cấp)'}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {TIERS.map((t) => (
                <div
                  key={t.tier}
                  className={`p-1.5 rounded-lg border text-center transition-all ${
                    maxTierReached >= t.tier
                      ? 'bg-white/10 border-[#C6A667]/40 text-white'
                      : 'bg-black/20 border-white/5 text-white/45'
                  }`}
                >
                  <div className="text-sm leading-none">{t.icon}</div>
                  <div className="text-[9px] font-semibold mt-1 truncate">{t.shortVi}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function drawTierOrb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  spec: TierSpec,
  angle: number,
  squash: number,
  alpha = 1
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);
  const sx = 2 - squash;
  const sy = squash;
  ctx.scale(sx, sy);

  // Drop shadow
  ctx.beginPath();
  ctx.arc(0, 3, spec.radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fill();

  // Main sphere gradient
  const grad = ctx.createRadialGradient(
    -spec.radius * 0.32,
    -spec.radius * 0.32,
    spec.radius * 0.15,
    0,
    0,
    spec.radius
  );
  grad.addColorStop(0, spec.rim);
  grad.addColorStop(0.28, spec.bg1);
  grad.addColorStop(1, spec.bg2);

  ctx.beginPath();
  ctx.arc(0, 0, spec.radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Outer rim highlight
  ctx.lineWidth = Math.max(1.8, spec.radius * 0.08);
  ctx.strokeStyle = spec.accent;
  ctx.stroke();

  // Glossy specular crescent
  ctx.beginPath();
  ctx.ellipse(-spec.radius * 0.28, -spec.radius * 0.36, spec.radius * 0.34, spec.radius * 0.16, -0.55, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fill();

  // Cute espresso eyes & icon
  ctx.font = `${Math.round(spec.radius * 0.92)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(spec.icon, 0, 1);

  ctx.restore();
}
