import React, { useEffect, useState } from 'react';
import { Coins, Gift, RotateCcw, Sparkles, Timer } from 'lucide-react';
import type { GameConfigRecord, GameRewardRecord } from '../../lib/gamesCatalog';
import { AdaptiveLogo } from '../AdaptiveLogo';
import { gameSound } from './RoarGamesSound';

interface MemoryCard {
  uid: number;
  pairKey: string;
  titleVi: string;
  titleEn: string;
  symbol: string;
  accent: string;
  flipped: boolean;
  matched: boolean;
}

const PAIRS_CATALOG = [
  { key: 'tiger', titleVi: 'Hổ Đậm', titleEn: 'Tiger Bold', symbol: '🐯', accent: '#00552B' },
  { key: 'lion', titleVi: 'Sư Tử', titleEn: 'Lion Roar', symbol: '🦁', accent: '#8C6D32' },
  { key: 'panther', titleVi: 'Báo Đen', titleEn: 'Black Panther', symbol: '🐆', accent: '#111814' },
  { key: 'fox', titleVi: 'Cáo Nhanh', titleEn: 'Fox Espresso', symbol: '🦊', accent: '#9A4B23' },
  { key: 'eagle', titleVi: 'Đại Bàng', titleEn: 'Eagle Gold', symbol: '🦅', accent: '#003D25' },
  { key: 'swan', titleVi: 'Thiên Nga', titleEn: 'Swan Arabica', symbol: '🦢', accent: '#4C6B5D' },
  { key: 'elephant', titleVi: 'Voi Cao Nguyên', titleEn: 'Highland Elephant', symbol: '🐘', accent: '#5D4A36' },
  { key: 'bean', titleVi: 'Hạt Culi S18', titleEn: 'Peaberry S18', symbol: '☕', accent: '#B38728' },
];

function buildDeck(): MemoryCard[] {
  const doubled = [...PAIRS_CATALOG, ...PAIRS_CATALOG].map((item, idx) => ({
    uid: idx + 1,
    pairKey: item.key,
    titleVi: item.titleVi,
    titleEn: item.titleEn,
    symbol: item.symbol,
    accent: item.accent,
    flipped: false,
    matched: false,
  }));
  for (let i = doubled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [doubled[i], doubled[j]] = [doubled[j], doubled[i]];
  }
  return doubled;
}

