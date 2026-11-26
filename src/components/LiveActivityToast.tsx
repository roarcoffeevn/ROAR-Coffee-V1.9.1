import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gamepad2, ShoppingBag, X } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { useStore } from '../context/StoreContext';

interface ActivityEvent {
  id: string;
  kind: 'order' | 'game';
  name: string;
  city: string;
  titleVi: string;
  titleEn: string;
  timeVi: string;
  timeEn: string;
  to: string;
}

const CURATED_STORE_ACTIVITY: ActivityEvent[] = [
  {
    id: 'ord-1',
    kind: 'order',
    name: 'Minh T.',
    city: 'TP.HCM',
    titleVi: 'vừa đặt Combo Sáng Bản Lĩnh (-12%)',
    titleEn: 'ordered Bold Morning Combo (-12%)',
    timeVi: '2 phút trước',
    timeEn: '2m ago',
    to: '/shop',
  },
  {
    id: 'ord-2',
    kind: 'order',
    name: 'Hải Yến',
    city: 'Hà Nội',
    titleVi: 'vừa chốt 2kg Arabica Cầu Đất S18',
    titleEn: 'ordered 2kg Cau Dat Arabica S18',
    timeVi: '5 phút trước',
    timeEn: '5m ago',
    to: '/coffee/roasted-beans',
  },
  {
    id: 'ord-3',
    kind: 'order',
    name: 'Quốc Bảo',
    city: 'Đà Nẵng',
    titleVi: 'vừa mua Cà phê Phin Sư Tử & Hòa Tan Gold',
    titleEn: 'ordered Lion Phin & Instant Gold',
    timeVi: '9 phút trước',
    timeEn: '9m ago',
    to: '/coffee/roasted',
  },
];

export const LiveActivityToast: React.FC = () => {
  const { t, localePath } = useI18n();
  const { cartOpen } = useStore();
  const { pathname } = useLocation();

  const [dismissedForever, setDismissedForever] = useState(false);
  const [events, setEvents] = useState<ActivityEvent[]>(CURATED_STORE_ACTIVITY);
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    fetch('/api/games')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d?.recentWinners) && d.recentWinners.length > 0) {
          const gameEvents: ActivityEvent[] = d.recentWinners.slice(0, 4).map((w: any) => ({
            id: `win-${w.id}`,
            kind: 'game',
            name: w.display_name || 'Thành viên ROAR',
            city: 'ROAR Play',
            titleVi: `vừa săn được ${w.reward_label_vi}`,
            titleEn: `won ${w.reward_label_en}`,
            timeVi: 'vừa xong',
            timeEn: 'just now',
            to: '/play',
          }));
          const merged: ActivityEvent[] = [];
          const maxLen = Math.max(gameEvents.length, CURATED_STORE_ACTIVITY.length);
          for (let i = 0; i < maxLen; i++) {
            if (CURATED_STORE_ACTIVITY[i]) merged.push(CURATED_STORE_ACTIVITY[i]);
            if (gameEvents[i]) merged.push(gameEvents[i]);
          }
          if (merged.length > 0) setEvents(merged);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (dismissedForever) return;
    // Respect arrival restraint (>= 12s before first appearance)
    let hideTimer = 0;
    let cycleTimer = 0;

    const showCurrent = () => {
      setVisible(true);
      hideTimer = window.setTimeout(() => {
        setVisible(false);
      }, 5400);
    };

    const initialTimer = window.setTimeout(() => {
      showCurrent();
      cycleTimer = window.setInterval(() => {
        setIndex((prev) => prev + 1);
        showCurrent();
      }, 19000);
    }, 12500);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearTimeout(hideTimer);
      window.clearInterval(cycleTimer);
    };
  }, [dismissedForever]);

  const isHiddenRoute =
    pathname.includes('/admin') ||
    pathname.includes('/play') ||
    pathname.includes('/games') ||
    pathname.includes('/roar-play') ||
    pathname.includes('/checkout');

  if (dismissedForever || !visible || cartOpen || isHiddenRoute || events.length === 0) {
    return null;
  }

  const current = events[index % events.length];

  return (
    <div
      role="status"
      aria-live="polite"
      className="hidden sm:flex fixed bottom-20 left-5 z-30 max-w-[315px] bg-white/95 dark:bg-[#16221C]/95 backdrop-blur-md border border-[#202020]/12 dark:border-[#C6A667]/30 rounded-xl shadow-lg p-3 items-start gap-2.5 transition-all duration-200"
    >
      <div className="w-8 h-8 rounded-lg bg-[#00552B]/10 dark:bg-[#C6A667]/15 text-[#00552B] dark:text-[#C6A667] flex items-center justify-center shrink-0 mt-0.5">
        {current.kind === 'game' ? <Gamepad2 className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
      </div>
      <Link to={localePath(current.to)} className="flex-1 min-w-0 group">
        <p className="text-xs text-[#202020] dark:text-[#F1EFEA] leading-snug">
          <span className="font-bold">{current.name}</span>{' '}
          <span className="text-[#202020]/55 dark:text-[#F1EFEA]/55">({current.city})</span>{' '}
          <span className="group-hover:text-[#00552B] dark:group-hover:text-[#C6A667] transition-colors">
            {t(current.titleVi, current.titleEn)}
          </span>
        </p>
        <p className="text-[10px] font-mono text-[#202020]/55 dark:text-[#F1EFEA]/55 mt-1">
          {t(current.timeVi, current.timeEn)} · {current.kind === 'game' ? t('Chơi nhận quà →', 'Play & Win →') : t('Xem sản phẩm →', 'View item →')}
        </p>
      </Link>
      <button
        type="button"
        onClick={() => setDismissedForever(true)}
        aria-label={t('Đóng thông báo hoạt động', 'Dismiss store activity')}
        className="p-1 text-[#202020]/45 dark:text-[#F1EFEA]/45 hover:text-[#202020] dark:hover:text-white cursor-pointer shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
