import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Gamepad2, Gift, Minus, Plus, ShoppingBag, Tag, Trash2, Truck, X } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { type Product, useStore } from '../context/StoreContext';
import { MediaImage } from './MediaImage';
import { localizeVariantLabel } from '../lib/i18nHelpers';
import { fetchProductsWithFallback } from '../lib/staticFallback';

const TIER1_FREESHIP_VND = 500000;
const TIER2_GIFT_VND = 900000;

export const CartDrawer: React.FC = () => {
  const { t, lang, localePath } = useI18n();
  const {
    cart,
    cartOpen,
    setCartOpen,
    addToCart,
    updateCartQty,
    removeFromCart,
    cartSubtotalVnd,
    formatPrice,
    currency,
    setCurrency,
    activeGameClaims,
    pendingVoucherCode,
    setPendingVoucherCode,
    user,
    apiFetch,
    showToast,
  } = useStore();

  const [upsellCatalog, setUpsellCatalog] = useState<Product[]>([]);
  const [previewDiscountVnd, setPreviewDiscountVnd] = useState(0);
  const [previewVoucherMsg, setPreviewVoucherMsg] = useState('');
  const [usePointsDiscount, setUsePointsDiscount] = useState<boolean>(() => {
    try {
      return window.sessionStorage.getItem('roar_use_points_discount') === '1';
    } catch {
      return false;
    }
  });
  const [giftCardNote, setGiftCardNote] = useState('');

  useEffect(() => {
    if (!cartOpen) return;
    try {
      setUsePointsDiscount(window.sessionStorage.getItem('roar_use_points_discount') === '1');
      setGiftCardNote(window.sessionStorage.getItem('roar_gift_card_note') || '');
    } catch {
      // ignore storage access issues
    }
  }, [cartOpen]);

  useEffect(() => {
    if (!cartOpen || upsellCatalog.length > 0) return;
    fetchProductsWithFallback(new URLSearchParams())
      .then((list) => {
        setUpsellCatalog((list || []).filter((p) => p.category !== 'green_bean' && p.status === 'active'));
      })
      .catch(() => {});
  }, [cartOpen, upsellCatalog.length]);

  useEffect(() => {
    if (!cartOpen || !pendingVoucherCode || cartSubtotalVnd <= 0) {
      setPreviewDiscountVnd(0);
      setPreviewVoucherMsg('');
      return;
    }
    let cancelled = false;
    apiFetch('/api/promotions/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: pendingVoucherCode, subtotal: cartSubtotalVnd }),
    })
      .then(async (r) => ({ ok: r.ok, d: await r.json().catch(() => ({})) }))
      .then(({ ok, d }) => {
        if (cancelled) return;
        if (ok && d?.valid) {
          setPreviewDiscountVnd(Number(d.discountAmount || 0));
          const dtype = d.promo?.discount_type;
          if (dtype === 'free_shipping') {
            setPreviewVoucherMsg(t('Miễn phí vận chuyển', 'Free Shipping'));
          } else if (dtype === 'product_gift') {
            setPreviewVoucherMsg(t('Tặng quà kèm đơn', 'Free Gift Included'));
          } else {
            setPreviewVoucherMsg(`-${formatPrice(Number(d.discountAmount || 0))}`);
          }
        } else {
          setPreviewDiscountVnd(0);
          setPreviewVoucherMsg(d?.error || t('Chưa đủ điều kiện mã', 'Min order not met'));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [cartOpen, pendingVoucherCode, cartSubtotalVnd, apiFetch, formatPrice, t]);

  const freeShipRemaining = Math.max(0, TIER1_FREESHIP_VND - cartSubtotalVnd);
  const giftTierRemaining = Math.max(0, TIER2_GIFT_VND - cartSubtotalVnd);
  const progressPct = Math.min(100, Math.round((cartSubtotalVnd / TIER2_GIFT_VND) * 100));

  const upsellPicks = useMemo(() => {
    if (upsellCatalog.length === 0) return [];
    const cartIds = new Set(cart.map((c) => c.productId));
    const candidates = upsellCatalog.filter((p) => !cartIds.has(p.id));
    const sorted = [...candidates].sort((a, b) => {
      const pa = a.variants?.[0]?.priceVnd || a.price_vnd;
      const pb = b.variants?.[0]?.priceVnd || b.price_vnd;
      if (freeShipRemaining > 0) {
        return Math.abs(pa - freeShipRemaining) - Math.abs(pb - freeShipRemaining);
      }
      return pa - pb;
    });
    return sorted.slice(0, 4);
  }, [upsellCatalog, cart, freeShipRemaining]);

  const quickVoucherOptions = useMemo(() => {
    const items: Array<{ code: string; label: string; isGame: boolean }> = [];
    for (const c of activeGameClaims) {
      if (!c.promo_code) continue;
      items.push({
        code: c.promo_code,
        label: `${c.promo_code} · ${lang === 'en' ? c.reward_label_en : c.reward_label_vi}`,
        isGame: true,
      });
    }
    if (cartSubtotalVnd >= 400000) {
      items.push({ code: 'ROARCOMBO12', label: 'ROARCOMBO12 · -12%', isGame: false });
    }
    if (cartSubtotalVnd >= 300000) {
      items.push({ code: 'ROARWELCOME10', label: 'ROARWELCOME10 · -10%', isGame: false });
    }
    return items.slice(0, 4);
  }, [activeGameClaims, cartSubtotalVnd, lang]);

  const availablePoints = user?.points?.available || 0;
  const maxRedeemPts = user && availablePoints > 0 && cartSubtotalVnd > 0
    ? Math.min(availablePoints, Math.floor((cartSubtotalVnd * 0.3) / 100))
    : 0;
  const pointsDiscountPreview = usePointsDiscount && maxRedeemPts > 0 ? maxRedeemPts * 100 : 0;

  if (!cartOpen) return null;

  const estimatedPayable = Math.max(0, cartSubtotalVnd - previewDiscountVnd - pointsDiscountPreview);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/55" onClick={() => setCartOpen(false)} />
      <aside
        aria-label={t('Giỏ hàng', 'Shopping Cart')}
        className="relative w-full max-w-md bg-[#F8F5EF] dark:bg-[#0E1512] h-full flex flex-col shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#16221C] border-b border-[#202020]/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#00552B] dark:text-[#C6A667]" />
            <h2 className="text-lg font-semibold text-[#202020] dark:text-[#F1EFEA]">
              {t('Giỏ hàng của bạn', 'Your Cart')}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrency(currency === 'VND' ? 'USD' : 'VND')}
              className="px-2 py-1 text-xs font-mono border border-[#202020]/15 dark:border-white/15 rounded text-[#202020] dark:text-[#F1EFEA] cursor-pointer"
            >
              {currency}
            </button>
            <button
              type="button"
              onClick={() => setCartOpen(false)}
              aria-label="Close cart"
              className="p-1.5 text-[#202020]/60 dark:text-[#F1EFEA]/60 hover:text-[#202020] dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2-Tier Free Shipping + Bonus Gift Progress */}
        <div className="px-6 py-3 bg-[#00552B]/6 dark:bg-[#00552B]/25 border-b border-[#00552B]/12 dark:border-white/10 space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs text-[#003D25] dark:text-[#C6A667] font-medium">
            <span className="inline-flex items-center gap-1.5 min-w-0">
              {freeShipRemaining > 0 ? (
                <Truck className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Gift className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="truncate">
                {freeShipRemaining > 0
                  ? t(
                      `Thêm ${formatPrice(freeShipRemaining)} để mở khóa Freeship 500k`,
                      `Add ${formatPrice(freeShipRemaining)} for Free Shipping`
                    )
                  : giftTierRemaining > 0
                  ? t(
                      `Đã đạt Freeship! Thêm ${formatPrice(giftTierRemaining)} để nhận Quà & X2 điểm`,
                      `Free Shipping unlocked! Add ${formatPrice(giftTierRemaining)} for Bonus Gift`
                    )
                  : t(
                      'Đã mở khóa Freeship + Quà dùng thử & +40 điểm chơi Game!',
                      'Unlocked Free Shipping + Sample Gift + 40 Play Points!'
                    )}
              </span>
            </span>
            <span className="font-mono text-[11px] font-bold tabular-nums shrink-0">{progressPct}%</span>
          </div>
          <div className="relative h-2 rounded-full bg-[#202020]/10 dark:bg-white/15 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#00552B] to-[#C6A667] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-[#202020]/55 dark:text-[#F1EFEA]/55 tabular-nums">
            <span>0₫</span>
            <span className={freeShipRemaining === 0 ? 'text-[#00552B] dark:text-[#C6A667] font-bold' : ''}>
              500k Freeship
            </span>
            <span className={giftTierRemaining === 0 ? 'text-[#00552B] dark:text-[#C6A667] font-bold' : ''}>
              900k Quà + X2 Điểm
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="py-10 text-center space-y-4">
              <ShoppingBag className="w-10 h-10 mx-auto text-[#202020]/25 dark:text-[#F1EFEA]/25" />
              <p className="text-sm text-[#202020]/70 dark:text-[#F1EFEA]/70">
                {t('Giỏ hàng của bạn đang trống.', 'Your shopping bag is currently empty.')}
              </p>
              <Link
                to={localePath('/shop')}
                onClick={() => setCartOpen(false)}
                className="inline-block px-5 py-2.5 bg-[#00552B] text-white text-sm font-medium rounded hover:bg-[#003D25] transition-colors"
              >
                {t('Khám phá Cà phê ROAR', 'Explore ROAR Coffee')}
              </Link>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={`${item.productId}-${item.variantLabel}`}
                className="flex gap-3.5 bg-white dark:bg-[#16221C] p-3.5 rounded-xl border border-[#202020]/8 dark:border-white/10"
              >
                <div className="w-16 aspect-[4/5] rounded-lg overflow-hidden shrink-0 bg-[#F8F5EF] dark:bg-[#0E1512]">
                  <MediaImage
                    imageKey={item.imageKey}
                    alt={lang === 'vi' ? item.nameVi : item.nameEn}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={localePath(`/product/${item.slug}`)}
                      onClick={() => setCartOpen(false)}
                      className="text-sm font-semibold text-[#202020] dark:text-[#F1EFEA] hover:text-[#00552B] dark:hover:text-[#C6A667] truncate"
                    >
                      {lang === 'vi' ? item.nameVi : item.nameEn}
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId, item.variantLabel)}
                      aria-label={t('Xóa sản phẩm', 'Remove item')}
                      className="text-[#202020]/40 dark:text-[#F1EFEA]/40 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-[#202020]/60 dark:text-[#F1EFEA]/60 mt-0.5">
                    {item.sku} · {localizeVariantLabel(item.variantLabel, lang)}
                  </p>
                  {(item.unit === 'kg' || (item.pricingTiers?.length || 0) > 0) && (
                    <p className="text-[11px] font-mono text-[#00552B] dark:text-[#C6A667] mt-0.5 tabular-nums">
                      {formatPrice(item.unitPriceVnd, item.unitPriceUsd)}/kg × {item.quantity} kg
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div className="inline-flex items-center border border-[#202020]/15 dark:border-white/15 rounded">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.productId, item.variantLabel, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-[#F8F5EF] dark:hover:bg-white/10 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      {item.unit === 'kg' || (item.pricingTiers?.length || 0) > 0 ? (
                        <input
                          type="number"
                          min={1}
                          max={100000}
                          value={item.quantity}
                          onChange={(e) => {
                            const val = Math.floor(Number(e.target.value) || 0);
                            if (val >= 1) updateCartQty(item.productId, item.variantLabel, val);
                          }}
                          className="w-12 text-center text-xs font-medium bg-transparent focus:outline-none tabular-nums"
                        />
                      ) : (
                        <span className="px-2.5 text-xs font-medium tabular-nums">{item.quantity}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.productId, item.variantLabel, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-[#F8F5EF] dark:hover:bg-white/10 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-[#00552B] dark:text-[#C6A667] tabular-nums">
                      {formatPrice(item.unitPriceVnd * item.quantity, item.unitPriceUsd * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Smart Bù Đơn Freeship / Mua Kèm Upsell Strip */}
          {upsellPicks.length > 0 && (
            <div className="pt-2 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-[#202020] dark:text-[#F1EFEA]">
                  {freeShipRemaining > 0
                    ? t('Bù đơn nhanh để đạt Freeship', 'Add-ons to unlock Free Shipping')
                    : t('Thường được mua kèm', 'Frequently Paired With')}
                </p>
                <Link
                  to={localePath('/shop')}
                  onClick={() => setCartOpen(false)}
                  className="text-[11px] font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline whitespace-nowrap"
                >
                  {t('Xem thêm', 'More')}
                </Link>
              </div>
              <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                {upsellPicks.map((p) => {
                  const firstVar = p.variants?.[0];
                  const priceVnd = firstVar?.priceVnd || p.price_vnd;
                  const priceUsd = firstVar?.priceUsd || p.price_usd;
                  return (
                    <div
                      key={p.id}
                      className="w-[188px] shrink-0 bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-2.5 flex items-center gap-2.5"
                    >
                      <Link
                        to={localePath(`/product/${p.slug}`)}
                        onClick={() => setCartOpen(false)}
                        className="w-11 h-14 rounded-md overflow-hidden shrink-0 bg-[#F8F5EF]"
                      >
                        <MediaImage
                          imageKey={p.image_key}
                          alt={lang === 'vi' ? p.name_vi : p.name_en}
                          className="w-full h-full object-cover"
                        />
                      </Link>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-[11px] font-semibold text-[#202020] dark:text-[#F1EFEA] truncate">
                          {lang === 'vi' ? p.name_vi : p.name_en}
                        </p>
                        <p className="text-[11px] font-bold text-[#00552B] dark:text-[#C6A667] tabular-nums">
                          {formatPrice(priceVnd, priceUsd)}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            addToCart({
                              productId: p.id,
                              slug: p.slug,
                              sku: p.sku,
                              nameVi: p.name_vi,
                              nameEn: p.name_en,
                              variantLabel: firstVar?.label || 'Standard',
                              unitPriceVnd: priceVnd,
                              unitPriceUsd: priceUsd,
                              quantity: 1,
                              imageKey: p.image_key,
                            });
                            showToast(t(`Đã thêm ${p.name_vi}`, `Added ${p.name_en}`));
                          }}
                          className="px-2 py-1 rounded bg-[#00552B]/10 dark:bg-[#C6A667]/15 text-[#00552B] dark:text-[#C6A667] hover:bg-[#00552B] hover:text-white text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{t('Thêm', 'Add')}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-5 sm:p-6 bg-white dark:bg-[#16221C] border-t border-[#202020]/10 dark:border-white/10 space-y-3.5">
            {/* Quick Game & Store Voucher Picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[#202020]/80 dark:text-[#F1EFEA]/80 inline-flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#00552B] dark:text-[#C6A667]" />
                  <span>{t('Mã giảm giá & Quà Game', 'Vouchers & Game Rewards')}</span>
                </span>
                {quickVoucherOptions.length === 0 && (
                  <Link
                    to={localePath('/play')}
                    onClick={() => setCartOpen(false)}
                    className="text-[11px] font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                  >
                    <Gamepad2 className="w-3 h-3" />
                    <span>{t('Săn mã ngay →', 'Win Codes →')}</span>
                  </Link>
                )}
              </div>

              {quickVoucherOptions.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                  {quickVoucherOptions.map((opt) => {
                    const active = pendingVoucherCode === opt.code;
                    return (
                      <button
                        key={opt.code}
                        type="button"
                        onClick={() => setPendingVoucherCode(active ? '' : opt.code)}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                          active
                            ? 'bg-[#00552B] border-[#00552B] text-white'
                            : 'bg-[#F8F5EF] dark:bg-[#0E1512] border-[#202020]/15 dark:border-white/15 text-[#202020] dark:text-[#F1EFEA] hover:border-[#00552B]'
                        }`}
                      >
                        {active && <Check className="w-3 h-3 text-[#C6A667]" />}
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {pendingVoucherCode && previewVoucherMsg && (
                <p className="text-[11px] font-medium text-[#00552B] dark:text-[#C6A667]">
                  {t(`Mã ${pendingVoucherCode}: `, `Code ${pendingVoucherCode}: `)}
                  <span className="font-bold">{previewVoucherMsg}</span>
                </p>
              )}
            </div>

            {giftCardNote && (
              <div className="px-3 py-2 rounded-lg bg-[#C6A667]/12 border border-[#C6A667]/40 text-[11px] flex items-center justify-between gap-2 text-[#202020] dark:text-[#F1EFEA]">
                <span className="truncate inline-flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-[#00552B] dark:text-[#C6A667] shrink-0" />
                  <span className="truncate">
                    {t('Thiệp quà:', 'Gift Card:')} &ldquo;{giftCardNote}&rdquo;
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setGiftCardNote('');
                    try {
                      window.sessionStorage.removeItem('roar_gift_card_note');
                    } catch {
                      // ignore
                    }
                  }}
                  className="text-[10px] font-semibold opacity-65 hover:opacity-100 shrink-0 cursor-pointer"
                >
                  {t('Xóa', 'Clear')}
                </button>
              </div>
            )}

            {user && maxRedeemPts > 0 && (
              <button
                type="button"
                onClick={() => {
                  const next = !usePointsDiscount;
                  setUsePointsDiscount(next);
                  try {
                    window.sessionStorage.setItem('roar_use_points_discount', next ? '1' : '0');
                  } catch {
                    // ignore
                  }
                }}
                className={`w-full px-3 py-2 rounded-lg border text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                  usePointsDiscount
                    ? 'bg-[#00552B]/10 dark:bg-[#00552B]/30 border-[#00552B] dark:border-[#C6A667] text-[#003D25] dark:text-[#C6A667]'
                    : 'bg-[#F8F5EF] dark:bg-[#0E1512] border-[#202020]/15 dark:border-white/15 text-[#202020] dark:text-[#F1EFEA]'
                }`}
              >
                <span className="text-left font-medium">
                  {t(
                    `Dùng ${maxRedeemPts.toLocaleString('vi-VN')} điểm ROAR (-100₫/điểm)`,
                    `Apply ${maxRedeemPts.toLocaleString('en-US')} ROAR Points`
                  )}
                </span>
                <span className="font-mono font-bold tabular-nums shrink-0">
                  {usePointsDiscount ? `-${formatPrice(maxRedeemPts * 100)}` : t('Bấm để dùng', 'Tap to apply')}
                </span>
              </button>
            )}

            <div className="space-y-1 pt-1 border-t border-[#202020]/8 dark:border-white/10">
              <div className="flex items-center justify-between text-xs text-[#202020]/65 dark:text-[#F1EFEA]/65">
                <span>{t('Tạm tính', 'Subtotal')}</span>
                <span className="tabular-nums">{formatPrice(cartSubtotalVnd)}</span>
              </div>
              {previewDiscountVnd > 0 && (
                <div className="flex items-center justify-between text-xs font-semibold text-[#00552B] dark:text-[#C6A667]">
                  <span>{t('Ưu đãi áp dụng', 'Voucher Savings')}</span>
                  <span className="tabular-nums">-{formatPrice(previewDiscountVnd)}</span>
                </div>
              )}
              {pointsDiscountPreview > 0 && (
                <div className="flex items-center justify-between text-xs font-semibold text-[#00552B] dark:text-[#C6A667]">
                  <span>{t('Quy đổi điểm thưởng', 'ROAR Points')}</span>
                  <span className="tabular-nums">-{formatPrice(pointsDiscountPreview)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm pt-0.5">
                <span className="font-semibold text-[#202020] dark:text-[#F1EFEA]">
                  {t('Ước tính thanh toán', 'Estimated Total')}
                </span>
                <span className="text-lg font-bold text-[#00552B] dark:text-[#C6A667] tabular-nums">
                  {formatPrice(estimatedPayable)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link
                to={localePath('/cart')}
                onClick={() => setCartOpen(false)}
                className="text-center py-2.5 border border-[#00552B] dark:border-[#C6A667] text-[#00552B] dark:text-[#C6A667] rounded-lg text-sm font-medium hover:bg-[#00552B]/5 transition-colors whitespace-nowrap"
              >
                {t('Xem giỏ hàng', 'View Cart')}
              </Link>
              <Link
                to={localePath('/checkout')}
                onClick={() => setCartOpen(false)}
                className="text-center py-2.5 bg-[#00552B] text-white rounded-lg text-sm font-semibold hover:bg-[#003D25] transition-colors whitespace-nowrap"
              >
                {t('Thanh toán', 'Checkout')}
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