interface MemoryMatchGameProps {
  lang: string;
  config?: GameConfigRecord;
  rewards: GameRewardRecord[];
  remainingFreeToday: number;
  isSignedIn: boolean;
  userPoints: number;
  savedProgress?: { current_level: number; max_level: number; best_score: number };
  onSaveProgress?: (payload: { currentLevel: number; maxLevel: number; bestScore: number }) => void;
  onPlayReal: (useExtraPoints: boolean) => Promise<any>;
  onRequireLogin: () => void;
  onDemoResult: (reward: GameRewardRecord) => void;
}

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({
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
  const [level, setLevel] = useState<number>(() => {
    try {
      const local = Number(window.localStorage.getItem('roar_memory_level_v1') || 1);
      return Math.max(1, savedProgress?.current_level || local);
    } catch {
      return Math.max(1, savedProgress?.current_level || 1);
    }
  });
  const [cards, setCards] = useState<MemoryCard[]>(() => buildDeck());
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [started, setStarted] = useState(false);
  const [locked, setLocked] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const matchedCount = cards.filter((c) => c.matched).length / 2;
  const completed = matchedCount === PAIRS_CATALOG.length;

  useEffect(() => {
    if (savedProgress && savedProgress.current_level > level) {
      setLevel(savedProgress.current_level);
    }
  }, [savedProgress]);

  useEffect(() => {
    if (!started || completed) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [started, completed]);

  useEffect(() => {
    if (!completed) return;
    gameSound.victoryFanfare();
    const nextLvl = level + 1;
    try {
      window.localStorage.setItem('roar_memory_level_v1', String(nextLvl));
    } catch {
      // ignore
    }
    onSaveProgress?.({
      currentLevel: nextLvl,
      maxLevel: Math.max(savedProgress?.max_level || 1, nextLvl),
      bestScore: Math.max(savedProgress?.best_score || 0, Math.max(100, 1000 - moves * 20 - seconds * 5)),
    });
  }, [completed]);

  const resetDeck = (advanceLevel = false) => {
    if (advanceLevel) {
      setLevel((l) => l + 1);
    }
    setCards(buildDeck());
    setSelectedIds([]);
    setMoves(0);
    setSeconds(0);
    setStarted(false);
    setLocked(false);
    setClaimed(false);
  };

  const handleCardClick = (card: MemoryCard) => {
    if (locked || card.flipped || card.matched || completed) return;
    if (!started) setStarted(true);
    gameSound.flip();

    const updated = cards.map((c) => (c.uid === card.uid ? { ...c, flipped: true } : c));
    setCards(updated);

    const nextSel = [...selectedIds, card.uid];
    setSelectedIds(nextSel);

    if (nextSel.length === 2) {
      setMoves((m) => m + 1);
      setLocked(true);
      const first = updated.find((c) => c.uid === nextSel[0])!;
      const second = updated.find((c) => c.uid === nextSel[1])!;

      if (first.pairKey === second.pairKey) {
        gameSound.match();
        window.setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.uid === first.uid || c.uid === second.uid ? { ...c, matched: true } : c))
          );
          setSelectedIds([]);
          setLocked(false);
        }, 280);
      } else {
        window.setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.uid === first.uid || c.uid === second.uid ? { ...c, flipped: false } : c))
          );
          setSelectedIds([]);
          setLocked(false);
        }, 720);
      }
    }
  };

  const handleClaim = async (useExtraPoints = false) => {
    if (!completed || claimed || claiming) return;
    if (!isSignedIn) {
      const pool = rewards.filter((r) => r.active);
      if (pool.length > 0) {
        gameSound.win();
        onDemoResult(pool[Math.floor(Math.random() * pool.length)]);
        setClaimed(true);
      }
      return;
    }
    setClaiming(true);
    try {
      const res = await onPlayReal(useExtraPoints);
      if (res) {
        gameSound.win();
        setClaimed(true);
      }
    } finally {
      setClaiming(false);
    }
  };

  const costPts = config?.extra_play_cost_points || 25;
  const canFree = remainingFreeToday > 0;

  return (
    <div className="space-y-2.5 sm:space-y-4">
      <div className="flex items-center justify-between gap-1.5 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-4 text-[11px] sm:text-xs font-bold text-[#202020]/80 dark:text-[#F1EFEA]/80 tabular-nums min-w-0">
          <AdaptiveLogo variant="horizontal" surface="auto" darkTone="gold" size="2xs" className="hidden sm:inline-flex shrink-0" />
          <span className="px-1.5 py-0.5 rounded bg-[#00552B] text-white text-[10px] font-extrabold whitespace-nowrap">
            {lang === 'en' ? `Lv.${level}` : `Màn ${level}`}
          </span>
          <span className="whitespace-nowrap">
            <span className="hidden sm:inline">{lang === 'en' ? 'Pairs:' : 'Cặp:'} </span>
            <strong className="text-[#00552B] dark:text-[#C6A667]">
              {matchedCount}/{PAIRS_CATALOG.length}
            </strong>
          </span>
          <span className="whitespace-nowrap">
            {lang === 'en' ? 'Moves:' : 'Lượt:'} <strong>{moves}</strong>
          </span>
          <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
            <Timer className="w-3.5 h-3.5 text-[#C6A667]" />
            <strong>{seconds}s</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={() => resetDeck(false)}
          className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 text-[11px] sm:text-xs font-semibold inline-flex items-center gap-1 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{lang === 'en' ? 'Shuffle' : 'Xáo Bài'}</span>
        </button>
      </div>

      {/* 4x4 Grid */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-[330px] sm:max-w-lg mx-auto">
        {cards.map((card) => {
          const revealed = card.flipped || card.matched;
          return (
            <button
              key={card.uid}
              type="button"
              onClick={() => handleCardClick(card)}
              disabled={revealed || locked}
              aria-label={revealed ? (lang === 'en' ? card.titleEn : card.titleVi) : 'ROAR card'}
              className={`aspect-square rounded-xl border transition-all duration-200 flex flex-col items-center justify-center p-1 sm:p-1.5 select-none touch-manipulation ${
                card.matched
                  ? 'bg-[#00552B]/15 dark:bg-[#00552B]/35 border-[#00552B] dark:border-[#C6A667] scale-[0.97]'
                  : revealed
                    ? 'bg-white dark:bg-[#1E2E26] border-[#C6A667] shadow-md'
                    : 'bg-gradient-to-br from-[#00552B] to-[#003D25] border-[#C6A667]/40 hover:scale-[1.03] active:scale-95 cursor-pointer shadow-sm'
              }`}
            >
              {revealed ? (
                <>
                  <span className="text-xl sm:text-3xl leading-none">{card.symbol}</span>
                  <span className="mt-1 sm:mt-1.5 text-[9px] sm:text-[10px] font-bold text-[#111111] dark:text-[#F8F5EF] leading-tight text-center line-clamp-1">
                    {lang === 'en' ? card.titleEn : card.titleVi}
                  </span>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <AdaptiveLogo
                    variant="vertical"
                    surface="dark"
                    darkTone="gold"
                    size="2xs"
                    className="scale-[0.82] sm:scale-100 pointer-events-none"
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {completed && (
        <div className="p-4 rounded-xl bg-[#00552B] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AdaptiveLogo variant="horizontal" surface="dark" darkTone="gold" size="2xs" />
            </div>
            <div className="text-sm font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#C6A667]" />
              <span>
                {lang === 'en'
                  ? `All 8 pairs matched in ${moves} moves (${seconds}s)!`
                  : `Xuất sắc! Ghép đủ 8 cặp sau ${moves} lượt (${seconds} giây)!`}
              </span>
            </div>
            <p className="text-xs text-white/80 mt-0.5">
              {claimed
                ? lang === 'en'
                  ? 'Reward added to your Rewards bag!'
                  : 'Phần thưởng đã được cộng vào Túi Quà của bạn!'
                : lang === 'en'
                  ? 'Claim your random reward from the Memory Match pool.'
                  : 'Nhấn nhận ngay phần thưởng từ kho quà Ghép Thẻ ROAR.'}
            </p>
          </div>
          {!claimed && (
            <div className="flex items-center gap-2 shrink-0">
              {!isSignedIn ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleClaim(false)}
                    className="px-4 py-2 rounded-xl bg-[#C6A667] text-[#111111] text-xs font-bold cursor-pointer whitespace-nowrap"
                  >
                    {lang === 'en' ? 'Preview Prize' : 'Xem Thử Quà'}
                  </button>
                  <button
                    type="button"
                    onClick={onRequireLogin}
                    className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                  >
                    {lang === 'en' ? 'Sign In to Claim' : 'Đăng nhập'}
                  </button>
                </>
              ) : canFree ? (
                <button
                  type="button"
                  disabled={claiming}
                  onClick={() => handleClaim(false)}
                  className="px-4 py-2 rounded-xl bg-[#C6A667] hover:bg-[#b59454] text-[#111111] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Gift className="w-4 h-4" />
                  <span>{claiming ? '...' : lang === 'en' ? 'Claim Reward' : 'Nhận Thưởng Ngay'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={claiming || userPoints < costPts}
                  onClick={() => handleClaim(true)}
                  className="px-4 py-2 rounded-xl bg-[#C6A667] hover:bg-[#b59454] text-[#111111] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
                >
                  <Coins className="w-4 h-4" />
                  <span>{lang === 'en' ? `Claim (-${costPts} pts)` : `Nhận Quà (-${costPts} điểm)`}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
