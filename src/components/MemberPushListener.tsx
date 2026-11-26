import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Calendar, Gift, Package, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useI18n } from '../i18n/I18nContext';

interface LiveNotifItem {
  id: number;
  title_vi: string;
  title_en: string;
  message_vi: string;
  message_en: string;
  category: 'order' | 'promo' | 'loyalty' | 'system' | 'event';
  link_url: string;
  created_at: string;
}

const STORAGE_LAST_SEEN_KEY = 'roar_last_notif_id_seen';

export const MemberPushListener: React.FC = () => {
  const { user, apiFetch, refreshUser } = useStore();
  const { lang, t, localePath } = useI18n();
  const [banner, setBanner] = useState<LiveNotifItem | null>(null);
  const lastSeenIdRef = useRef<number>(0);
  const initializedForUserRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user) {
      initializedForUserRef.current = null;
      setBanner(null);
      return;
    }

    const storageKey = `${STORAGE_LAST_SEEN_KEY}_${user.id}`;
    const stored = Number(localStorage.getItem(storageKey) || '0');
    lastSeenIdRef.current = Number.isFinite(stored) ? stored : 0;

    let active = true;

    const triggerOsPush = (item: LiveNotifItem) => {
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;
      const title = lang === 'en' ? item.title_en : item.title_vi;
      const body = lang === 'en' ? item.message_en : item.message_vi;
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready
            .then((reg) =>
              reg.showNotification(title, {
                body,
                icon: '/favicon.svg',
                badge: '/favicon.svg',
                tag: `roar-notif-${item.id}`,
                data: { url: item.link_url || '/account?tab=notifications' },
              })
            )
            .catch(() => {
              new Notification(title, { body, icon: '/favicon.svg' });
            });
        } else {
          new Notification(title, { body, icon: '/favicon.svg' });
        }
      } catch {
        // Ignore browser notification restrictions inside iframes
      }
    };

    const poll = async (isInitial: boolean) => {
      if (!active) return;
      try {
        const res = await apiFetch(`/api/account/notifications/poll?sinceId=${lastSeenIdRef.current}`);
        if (!res.ok || !active) return;
        const d = await res.json();
        const latestId = Number(d.latestId || 0);

        if (isInitial && lastSeenIdRef.current === 0) {
          lastSeenIdRef.current = latestId;
          localStorage.setItem(storageKey, String(latestId));
          return;
        }

        const items: LiveNotifItem[] = Array.isArray(d.latest) ? d.latest : [];
        if (items.length > 0 && latestId > lastSeenIdRef.current) {
          lastSeenIdRef.current = latestId;
          localStorage.setItem(storageKey, String(latestId));
          const newest = items[0];
          setBanner(newest);
          triggerOsPush(newest);
          refreshUser();
        }
      } catch {
        // Silent background poll
      }
    };

    const isFirstForUser = initializedForUserRef.current !== user.id;
    initializedForUserRef.current = user.id;
    poll(isFirstForUser);

    const timer = window.setInterval(() => poll(false), 25000);
    const onFocus = () => poll(false);
    window.addEventListener('focus', onFocus);

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [user, apiFetch, refreshUser, lang]);

  useEffect(() => {
    if (!banner) return;
    const timeout = window.setTimeout(() => setBanner(null), 9000);
    return () => window.clearTimeout(timeout);
  }, [banner]);

  if (!banner) return null;

  const iconMap: Record<LiveNotifItem['category'], React.ReactNode> = {
    promo: <Gift className="w-4 h-4 text-[#C6A667]" />,
    event: <Calendar className="w-4 h-4 text-emerald-400" />,
    order: <Package className="w-4 h-4 text-sky-400" />,
    system: <ShieldCheck className="w-4 h-4 text-amber-300" />,
    loyalty: <Sparkles className="w-4 h-4 text-[#C6A667]" />,
  };

  const labelMap: Record<LiveNotifItem['category'], string> = {
    promo: t('Khuyến mãi mới', 'New Promotion'),
    event: t('Sự kiện ROAR', 'ROAR Event'),
    order: t('Thông báo mua hàng', 'Order Update'),
    system: t('Cập nhật hệ thống', 'System Update'),
    loyalty: t('Đặc quyền thành viên', 'Member Reward'),
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-20 right-3 sm:right-5 z-[65] w-[calc(100vw-24px)] max-w-sm bg-[#0F241A] text-[#F8F5EF] border border-[#C6A667]/40 rounded-2xl shadow-2xl p-4 space-y-2.5 animate-in fade-in slide-in-from-top-3 duration-200"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#C6A667]">
          <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            {iconMap[banner.category] || <Bell className="w-3.5 h-3.5" />}
          </span>
          <span>{labelMap[banner.category] || t('Thông báo ROAR', 'ROAR Alert')}</span>
        </div>
        <button
          type="button"
          onClick={() => setBanner(null)}
          aria-label={t('Đóng thông báo', 'Dismiss notification')}
          className="p-1 text-white/60 hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-bold leading-snug text-white">
          {lang === 'en' ? banner.title_en : banner.title_vi}
        </p>
        <p className="text-xs text-[#F8F5EF]/80 leading-relaxed line-clamp-3">
          {lang === 'en' ? banner.message_en : banner.message_vi}
        </p>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-white/10">
        <Link
          to={localePath(banner.link_url || '/account?tab=notifications')}
          onClick={() => setBanner(null)}
          className="text-xs font-semibold text-[#C6A667] hover:underline"
        >
          {t('Xem chi tiết ngay →', 'View Details →')}
        </Link>
        <Link
          to={localePath('/account?tab=notifications')}
          onClick={() => setBanner(null)}
          className="text-[11px] text-white/65 hover:text-white"
        >
          {t('Tất cả thông báo', 'All Alerts')}
        </Link>
      </div>
    </div>
  );
};
