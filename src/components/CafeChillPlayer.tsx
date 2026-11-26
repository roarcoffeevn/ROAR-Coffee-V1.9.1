import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CloudRain, Coffee, Dices, Headphones, Music2, Pause, Play, RotateCcw, SlidersHorizontal, Timer, X } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { roarCafeAudio, type CafeTrackId } from './RoarCafeAudioEngine';

const TRACK_PRESETS: Array<{ id: CafeTrackId; labelVi: string; labelEn: string; moodVi: string; moodEn: string }> = [
  { id: 'highland_dawn', labelVi: 'Bình Minh Cao Nguyên', labelEn: 'Highland Dawn', moodVi: 'Rhodes 72 BPM', moodEn: 'Rhodes 72 BPM' },
  { id: 'dalat_rain', labelVi: 'Mưa Nhẹ Đà Lạt', labelEn: 'Da Lat Drizzle', moodVi: 'Lo-Fi 68 BPM', moodEn: 'Lo-Fi 68 BPM' },
  { id: 'reserve_night', labelVi: 'Đêm Reserve Ấm Áp', labelEn: 'Reserve Night', moodVi: 'Jazz 64 BPM', moodEn: 'Jazz 64 BPM' },
];

const MOOD_DRINK_CARDS = [
  {
    moodVi: 'Cần tỉnh táo bứt phá',
    moodEn: 'Deep Focus Energy',
    drinkVi: 'Phin Đen Đá Bản Lĩnh',
    drinkEn: 'Bold Iced Black Phin',
    productSlug: 'roar-dam-bold',
    ctaVi: 'Xem Cà Phê Đậm',
    ctaEn: 'Explore Bold Roast',
  },
  {
    moodVi: 'Thư giãn nhẹ nhàng',
    moodEn: 'Slow Afternoon Chill',
    drinkVi: 'Pour-Over Arabica Thanh Tao',
    drinkEn: 'Bright Arabica Pour-Over',
    productSlug: 'arabica-selection',
    ctaVi: 'Xem Arabica Selection',
    ctaEn: 'Explore Arabica',
  },
  {
    moodVi: 'Sáng tạo & Làm việc',
    moodEn: 'Creative Espresso Flow',
    drinkVi: 'Espresso Gold Kem Béo Mịn',
    drinkEn: 'Velvety Espresso Gold',
    productSlug: 'roar-espresso-gold',
    ctaVi: 'Xem Espresso Gold',
    ctaEn: 'Explore Espresso Gold',
  },
  {
    moodVi: 'Tiện lợi tức thì',
    moodEn: 'Quick Desk Ritual',
    drinkVi: 'Hòa Tan Gold Sấy Lạnh',
    drinkEn: 'Freeze-Dried Gold',
    productSlug: 'instant-gold-collection',
    ctaVi: 'Xem Hòa Tan Gold',
    ctaEn: 'Explore Instant Gold',
  },
  {
    moodVi: 'Thưởng thức chuẩn gu sành',
    moodEn: 'Evening Reserve Tasting',
    drinkVi: 'Signature Reserve Cao Nguyên',
    drinkEn: 'Signature Highland Reserve',
    productSlug: 'signature-reserve',
    ctaVi: 'Xem Signature Reserve',
    ctaEn: 'Explore Reserve',
  },
];

function playFocusChime() {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + idx * 0.14;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.14, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.52);
    });
  } catch {
    // ignore Web Audio errors
  }
}

