import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Flame,
  Gift,
  Heart,
  Lock,
  Music,
  Play,
  RotateCcw,
  Shield,
  Snowflake,
  Sparkles,
  Swords,
  Timer,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import type { GameConfigRecord, GameRewardRecord } from '../../lib/gamesCatalog';
import { gameSound } from './RoarGamesSound';
import { AdaptiveLogo } from '../AdaptiveLogo';

type NinjaMode = 'classic' | 'zen' | 'arcade';
type BladeId = 'emerald' | 'inferno' | 'thunder' | 'frost';
type FruitKind =
  | 'watermelon'
  | 'pineapple'
  | 'orange'
  | 'apple'
  | 'strawberry'
  | 'dragonfruit'
  | 'coconut'
  | 'roar_bean'
  | 'banana_freeze'
  | 'banana_frenzy'
  | 'banana_double'
  | 'pomegranate'
  | 'bomb';

interface FruitEntity {
  id: number;
  kind: FruitKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  vRot: number;
  sliced: boolean;
  enteredScreen: boolean;
  /** Pomegranate boss multi-slash fields */
  pomHits?: number;
  pomTimer?: number;
  pomMaxTime?: number;
}

interface SlicedHalf {
  kind: FruitKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  vRot: number;
  cutAngle: number;
  side: -1 | 1;
  alpha: number;
}

interface JuiceParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
  kind: 'drop' | 'spark' | 'shard' | 'ring';
  maxRadius?: number;
}

interface SplatMark {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  seed: number;
}

interface FloatingCallout {
  id: number;
  x: number;
  y: number;
  vy: number;
  text: string;
  subText?: string;
  color: string;
  scale: number;
  life: number;
  maxLife: number;
}

interface BladePoint {
  x: number;
  y: number;
  time: number;
}

interface FruitNinjaGameProps {
  lang: string;
  config: GameConfigRecord;
  rewards: GameRewardRecord[];
  remainingFreeToday: number;
  isSignedIn: boolean;
  userPoints: number;
  savedProgress?: { current_level: number; max_level: number; best_score: number };
  onSaveProgress?: (payload: { currentLevel: number; maxLevel: number; bestScore: number }) => void;
  onPlayReal: (useExtraPoints: boolean, score?: number) => Promise<any>;
  onRequireLogin: () => void;
  onDemoResult: (reward: GameRewardRecord) => void;
}

const GUEST_STORAGE_KEY = 'roar_fruitninja_guest_v1';

interface BladeStyle {
  id: BladeId;
  nameVi: string;
  nameEn: string;
  coreColor: string;
  glowColor: string;
  particleColor: string;
  unlockBest: number;
}

const BLADE_STYLES: BladeStyle[] = [
  {
    id: 'emerald',
    nameVi: 'Lục Bảo ROAR',
    nameEn: 'ROAR Emerald',
    coreColor: '#ECFDF5',
    glowColor: '#10B981',
    particleColor: '#C6A667',
    unlockBest: 0,
  },
  {
    id: 'inferno',
    nameVi: 'Hỏa Long',
    nameEn: 'Inferno Flame',
    coreColor: '#FFFBEB',
    glowColor: '#F97316',
    particleColor: '#EF4444',
    unlockBest: 0,
  },
  {
    id: 'thunder',
    nameVi: 'Lôi Thần',
    nameEn: 'Thunder Storm',
    coreColor: '#F5F3FF',
    glowColor: '#8B5CF6',
    particleColor: '#38BDF8',
    unlockBest: 0,
  },
  {
    id: 'frost',
    nameVi: 'Băng Tuyết',
    nameEn: 'Frost Crystal',
    coreColor: '#F0F9FF',
    glowColor: '#38BDF8',
    particleColor: '#BAE6FD',
    unlockBest: 0,
  },
];

const FRUIT_META: Record<
  FruitKind,
  { outer: string; inner: string; juice: string; accent: string; basePts: number }
> = {
  watermelon: { outer: '#15803D', inner: '#EF4444', juice: '#F43F5E', accent: '#111827', basePts: 5 },
  pineapple: { outer: '#D97706', inner: '#FDE047', juice: '#FACC15', accent: '#16A34A', basePts: 6 },
  orange: { outer: '#EA580C', inner: '#FB923C', juice: '#F97316', accent: '#FED7AA', basePts: 4 },
  apple: { outer: '#DC2626', inner: '#FEF3C7', juice: '#FCA5A5', accent: '#991B1B', basePts: 4 },
  strawberry: { outer: '#E11D48', inner: '#FDA4AF', juice: '#FB7185', accent: '#FEF08A', basePts: 5 },
  dragonfruit: { outer: '#DB2777', inner: '#F8FAFC', juice: '#EC4899', accent: '#1E293B', basePts: 7 },
  coconut: { outer: '#78350F', inner: '#F8FAFC', juice: '#E2E8F0', accent: '#451A03', basePts: 6 },
  roar_bean: { outer: '#C6A667', inner: '#FEF08A', juice: '#F59E0B', accent: '#451A03', basePts: 25 },
  banana_freeze: { outer: '#38BDF8', inner: '#E0F2FE', juice: '#7DD3FC', accent: '#0284C7', basePts: 12 },
  banana_frenzy: { outer: '#FACC15', inner: '#FEF9C3', juice: '#FB923C', accent: '#DC2626', basePts: 12 },
  banana_double: { outer: '#A855F7', inner: '#F3E8FF', juice: '#C084FC', accent: '#FACC15', basePts: 12 },
  pomegranate: { outer: '#9F1239', inner: '#E11D48', juice: '#BE123C', accent: '#FDE047', basePts: 15 },
  bomb: { outer: '#1F2937', inner: '#EF4444', juice: '#F97316', accent: '#FACC15', basePts: 0 },
};

function distPointToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function getNinjaRank(score: number, lang: string): { vi: string; en: string; level: number } {
  if (score >= 700) return { vi: 'Huyền Thoại ROAR', en: 'ROAR Legend', level: 5 };
  if (score >= 450) return { vi: 'Đại Sư Dojo', en: 'Dojo Grandmaster', level: 4 };
  if (score >= 280) return { vi: 'Thượng Nhẫn', en: 'Master Shinobi', level: 3 };
  if (score >= 150) return { vi: 'Kiếm Sĩ', en: 'Blade Apprentice', level: 2 };
  return { vi: 'Tân Binh', en: 'Dojo Novice', level: 1 };
}

