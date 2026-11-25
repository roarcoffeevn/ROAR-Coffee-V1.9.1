import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Coins, Gift, RotateCcw, ShoppingBag, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { GameConfigRecord, GameRewardRecord } from '../../lib/gamesCatalog';
import type { Personality, Product } from '../../context/StoreContext';
import { MediaImage } from '../MediaImage';
import { AdaptiveLogo } from '../AdaptiveLogo';
import { gameSound } from './RoarGamesSound';

interface QuizQuestion {
  id: string;
  qVi: string;
  qEn: string;
  options: Array<{
    labelVi: string;
    labelEn: string;
    traits: string[]; // personality slugs boosted
  }>;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'intensity',
    qVi: 'Buổi sáng lý tưởng của bạn bắt đầu với hương vị cà phê nào?',
    qEn: 'Which morning coffee profile sparks your ideal day?',
    options: [
      { labelVi: 'Đậm mạnh tỉnh táo tức thì (Phin đen đá / Sữa đá)', labelEn: 'Bold, punchy awakening (Phin Black / Milk Coffee)', traits: ['tiger', 'lion'] },
      { labelVi: 'Cân bằng, êm dày hậu ngọt caramel (Espresso / Latte)', labelEn: 'Balanced velvet espresso & caramel sweetness', traits: ['fox', 'eagle'] },
      { labelVi: 'Thơm hoa trái tinh tế, chua thanh nhẹ nhàng (Pour Over)', labelEn: 'Floral aromatics & delicate bright acidity', traits: ['swan', 'panther'] },
      { labelVi: 'Êm đầm sâu lắng, vị ca cao và hạt rang bền vị', labelEn: 'Deep cocoa warmth and steady roasted harmony', traits: ['elephant', 'tiger'] },
    ],
  },
  {
    id: 'mood',
    qVi: 'Phong cách làm việc hoặc cá tính nổi bật của bạn?',
    qEn: 'Which mindset best describes your everyday rhythm?',
    options: [
      { labelVi: 'Quyết đoán, tốc độ, dẫn đầu mọi mục tiêu', labelEn: 'Decisive, ambitious, leading from the front', traits: ['lion', 'eagle'] },
      { labelVi: 'Thông minh, linh hoạt, bắt nhịp xu hướng mới', labelEn: 'Clever, agile, adaptable creative energy', traits: ['fox', 'panther'] },
      { labelVi: 'Bình tĩnh, điềm đạm và giữ chất lượng bền bỉ', labelEn: 'Calm, dependable, enduring strength', traits: ['elephant', 'tiger'] },
      { labelVi: 'Tinh tế, sâu sắc và trân trọng từng khoảnh khắc', labelEn: 'Refined, expressive, savoring every detail', traits: ['swan', 'panther'] },
    ],
  },
  {
    id: 'brew',
    qVi: 'Dụng cụ pha chế bạn thường dùng nhất ở nhà hoặc văn phòng?',
    qEn: 'Your go-to brewing gear at home or the studio?',
    options: [
      { labelVi: 'Phin nhôm / Inox truyền thống Việt Nam', labelEn: 'Traditional Vietnamese Phin filter', traits: ['tiger', 'lion', 'elephant'] },
      { labelVi: 'Máy pha Espresso hoặc ấm Moka Pot', labelEn: 'Espresso machine or Moka Pot', traits: ['fox', 'eagle'] },
      { labelVi: 'V60 Pour Over / Cold Brew ủ lạnh', labelEn: 'V60 Pour Over or Slow Cold Brew', traits: ['swan', 'panther'] },
      { labelVi: 'Gói cà phê hòa tan nguyên chất tiện lợi 30 giây', labelEn: 'Premium instant stick in 30 seconds', traits: ['fox', 'elephant'] },
    ],
  },
  {
    id: 'occasion',
    qVi: 'Bạn muốn ROAR gợi ý phần quà nào hợp với mình nhất?',
    qEn: 'What kind of coffee moment are you seeking today?',
    options: [
      { labelVi: 'Nạp năng lượng bứt phá ngày dài bận rộn', labelEn: 'High-voltage fuel for deep work', traits: ['tiger', 'lion', 'eagle'] },
      { labelVi: 'Quà tặng sang trọng dành cho đối tác & người thân', labelEn: 'Signature executive gifting', traits: ['panther', 'swan'] },
      { labelVi: 'Trải nghiệm gu pha máy mượt mà chuẩn quán', labelEn: 'Cafe-grade creamy espresso at home', traits: ['eagle', 'fox'] },
      { labelVi: 'Khám phá đặc sản vùng trồng Cầu Đất – Đắk Lắk', labelEn: 'Exploring highland Vietnam origins', traits: ['elephant', 'swan'] },
    ],
  },
];