export const CafeChillPlayer: React.FC = () => {
  const { t, lang, localePath } = useI18n();
  const { pathname } = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<'mixer' | 'focus'>('mixer');
  const [playing, setPlaying] = useState(false);
  const [track, setTrack] = useState<CafeTrackId>('highland_dawn');
  const [lofi, setLofi] = useState(65);
  const [rain, setRain] = useState(35);
  const [cafe, setCafe] = useState(25);

  // Pomodoro Focus Mode (25 min Focus / 5 min Coffee Break)
  const [focusMode, setFocusMode] = useState<'work' | 'break'>('work');
  const [focusSecLeft, setFocusSecLeft] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const [moodIdx, setMoodIdx] = useState(0);

  useEffect(() => {
    roarCafeAudio.setLevels({
      lofi: lofi / 100,
      rain: rain / 100,
      cafe: cafe / 100,
    });
  }, [lofi, rain, cafe]);

  useEffect(() => {
    if (!focusRunning) return;
    const id = window.setInterval(() => {
      setFocusSecLeft((prev) => {
        if (prev <= 1) {
          playFocusChime();
          const nextMode = focusMode === 'work' ? 'break' : 'work';
          setFocusMode(nextMode);
          setFocusRunning(false);
          return nextMode === 'work' ? 25 * 60 : 5 * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [focusRunning, focusMode]);

  useEffect(() => {
    return () => {
      roarCafeAudio.stop();
    };
  }, []);

  if (pathname.includes('/admin')) return null;
  const isGameRoute = pathname.includes('/play') || pathname.includes('/games') || pathname.includes('/roar-play');

  const togglePlay = () => {
    if (playing) {
      roarCafeAudio.stop();
      setPlaying(false);
    } else {
      roarCafeAudio.start();
      setPlaying(true);
    }
  };

  const handleSelectTrack = (id: CafeTrackId) => {
    setTrack(id);
    roarCafeAudio.setTrack(id);
    if (!playing) {
      roarCafeAudio.start();
      setPlaying(true);
    }
  };

  const switchFocusPhase = (next: 'work' | 'break') => {
    setFocusRunning(false);
    setFocusMode(next);
    setFocusSecLeft(next === 'work' ? 25 * 60 : 5 * 60);
  };

  const focusMm = String(Math.floor(focusSecLeft / 60)).padStart(2, '0');
  const focusSs = String(focusSecLeft % 60).padStart(2, '0');
  const activeMood = MOOD_DRINK_CARDS[moodIdx % MOOD_DRINK_CARDS.length];

  return (
    <div
      className={`fixed bottom-20 lg:bottom-6 left-4 sm:left-5 z-35 ${
        isGameRoute ? 'hidden lg:block' : 'block'
      }`}
    >
      {expanded && (
        <div
          role="region"
          aria-label={t('Trình phát ROAR Café Chill', 'ROAR Café Chill Studio')}
          className="mb-2.5 w-[295px] sm:w-[320px] rounded-2xl bg-white/95 dark:bg-[#131F19]/95 backdrop-blur-md border border-[#202020]/12 dark:border-[#C6A667]/25 shadow-xl overflow-hidden text-[#202020] dark:text-[#F1EFEA]"
        >
          <div className="px-4 py-3 bg-[#003D25] text-[#F8F5EF] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Headphones className="w-4 h-4 text-[#C6A667] shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">ROAR Café Chill & Focus</p>
                <p className="text-[10px] text-[#C6A667] truncate tabular-nums">
                  {focusRunning
                    ? `${focusMode === 'work' ? 'Focus' : 'Break'} · ${focusMm}:${focusSs}`
                    : playing
                    ? t('Đang phát nhạc quán & ASMR', 'Playing café ambiance')
                    : t('Nhạc Lo-Fi · Pomodoro · Gợi ý đồ uống', 'Lo-Fi · Focus Timer · Drink Pick')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label={t('Thu gọn trình phát nhạc', 'Collapse audio studio')}
              className="p-1.5 rounded-lg hover:bg-white/15 text-white/80 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Studio Mode Switcher */}
          <div className="grid grid-cols-2 border-b border-[#202020]/10 dark:border-white/10 text-[11px] font-semibold bg-[#F8F5EF]/60 dark:bg-[#0E1512]">
            <button
              type="button"
              onClick={() => setTab('mixer')}
              className={`py-2 flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                tab === 'mixer'
                  ? 'text-[#00552B] dark:text-[#C6A667] border-b-2 border-[#00552B] dark:border-[#C6A667] bg-white dark:bg-[#131F19]'
                  : 'text-[#202020]/60 dark:text-[#F1EFEA]/60'
              }`}
            >
              <Music2 className="w-3.5 h-3.5" />
              <span>{t('Âm thanh Quán', 'Sound Mixer')}</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('focus')}
              className={`py-2 flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                tab === 'focus'
                  ? 'text-[#00552B] dark:text-[#C6A667] border-b-2 border-[#00552B] dark:border-[#C6A667] bg-white dark:bg-[#131F19]'
                  : 'text-[#202020]/60 dark:text-[#F1EFEA]/60'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>{t('Focus 25/5 & Gu', 'Focus & Mood')}</span>
            </button>
          </div>

          {tab === 'mixer' ? (
            <div className="p-3.5 space-y-3.5">
              {/* Play / Track Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                >
                  {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{playing ? t('Tạm dừng', 'Pause') : t('Bật Chill', 'Play Chill')}</span>
                </button>
                <span className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65 truncate">
                  {TRACK_PRESETS.find((p) => p.id === track)?.[playing ? 'moodVi' : 'labelVi']}
                </span>
              </div>

              {/* Mood Presets */}
              <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/8 dark:border-white/10">
                {TRACK_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectTrack(preset.id)}
                    className={`px-2 py-1.5 rounded-md text-[10px] font-semibold truncate cursor-pointer transition-colors ${
                      track === preset.id
                        ? 'bg-[#00552B] text-white'
                        : 'text-[#202020]/70 dark:text-[#F1EFEA]/70 hover:text-[#202020] dark:hover:text-white'
                    }`}
                    title={t(preset.labelVi, preset.labelEn)}
                  >
                    {t(preset.labelVi.split(' ').slice(0, 2).join(' '), preset.labelEn)}
                  </button>
                ))}
              </div>

              {/* 3 Independent Ambient Channels */}
              <div className="space-y-2.5 text-xs">
                <label className="block space-y-1">
                  <span className="flex items-center justify-between text-[11px] font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <Music2 className="w-3.5 h-3.5 text-[#00552B] dark:text-[#C6A667]" />
                      <span>{t('Nhạc Lo-Fi Coffee', 'Lo-Fi Rhodes')}</span>
                    </span>
                    <span className="font-mono text-[10px] opacity-65 tabular-nums">{lofi}%</span>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={lofi}
                    onChange={(e) => setLofi(Number(e.target.value))}
                    className="w-full accent-[#00552B] dark:accent-[#C6A667] h-1.5 cursor-pointer"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="flex items-center justify-between text-[11px] font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <CloudRain className="w-3.5 h-3.5 text-[#00552B] dark:text-[#C6A667]" />
                      <span>{t('Mưa Rừng Cao Nguyên', 'Highland Rain')}</span>
                    </span>
                    <span className="font-mono text-[10px] opacity-65 tabular-nums">{rain}%</span>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={rain}
                    onChange={(e) => setRain(Number(e.target.value))}
                    className="w-full accent-[#00552B] dark:accent-[#C6A667] h-1.5 cursor-pointer"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="flex items-center justify-between text-[11px] font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <Coffee className="w-3.5 h-3.5 text-[#00552B] dark:text-[#C6A667]" />
                      <span>{t('Tiếng Phin & Quán Cà Phê', 'Phin Drip & Bar')}</span>
                    </span>
                    <span className="font-mono text-[10px] opacity-65 tabular-nums">{cafe}%</span>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={cafe}
                    onChange={(e) => setCafe(Number(e.target.value))}
                    className="w-full accent-[#00552B] dark:accent-[#C6A667] h-1.5 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="p-3.5 space-y-3.5">
              {/* Pomodoro Focus Timer */}
              <div className="rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/8 dark:border-white/10 p-3 space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => switchFocusPhase('work')}
                      className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                        focusMode === 'work' ? 'bg-[#00552B] text-white' : 'text-[#202020]/65 dark:text-[#F1EFEA]/65'
                      }`}
                    >
                      25m Focus
                    </button>
                    <button
                      type="button"
                      onClick={() => switchFocusPhase('break')}
                      className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                        focusMode === 'break' ? 'bg-[#C6A667] text-[#111111]' : 'text-[#202020]/65 dark:text-[#F1EFEA]/65'
                      }`}
                    >
                      5m Break
                    </button>
                  </div>
                  <span className="font-mono text-lg font-bold text-[#00552B] dark:text-[#C6A667] tabular-nums">
                    {focusMm}:{focusSs}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!focusRunning && !playing) {
                        roarCafeAudio.start();
                        setPlaying(true);
                      }
                      setFocusRunning((r) => !r);
                    }}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {focusRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{focusRunning ? t('Tạm dừng', 'Pause') : t('Tập trung ngay', 'Start Focus')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => switchFocusPhase(focusMode)}
                    aria-label={t('Đặt lại Pomodoro', 'Reset Pomodoro')}
                    className="p-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* "Hôm nay uống gì?" Mood Roulette Card */}
              <div className="rounded-xl bg-[#003D25] text-[#F8F5EF] p-3 space-y-2 border border-[#C6A667]/30">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C6A667]">
                    {t('Hôm nay uống gì?', 'Mood Drink Pick')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMoodIdx((prev) => (prev + 1) % MOOD_DRINK_CARDS.length)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 text-[10px] font-semibold cursor-pointer"
                  >
                    <Dices className="w-3 h-3 text-[#C6A667]" />
                    <span>{t('Đổi gu', 'Spin')}</span>
                  </button>
                </div>
                <div>
                  <p className="text-[11px] text-white/70">{lang === 'vi' ? activeMood.moodVi : activeMood.moodEn}</p>
                  <p className="text-xs font-bold text-white">{lang === 'vi' ? activeMood.drinkVi : activeMood.drinkEn}</p>
                </div>
                <Link
                  to={localePath(`/product/${activeMood.productSlug}`)}
                  onClick={() => setExpanded(false)}
                  className="inline-block text-[11px] font-bold text-[#C6A667] hover:underline"
                >
                  {t(activeMood.ctaVi, activeMood.ctaEn)} →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Compact Launcher Pill-Free Button */}
      <div className="inline-flex items-center rounded-xl bg-white/90 dark:bg-[#16221C]/90 backdrop-blur-md border border-[#202020]/12 dark:border-[#C6A667]/30 shadow-md overflow-hidden">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? t('Tắt nhạc chill', 'Pause chill audio') : t('Bật nhạc ROAR Café Chill', 'Play ROAR Café Chill')}
          className={`px-3 py-2.5 inline-flex items-center gap-2 text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
            playing
              ? 'bg-[#00552B] text-white'
              : 'text-[#202020] dark:text-[#F1EFEA] hover:bg-[#F8F5EF] dark:hover:bg-white/10'
          }`}
        >
          {playing ? <Pause className="w-3.5 h-3.5 text-[#C6A667] shrink-0" /> : <Headphones className="w-3.5 h-3.5 text-[#00552B] dark:text-[#C6A667] shrink-0" />}
          <span className="hidden sm:inline tabular-nums">
            {focusRunning ? `${focusMm}:${focusSs}` : playing ? t('Đang Chill', 'Chilling') : 'ROAR Chill'}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={t('Chỉnh âm thanh & Focus Timer', 'Open sound mixer & focus timer')}
          title={t('Chỉnh Lo-Fi, Pomodoro & Gợi ý đồ uống', 'Mix Lo-Fi, Focus Timer & Mood Drink')}
          className="px-2.5 py-2.5 border-l border-[#202020]/10 dark:border-white/10 text-[#202020]/70 dark:text-[#F1EFEA]/70 hover:text-[#00552B] dark:hover:text-[#C6A667] cursor-pointer transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