export const FruitNinjaGame: React.FC<FruitNinjaGameProps> = ({
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
  const tr = (vi: string, en: string) => (lang === 'en' ? en : vi);
  const minScoreToWin = Math.max(120, Number(config.min_score_to_win || 180));

  const [mode, setMode] = useState<NinjaMode>('arcade');
  const [bladeId, setBladeId] = useState<BladeId>('emerald');
  const [phase, setPhase] = useState<'ready' | 'playing' | 'ended'>('ready');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    let localBest = 0;
    try {
      const raw = localStorage.getItem(GUEST_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        localBest = Number(parsed?.bestScore || 0);
      }
    } catch {
      // ignore
    }
    return Math.max(localBest, Number(savedProgress?.best_score || 0));
  });
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(60);
  const [maxCombo, setMaxCombo] = useState(0);
  const [totalSliced, setTotalSliced] = useState(0);
  const [endReason, setEndReason] = useState<'time' | 'bomb' | 'lives'>('time');
  const [activeEffects, setActiveEffects] = useState<{ freeze: number; frenzy: number; double: number }>({
    freeze: 0,
    frenzy: 0,
    double: 0,
  });
  const [soundMuted, setSoundMuted] = useState(gameSound.muted);
  const [lofiOn, setLofiOn] = useState(gameSound.lofiActive);
  const [submittingReward, setSubmittingReward] = useState(false);
  const [claimedThisRun, setClaimedThisRun] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Mutable high-frequency engine refs for rock-solid 60fps loop
  const engineRef = useRef({
    phase: 'ready' as 'ready' | 'playing' | 'ended',
    mode: 'arcade' as NinjaMode,
    bladeId: 'emerald' as BladeId,
    width: 720,
    height: 460,
    score: 0,
    lives: 3,
    timeLeft: 60,
    maxCombo: 0,
    totalSliced: 0,
    wave: 1,
    spawnCooldown: 0.7,
    frenzySpawnCooldown: 0,
    pomCooldown: 16,
    freezeRemaining: 0,
    frenzyRemaining: 0,
    doubleRemaining: 0,
    shakeTime: 0,
    shakePower: 0,
    bombFlashAlpha: 0,
    fruits: [] as FruitEntity[],
    halves: [] as SlicedHalf[],
    particles: [] as JuiceParticle[],
    splats: [] as SplatMark[],
    callouts: [] as FloatingCallout[],
    trail: [] as BladePoint[],
    isPointerDown: false,
    lastWhooshAt: 0,
    strokeComboCount: 0,
    strokeComboTimer: 0,
    strokeLastX: 0,
    strokeLastY: 0,
    nextId: 1,
    hudSyncAccum: 0,
  });

  useEffect(() => {
    if (savedProgress?.best_score && savedProgress.best_score > bestScore) {
      setBestScore(savedProgress.best_score);
    }
  }, [savedProgress?.best_score]);

  useEffect(() => {
    engineRef.current.bladeId = bladeId;
  }, [bladeId]);

  const persistProgress = useCallback(
    (finalScore: number) => {
      const nextBest = Math.max(bestScore, finalScore);
      if (nextBest !== bestScore) setBestScore(nextBest);
      const rank = getNinjaRank(nextBest, lang);
      try {
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({ bestScore: nextBest, level: rank.level }));
      } catch {
        // ignore
      }
      onSaveProgress?.({
        currentLevel: rank.level,
        maxLevel: rank.level,
        bestScore: nextBest,
      });
    },
    [bestScore, lang, onSaveProgress]
  );

  const finishGame = useCallback(
    (reason: 'time' | 'bomb' | 'lives') => {
      const eng = engineRef.current;
      if (eng.phase === 'ended') return;
      eng.phase = 'ended';
      setPhase('ended');
      setEndReason(reason);
      setScore(eng.score);
      setLives(eng.lives);
      setTimeLeft(Math.max(0, Math.ceil(eng.timeLeft)));
      setMaxCombo(eng.maxCombo);
      setTotalSliced(eng.totalSliced);
      setActiveEffects({ freeze: 0, frenzy: 0, double: 0 });
      persistProgress(eng.score);

      if (reason === 'bomb') {
        gameSound.ninjaBomb();
      } else if (eng.score >= minScoreToWin) {
        gameSound.victoryFanfare();
      } else {
        gameSound.gameOver();
      }
    },
    [minScoreToWin, persistProgress]
  );

  const startRun = useCallback(
    (chosenMode?: NinjaMode) => {
      const targetMode = chosenMode || mode;
      if (chosenMode) setMode(chosenMode);
      const eng = engineRef.current;
      const initialTime = targetMode === 'zen' ? 90 : targetMode === 'arcade' ? 60 : 0;

      eng.phase = 'playing';
      eng.mode = targetMode;
      eng.score = 0;
      eng.lives = 3;
      eng.timeLeft = initialTime;
      eng.maxCombo = 0;
      eng.totalSliced = 0;
      eng.wave = 1;
      eng.spawnCooldown = 0.45;
      eng.frenzySpawnCooldown = 0;
      eng.pomCooldown = targetMode === 'arcade' ? 17 : 22;
      eng.freezeRemaining = 0;
      eng.frenzyRemaining = 0;
      eng.doubleRemaining = 0;
      eng.shakeTime = 0;
      eng.shakePower = 0;
      eng.bombFlashAlpha = 0;
      eng.fruits = [];
      eng.halves = [];
      eng.particles = [];
      eng.splats = [];
      eng.callouts = [];
      eng.trail = [];
      eng.strokeComboCount = 0;
      eng.strokeComboTimer = 0;

      setPhase('playing');
      setScore(0);
      setLives(3);
      setTimeLeft(initialTime);
      setMaxCombo(0);
      setTotalSliced(0);
      setClaimedThisRun(false);
      setActiveEffects({ freeze: 0, frenzy: 0, double: 0 });
      gameSound.ninjaWhoosh(1.2);
    },
    [mode]
  );

  const addCallout = (x: number, y: number, text: string, color: string, scale = 1, subText?: string) => {
    const eng = engineRef.current;
    eng.callouts.push({
      id: eng.nextId++,
      x: Math.max(70, Math.min(eng.width - 70, x)),
      y: Math.max(55, Math.min(eng.height - 45, y)),
      vy: -55,
      text,
      subText,
      color,
      scale,
      life: 1.05,
      maxLife: 1.05,
    });
  };

  const spawnFruitBurst = useCallback((count: number, forceSide?: 'left' | 'right', allowSpecials = true) => {
    const eng = engineRef.current;
    const w = eng.width;
    const h = eng.height;
    const isSmall = w < 460;
    const baseR = isSmall ? 24 : 30;
    const gravity = isSmall ? 590 : 660;

    for (let i = 0; i < count; i++) {
      let kind: FruitKind = 'watermelon';
      const roll = Math.random();

      if (allowSpecials && eng.mode !== 'zen' && roll < 0.14 + Math.min(0.11, eng.wave * 0.014)) {
        kind = 'bomb';
      } else if (allowSpecials && eng.mode === 'arcade' && roll < 0.25) {
        const bRoll = Math.random();
        kind = bRoll < 0.34 ? 'banana_freeze' : bRoll < 0.68 ? 'banana_frenzy' : 'banana_double';
      } else if (allowSpecials && roll < 0.28) {
        kind = 'roar_bean';
      } else {
        const pool: FruitKind[] = ['watermelon', 'pineapple', 'orange', 'apple', 'strawberry', 'dragonfruit', 'coconut'];
        kind = pool[Math.floor(Math.random() * pool.length)];
      }

      let x = w * (0.16 + Math.random() * 0.68);
      let y = h + baseR + Math.random() * 28;
      let vx = (w * 0.5 - x) * (0.35 + Math.random() * 0.45) + (Math.random() - 0.5) * 90;
      const peakMin = h * 0.14;
      const peakMax = h * 0.38;
      const targetPeakY = peakMin + Math.random() * (peakMax - peakMin);
      let vy = -Math.sqrt(Math.max(120, 2 * gravity * (h - targetPeakY)));

      if (forceSide) {
        x = forceSide === 'left' ? -baseR : w + baseR;
        y = h * (0.38 + Math.random() * 0.34);
        vx = (forceSide === 'left' ? 1 : -1) * (w * (0.45 + Math.random() * 0.28));
        vy = -(h * (0.68 + Math.random() * 0.32));
      }

      const radius =
        kind === 'watermelon'
          ? baseR * 1.18
          : kind === 'pineapple'
            ? baseR * 1.12
            : kind === 'strawberry' || kind === 'roar_bean'
              ? baseR * 0.86
              : kind === 'bomb'
                ? baseR * 0.96
                : baseR;

      eng.fruits.push({
        id: eng.nextId++,
        kind,
        x,
        y,
        vx,
        vy,
        radius,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 4.5,
        sliced: false,
        enteredScreen: Boolean(forceSide),
      });
    }
  }, []);

  const sliceFruit = useCallback(
    (fruit: FruitEntity, cutAngle: number, hitDistRatio: number) => {
      const eng = engineRef.current;
      const meta = FRUIT_META[fruit.kind];

      // Handle Pomegranate multi-slash boss
      if (fruit.kind === 'pomegranate') {
        fruit.pomHits = (fruit.pomHits || 0) + 1;
        const mult = eng.doubleRemaining > 0 ? 2 : 1;
        const pts = 5 * mult;
        eng.score += pts;
        eng.totalSliced += 1;
        eng.shakeTime = 0.08;
        eng.shakePower = 4;
        gameSound.ninjaPomegranateHit(fruit.pomHits);
        addCallout(
          fruit.x + (Math.random() - 0.5) * 40,
          fruit.y - 36,
          `${fruit.pomHits} HITS!`,
          '#FDE047',
          1.12,
          `+${pts}`
        );
        for (let i = 0; i < 10; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 120 + Math.random() * 240;
          eng.particles.push({
            x: fruit.x,
            y: fruit.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            radius: 3 + Math.random() * 3.5,
            color: i % 2 === 0 ? '#FB7185' : '#FDE047',
            alpha: 1,
            decay: 2.1,
            gravity: 340,
            kind: 'drop',
          });
        }
        return;
      }

      fruit.sliced = true;

      // Bomb hit handling
      if (fruit.kind === 'bomb') {
        eng.bombFlashAlpha = 0.92;
        eng.shakeTime = 0.48;
        eng.shakePower = 16;
        for (let i = 0; i < 36; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 140 + Math.random() * 420;
          eng.particles.push({
            x: fruit.x,
            y: fruit.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            radius: 3 + Math.random() * 5,
            color: i % 3 === 0 ? '#FFFFFF' : i % 2 === 0 ? '#F97316' : '#EF4444',
            alpha: 1,
            decay: 1.4,
            gravity: 160,
            kind: 'spark',
          });
        }
        if (eng.mode === 'classic') {
          finishGame('bomb');
        } else {
          eng.score = Math.max(0, eng.score - 10);
          eng.strokeComboCount = 0;
          gameSound.ninjaBomb();
          addCallout(fruit.x, fruit.y - 20, 'BOOM! -10', '#EF4444', 1.25);
        }
        return;
      }

      // Valid fruit sliced!
      const isCrit = hitDistRatio < 0.28 && Math.random() < 0.45;
      const mult = eng.doubleRemaining > 0 ? 2 : 1;
      const critBonus = isCrit ? 10 : 0;
      const gained = (meta.basePts + critBonus) * mult;
      eng.score += gained;
      eng.totalSliced += 1;

      eng.strokeComboCount += 1;
      eng.strokeComboTimer = 0.28;
      eng.strokeLastX = fruit.x;
      eng.strokeLastY = fruit.y;

      gameSound.ninjaSlice(eng.strokeComboCount, isCrit);

      // Special Bananas & Golden Bean triggers
      if (fruit.kind === 'banana_freeze') {
        eng.freezeRemaining = 5.2;
        gameSound.ninjaFreeze();
        addCallout(fruit.x, fruit.y - 24, tr('ĐÓNG BĂNG!', 'FREEZE!'), '#38BDF8', 1.3, tr('Chậm thời gian 5s', '5s Slow-Mo'));
      } else if (fruit.kind === 'banana_frenzy') {
        eng.frenzyRemaining = 5.4;
        eng.frenzySpawnCooldown = 0.08;
        gameSound.ninjaFrenzy();
        addCallout(fruit.x, fruit.y - 24, tr('MƯA TRÁI CÂY!', 'FRENZY!'), '#FACC15', 1.35, tr('Phóng 2 bên liên hoàn', 'Double Barrage'));
      } else if (fruit.kind === 'banana_double') {
        eng.doubleRemaining = 6.2;
        gameSound.ninjaComboBlitz(5);
        addCallout(fruit.x, fruit.y - 24, '2X SCORE!', '#C084FC', 1.35, tr('Nhân đôi điểm 6s', 'Double Points 6s'));
      } else if (fruit.kind === 'roar_bean') {
        gameSound.catchGolden();
        addCallout(fruit.x, fruit.y - 22, `ROAR BEAN +${gained}`, '#FDE047', 1.32, isCrit ? 'CRITICAL!' : 'ARABICA GOLD');
      } else if (isCrit) {
        addCallout(fruit.x, fruit.y - 18, `CRITICAL! +${gained}`, '#FDE047', 1.2);
      } else if (mult > 1) {
        addCallout(fruit.x, fruit.y - 14, `+${gained} (2X)`, '#C084FC', 0.95);
      }

      // Split into two halves perpendicular to cut angle
      const perpX = Math.cos(cutAngle + Math.PI / 2);
      const perpY = Math.sin(cutAngle + Math.PI / 2);
      const splitSpeed = 95 + Math.random() * 55;
      for (const side of [-1, 1] as const) {
        eng.halves.push({
          kind: fruit.kind,
          x: fruit.x + perpX * side * 6,
          y: fruit.y + perpY * side * 6,
          vx: fruit.vx + perpX * side * splitSpeed,
          vy: fruit.vy + perpY * side * splitSpeed - 45,
          radius: fruit.radius,
          rotation: fruit.rotation,
          vRot: side * (2.5 + Math.random() * 3.5),
          cutAngle,
          side,
          alpha: 1,
        });
      }

      // Persistent juice splatter on Dojo board
      if (eng.splats.length > 26) eng.splats.shift();
      eng.splats.push({
        x: fruit.x,
        y: fruit.y,
        radius: fruit.radius * (1.25 + Math.random() * 0.55),
        color: meta.juice,
        alpha: 0.42,
        seed: Math.random() * 100,
      });

      // Shockwave ring + 18 juicy droplets
      eng.particles.push({
        x: fruit.x,
        y: fruit.y,
        vx: 0,
        vy: 0,
        radius: fruit.radius * 0.5,
        maxRadius: fruit.radius * (isCrit ? 2.8 : 1.9),
        color: isCrit ? '#FDE047' : meta.juice,
        alpha: 0.85,
        decay: 3.1,
        gravity: 0,
        kind: 'ring',
      });

      for (let i = 0; i < 18; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 90 + Math.random() * 290;
        eng.particles.push({
          x: fruit.x,
          y: fruit.y,
          vx: Math.cos(ang) * spd + fruit.vx * 0.25,
          vy: Math.sin(ang) * spd + fruit.vy * 0.25,
          radius: 2.5 + Math.random() * 4.5,
          color: i % 4 === 0 ? meta.inner : meta.juice,
          alpha: 1,
          decay: 1.45 + Math.random() * 0.8,
          gravity: 520,
          kind: 'drop',
        });
      }
    },
    [finishGame, tr]
  );

  // Canvas resize observer
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(300, Math.round(rect.width));
      const h = Math.max(320, Math.round(rect.height));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      engineRef.current.width = w;
      engineRef.current.height = h;
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Main 60fps simulation & rendering loop
  useEffect(() => {
    let rafId = 0;
    let lastTs = performance.now();

    const drawDojoBackground = (ctx: CanvasRenderingContext2D, w: number, h: number, eng: typeof engineRef.current) => {
      const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.42, 40, w * 0.5, h * 0.5, Math.max(w, h) * 0.78);
      bgGrad.addColorStop(0, '#462A17');
      bgGrad.addColorStop(0.55, '#2C190D');
      bgGrad.addColorStop(1, '#140B06');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Horizontal dojo wooden plank seams & subtle grain
      const plankH = Math.max(48, h / 7);
      ctx.lineWidth = 1.5;
      for (let py = plankH; py < h; py += plankH) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.36)';
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(w, py);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 215, 160, 0.04)';
        ctx.beginPath();
        ctx.moveTo(0, py + 1.5);
        ctx.lineTo(w, py + 1.5);
        ctx.stroke();
      }

      // Subtle ROAR Dojo center emblem watermark (craft seal)
      ctx.save();
      ctx.translate(w * 0.5, h * 0.5);
      ctx.strokeStyle = 'rgba(198, 166, 103, 0.08)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(w, h) * 0.24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(w, h) * 0.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Active power-up perimeter auras
      if (eng.freezeRemaining > 0) {
        const freezeGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.25, w * 0.5, h * 0.5, w * 0.65);
        freezeGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        freezeGrad.addColorStop(1, 'rgba(56, 189, 248, 0.26)');
        ctx.fillStyle = freezeGrad;
        ctx.fillRect(0, 0, w, h);
      }
      if (eng.frenzyRemaining > 0) {
        const frenzyGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.22, w * 0.5, h * 0.5, w * 0.65);
        frenzyGrad.addColorStop(0, 'rgba(250, 204, 21, 0)');
        frenzyGrad.addColorStop(1, 'rgba(249, 115, 22, 0.22)');
        ctx.fillStyle = frenzyGrad;
        ctx.fillRect(0, 0, w, h);
      }
      if (eng.doubleRemaining > 0) {
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.55)';
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, w - 6, h - 6);
      }
    };

    const drawFruitGraphic = (ctx: CanvasRenderingContext2D, kind: FruitKind, r: number, nowSec: number, pomRatio?: number) => {
      const meta = FRUIT_META[kind];

      if (kind === 'bomb') {
        // Metallic iron bomb + red warning pulse + burning fuse sparks
        const bodyGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.15, 0, 0, r);
        bodyGrad.addColorStop(0, '#4B5563');
        bodyGrad.addColorStop(0.55, '#1F2937');
        bodyGrad.addColorStop(1, '#090D16');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Warning crimson X
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = Math.max(3, r * 0.14);
        ctx.lineCap = 'round';
        const xr = r * 0.34;
        ctx.beginPath();
        ctx.moveTo(-xr, -xr);
        ctx.lineTo(xr, xr);
        ctx.moveTo(xr, -xr);
        ctx.lineTo(-xr, xr);
        ctx.stroke();

        // Fuse cap & sizzling spark
        ctx.fillStyle = '#78350F';
        ctx.fillRect(-r * 0.18, -r * 1.12, r * 0.36, r * 0.22);
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.1);
        ctx.quadraticCurveTo(r * 0.28, -r * 1.38, r * 0.42, -r * 1.24);
        ctx.stroke();

        const sparkPulse = 0.7 + Math.sin(nowSec * 28) * 0.3;
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        ctx.arc(r * 0.42, -r * 1.24, r * 0.22 * sparkPulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(r * 0.42, -r * 1.24, r * 0.1 * sparkPulse, 0, Math.PI * 2);
        ctx.fill();
        return;
      }

      if (kind === 'banana_freeze' || kind === 'banana_frenzy' || kind === 'banana_double') {
        // Curved glowing crescent banana
        ctx.save();
        const glowCol = kind === 'banana_freeze' ? '#38BDF8' : kind === 'banana_frenzy' ? '#FACC15' : '#C084FC';
        ctx.shadowColor = glowCol;
        ctx.shadowBlur = 16;
        ctx.fillStyle = meta.outer;
        ctx.beginPath();
        ctx.moveTo(-r * 0.95, -r * 0.2);
        ctx.quadraticCurveTo(0, r * 0.95, r * 0.98, -r * 0.18);
        ctx.quadraticCurveTo(0, r * 0.32, -r * 0.95, -r * 0.2);
        ctx.fill();

        ctx.strokeStyle = meta.inner;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Tag icon text
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.round(r * 0.36)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(kind === 'banana_freeze' ? 'ICE' : kind === 'banana_frenzy' ? 'FRZ' : '2X', 0, r * 0.16);
        ctx.restore();
        return;
      }

      if (kind === 'roar_bean') {
        // Golden Royal ROAR Coffee Bean
        ctx.save();
        ctx.shadowColor = '#FACC15';
        ctx.shadowBlur = 18;
        const grad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.1, 0, 0, r);
        grad.addColorStop(0, '#FEF08A');
        grad.addColorStop(0.6, '#C6A667');
        grad.addColorStop(1, '#92400E');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.84, r * 1.08, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#451A03';
        ctx.lineWidth = Math.max(2.5, r * 0.12);
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.85);
        ctx.bezierCurveTo(r * 0.25, -r * 0.25, -r * 0.25, r * 0.25, 0, r * 0.85);
        ctx.stroke();
        ctx.restore();
        return;
      }

      if (kind === 'pomegranate') {
        const pulse = 1 + Math.sin(nowSec * 14) * 0.05;
        ctx.save();
        ctx.scale(pulse, pulse);
        ctx.shadowColor = '#FB7185';
        ctx.shadowBlur = 22;
        const pGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
        pGrad.addColorStop(0, '#F43F5E');
        pGrad.addColorStop(0.7, '#9F1239');
        pGrad.addColorStop(1, '#4C0519');
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Crown calyx
        ctx.fillStyle = '#BE123C';
        ctx.beginPath();
        ctx.moveTo(-r * 0.28, -r * 0.88);
        ctx.lineTo(-r * 0.14, -r * 1.18);
        ctx.lineTo(0, -r * 0.96);
        ctx.lineTo(r * 0.14, -r * 1.18);
        ctx.lineTo(r * 0.28, -r * 0.88);
        ctx.closePath();
        ctx.fill();

        // Countdown ring
        if (pomRatio !== undefined) {
          ctx.shadowBlur = 0;
          ctx.strokeStyle = '#FDE047';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, r + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, pomRatio));
          ctx.stroke();
        }
        ctx.restore();
        return;
      }

      // Standard luscious fruit body
      const grad = ctx.createRadialGradient(-r * 0.32, -r * 0.32, r * 0.12, 0, 0, r);
      grad.addColorStop(0, meta.inner);
      grad.addColorStop(0.28, meta.outer);
      grad.addColorStop(1, '#0F172A');
      ctx.fillStyle = meta.outer;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Subtle glossy highlight
      ctx.fillStyle = 'rgba(255,255,255,0.24)';
      ctx.beginPath();
      ctx.ellipse(-r * 0.3, -r * 0.34, r * 0.32, r * 0.16, -0.5, 0, Math.PI * 2);
      ctx.fill();

      if (kind === 'watermelon') {
        ctx.strokeStyle = '#064E3B';
        ctx.lineWidth = Math.max(2.5, r * 0.14);
        for (let s = -1; s <= 1; s++) {
          ctx.beginPath();
          ctx.arc(s * r * 0.36, 0, r * 0.82, -0.7, 0.7);
          ctx.stroke();
        }
      } else if (kind === 'pineapple') {
        ctx.fillStyle = '#16A34A';
        ctx.beginPath();
        ctx.moveTo(-r * 0.25, -r * 0.85);
        ctx.lineTo(0, -r * 1.38);
        ctx.lineTo(r * 0.25, -r * 0.85);
        ctx.fill();
        ctx.strokeStyle = '#92400E';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-r * 0.5, -r * 0.5);
        ctx.lineTo(r * 0.5, r * 0.5);
        ctx.moveTo(r * 0.5, -r * 0.5);
        ctx.lineTo(-r * 0.5, r * 0.5);
        ctx.stroke();
      } else if (kind === 'apple' || kind === 'strawberry') {
        ctx.fillStyle = '#22C55E';
        ctx.beginPath();
        ctx.ellipse(r * 0.16, -r * 0.92, r * 0.26, r * 0.12, -0.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (kind === 'orange') {
        ctx.strokeStyle = 'rgba(255,237,213,0.45)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const drawSlicedHalf = (ctx: CanvasRenderingContext2D, half: SlicedHalf) => {
      const meta = FRUIT_META[half.kind];
      ctx.save();
      ctx.globalAlpha = half.alpha;
      ctx.translate(half.x, half.y);
      ctx.rotate(half.cutAngle + half.rotation);

      ctx.beginPath();
      if (half.side === -1) {
        ctx.arc(0, 0, half.radius, Math.PI, Math.PI * 2);
      } else {
        ctx.arc(0, 0, half.radius, 0, Math.PI);
      }
      ctx.closePath();

      ctx.fillStyle = meta.outer;
      ctx.fill();

      // Inner juicy cross-section band
      ctx.fillStyle = meta.inner;
      ctx.beginPath();
      ctx.ellipse(0, 0, half.radius * 0.86, half.radius * 0.24, 0, 0, Math.PI * 2);
      ctx.fill();

      // Seeds on cross-section
      ctx.fillStyle = meta.accent;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.arc(i * half.radius * 0.24, 0, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const tick = (now: number) => {
      const rawDt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;
      const nowSec = now / 1000;
      const eng = engineRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');

      if (canvas && ctx) {
        const dpr = canvas.width / Math.max(1, eng.width);
        ctx.save();
        ctx.scale(dpr, dpr);

        // Physics update during active play
        if (eng.phase === 'playing') {
          const timeScale = eng.freezeRemaining > 0 ? 0.44 : 1;
          const dt = rawDt * timeScale;

          if (eng.freezeRemaining > 0) eng.freezeRemaining = Math.max(0, eng.freezeRemaining - rawDt);
          if (eng.frenzyRemaining > 0) eng.frenzyRemaining = Math.max(0, eng.frenzyRemaining - rawDt);
          if (eng.doubleRemaining > 0) eng.doubleRemaining = Math.max(0, eng.doubleRemaining - rawDt);
          if (eng.shakeTime > 0) eng.shakeTime = Math.max(0, eng.shakeTime - rawDt);
          if (eng.bombFlashAlpha > 0) eng.bombFlashAlpha = Math.max(0, eng.bombFlashAlpha - rawDt * 2.1);

          // Timer countdown for Zen & Arcade (paused while Frozen!)
          if ((eng.mode === 'zen' || eng.mode === 'arcade') && eng.freezeRemaining <= 0) {
            eng.timeLeft -= rawDt;
            if (eng.timeLeft <= 0) {
              eng.timeLeft = 0;
              finishGame('time');
            }
          }

          // Combo flush window
          if (eng.strokeComboCount > 0) {
            eng.strokeComboTimer -= rawDt;
            if (eng.strokeComboTimer <= 0) {
              if (eng.strokeComboCount >= 3) {
                const mult = eng.doubleRemaining > 0 ? 2 : 1;
                const bonus = eng.strokeComboCount * 2 * mult;
                eng.score += bonus;
                if (eng.strokeComboCount > eng.maxCombo) eng.maxCombo = eng.strokeComboCount;
                eng.shakeTime = 0.14;
                eng.shakePower = Math.min(10, eng.strokeComboCount * 1.8);
                gameSound.ninjaComboBlitz(eng.strokeComboCount);
                addCallout(
                  eng.strokeLastX,
                  eng.strokeLastY - 26,
                  `${eng.strokeComboCount} FRUIT BLITZ!`,
                  '#FDE047',
                  1.36,
                  `+${bonus} ${tr('COMBO', 'COMBO')}`
                );
              }
              eng.strokeComboCount = 0;
            }
          }

          // Wave spawning
          eng.spawnCooldown -= dt;
          if (eng.spawnCooldown <= 0) {
            const batchSize =
              eng.mode === 'zen'
                ? 2 + Math.floor(Math.random() * 4)
                : Math.min(6, 1 + Math.floor(eng.wave * 0.35) + Math.floor(Math.random() * 3));
            spawnFruitBurst(batchSize);
            eng.wave += 1;
            eng.spawnCooldown = Math.max(0.85, 2.05 - Math.min(0.95, eng.wave * 0.04));
          }

          // Frenzy side barrage spawning
          if (eng.frenzyRemaining > 0) {
            eng.frenzySpawnCooldown -= rawDt;
            if (eng.frenzySpawnCooldown <= 0) {
              spawnFruitBurst(1, Math.random() < 0.5 ? 'left' : 'right', false);
              eng.frenzySpawnCooldown = 0.22;
            }
          }

          // Pomegranate Multi-Slash Boss spawn
          eng.pomCooldown -= rawDt;
          if (eng.pomCooldown <= 0 && eng.mode !== 'zen') {
            eng.fruits.push({
              id: eng.nextId++,
              kind: 'pomegranate',
              x: eng.width * 0.5,
              y: eng.height + 42,
              vx: 0,
              vy: -Math.sqrt(2 * 640 * (eng.height * 0.52)),
              radius: eng.width < 460 ? 34 : 42,
              rotation: 0,
              vRot: 1.5,
              sliced: false,
              enteredScreen: true,
              pomHits: 0,
              pomTimer: 2.8,
              pomMaxTime: 2.8,
            });
            eng.pomCooldown = 26;
          }

          const gravity = eng.width < 460 ? 590 : 660;
          const remainingFruits: FruitEntity[] = [];

          for (const f of eng.fruits) {
            if (f.sliced) continue;

            if (f.kind === 'pomegranate' && f.pomTimer !== undefined) {
              // Hover dramatically near center while player multi-slashes
              if (f.y <= eng.height * 0.48 && f.pomTimer > 0) {
                f.pomTimer -= rawDt;
                f.vy *= 0.85;
                f.y += f.vy * rawDt;
                f.rotation += f.vRot * rawDt;
                if (f.pomTimer <= 0) {
                  // Detonate Pomegranate and slice all fruits on screen!
                  const hits = f.pomHits || 0;
                  const pomBonus = hits * 8;
                  if (hits > 0) {
                    eng.score += pomBonus;
                    eng.shakeTime = 0.35;
                    eng.shakePower = 12;
                    gameSound.ninjaPomegranateBoom();
                    addCallout(f.x, f.y, `${hits} SLASHES! +${pomBonus}`, '#FDE047', 1.45, 'POMEGRANATE BLAST!');
                    for (const other of eng.fruits) {
                      if (!other.sliced && other.id !== f.id && other.kind !== 'bomb') {
                        sliceFruit(other, Math.random() * Math.PI, 0.5);
                      }
                    }
                  }
                  continue;
                }
                remainingFruits.push(f);
                continue;
              }
            }

            f.x += f.vx * dt;
            f.y += f.vy * dt;
            f.vy += gravity * dt;
            f.rotation += f.vRot * dt;

            if (f.y < eng.height - f.radius * 0.5) {
              f.enteredScreen = true;
            }

            // Bomb sparks
            if (f.kind === 'bomb' && Math.random() < 0.35) {
              eng.particles.push({
                x: f.x + Math.cos(f.rotation - Math.PI / 2) * f.radius * 1.1,
                y: f.y + Math.sin(f.rotation - Math.PI / 2) * f.radius * 1.1,
                vx: (Math.random() - 0.5) * 80,
                vy: -60 - Math.random() * 80,
                radius: 2 + Math.random() * 2,
                color: Math.random() < 0.5 ? '#FACC15' : '#F97316',
                alpha: 1,
                decay: 3.2,
                gravity: 140,
                kind: 'spark',
              });
            }

            if (f.y > eng.height + f.radius * 2.2 && f.vy > 0) {
              // Dropped unsliced normal fruit in Classic costs 1 life
              const isPenaltyFruit =
                eng.mode === 'classic' &&
                f.enteredScreen &&
                f.kind !== 'bomb' &&
                f.kind !== 'roar_bean' &&
                f.kind !== 'pomegranate' &&
                !f.kind.startsWith('banana_');
              if (isPenaltyFruit) {
                eng.lives -= 1;
                gameSound.catchBad();
                addCallout(Math.max(50, Math.min(eng.width - 50, f.x)), eng.height - 40, 'MISS! ✕', '#F87171', 1.05);
                if (eng.lives <= 0) {
                  eng.lives = 0;
                  finishGame('lives');
                }
              }
              continue;
            }

            remainingFruits.push(f);
          }
          eng.fruits = remainingFruits;

          // Sync lightweight React HUD ~10 times/sec
          eng.hudSyncAccum += rawDt;
          if (eng.hudSyncAccum >= 0.1) {
            eng.hudSyncAccum = 0;
            setScore(eng.score);
            setLives(eng.lives);
            setTimeLeft(Math.max(0, Math.ceil(eng.timeLeft)));
            setActiveEffects({
              freeze: Math.ceil(eng.freezeRemaining),
              frenzy: Math.ceil(eng.frenzyRemaining),
              double: Math.ceil(eng.doubleRemaining),
            });
          }
        }

        // Update halves, particles, splats, callouts, trail even after round ends
        const gravityVisual = eng.width < 460 ? 600 : 660;
        eng.halves = eng.halves.filter((hf) => {
          hf.x += hf.vx * rawDt;
          hf.y += hf.vy * rawDt;
          hf.vy += gravityVisual * rawDt;
          hf.rotation += hf.vRot * rawDt;
          hf.alpha = Math.max(0, hf.alpha - rawDt * 0.45);
          return hf.y < eng.height + 90 && hf.alpha > 0.02;
        });

        eng.particles = eng.particles.filter((pt) => {
          if (pt.kind === 'ring') {
            pt.radius += ((pt.maxRadius || 60) - pt.radius) * Math.min(1, rawDt * 12);
            pt.alpha -= pt.decay * rawDt;
            return pt.alpha > 0.02;
          }
          pt.x += pt.vx * rawDt;
          pt.y += pt.vy * rawDt;
          pt.vy += pt.gravity * rawDt;
          pt.alpha -= pt.decay * rawDt;
          return pt.alpha > 0.02;
        });

        eng.splats = eng.splats.filter((sp) => {
          sp.alpha -= rawDt * 0.055;
          return sp.alpha > 0.02;
        });

        eng.callouts = eng.callouts.filter((cl) => {
          cl.y += cl.vy * rawDt;
          cl.vy *= 0.94;
          cl.life -= rawDt;
          return cl.life > 0;
        });

        eng.trail = eng.trail.filter((pt) => now - pt.time <= 135);

        // Apply screen shake offset
        ctx.save();
        if (eng.shakeTime > 0) {
          const sx = (Math.random() - 0.5) * eng.shakePower;
          const sy = (Math.random() - 0.5) * eng.shakePower;
          ctx.translate(sx, sy);
        }

        drawDojoBackground(ctx, eng.width, eng.height, eng);

        // 1. Juice splats on wood
        for (const sp of eng.splats) {
          ctx.save();
          ctx.globalAlpha = sp.alpha;
          ctx.fillStyle = sp.color;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.radius * 0.65, 0, Math.PI * 2);
          ctx.fill();
          for (let b = 0; b < 5; b++) {
            const a = sp.seed + b * 1.25;
            ctx.beginPath();
            ctx.arc(
              sp.x + Math.cos(a) * sp.radius * 0.65,
              sp.y + Math.sin(a) * sp.radius * 0.65,
              sp.radius * (0.2 + (b % 2) * 0.14),
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
          ctx.restore();
        }

        // 2. Sliced halves
        for (const hf of eng.halves) {
          drawSlicedHalf(ctx, hf);
        }

        // 3. Active whole fruits
        for (const f of eng.fruits) {
          ctx.save();
          ctx.translate(f.x, f.y);
          ctx.rotate(f.rotation);
          const pomRatio =
            f.kind === 'pomegranate' && f.pomTimer !== undefined && f.pomMaxTime
              ? f.pomTimer / f.pomMaxTime
              : undefined;
          drawFruitGraphic(ctx, f.kind, f.radius, nowSec, pomRatio);
          ctx.restore();
        }

        // 4. Particles & shockwave rings
        for (const pt of eng.particles) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, pt.alpha);
          if (pt.kind === 'ring') {
            ctx.strokeStyle = pt.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // 5. Tapered Glowing Katana Blade Trail
        if (eng.trail.length >= 2) {
          const bStyle = BLADE_STYLES.find((b) => b.id === eng.bladeId) || BLADE_STYLES[0];
          ctx.save();
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.shadowColor = bStyle.glowColor;
          ctx.shadowBlur = 14;

          for (let i = 1; i < eng.trail.length; i++) {
            const p0 = eng.trail[i - 1];
            const p1 = eng.trail[i];
            const progress = i / (eng.trail.length - 1);
            ctx.strokeStyle = bStyle.glowColor;
            ctx.lineWidth = 2 + progress * 12;
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();

            ctx.strokeStyle = bStyle.coreColor;
            ctx.lineWidth = 1 + progress * 5;
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();
          }
          ctx.restore();
        }

        // 6. Floating Callouts
        for (const cl of eng.callouts) {
          const alpha = Math.min(1, cl.life / (cl.maxLife * 0.45));
          ctx.save();
          ctx.globalAlpha = Math.max(0, alpha);
          ctx.translate(cl.x, cl.y);
          ctx.scale(cl.scale, cl.scale);
          ctx.textAlign = 'center';
          ctx.font = '800 18px sans-serif';
          ctx.strokeStyle = 'rgba(0,0,0,0.75)';
          ctx.lineWidth = 4;
          ctx.strokeText(cl.text, 0, 0);
          ctx.fillStyle = cl.color;
          ctx.fillText(cl.text, 0, 0);
          if (cl.subText) {
            ctx.font = '700 11px sans-serif';
            ctx.strokeText(cl.subText, 0, 15);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(cl.subText, 0, 15);
          }
          ctx.restore();
        }

        // 7. Bomb flash overlay
        if (eng.bombFlashAlpha > 0.01) {
          ctx.fillStyle = `rgba(255, 245, 235, ${eng.bombFlashAlpha})`;
          ctx.fillRect(0, 0, eng.width, eng.height);
        }

        ctx.restore(); // end shake
        ctx.restore(); // end dpr
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [finishGame, sliceFruit, spawnFruitBurst, tr]);

  // Pointer slicing handlers
  const handlePointerSlice = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const eng = engineRef.current;
    if (!canvas || eng.phase !== 'playing') return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const now = performance.now();

    const prev = eng.trail[eng.trail.length - 1];
    eng.trail.push({ x, y, time: now });

    if (prev) {
      const dist = Math.hypot(x - prev.x, y - prev.y);
      if (dist > 28 && now - eng.lastWhooshAt > 170) {
        eng.lastWhooshAt = now;
        gameSound.ninjaWhoosh(Math.min(2.0, dist / 45));
      }

      // Emit blade particles (fire, lightning, frost, emerald)
      if (dist > 10 && Math.random() < 0.7) {
        const bStyle = BLADE_STYLES.find((b) => b.id === eng.bladeId) || BLADE_STYLES[0];
        eng.particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 70,
          vy: (Math.random() - 0.5) * 70 + (eng.bladeId === 'inferno' ? -45 : 30),
          radius: 1.8 + Math.random() * 2.4,
          color: bStyle.particleColor,
          alpha: 0.9,
          decay: 2.8,
          gravity: eng.bladeId === 'inferno' ? -80 : 120,
          kind: 'spark',
        });
      }

      if (dist >= 4) {
        const cutAngle = Math.atan2(y - prev.y, x - prev.x);
        for (const fruit of eng.fruits) {
          if (fruit.sliced) continue;
          const d = distPointToSegment(fruit.x, fruit.y, prev.x, prev.y, x, y);
          if (d <= fruit.radius * 1.15) {
            // Avoid double-hitting pomegranate within same tiny frame
            if (fruit.kind === 'pomegranate' && eng.lastWhooshAt && dist < 8) continue;
            sliceFruit(fruit, cutAngle, d / Math.max(1, fruit.radius));
          }
        }
      }
    }
  };

  const handleToggleSound = () => {
    gameSound.muted = !gameSound.muted;
    setSoundMuted(gameSound.muted);
    if (!gameSound.muted) gameSound.tick();
  };

  const handleToggleLofi = () => {
    const active = gameSound.toggleLofi();
    setLofiOn(active);
  };

  const handleClaimReward = async (useExtraPoints: boolean) => {
    if (!isSignedIn) {
      onRequireLogin();
      return;
    }
    setSubmittingReward(true);
    try {
      const res = await onPlayReal(useExtraPoints, score);
      if (res) {
        setClaimedThisRun(true);
      }
    } finally {
      setSubmittingReward(false);
    }
  };

  const handleDemoPrize = () => {
    const activeRewards = rewards.filter((r) => r.active);
    if (activeRewards.length === 0) return;
    const picked = activeRewards[Math.floor(Math.random() * activeRewards.length)];
    onDemoResult(picked);
  };

  const rank = getNinjaRank(bestScore, lang);
  const qualifiedForReward = score >= minScoreToWin;

  return (
    <div className="rounded-2xl bg-[#1A0E08] text-[#F8F5EF] border border-[#C6A667]/30 overflow-hidden shadow-lg select-none">
      {/* Compact Single-Row Dojo Header Bar (Mobile & Desktop friendly) */}
      <div className="px-3 sm:px-5 py-2.5 bg-[#120905]/95 border-b border-[#C6A667]/20 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <AdaptiveLogo variant="horizontal" surface="dark" size="xs" />
          <span aria-hidden="true" className="text-white/25 text-xs hidden sm:inline">·</span>
          <span className="text-xs font-bold text-[#C6A667] truncate hidden sm:inline">
            {tr('Fruit Ninja Dojo', 'Fruit Ninja Dojo')}
          </span>
        </div>

        {/* Mode & Blade & Audio Controls */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {/* Mode Selector */}
          <div className="flex items-center p-0.5 rounded-lg bg-white/8 border border-white/10 text-[11px] shrink-0">
            {(
              [
                { id: 'arcade', label: 'Arcade' },
                { id: 'zen', label: 'Zen' },
                { id: 'classic', label: 'Classic' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  if (phase === 'playing') {
                    startRun(m.id);
                  } else {
                    setMode(m.id);
                  }
                }}
                className={`px-2 py-1 rounded-md font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  mode === m.id ? 'bg-[#C6A667] text-[#111111]' : 'text-white/75 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Blade Picker */}
          <button
            type="button"
            onClick={() => {
              const idx = BLADE_STYLES.findIndex((b) => b.id === bladeId);
              const next = BLADE_STYLES[(idx + 1) % BLADE_STYLES.length];
              setBladeId(next.id);
              gameSound.ninjaWhoosh(1.1);
            }}
            title={tr('Đổi kiếm khí', 'Switch Katana Blade')}
            className="px-2 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 border border-white/15 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Swords className="w-3.5 h-3.5 text-[#C6A667]" />
            <span className="hidden sm:inline">
              {lang === 'en'
                ? BLADE_STYLES.find((b) => b.id === bladeId)?.nameEn
                : BLADE_STYLES.find((b) => b.id === bladeId)?.nameVi}
            </span>
          </button>

          <button
            type="button"
            onClick={handleToggleLofi}
            aria-label="Toggle Lo-fi BGM"
            className={`p-1.5 rounded-lg border text-xs cursor-pointer shrink-0 ${
              lofiOn
                ? 'bg-[#C6A667] text-[#111111] border-[#C6A667]'
                : 'bg-white/8 text-white/80 border-white/15 hover:bg-white/15'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleToggleSound}
            aria-label="Toggle Sound"
            className="p-1.5 rounded-lg bg-white/8 hover:bg-white/15 border border-white/15 text-white/85 cursor-pointer shrink-0"
          >
            {soundMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Ultra-Compact Live Stats Strip (Single Row even on Mobile) */}
      <div className="px-3 sm:px-5 py-2 bg-[#1D1009] border-b border-white/10 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-white/50 block leading-none">{tr('Điểm', 'Score')}</span>
            <span className="font-mono text-base sm:text-lg font-extrabold text-[#C6A667] tabular-nums">{score}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider text-white/50 block leading-none">{tr('Kỷ lục', 'Best')}</span>
            <span className="font-mono text-sm sm:text-base font-bold text-white tabular-nums">{Math.max(bestScore, score)}</span>
          </div>

          <div className="hidden sm:block">
            <span className="text-[10px] uppercase tracking-wider text-white/50 block leading-none">{tr('Cấp bậc', 'Rank')}</span>
            <span className="text-xs font-bold text-emerald-300">{lang === 'en' ? rank.en : rank.vi}</span>
          </div>
        </div>

        {/* Active Boosters & Lives/Clock */}
        <div className="flex items-center gap-2 shrink-0">
          {activeEffects.freeze > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-300 font-mono tabular-nums">
              <Snowflake className="w-3.5 h-3.5" />
              {activeEffects.freeze}s
            </span>
          )}
          {activeEffects.frenzy > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 font-mono tabular-nums">
              <Flame className="w-3.5 h-3.5" />
              {activeEffects.frenzy}s
            </span>
          )}
          {activeEffects.double > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-300 font-mono tabular-nums">
              <Zap className="w-3.5 h-3.5" />
              2X · {activeEffects.double}s
            </span>
          )}

          {mode === 'classic' ? (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/30 border border-white/10">
              {[0, 1, 2].map((idx) => (
                <Heart
                  key={idx}
                  className={`w-4 h-4 ${idx < lives ? 'text-rose-500 fill-rose-500' : 'text-white/20'}`}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/30 border border-white/10 font-mono text-sm font-bold tabular-nums">
              <Timer className={`w-3.5 h-3.5 ${timeLeft <= 10 && phase === 'playing' ? 'text-rose-400' : 'text-[#C6A667]'}`} />
              <span className={timeLeft <= 10 && phase === 'playing' ? 'text-rose-400' : 'text-white'}>
                {timeLeft}s
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main 60fps Interactive Katana Arena Canvas */}
      <div
        ref={containerRef}
        className="relative w-full h-[380px] sm:h-[440px] lg:h-[470px] overflow-hidden touch-none cursor-crosshair"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={(e) => {
            engineRef.current.isPointerDown = true;
            engineRef.current.trail = [];
            (e.currentTarget as HTMLCanvasElement).setPointerCapture?.(e.pointerId);
            handlePointerSlice(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (!engineRef.current.isPointerDown && e.pointerType === 'mouse') {
              // On desktop allow hold-drag slicing cleanly
              return;
            }
            if (engineRef.current.isPointerDown) {
              handlePointerSlice(e.clientX, e.clientY);
            }
          }}
          onPointerUp={() => {
            engineRef.current.isPointerDown = false;
          }}
          onPointerCancel={() => {
            engineRef.current.isPointerDown = false;
          }}
          className="w-full h-full block touch-none"
        />

        {/* Ready / Start Dojo Overlay */}
        {phase === 'ready' && (
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] flex flex-col items-center justify-center p-5 text-center space-y-4">
            <div className="space-y-1.5 max-w-md">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C6A667]">
                ROAR DOJO · {mode.toUpperCase()} MODE
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                {tr('Chém Trái Cây & Hạt Vàng ROAR', 'Slice Fruits & Golden ROAR Beans')}
              </h3>
              <p className="text-xs text-white/80 leading-relaxed">
                {mode === 'arcade'
                  ? tr(
                      '60 giây bùng nổ: săn Chuối Băng Tuyết ❄️, Mưa Trái Cây ⚡, Nhân Đôi x2 🌟 và Lựu Liên Hoàn. Đạt từ ' + minScoreToWin + ' điểm để nhận quà!',
                      `60s Blitz: slice Freeze, Frenzy & Double-Score Bananas + Pomegranate bosses. Reach ${minScoreToWin} pts to claim rewards!`
                    )
                  : mode === 'zen'
                    ? tr(
                        '90 giây thư giãn hoàn toàn — không Bom, không mất mạng! Chém combo nhiều quả một lúc để ghi kỷ lục.',
                        '90s pure chill slicing — zero bombs, zero lives lost. Chain big multi-fruit combos!'
                      )
                    : tr(
                        'Chế độ Cổ Điển 3 mạng: đừng để rơi trái thường và tuyệt đối né Bom cháy ngòi!',
                        'Classic 3-life survival: don’t drop fruits and dodge sizzling spiked bombs!'
                      )}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-white/85">
              <span>{tr('Kéo giữ chuột hoặc vuốt ngón tay để chém', 'Drag or swipe across the board to slice')}</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#C6A667] font-semibold">
                {tr(`Mốc quà: ${minScoreToWin}đ`, `Win Goal: ${minScoreToWin} pts`)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => startRun()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#00552B] to-[#0D7A43] hover:from-[#006B37] hover:to-[#119250] border border-[#C6A667]/60 text-white font-extrabold text-sm inline-flex items-center gap-2 shadow-lg cursor-pointer transition-transform active:scale-95"
            >
              <Play className="w-4 h-4 text-[#C6A667] fill-[#C6A667]" />
              <span>{tr('Rút Kiếm Bắt Đầu!', 'Draw Blade & Start!')}</span>
            </button>
          </div>
        )}

        {/* End of Round / Victory & Reward Modal */}
        {phase === 'ended' && (
          <div className="absolute inset-0 bg-black/72 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-[#18100B] border border-[#C6A667]/45 p-5 text-center space-y-4 shadow-2xl">
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C6A667]">
                  {endReason === 'bomb'
                    ? tr('NỔ BOM DOJO!', 'BOMB DETONATED!')
                    : qualifiedForReward
                      ? tr('HOÀN HẢO · ĐỦ ĐIỂM NHẬN QUÀ!', 'VICTORY · REWARD UNLOCKED!')
                      : tr('HẾT GIỜ!', 'TIME UP!')}
                </p>
                <div className="font-mono text-4xl font-black text-white tabular-nums">
                  {score} <span className="text-base font-bold text-[#C6A667]">{tr('điểm', 'pts')}</span>
                </div>
                <p className="text-xs text-white/70">
                  {tr(
                    `Đã chém ${totalSliced} quả · Combo cao nhất: ${maxCombo}x · Kỷ lục: ${bestScore}`,
                    `Sliced ${totalSliced} · Best Blitz: ${maxCombo}x · Record: ${bestScore}`
                  )}
                </p>
              </div>

              {/* Claim Real Reward CTA */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
                {qualifiedForReward ? (
                  claimedThisRun ? (
                    <p className="text-xs font-bold text-emerald-400">
                      {tr('Đã nhận phần thưởng cho lượt chơi này!', 'Reward claimed for this run!')}
                    </p>
                  ) : !isSignedIn ? (
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={onRequireLogin}
                        className="px-4 py-2 rounded-lg bg-[#C6A667] text-[#111111] text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{tr('Đăng nhập nhận quà thật', 'Sign In to Claim')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDemoPrize}
                        className="px-3.5 py-2 rounded-lg border border-white/20 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer hover:bg-white/10"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#C6A667]" />
                        <span>{tr('Quay thử quà', 'Demo Prize')}</span>
                      </button>
                    </div>
                  ) : remainingFreeToday > 0 ? (
                    <button
                      type="button"
                      disabled={submittingReward}
                      onClick={() => handleClaimReward(false)}
                      className="w-full py-2.5 rounded-xl bg-[#C6A667] hover:bg-[#b89757] text-[#111111] text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Gift className="w-4 h-4" />
                      <span>
                        {submittingReward
                          ? tr('Đang mở quà...', 'Claiming...')
                          : tr(`Nhận Quà Ninja (Còn ${remainingFreeToday} lượt free)`, `Claim Ninja Reward (${remainingFreeToday} free left)`)}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={submittingReward || userPoints < Number(config.extra_play_cost_points || 20)}
                      onClick={() => handleClaimReward(true)}
                      className="w-full py-2.5 rounded-xl bg-[#00552B] hover:bg-[#003D25] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Trophy className="w-4 h-4 text-[#C6A667]" />
                      <span>
                        {tr(
                          `Đổi ${config.extra_play_cost_points} điểm nhận quà (Đang có ${userPoints}đ)`,
                          `Redeem ${config.extra_play_cost_points} pts for Reward (${userPoints} pts)`
                        )}
                      </span>
                    </button>
                  )
                ) : (
                  <p className="text-xs text-amber-300">
                    {tr(
                      `Cần đạt tối thiểu ${minScoreToWin} điểm để mở khóa phần thưởng ROAR (còn thiếu ${minScoreToWin - score} điểm).`,
                      `Reach ${minScoreToWin} pts to unlock ROAR rewards (${minScoreToWin - score} pts needed).`
                    )}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => startRun()}
                  className="flex-1 py-2.5 rounded-xl bg-white/12 hover:bg-white/20 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-[#C6A667]" />
                  <span>{tr('Chơi Lại Ngay', 'Slice Again')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPhase('ready')}
                  className="px-4 py-2.5 rounded-xl border border-white/15 text-white/80 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  {tr('Đổi chế độ', 'Modes')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compact Dojo Blade & Legend Footer */}
      <div className="px-3 sm:px-5 py-2 bg-[#120905] border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/65">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-white/45 shrink-0">{tr('Kiếm:', 'Blade:')}</span>
          {BLADE_STYLES.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setBladeId(b.id);
                gameSound.ninjaWhoosh(1.0);
              }}
              className={`px-2 py-0.5 rounded border font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                bladeId === b.id
                  ? 'bg-white/15 text-white border-[#C6A667]'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              {lang === 'en' ? b.nameEn : b.nameVi}
            </button>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] text-white/60">
          <Shield className="w-3 h-3 text-[#C6A667]" />
          <span>{tr(`Mốc quà: ${minScoreToWin}đ · Chuối Băng / Frenzy / x2 · Lựu Liên Hoàn`, `Goal: ${minScoreToWin} pts · Freeze/Frenzy/2x · Pomegranate Blitz`)}</span>
        </div>
      </div>
    </div>
  );
};