interface PersonalityQuizGameProps {
  lang: string;
  config?: GameConfigRecord;
  rewards: GameRewardRecord[];
  personalities: Personality[];
  products: Product[];
  remainingFreeToday: number;
  isSignedIn: boolean;
  userPoints: number;
  onAddProductToCart: (product: Product) => void;
  onPlayReal: (useExtraPoints: boolean) => Promise<any>;
  onRequireLogin: () => void;
  onDemoResult: (reward: GameRewardRecord) => void;
}

export const PersonalityQuizGame: React.FC<PersonalityQuizGameProps> = ({
  lang,
  config,
  rewards,
  personalities,
  products,
  remainingFreeToday,
  isSignedIn,
  userPoints,
  onAddProductToCart,
  onPlayReal,
  onRequireLogin,
  onDemoResult,
}) => {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [matchedSlug, setMatchedSlug] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimedDone, setClaimedDone] = useState(false);

  const handleSelectOption = (traits: string[]) => {
    gameSound.flip();
    const nextScores = { ...scores };
    traits.forEach((tr) => {
      nextScores[tr] = (nextScores[tr] || 0) + 1;
    });
    setScores(nextScores);

    if (step + 1 < QUIZ_QUESTIONS.length) {
      setStep(step + 1);
    } else {
      const sorted = Object.entries(nextScores).sort((a, b) => b[1] - a[1]);
      const winnerSlug = sorted[0]?.[0] || 'tiger';
      setMatchedSlug(winnerSlug);
      gameSound.match();
    }
  };

  const resetQuiz = () => {
    setStep(0);
    setScores({});
    setMatchedSlug(null);
    setClaimedDone(false);
  };

  const handleClaim = async (useExtraPoints = false) => {
    if (claiming || claimedDone) return;
    if (!isSignedIn) {
      const pool = rewards.filter((r) => r.active);
      if (pool.length > 0) {
        onDemoResult(pool[Math.floor(Math.random() * pool.length)]);
      }
      return;
    }
    setClaiming(true);
    try {
      const res = await onPlayReal(useExtraPoints);
      if (res) {
        gameSound.win();
        setClaimedDone(true);
      }
    } finally {
      setClaiming(false);
    }
  };

  if (matchedSlug) {
    const persona =
      personalities.find((p) => p.slug === matchedSlug) ||
      personalities[0];
    const matchedProduct =
      products.find((p) => p.slug === persona?.associated_product_slug) ||
      products.find((p) => p.mascot_slug === matchedSlug) ||
      products[0];
    const costPts = config?.extra_play_cost_points || 20;
    const canFree = remainingFreeToday > 0;

    return (
      <div className="space-y-3.5 sm:space-y-5">
        <div className="p-3.5 sm:p-5 rounded-2xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#C6A667]/35 grid md:grid-cols-[200px_1fr] gap-3.5 sm:gap-5 items-center">
          <div className="aspect-square max-w-[140px] sm:max-w-[200px] mx-auto md:mx-0 w-full rounded-xl overflow-hidden bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10">
            <MediaImage
              imageKey={persona?.custom_image_url || persona?.image_key || matchedProduct?.image_key}
              alt={persona ? (lang === 'en' ? persona.animal_en : persona.animal_vi) : 'ROAR'}
              brandMark="bottom-left"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <AdaptiveLogo variant="horizontal" surface="auto" darkTone="gold" size="2xs" />
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#00552B] dark:text-[#C6A667]">
                {lang === 'en' ? 'YOUR ROAR COFFEE PERSONALITY' : 'CÁ TÍNH CÀ PHÊ ROAR CỦA BẠN'}
              </div>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#111111] dark:text-[#F8F5EF]">
              {persona ? (lang === 'en' ? `${persona.animal_en} Spirit` : `Linh Vật ${persona.animal_vi} (${persona.animal_en})`) : matchedSlug}
            </h3>
            <p className="text-xs font-semibold text-[#8C6D32] dark:text-[#C6A667]">
              {lang === 'en' ? persona?.traits_en : persona?.traits_vi}
            </p>
            <p className="text-sm text-[#202020]/80 dark:text-[#F1EFEA]/80 leading-relaxed line-clamp-3">
              {lang === 'en' ? persona?.product_association_en : persona?.product_association_vi}
            </p>

            {matchedProduct && (
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onAddProductToCart(matchedProduct)}
                  className="px-4 py-2 rounded-xl bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'en' ? `Add ${matchedProduct.name_en}` : `Thêm ${matchedProduct.name_vi}`}
                  </span>
                </button>
                <Link
                  to={`/product/${matchedProduct.slug}`}
                  className="text-xs font-bold text-[#00552B] dark:text-[#C6A667] hover:underline inline-flex items-center gap-1"
                >
                  <span>{lang === 'en' ? 'View tasting notes' : 'Xem chi tiết'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Reward Claim Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-[#16221C] border border-[#00552B]/25 dark:border-[#C6A667]/30">
          <div className="text-xs text-[#202020]/80 dark:text-[#F1EFEA]/80">
            {claimedDone
              ? lang === 'en'
                ? 'Reward credited! Check your Rewards Wallet on the right.'
                : 'Đã nhận quà trắc nghiệm! Xem mã thưởng trong Túi Quà.'
              : lang === 'en'
                ? 'Complete quiz bonus: Draw your taste-match voucher or gift now.'
                : 'Hoàn thành trắc nghiệm: Rút ngẫu nhiên voucher chọn gu hoặc hộp cà phê tặng kèm!'}
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {!claimedDone && (
              !isSignedIn ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleClaim(false)}
                    className="px-4 py-2.5 rounded-xl bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#C6A667]" />
                    <span>{lang === 'en' ? 'Preview Demo Prize' : 'Xem Thử Quà'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onRequireLogin}
                    className="px-4 py-2.5 rounded-xl border border-[#C6A667] text-[#8C6D32] dark:text-[#C6A667] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Sign In to Claim' : 'Đăng nhập Nhận Quà'}</span>
                  </button>
                </>
              ) : canFree ? (
                <button
                  type="button"
                  disabled={claiming}
                  onClick={() => handleClaim(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Gift className="w-3.5 h-3.5 text-[#C6A667]" />
                  <span>{claiming ? '...' : lang === 'en' ? 'Claim Tasting Reward' : 'Nhận Quà Chọn Gu Ngay'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={claiming || userPoints < costPts}
                  onClick={() => handleClaim(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#C6A667] hover:bg-[#b59454] text-[#111111] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? `Claim Extra (-${costPts} pts)` : `Nhận Thêm (-${costPts} điểm)`}</span>
                </button>
              )
            )}
            {claimedDone && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#00552B] dark:text-[#C6A667]">
                <CheckCircle2 className="w-4 h-4" />
                <span>{lang === 'en' ? 'Claimed' : 'Đã nhận thưởng'}</span>
              </span>
            )}
            <button
              type="button"
              onClick={resetQuiz}
              className="px-3.5 py-2 rounded-xl border border-[#202020]/15 dark:border-white/15 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Retake Quiz' : 'Làm lại'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = QUIZ_QUESTIONS[step];
  const progressPct = Math.round(((step + 1) / QUIZ_QUESTIONS.length) * 100);

  return (
    <div className="space-y-3.5 sm:space-y-5">
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-[#202020]/70 dark:text-[#F1EFEA]/70 gap-2">
          <div className="flex items-center gap-2">
            <AdaptiveLogo variant="horizontal" surface="auto" darkTone="gold" size="2xs" />
            <span>
              {lang === 'en' ? `Question ${step + 1} of ${QUIZ_QUESTIONS.length}` : `Câu hỏi ${step + 1} / ${QUIZ_QUESTIONS.length}`}
            </span>
          </div>
          <span className="tabular-nums text-[#00552B] dark:text-[#C6A667]">{progressPct}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#202020]/10 dark:bg-white/10 overflow-hidden">
          <div className="h-full bg-[#00552B] dark:bg-[#C6A667] transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <h3 className="font-serif text-base sm:text-2xl font-bold text-[#111111] dark:text-[#F8F5EF] leading-snug">
        {lang === 'en' ? currentQ.qEn : currentQ.qVi}
      </h3>

      <div className="grid sm:grid-cols-2 gap-2 sm:gap-3">
        {currentQ.options.map((opt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelectOption(opt.traits)}
            className="p-3 sm:p-4 rounded-xl border border-[#202020]/12 dark:border-white/15 bg-[#F8F5EF]/60 dark:bg-[#0E1512] hover:border-[#00552B] dark:hover:border-[#C6A667] hover:bg-[#00552B]/5 text-left transition-all cursor-pointer flex items-center sm:items-start gap-2.5 sm:gap-3 group min-h-[48px]"
          >
            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#00552B]/10 dark:bg-[#C6A667]/20 text-[#00552B] dark:text-[#C6A667] text-xs font-extrabold flex items-center justify-center shrink-0 group-hover:bg-[#00552B] group-hover:text-white transition-colors">
              {String.fromCharCode(65 + idx)}
            </span>
            <span className="text-xs sm:text-sm font-medium text-[#202020] dark:text-[#F1EFEA] leading-snug">
              {lang === 'en' ? opt.labelEn : opt.labelVi}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
