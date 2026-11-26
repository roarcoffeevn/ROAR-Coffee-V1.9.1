import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CloudSun, Coffee, Disc3, Moon, Pause, Play, Sunrise, Timer } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { roarCafeAudio, type CafeAudioState, type CafeTrackId } from './RoarCafeAudioEngine';

interface RitualConfig {
  id: 'morning' | 'afternoon' | 'evening';
  track: CafeTrackId;
  greetingVi: string;
  greetingEn: string;
  subVi: string;
  subEn: string;
  drinkVi: string;
  drinkEn: string;
  drinkTo: string;
  soundLabelVi: string;
  soundLabelEn: string;
  icon: 'morning' | 'afternoon' | 'evening';
}

function getRitualForHour(hour: number): RitualConfig {
  if (hour >= 5 && hour < 12) {
    return {
      id: 'morning',
      track: 'highland_dawn',
      greetingVi: 'Chào buổi sáng · Khởi động cùng Phin CBU',
      greetingEn: 'Good Morning · Highland Phin Awakening',
      subVi: 'Nhâm nhi ngụm đầu ngày đậm mượt, bật nhẹ tiếng Phin tí tách để bắt đầu tập trung.',
      subEn: 'Ease into the day with clean highland notes and gentle Phin drip ambience.',
      drinkVi: 'Khám phá Hạt Rang Phin',
      drinkEn: 'Explore Phin Roasts',
      drinkTo: '/shop?category=roasted_beans',
      soundLabelVi: 'Bật nhạc Sáng Cao Nguyên',
      soundLabelEn: 'Play Highland Dawn',
      icon: 'morning',
    };
  }
  if (hour >= 12 && hour < 18) {
    return {
      id: 'afternoon',
      track: 'dalat_rain',
      greetingVi: 'Chiều mưa Cao Nguyên · Thư giãn & tập trung',
      greetingEn: 'Highland Afternoon · Rainy Focus Ritual',
      subVi: 'Một ly Cold Brew hoặc Hòa Tan Gold mát lạnh cùng tiếng mưa Đà Lạt êm dịu giúp tỉnh táo nhẹ nhàng.',
      subEn: 'Pair a chilled brew with soft Da Lat rain tones to stay calm and sharp.',
      drinkVi: 'Chọn Cà Phê Chiều Chill',
      drinkEn: 'Browse Afternoon Brews',
      drinkTo: '/shop?category=instant_coffee',
      soundLabelVi: 'Bật nhạc Mưa Đà Lạt',
      soundLabelEn: 'Play Da Lat Rain',
      icon: 'afternoon',
    };
  }
  return {
    id: 'evening',
    track: 'midnight_vinyl',
    greetingVi: 'Buổi tối chậm rãi · Nhạc Đĩa Than 60 BPM',
    greetingEn: 'Slow Evening · Midnight Vinyl 60 BPM',
    subVi: 'Tắt bớt ồn ào, đọc một chương Tạp Chí Cà Phê hoặc ghi lại công thức pha chế yêu thích của bạn.',
    subEn: 'Unwind with warm vinyl chords, browse the Coffee Journal, or log your favourite brew recipe.',
    drinkVi: 'Gợi ý Quà & Combo Chill',
    drinkEn: 'Explore Chill Combos',
    drinkTo: '/shop',
    soundLabelVi: 'Bật nhạc Đĩa Than Khuya',
    soundLabelEn: 'Play Midnight Vinyl',
    icon: 'evening',
  };
}

