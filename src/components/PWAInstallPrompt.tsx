import React, { useState } from 'react';
import { Download, Share, Smartphone, WifiOff, X } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'footer' | 'drawer';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'footer',
  className = '',
}) => {
  const { t } = useI18n();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) return null;

  const isDrawer = variant === 'drawer';

  const handleTrigger = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuide(true);
  };

  // Chromium / Android / Desktop native prompt OR iOS / Desktop fallback guide
  const label = isInstallable
    ? t('Cài đặt Ứng dụng ROAR', 'Install ROAR App')
    : isIOS
      ? t('Thêm vào Màn hình chính (iOS)', 'Add to Home Screen (iOS)')
      : t('Cài ứng dụng ROAR COFFEE', 'Install ROAR App');

  return (
    <>
      <button
        type="button"
        onClick={handleTrigger}
        className={
          isDrawer
            ? `w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded border border-[#00552B]/25 dark:border-[#C6A667]/35 bg-[#F8F5EF] dark:bg-[#0E1512] text-xs font-semibold text-[#00552B] dark:text-[#C6A667] hover:bg-[#00552B]/10 transition-colors cursor-pointer ${className}`
            : `inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/25 bg-white/8 hover:bg-[#C6A667] hover:text-[#111111] hover:border-[#C6A667] text-xs font-medium text-[#F8F5EF] transition-colors cursor-pointer ${className}`
        }
      >
        {isIOS && !isInstallable ? (
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <Download className="w-3.5 h-3.5 shrink-0" />
        )}
        <span>{label}</span>
      </button>

      {showGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('Hướng dẫn cài đặt ứng dụng ROAR COFFEE', 'Install ROAR COFFEE App Guide')}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#16221C] text-[#202020] dark:text-[#F1EFEA] border border-[#202020]/10 dark:border-white/15 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src="/pwa-192x192.png"
                  alt="ROAR COFFEE Icon"
                  className="w-11 h-11 rounded-xl border border-[#C6A667]/40 shrink-0"
                />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[#00552B] dark:text-[#C6A667]">
                    PWA · ROAR COFFEE®
                  </p>
                  <h3 className="text-base font-bold">
                    {isIOS
                      ? t('Cài đặt trên iPhone / iPad', 'Install on iPhone / iPad')
                      : t('Cài đặt Ứng dụng Web ROAR', 'Install ROAR COFFEE Web App')}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label={t('Đóng', 'Close')}
                className="p-1.5 rounded-lg text-[#202020]/60 dark:text-[#F1EFEA]/60 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-2.5 text-xs text-[#202020]/80 dark:text-[#F1EFEA]/80 leading-relaxed list-decimal pl-4">
                <li>
                  {t('Nhấn biểu tượng', 'Tap the')}{' '}
                  <span className="inline-flex items-center gap-1 font-semibold text-[#00552B] dark:text-[#C6A667]">
                    <Share className="w-3.5 h-3.5" /> {t('Chia sẻ (Share)', 'Share')}
                  </span>{' '}
                  {t('trên thanh công cụ Safari.', 'button in Safari.')}
                </li>
                <li>
                  {t('Cuộn xuống và chọn', 'Scroll down and select')}{' '}
                  <strong>{t('Thêm vào Màn hình chính (Add to Home Screen)', 'Add to Home Screen')}</strong>.
                </li>
                <li>
                  {t('Nhấn', 'Tap')} <strong>{t('Thêm (Add)', 'Add')}</strong>{' '}
                  {t('để mở ROAR COFFEE như ứng dụng riêng toàn màn hình.', 'to launch ROAR COFFEE in standalone mode.')}
                </li>
              </ol>
            ) : (
              <ol className="space-y-2.5 text-xs text-[#202020]/80 dark:text-[#F1EFEA]/80 leading-relaxed list-decimal pl-4">
                <li>
                  {t(
                    'Trên Chrome / Edge, nhấn biểu tượng "Cài đặt ứng dụng" ở góc phải thanh địa chỉ URL hoặc mở Menu trình duyệt (⋮).',
                    'In Chrome or Edge, click the "Install app" icon in the address bar or open browser menu (⋮).'
                  )}
                </li>
                <li>
                  {t(
                    'Chọn "Cài đặt ROAR COFFEE" / "Install app" để truy cập nhanh danh mục 27 SKU & đặt hàng ngay cả khi mạng yếu.',
                    'Choose "Install ROAR COFFEE" for one-tap access and offline catalog browsing.'
                  )}
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-semibold cursor-pointer"
            >
              {t('Đã hiểu', 'Got it')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const { t } = useI18n();
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 lg:bottom-4 left-4 z-[90] flex items-center gap-2 rounded-lg bg-[#9A5B13] px-3.5 py-2 text-xs font-medium text-white shadow-lg border border-white/20"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>
        {t(
          'Đang ngoại tuyến — Dữ liệu danh mục lưu tạm đang hoạt động.',
          'Offline Mode — Cached catalog data is active.'
        )}
      </span>
    </div>
  );
};
