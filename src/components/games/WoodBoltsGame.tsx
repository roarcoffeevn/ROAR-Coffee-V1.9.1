import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Coins,
  Gift,
  Music,
  PlusCircle,
  RotateCcw,
  Sparkles,
  Trophy,
  Undo2,
  Volume2,
  VolumeX,
  Wrench,
} from 'lucide-react';
import type { GameConfigRecord, GameRewardRecord } from '../../lib/gamesCatalog';
import { AdaptiveLogo } from '../AdaptiveLogo';
import { FireworksOverlay } from './FireworksOverlay';
import { gameSound } from './RoarGamesSound';

interface WoodBoltsGameProps {
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

interface BoardHole {
  id: string;
  x: number;
  y: number;
  boltId: string | null;
}

interface PlankSpec {
  id: string;
  cx: number;
  cy: number;
  w: number;
  h: number;
  angle: number;
  angVel: number;
  vx: number;
  vy: number;
  color1: string;
  color2: string;
  // Local coordinates of pin sockets relative to plank center
  localHoles: Array<{ lx: number; ly: number; attachedHoleId: string | null }>;
  fallen: boolean;
}

interface StageDef {
  titleVi: string;
  titleEn: string;
  holes: Array<{ id: string; x: number; y: number }>;
  planks: Array<{
    id: string;
    cx: number;
    cy: number;
    w: number;
    h: number;
    angle: number;
    color1: string;
    color2: string;
    pins: Array<{ holeId: string }>;
  }>;
}

const BOARD_W = 420;
const BOARD_H = 440;
const GUEST_STORAGE_KEY = 'roar_woodbolts_progress_v1';

const STAGES: StageDef[] = [
  {
    titleVi: 'Màn 1 · Thanh Gỗ Khởi Động',
    titleEn: 'Stage 1 · Warm-Up Beams',
    holes: [
      { id: 'h1', x: 115, y: 125 },
      { id: 'h2', x: 305, y: 125 },
      { id: 'h3', x: 115, y: 225 },
      { id: 'h4', x: 305, y: 225 },
      { id: 'h5', x: 210, y: 315 },
    ],
    planks: [
      {
        id: 'p1',
        cx: 210,
        cy: 125,
        w: 245,
        h: 36,
        angle: 0,
        color1: '#D97706',
        color2: '#92400E',
        pins: [{ holeId: 'h1' }, { holeId: 'h2' }],
      },
      {
        id: 'p2',
        cx: 210,
        cy: 225,
        w: 245,
        h: 36,
        angle: 0,
        color1: '#B45309',
        color2: '#78350F',
        pins: [{ holeId: 'h3' }, { holeId: 'h4' }],
      },
    ],
  },
  {
    titleVi: 'Màn 2 · Chữ Thập Đan Chéo',
    titleEn: 'Stage 2 · Crossed Beams',
    holes: [
      { id: 'h1', x: 135, y: 110 },
      { id: 'h2', x: 285, y: 110 },
      { id: 'h3', x: 135, y: 210 },
      { id: 'h4', x: 285, y: 210 },
      { id: 'h5', x: 210, y: 300 },
      { id: 'h6', x: 95, y: 325 },
      { id: 'h7', x: 325, y: 325 },
    ],
    planks: [
      {
        id: 'p1',
        cx: 135,
        cy: 160,
        w: 36,
        h: 165,
        angle: 0,
        color1: '#CA8A04',
        color2: '#854D0E',
        pins: [{ holeId: 'h1' }, { holeId: 'h3' }],
      },
      {
        id: 'p2',
        cx: 285,
        cy: 160,
        w: 36,
        h: 165,
        angle: 0,
        color1: '#EA580C',
        color2: '#9A3412',
        pins: [{ holeId: 'h2' }, { holeId: 'h4' }],
      },
      {
        id: 'p3',
        cx: 210,
        cy: 210,
        w: 230,
        h: 34,
        angle: 0,
        color1: '#15803D',
        color2: '#064E3B',
        pins: [{ holeId: 'h3' }, { holeId: 'h4' }],
      },
    ],
  },
  {
    titleVi: 'Màn 3 · Khung Tam Giác Cà Phê',
    titleEn: 'Stage 3 · Highland Triangle',
    holes: [
      { id: 'h1', x: 210, y: 95 },
      { id: 'h2', x: 120, y: 235 },
      { id: 'h3', x: 300, y: 235 },
      { id: 'h4', x: 210, y: 235 },
      { id: 'h5', x: 95, y: 145 },
      { id: 'h6', x: 325, y: 145 },
      { id: 'h7', x: 210, y: 335 },
    ],
    planks: [
      {
        id: 'p1',
        cx: 165,
        cy: 165,
        w: 215,
        h: 32,
        angle: -0.99,
        color1: '#D97706',
        color2: '#78350F',
        pins: [{ holeId: 'h1' }, { holeId: 'h2' }],
      },
      {
        id: 'p2',
        cx: 255,
        cy: 165,
        w: 215,
        h: 32,
        angle: 0.99,
        color1: '#059669',
        color2: '#064E3B',
        pins: [{ holeId: 'h1' }, { holeId: 'h3' }],
      },
      {
        id: 'p3',
        cx: 210,
        cy: 235,
        w: 240,
        h: 34,
        angle: 0,
        color1: '#B45309',
        color2: '#451A03',
        pins: [{ holeId: 'h2' }, { holeId: 'h4' }, { holeId: 'h3' }],
      },
    ],
  },
  {
    titleVi: 'Màn 4 · Giàn Gỗ Bốn Tầng',
    titleEn: 'Stage 4 · Roastery Rack',
    holes: [
      { id: 'h1', x: 110, y: 95 },
      { id: 'h2', x: 310, y: 95 },
      { id: 'h3', x: 110, y: 175 },
      { id: 'h4', x: 210, y: 175 },
      { id: 'h5', x: 310, y: 175 },
      { id: 'h6', x: 150, y: 265 },
      { id: 'h7', x: 270, y: 265 },
      { id: 'h8', x: 210, y: 350 },
    ],
    planks: [
      {
        id: 'p1',
        cx: 210,
        cy: 95,
        w: 255,
        h: 32,
        angle: 0,
        color1: '#CA8A04',
        color2: '#713F12',
        pins: [{ holeId: 'h1' }, { holeId: 'h2' }],
      },
      {
        id: 'p2',
        cx: 210,
        cy: 175,
        w: 255,
        h: 32,
        angle: 0,
        color1: '#EA580C',
        color2: '#7C2D12',
        pins: [{ holeId: 'h3' }, { holeId: 'h4' }, { holeId: 'h5' }],
      },
      {
        id: 'p3',
        cx: 130,
        cy: 180,
        w: 32,
        h: 220,
        angle: -0.22,
        color1: '#16A34A',
        color2: '#14532D',
        pins: [{ holeId: 'h1' }, { holeId: 'h6' }],
      },
      {
        id: 'p4',
        cx: 290,
        cy: 180,
        w: 32,
        h: 220,
        angle: 0.22,
        color1: '#D97706',
        color2: '#78350F',
        pins: [{ holeId: 'h2' }, { holeId: 'h7' }],
      },
    ],
  },
];

function buildStageRuntime(stageIdx: number): { holes: BoardHole[]; planks: PlankSpec[] } {
  const def = STAGES[stageIdx % STAGES.length];
  const holeMap = new Map(def.holes.map((h) => [h.id, h]));

  const holes: BoardHole[] = def.holes.map((h) => ({
    id: h.id,
    x: h.x,
    y: h.y,
    boltId: null,
  }));

  let boltSeq = 1;
  const occupied = new Set<string>();
  const planks: PlankSpec[] = def.planks.map((p) => {
    const cos = Math.cos(-p.angle);
    const sin = Math.sin(-p.angle);
    const localHoles = p.pins.map((pin) => {
      const target = holeMap.get(pin.holeId)!;
      const dx = target.x - p.cx;
      const dy = target.y - p.cy;
      const lx = dx * cos - dy * sin;
      const ly = dx * sin + dy * cos;

      if (!occupied.has(pin.holeId)) {
        occupied.add(pin.holeId);
        const hObj = holes.find((h) => h.id === pin.holeId);
        if (hObj) hObj.boltId = `b${boltSeq++}`;
      }
      return { lx, ly, attachedHoleId: pin.holeId };
    });

    return {
      id: p.id,
      cx: p.cx,
      cy: p.cy,
      w: p.w,
      h: p.h,
      angle: p.angle,
      angVel: 0,
      vx: 0,
      vy: 0,
      color1: p.color1,
      color2: p.color2,
      localHoles,
      fallen: false,
    };
  });

  return { holes, planks };
}

function isPointInsidePlank(px: number, py: number, p: PlankSpec): boolean {
  if (p.fallen) return false;
  const dx = px - p.cx;
  const dy = py - p.cy;
  const cos = Math.cos(-p.angle);
  const sin = Math.sin(-p.angle);
  const lx = dx * cos - dy * sin;
  const ly = dx * sin + dy * cos;
  return Math.abs(lx) <= p.w / 2 - 4 && Math.abs(ly) <= p.h / 2 - 4;
}

export const WoodBoltsGame: React.FC<WoodBoltsGameProps> = ({
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
  const minScore = Number(config?.min_score_to_win || 150);
  const extraCost = Number(config?.extra_play_cost_points || 20);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const holesRef = useRef<BoardHole[]>([]);
  const planksRef = useRef<PlankSpec[]>([]);
  const selectedHoleIdRef = useRef<string | null>(null);
  const historyRef = useRef<Array<{ holes: BoardHole[]; planks: PlankSpec[]; score: number }>>([]);
  const stageDoneRef = useRef(false);

  const [level, setLevel] = useState<number>(() => {
    try {
      const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
      if (raw) return Math.max(1, Number(JSON.parse(raw).level || 1));
    } catch {
      // ignore
    }
    return Math.max(1, Number(savedProgress?.current_level || 1));
  });
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
      const localBest = raw ? Number(JSON.parse(raw).bestScore || 0) : 0;
      return Math.max(localBest, Number(savedProgress?.best_score || 0));
    } catch {
      return Number(savedProgress?.best_score || 0);
    }
  });

  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  scoreRef.current = score;

  const [planksLeft, setPlanksLeft] = useState(0);
  const [stageWon, setStageWon] = useState(false);
  const [extraHoleUsed, setExtraHoleUsed] = useState(false);
  const [removeToolLeft, setRemoveToolLeft] = useState(1);
  const [removeMode, setRemoveMode] = useState(false);
  const [muted, setMuted] = useState(gameSound.muted);
  const [lofiOn, setLofiOn] = useState(gameSound.lofiActive);
  const [submitting, setSubmitting] = useState(false);
  const [claimedThisRun, setClaimedThisRun] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);

  const initStage = useCallback((lv: number, resetScore = false) => {
    const rt = buildStageRuntime(lv - 1);
    holesRef.current = rt.holes;
    planksRef.current = rt.planks;
    selectedHoleIdRef.current = null;
    historyRef.current = [];
    stageDoneRef.current = false;

    setLevel(lv);
    setPlanksLeft(rt.planks.length);
    setStageWon(false);
    setExtraHoleUsed(false);
    setRemoveToolLeft(1);
    setRemoveMode(false);
    setShowFireworks(false);
    if (resetScore) {
      setScore(0);
      setClaimedThisRun(false);
    }
  }, []);

  useEffect(() => {
    initStage(level, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 60FPS Gravity & Pendulum Physics Loop
  useEffect(() => {
    let rafId = 0;
    let lastTs = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.032, Math.max(0.008, (now - lastTs) / 1000));
      lastTs = now;

      const planks = planksRef.current;
      const holes = holesRef.current;
      const holeMap = new Map(holes.map((h) => [h.id, h]));

      let activeCount = 0;

      for (const p of planks) {
        if (p.fallen) continue;

        const attached = p.localHoles.filter((lh) => lh.attachedHoleId !== null);
        if (attached.length >= 2) {
          // Rigidly locked by 2+ bolts
          activeCount++;
        } else if (attached.length === 1) {
          // Single bolt -> realistic pendulum swing under gravity!
          activeCount++;
          const pivotLocal = attached[0];
          const anchor = holeMap.get(pivotLocal.attachedHoleId!);
          if (anchor) {
            // Vector from pivot to center of mass in world coords
            const cos = Math.cos(p.angle);
            const sin = Math.sin(p.angle);
            const rx = -(pivotLocal.lx * cos - pivotLocal.ly * sin);
            const ry = -(pivotLocal.lx * sin + pivotLocal.ly * cos);
            const lever = Math.hypot(rx, ry);
            if (lever > 2) {
              // Gravity torque = rx * mg (g downward)
              const angAcc = (rx * 18) / (lever * lever + 900);
              p.angVel += angAcc * dt * 60;
              p.angVel *= 0.985;
              p.angle += p.angVel * dt * 60;
            }
            const newCos = Math.cos(p.angle);
            const newSin = Math.sin(p.angle);
            p.cx = anchor.x - (pivotLocal.lx * newCos - pivotLocal.ly * newSin);
            p.cy = anchor.y - (pivotLocal.lx * newSin + pivotLocal.ly * newCos);
          }
        } else {
          // 0 bolts -> Free gravity fall!
          p.vy += 980 * dt;
          p.cx += p.vx * dt;
          p.cy += p.vy * dt;
          p.angle += p.angVel * dt * 60;

          if (p.cy - Math.max(p.w, p.h) > BOARD_H + 40) {
            p.fallen = true;
            const newScore = scoreRef.current + 55;
            scoreRef.current = newScore;
            setScore(newScore);
          } else {
            activeCount++;
          }
        }
      }

      if (!stageDoneRef.current && planks.length > 0 && planks.every((p) => p.fallen)) {
        stageDoneRef.current = true;
        const stageBonus = 60 + level * 20;
        const finalScore = scoreRef.current + stageBonus;
        scoreRef.current = finalScore;
        setScore(finalScore);
        setPlanksLeft(0);
        setStageWon(true);
        setShowFireworks(true);
        gameSound.win();
        setBestScore((prev) => {
          const nb = Math.max(prev, finalScore);
          try {
            window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({ level: level + 1, bestScore: nb }));
          } catch {
            // ignore
          }
          return nb;
        });
        onSaveProgress?.({
          currentLevel: level + 1,
          maxLevel: level + 1,
          bestScore: finalScore,
        });
      } else {
        setPlanksLeft(activeCount);
      }

      // RENDER CANVAS
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.clearRect(0, 0, BOARD_W, BOARD_H);

        // Warm Oak Pegboard Background
        const bg = ctx.createLinearGradient(0, 0, 0, BOARD_H);
        bg.addColorStop(0, '#2B1B11');
        bg.addColorStop(1, '#1A110B');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, BOARD_W, BOARD_H);

        // Subtle Wood Grain Lines
        ctx.strokeStyle = 'rgba(255, 224, 178, 0.04)';
        ctx.lineWidth = 1;
        for (let y = 18; y < BOARD_H; y += 22) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(BOARD_W, y);
          ctx.stroke();
        }

        // Empty Sockets Underneath Planks
        for (const h of holes) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(h.x, h.y, 12, 0, Math.PI * 2);
          ctx.fillStyle = '#0B0705';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = selectedHoleIdRef.current && !h.boltId ? '#34D399' : '#6B4C35';
          ctx.stroke();
          ctx.restore();
        }

        // Draw Wooden Planks
        for (const p of planks) {
          if (p.fallen) continue;
          ctx.save();
          ctx.translate(p.cx, p.cy);
          ctx.rotate(p.angle);

          // Drop shadow
          ctx.fillStyle = 'rgba(0,0,0,0.38)';
          ctx.beginPath();
          ctx.roundRect(-p.w / 2 + 2, -p.h / 2 + 5, p.w, p.h, 12);
          ctx.fill();

          // Plank body
          const grad = ctx.createLinearGradient(0, -p.h / 2, 0, p.h / 2);
          grad.addColorStop(0, p.color1);
          grad.addColorStop(1, p.color2);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(-p.w / 2, -p.h / 2, p.w, p.h, 12);
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'rgba(255, 237, 213, 0.38)';
          ctx.stroke();

          // Plank pin holes
          for (const lh of p.localHoles) {
            ctx.beginPath();
            ctx.arc(lh.lx, lh.ly, 9, 0, Math.PI * 2);
            ctx.fillStyle = '#18100A';
            ctx.fill();
            ctx.strokeStyle = 'rgba(253, 230, 138, 0.45)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }

          ctx.restore();
        }

        // Draw Bolts ON TOP of Planks
        for (const h of holes) {
          if (!h.boltId) continue;
          const isSel = selectedHoleIdRef.current === h.id;
          ctx.save();
          ctx.translate(h.x, isSel ? h.y - 6 : h.y);

          if (isSel) {
            ctx.beginPath();
            ctx.arc(0, 0, 19, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(253, 224, 71, 0.25)';
            ctx.fill();
          }

          // Metallic hex bolt head
          const bGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 13);
          bGrad.addColorStop(0, isSel ? '#FEF08A' : '#F3F4F6');
          bGrad.addColorStop(0.55, isSel ? '#EAB308' : '#9CA3AF');
          bGrad.addColorStop(1, '#374151');
          ctx.beginPath();
          ctx.arc(0, 0, 12.5, 0, Math.PI * 2);
          ctx.fillStyle = bGrad;
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = isSel ? '#FEF9C3' : '#1F2937';
          ctx.stroke();

          // Screw slot cross
          ctx.strokeStyle = '#1F2937';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(-5, 0);
          ctx.lineTo(5, 0);
          ctx.moveTo(0, -5);
          ctx.lineTo(0, 5);
          ctx.stroke();

          ctx.restore();
        }
      }

      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [level, onSaveProgress]);

  const snapshotHistory = () => {
    historyRef.current = [
      ...historyRef.current.slice(-15),
      {
        holes: holesRef.current.map((h) => ({ ...h })),
        planks: planksRef.current.map((p) => ({
          ...p,
          localHoles: p.localHoles.map((lh) => ({ ...lh })),
        })),
        score: scoreRef.current,
      },
    ];
  };

  const handleCanvasTap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (stageDoneRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * BOARD_W;
    const y = ((e.clientY - rect.top) / rect.height) * BOARD_H;

    // Find nearest hole within tap radius
    let tapped: BoardHole | null = null;
    let minD = 28;
    for (const h of holesRef.current) {
      const d = Math.hypot(h.x - x, h.y - y);
      if (d < minD) {
        minD = d;
        tapped = h;
      }
    }
    if (!tapped) return;

    // Remove bolt tool active
    if (removeMode && tapped.boltId) {
      snapshotHistory();
      const targetId = tapped.id;
      tapped.boltId = null;
      for (const p of planksRef.current) {
        for (const lh of p.localHoles) {
          if (lh.attachedHoleId === targetId) lh.attachedHoleId = null;
        }
        if (p.localHoles.every((lh) => lh.attachedHoleId === null)) {
          p.angVel = (Math.random() - 0.5) * 0.06;
          gameSound.woodFall();
        }
      }
      setRemoveMode(false);
      setRemoveToolLeft((r) => Math.max(0, r - 1));
      gameSound.boltUnscrew();
      return;
    }

    if (tapped.boltId) {
      if (selectedHoleIdRef.current === tapped.id) {
        selectedHoleIdRef.current = null;
        gameSound.tick();
      } else {
        selectedHoleIdRef.current = tapped.id;
        gameSound.boltUnscrew();
      }
      return;
    }

    // Tapped empty hole while holding a bolt
    if (selectedHoleIdRef.current) {
      const srcHole = holesRef.current.find((h) => h.id === selectedHoleIdRef.current);
      if (!srcHole || !srcHole.boltId) {
        selectedHoleIdRef.current = null;
        return;
      }

      // Check if an unaligned plank solid body covers this empty hole
      const blockedByWood = planksRef.current.some((p) => {
        if (!isPointInsidePlank(tapped!.x, tapped!.y, p)) return false;
        // Allow if the plank itself has a socket aligned near this hole!
        const cos = Math.cos(p.angle);
        const sin = Math.sin(p.angle);
        const hasAlignedSocket = p.localHoles.some((lh) => {
          const wx = p.cx + lh.lx * cos - lh.ly * sin;
          const wy = p.cy + lh.lx * sin + lh.ly * cos;
          return Math.hypot(wx - tapped!.x, wy - tapped!.y) < 16;
        });
        return !hasAlignedSocket;
      });

      if (blockedByWood) {
        gameSound.cubeBlocked();
        return;
      }

      snapshotHistory();

      // Move bolt from srcHole to tapped
      const movingBolt = srcHole.boltId;
      srcHole.boltId = null;
      tapped.boltId = movingBolt;
      selectedHoleIdRef.current = null;

      // Detach planks from srcHole, and attach any plank whose socket sits on tapped
      for (const p of planksRef.current) {
        if (p.fallen) continue;
        let detachedNow = false;
        for (const lh of p.localHoles) {
          if (lh.attachedHoleId === srcHole.id) {
            lh.attachedHoleId = null;
            detachedNow = true;
          }
        }
        const cos = Math.cos(p.angle);
        const sin = Math.sin(p.angle);
        for (const lh of p.localHoles) {
          if (lh.attachedHoleId === null) {
            const wx = p.cx + lh.lx * cos - lh.ly * sin;
            const wy = p.cy + lh.lx * sin + lh.ly * cos;
            if (Math.hypot(wx - tapped.x, wy - tapped.y) < 16) {
              lh.attachedHoleId = tapped.id;
            }
          }
        }
        if (detachedNow && p.localHoles.every((lh) => lh.attachedHoleId === null)) {
          p.angVel = (Math.random() - 0.5) * 0.08;
          gameSound.woodFall();
        }
      }

      gameSound.boltScrewIn();
    }
  };

  const handleUndo = () => {
    if (historyRef.current.length === 0 || stageDoneRef.current) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    holesRef.current = prev.holes;
    planksRef.current = prev.planks;
    selectedHoleIdRef.current = null;
    scoreRef.current = prev.score;
    setScore(prev.score);
    gameSound.flip();
  };

  const handleAddExtraHole = () => {
    if (extraHoleUsed || stageDoneRef.current) return;
    holesRef.current.push({ id: `extra_${Date.now()}`, x: BOARD_W / 2, y: 385, boltId: null });
    setExtraHoleUsed(true);
    gameSound.hintChime();
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

  const stageDef = STAGES[(level - 1) % STAGES.length];
  const reachedTarget = score >= minScore;

  return (
    <div className="relative rounded-2xl bg-gradient-to-b from-[#2E1B11] via-[#21130C] to-[#121D16] border border-[#C6A667]/35 p-3 sm:p-4 text-[#F8F5EF] overflow-hidden shadow-lg">
      {showFireworks && <FireworksOverlay active={showFireworks} />}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <AdaptiveLogo variant="horizontal" surface="dark" darkTone="gold" size="2xs" />
          <span className="text-xs font-extrabold text-[#FDE68A]">
            {isEn ? stageDef.titleEn : stageDef.titleVi}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-lg bg-black/35 border border-[#C6A667]/30 text-center">
            <div className="text-[10px] uppercase text-white/60">{isEn ? 'Score' : 'Điểm'}</div>
            <div className="text-sm font-black text-[#FDE68A] tabular-nums">{score}</div>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-black/35 border border-white/15 text-center">
            <div className="text-[10px] uppercase text-white/60">{isEn ? 'Beams' : 'Thanh gỗ'}</div>
            <div className="text-sm font-black text-amber-300 tabular-nums">{planksLeft}</div>
          </div>
          <button
            type="button"
            onClick={() => setLofiOn(gameSound.toggleLofi())}
            aria-label="Toggle Music"
            className={`w-9 h-9 rounded-lg border flex items-center justify-center cursor-pointer ${
              lofiOn ? 'bg-[#C6A667] text-[#111111] border-[#FDE68A]' : 'bg-white/10 text-white border-white/15'
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
            className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 text-white flex items-center justify-center cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Instructions & Goal */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-white/80">
        <span>
          {removeMode
            ? isEn
              ? 'Tap any bolt to permanently unscrew it!'
              : 'Chạm trực tiếp vào 1 con ốc để tháo bỏ ngay!'
            : isEn
              ? 'Tap a bolt, then tap an unobstructed empty socket to drop the wooden beams.'
              : 'Chạm 1 con ốc rồi chạm vào lỗ trống không bị gỗ che để thả rơi thanh gỗ.'}
        </span>
        <span className={`font-bold tabular-nums ${reachedTarget ? 'text-emerald-300' : 'text-[#FDE68A]'}`}>
          {isEn ? `Goal: ${score}/${minScore} pts` : `Mục tiêu quà: ${score}/${minScore} điểm`}
        </span>
      </div>

      {/* Pegboard Canvas */}
      <div className="mt-3 relative mx-auto w-full max-w-[420px]">
        <canvas
          ref={canvasRef}
          width={BOARD_W}
          height={BOARD_H}
          onPointerDown={handleCanvasTap}
          className="w-full h-auto rounded-2xl border-2 border-[#C6A667]/35 shadow-inner touch-none cursor-pointer bg-[#2B1B11]"
        />

        {stageWon && (
          <div className="absolute inset-0 rounded-2xl bg-black/82 backdrop-blur-xs flex flex-col items-center justify-center p-5 text-center space-y-3">
            <Trophy className="w-10 h-10 text-[#FDE047]" />
            <div>
              <h4 className="text-lg font-black text-white">
                {isEn ? `Stage ${level} Cleared!` : `Gỡ Sạch Màn ${level}!`}
              </h4>
              <p className="text-xs text-white/75 mt-1">
                {isEn ? 'Score:' : 'Điểm:'} <span className="font-bold text-[#FDE68A]">{score}</span> ·{' '}
                {isEn ? 'Best:' : 'Kỷ lục:'} <span className="font-bold text-emerald-300">{Math.max(bestScore, score)}</span>
              </p>
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
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0B1F14] font-extrabold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Gift className="w-4 h-4" />
                        <span>{submitting ? (isEn ? 'Claiming...' : 'Đang nhận...') : (isEn ? `Claim Free Gift (${remainingFreeToday})` : `Nhận Quà Miễn Phí (${remainingFreeToday})`)}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={submitting || userPoints < extraCost}
                        onClick={() => handleClaimReward(true)}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#C6A667] text-[#111111] font-extrabold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Coins className="w-4 h-4" />
                        <span>{isEn ? `Use ${extraCost} pts to Claim` : `Đổi ${extraCost} điểm Nhận Quà`}</span>
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={onRequireLogin}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#C6A667] text-[#111111] font-extrabold text-xs cursor-pointer"
                    >
                      {isEn ? 'Sign In to Claim Gift' : 'Đăng Nhập Nhận Quà'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleDemoPlay}
                    className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
                  >
                    {isEn ? 'Preview Reward' : 'Xem Thử Quà'}
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => initStage(level + 1, false)}
                className="w-full py-2.5 px-4 rounded-xl bg-white text-[#111111] font-extrabold text-xs cursor-pointer"
              >
                {isEn ? `Next Stage (${level + 1})` : `Qua Màn ${level + 1}`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tools Strip */}
      <div className="mt-3 max-w-[420px] mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={handleUndo}
          className="py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Undo2 className="w-3.5 h-3.5 text-sky-300" />
          <span>{isEn ? 'Undo' : 'Hoàn tác'}</span>
        </button>

        <button
          type="button"
          disabled={extraHoleUsed}
          onClick={handleAddExtraHole}
          className="py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
        >
          <PlusCircle className="w-3.5 h-3.5 text-emerald-300" />
          <span>{isEn ? '+1 Socket' : '+1 Lỗ chờ'}</span>
        </button>

        <button
          type="button"
          disabled={removeToolLeft <= 0}
          onClick={() => setRemoveMode((m) => !m)}
          className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 ${
            removeMode
              ? 'bg-amber-400 text-[#111111] border-amber-200'
              : 'bg-white/10 hover:bg-white/20 border-white/15 text-white'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>{isEn ? `Unscrew (${removeToolLeft})` : `Tháo 1 ốc (${removeToolLeft})`}</span>
        </button>

        <button
          type="button"
          onClick={() => initStage(level, false)}
          className="py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-300" />
          <span>{isEn ? 'Restart' : 'Chơi lại'}</span>
        </button>
      </div>

      {reachedTarget && !claimedThisRun && !stageWon && (
        <div className="mt-3 max-w-[420px] mx-auto">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleClaimReward(remainingFreeToday <= 0)}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00552B] to-emerald-600 border border-emerald-300/40 text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#FDE68A]" />
            <span>{isEn ? 'Target Reached! Claim ROAR Reward' : 'Đủ Điểm! Bấm Nhận Quà ROAR Ngay'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