export const DailyChillRitualBar: React.FC = () => {
  const { t, localePath } = useI18n();
  const [audioState, setAudioState] = useState<CafeAudioState>(() => roarCafeAudio.getState());
  const [readCount, setReadCount] = useState<number>(0);

  const ritual = useMemo(() => getRitualForHour(new Date().getHours()), []);

  useEffect(() => {
    const unsub = roarCafeAudio.subscribe(setAudioState);
    try {
      const raw = localStorage.getItem('roar_read_articles_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setReadCount(parsed.length);
      }
    } catch {
      // Ignore storage restrictions
    }
    return unsub;
  }, []);

  const isPlayingRitual = audioState.playing && audioState.trackId === ritual.track;

  const handleToggleRitualAudio = () => {
    if (isPlayingRitual) {
      roarCafeAudio.stop();
    } else {
      roarCafeAudio.setTrack(ritual.track);
      roarCafeAudio.start();
    }
  };

  const RitualIcon =
    ritual.icon === 'morning' ? Sunrise : ritual.icon === 'afternoon' ? CloudSun : Moon;

  return (
    <section className="max-w-[1280px] mx-auto px-5 sm:px-6 pt-4">
      <div className="rounded-xl border border-[#202020]/10 dark:border-white/10 bg-[#FAF7F0] dark:bg-[#131F19] px-4 sm:px-5 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#00552B]/10 dark:bg-[#C6A667]/15 text-[#00552B] dark:text-[#C6A667] flex items-center justify-center shrink-0">
            <RitualIcon className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-bold text-[#202020] dark:text-[#F1EFEA]">
              <span>{t(ritual.greetingVi, ritual.greetingEn)}</span>
              {audioState.playing && (
                <span className="text-[11px] font-mono font-semibold text-[#00552B] dark:text-[#C6A667] inline-flex items-center gap-1">
                  · <Disc3 className="w-3 h-3 animate-spin" /> {t('Đang phát Chill Audio', 'Chill Audio On')}
                </span>
              )}
            </div>
            <p className="text-xs text-[#202020]/70 dark:text-[#F1EFEA]/70 leading-relaxed mt-0.5 line-clamp-2 sm:line-clamp-1">
              {t(ritual.subVi, ritual.subEn)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleRitualAudio}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              isPlayingRitual
                ? 'bg-[#C6A667] text-[#111111] hover:bg-[#b59454]'
                : 'bg-[#00552B] text-white hover:bg-[#003D25]'
            }`}
          >
            {isPlayingRitual ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlayingRitual ? t('Tạm dừng nhạc', 'Pause Audio') : t(ritual.soundLabelVi, ritual.soundLabelEn)}</span>
          </button>

          <Link
            to={localePath(ritual.drinkTo)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0E1512] border border-[#202020]/12 dark:border-white/12 hover:border-[#00552B] dark:hover:border-[#C6A667] text-xs font-semibold text-[#202020] dark:text-[#F1EFEA] transition-colors whitespace-nowrap"
          >
            <Coffee className="w-3.5 h-3.5 text-[#00552B] dark:text-[#C6A667]" />
            <span>{t(ritual.drinkVi, ritual.drinkEn)}</span>
          </Link>

          <Link
            to={localePath('/brewing-handbook')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0E1512] border border-[#202020]/12 dark:border-white/12 hover:border-[#00552B] dark:hover:border-[#C6A667] text-xs font-medium text-[#202020]/85 dark:text-[#F1EFEA]/85 transition-colors whitespace-nowrap"
          >
            <Timer className="w-3.5 h-3.5 text-[#00552B] dark:text-[#C6A667]" />
            <span>{t('Hẹn giờ & Sổ pha', 'Brew Timer & Log')}</span>
          </Link>

          <Link
            to={localePath('/journal')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0E1512] border border-[#202020]/12 dark:border-white/12 hover:border-[#00552B] dark:hover:border-[#C6A667] text-xs font-medium text-[#202020]/85 dark:text-[#F1EFEA]/85 transition-colors whitespace-nowrap"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#00552B] dark:text-[#C6A667]" />
            <span className="tabular-nums">
              {readCount > 0 ? t(`Hộ chiếu ${readCount}/50`, `Passport ${readCount}/50`) : t('Tạp chí B001–B050', 'Journal B001–B050')}
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};
