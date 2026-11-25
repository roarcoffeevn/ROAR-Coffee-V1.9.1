import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BookUser,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Gift,
  HelpCircle,
  Mail,
  MessageSquareHeart,
  Minus,
  Plus,
  RefreshCw,
  Send,
  Smartphone,
  Sparkles,
  Tag,
  User,
  Wallet,
  X,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { useStore, type Product } from '../context/StoreContext';
import { MediaImage } from './MediaImage';

export interface GiftVoucherModalProps {
  isOpen: boolean;
  initialProduct: Product | null;
  allVoucherProducts: Product[];
  initialMode?: 'self' | 'gift';
  onClose: () => void;
}

interface RecipientRow {
  id: string;
  name: string;
  contact: string;
}

interface GiftDispatchItem {
  id: number;
  order_id: number;
  order_number: string;
  voucher_code: string;
  purchase_mode: 'self' | 'gift';
  delivery_channel: 'zalo_sms' | 'email';
  sender_name: string;
  recipient_name: string;
  recipient_contact: string;
  gift_message: string;
  face_value_vnd: number;
  status: string;
  is_code_masked?: boolean;
  expires_at: string;
}

interface CheckoutMembershipInfo {
  isNewMember: boolean;
  matchedExisting?: boolean;
  memberCode?: string;
  tier?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  welcomePoints?: number;
}

interface CheckoutResult {
  order: {
    orderId: number;
    orderNumber: string;
    subtotal: number;
    discountAmount: number;
    pointsDiscount: number;
    shippingFee: number;
    total: number;
    paymentMethod: string;
    paymentStatus: string;
    orderStatus: string;
    customerEmail: string;
    customerPhone: string;
  };
  dispatches: GiftDispatchItem[];
  membership?: CheckoutMembershipInfo;
  auth?: { token: string; user: any };
}

function buildDeterministicQRMatrix(seedText: string, size = 21): boolean[][] {
  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const placeFinder = (top: number, left: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[top + r][left + c] = isBorder || isCore;
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  let state = hash >>> 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTL = r < 8 && c < 8;
      const inTR = r < 8 && c >= size - 8;
      const inBL = r >= size - 8 && c < 8;
      const inCenterBadge = r >= 8 && r <= 12 && c >= 8 && c <= 12;
      if (inTL || inTR || inBL || inCenterBadge) continue;
      if (r === 6 || c === 6) {
        matrix[r][c] = (r + c) % 2 === 0;
        continue;
      }
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      matrix[r][c] = (state & 3) !== 0 && ((state >>> 4) & 1) === 1;
    }
  }
  return matrix;
}

const GIFT_PAYMENT_METHODS = [
  {
    id: 'vietqr',
    labelVi: 'Chuyển khoản · VietQR',
    labelEn: 'Bank Transfer · VietQR',
    subVi: 'Quét mã từ mọi app ngân hàng Việt Nam (Napas 24/7)',
    subEn: 'Scan from any Vietnamese banking app',
    badge: 'VIETQR',
    accent: '#00552B',
    accountNumber: '1903 8868 9999 01',
    accountName: 'CONG TY ROAR COFFEE VIETNAM',
    bankVi: 'Techcombank · Napas 24/7',
    bankEn: 'Techcombank · Napas 24/7',
    isQR: true,
  },
  {
    id: 'vnpay_qr',
    labelVi: 'VNPAY-QR',
    labelEn: 'VNPAY-QR',
    subVi: 'Hỗ trợ hơn 40 ngân hàng & ví điện tử liên kết',
    subEn: '40+ Vietnamese bank apps supported',
    badge: 'VNPAY',
    accent: '#005BAA',
    accountNumber: 'VNPAY-RC-8826',
    accountName: 'ROAR COFFEE VIETNAM',
    bankVi: 'Cổng thanh toán VNPAY-QR',
    bankEn: 'VNPAY-QR Gateway',
    isQR: true,
  },
  {
    id: 'zalopay',
    labelVi: 'Ví ZaloPay',
    labelEn: 'ZaloPay Wallet',
    subVi: 'Thanh toán nhanh trực tiếp trên Zalo / ZaloPay',
    subEn: 'Fast checkout via Zalo / ZaloPay',
    badge: 'ZALOPAY',
    accent: '#0068FF',
    accountNumber: 'ZP-ROAR-202601',
    accountName: 'ROAR COFFEE OFFICIAL',
    bankVi: 'Ví điện tử ZaloPay QR',
    bankEn: 'ZaloPay QR Wallet',
    isQR: true,
  },
  {
    id: 'momo',
    labelVi: 'Ví MoMo',
    labelEn: 'MoMo E-Wallet',
    subVi: 'Quét mã MoMo QR thanh toán tức thì',
    subEn: 'Instant scan with MoMo app',
    badge: 'MOMO',
    accent: '#A50064',
    accountNumber: '0901 686 888',
    accountName: 'ROAR COFFEE OFFICIAL',
    bankVi: 'Ví điện tử MoMo Doanh nghiệp',
    bankEn: 'MoMo Business Wallet',
    isQR: true,
  },
  {
    id: 'wallet',
    labelVi: 'Ví Thành viên ROAR',
    labelEn: 'ROAR Member Wallet',
    subVi: 'Trừ số dư Ví ROAR · Kích hoạt E-Voucher tức thì',
    subEn: 'Instant activation using your ROAR Wallet balance',
    badge: 'WALLET',
    accent: '#00552B',
    accountNumber: '',
    accountName: '',
    bankVi: 'Ví Thành viên ROAR COFFEE®',
    bankEn: 'ROAR COFFEE® Member Wallet',
    isQR: false,
  },
  {
    id: 'points',
    labelVi: 'Điểm thưởng ROAR (100% Điểm)',
    labelEn: 'ROAR Reward Points (100%)',
    subVi: 'Quy đổi toàn bộ giá trị từ điểm tích lũy · Kích hoạt ngay',
    subEn: 'Redeem 100% with loyalty points · Instant activation',
    badge: 'POINTS',
    accent: '#C6A667',
    accountNumber: '',
    accountName: '',
    bankVi: 'Điểm thưởng ROAR Rewards',
    bankEn: 'ROAR Rewards Points',
    isQR: false,
  },
];

export const GiftVoucherModal: React.FC<GiftVoucherModalProps> = ({
  isOpen,
  initialProduct,
  allVoucherProducts,
  initialMode = 'gift',
  onClose,
}) => {
  const { lang, t, localePath } = useI18n();
  const { user, apiFetch, formatPrice, refreshUser, setAuthSession, showToast } = useStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(initialProduct);
  const [purchaseMode, setPurchaseMode] = useState<'self' | 'gift'>(initialMode);
  const [deliveryChannel, setDeliveryChannel] = useState<'zalo_sms' | 'email'>('zalo_sms');
  const [showHowTo, setShowHowTo] = useState(false);
  const [showAddressBook, setShowAddressBook] = useState(false);

  // Sender info
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderEmail, setSenderEmail] = useState('');

  // Recipients & Quantity
  const [selfQuantity, setSelfQuantity] = useState(1);
  const [recipients, setRecipients] = useState<RecipientRow[]>([
    { id: 'rec-1', name: '', contact: '' },
  ]);
  const [giftMessage, setGiftMessage] = useState('');

  // Step 2: Promo & Points & Payment
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState('');
  const [promoDiscountVnd, setPromoDiscountVnd] = useState(0);
  const [promoFeedback, setPromoFeedback] = useState('');
  const [pointsInput, setPointsInput] = useState('');
  const [appliedPoints, setAppliedPoints] = useState(0);
  const [pointsDiscountVnd, setPointsDiscountVnd] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('vietqr');

  // Step 3 & submission state
  const [stepError, setStepError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);
  const [countdownSec, setCountdownSec] = useState(900);
  const [txRef, setTxRef] = useState('');
  const [confirmingTx, setConfirmingTx] = useState(false);
  const [paymentSubmittedNote, setPaymentSubmittedNote] = useState(false);
  const [showNewMemberPopup, setShowNewMemberPopup] = useState(false);
  const [checkingCodeStatus, setCheckingCodeStatus] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const wasOpenRef = useRef(false);
  const userRef = useRef(user);
  userRef.current = user;

  // Initialize / Reset ONLY when modal transitions from closed -> open
  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }
    if (wasOpenRef.current || !initialProduct) return;
    wasOpenRef.current = true;
    const curUser = userRef.current;
    setSelectedProduct(initialProduct);
    setPurchaseMode(initialMode);
    setDeliveryChannel('zalo_sms');
    setStep(1);
    setSelfQuantity(1);
    setRecipients([{ id: `rec-${Date.now()}`, name: '', contact: '' }]);
    setGiftMessage('');
    setPromoInput('');
    setAppliedPromoCode('');
    setPromoDiscountVnd(0);
    setPromoFeedback('');
    setPointsInput('');
    setAppliedPoints(0);
    setPointsDiscountVnd(0);
    setPaymentMethod('vietqr');
    setStepError('');
    setCheckoutResult(null);
    setCountdownSec(900);
    setTxRef('');
    setPaymentSubmittedNote(false);
    setShowNewMemberPopup(false);
    setShowAddressBook(false);
    setShowHowTo(false);
    setSenderName(curUser?.fullName || '');
    setSenderPhone(curUser?.phone || '');
    setSenderEmail(curUser?.email || '');
  }, [isOpen, initialProduct, initialMode]);

  // Esc key close handler
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Countdown timer on Step 3 QR screen
  useEffect(() => {
    if (!isOpen || step !== 3 || !checkoutResult || checkoutResult.order.paymentStatus === 'paid') return;
    const timer = window.setInterval(() => {
      setCountdownSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isOpen, step, checkoutResult]);

  const sortedVouchers = useMemo(() => {
    const list = allVoucherProducts.length > 0 ? allVoucherProducts : selectedProduct ? [selectedProduct] : [];
    return [...list].sort((a, b) => a.price_vnd - b.price_vnd);
  }, [allVoucherProducts, selectedProduct]);

  if (!isOpen || !selectedProduct) return null;

  const quantity = purchaseMode === 'self' ? selfQuantity : recipients.length;
  const unitPriceVnd = selectedProduct.price_vnd;
  const unitPriceUsd = selectedProduct.price_usd;
  const subtotalVnd = unitPriceVnd * quantity;
  const subtotalUsd = unitPriceUsd * quantity;
  const finalTotalVnd = Math.max(0, subtotalVnd - promoDiscountVnd - pointsDiscountVnd);

  const availablePoints = Number(user?.points?.available || 0);
  const maxPointsRedeemable = Math.min(availablePoints, Math.floor((subtotalVnd * 0.3) / 100));
  const pointsNeededFor100Pct = Math.ceil(finalTotalVnd / 100);
  const walletBalanceVnd = Number(user?.walletBalanceVnd || 0);

  const savedContacts = [
    ...(user
      ? [
          {
            id: 'self',
            label: t('Thông tin của tôi', 'My Profile'),
            name: user.fullName || '',
            phone: user.phone || '',
            email: user.email || '',
          },
        ]
      : []),
    ...(Array.isArray(user?.addresses)
      ? user.addresses.map((a: any, idx: number) => ({
          id: a.id || `addr-${idx}`,
          label: a.label || t('Địa chỉ đã lưu', 'Saved Contact'),
          name: a.recipient || user?.fullName || '',
          phone: a.phone || '',
          email: '',
        }))
      : []),
  ].filter((c) => c.name || c.phone || c.email);

  const wishPresets = [
    {
      label: t('+ Ngày mới năng lượng', '+ Great day ahead'),
      text: t('Chúc bạn ngày mới thật nhiều năng lượng và niềm vui cùng ROAR COFFEE!', 'Wishing you a wonderful, energized day with ROAR COFFEE!'),
    },
    {
      label: t('+ Chúc mừng sinh nhật', '+ Happy Birthday'),
      text: t('Chúc mừng sinh nhật! Gửi tặng bạn hương vị cà phê rang mộc chuẩn gu.', 'Happy Birthday! Treating you to your favorite freshly roasted brew.'),
    },
    {
      label: t('+ Cảm ơn đồng hành', '+ Thank you'),
      text: t('Cảm ơn bạn đã luôn đồng hành. Mời bạn ly cà phê thật chill nhé!', 'Thank you for being amazing — coffee is on me today!'),
    },
  ];

  const handleChannelChange = (ch: 'zalo_sms' | 'email') => {
    setDeliveryChannel(ch);
    setStepError('');
  };

  const addRecipientRow = () => {
    if (recipients.length >= 20) return;
    setRecipients((prev) => [...prev, { id: `rec-${Date.now()}-${prev.length}`, name: '', contact: '' }]);
  };

  const removeRecipientRow = (id: string) => {
    if (recipients.length <= 1) {
      setRecipients([{ id: `rec-${Date.now()}`, name: '', contact: '' }]);
      return;
    }
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRecipient = (id: string, field: 'name' | 'contact', value: string) => {
    setRecipients((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const pickFromAddressBook = (entry: { name: string; phone: string; email: string }) => {
    const contactVal = deliveryChannel === 'email' ? entry.email || entry.phone : entry.phone || entry.email;
    const emptyIdx = recipients.findIndex((r) => !r.name.trim() && !r.contact.trim());
    if (emptyIdx >= 0) {
      setRecipients((prev) =>
        prev.map((r, idx) => (idx === emptyIdx ? { ...r, name: entry.name, contact: contactVal } : r))
      );
    } else if (recipients.length < 20) {
      setRecipients((prev) => [
        ...prev,
        { id: `rec-${Date.now()}`, name: entry.name, contact: contactVal },
      ]);
    }
    setShowAddressBook(false);
  };

  const goToStep2 = () => {
    setStepError('');
    if (!senderName.trim()) {
      setStepError(t('Vui lòng nhập họ tên của bạn.', 'Please enter your full name.'));
      return;
    }
    if (deliveryChannel === 'zalo_sms' && !senderPhone.trim() && !senderEmail.trim()) {
      setStepError(t('Vui lòng nhập số điện thoại (Zalo/SMS) hoặc Email của bạn.', 'Please enter your phone or email.'));
      return;
    }
    if (deliveryChannel === 'email' && !senderEmail.trim()) {
      setStepError(t('Vui lòng nhập Email của bạn để nhận bản sao hóa đơn & mã quà tặng.', 'Please enter your email address.'));
      return;
    }
    if (purchaseMode === 'gift') {
      for (let i = 0; i < recipients.length; i++) {
        const r = recipients[i];
        if (!r.name.trim() || !r.contact.trim()) {
          setStepError(
            t(
              `Vui lòng điền đầy đủ Tên và ${deliveryChannel === 'email' ? 'Email' : 'SĐT / Zalo'} cho người nhận #${i + 1}.`,
              `Please enter both Name and ${deliveryChannel === 'email' ? 'Email' : 'Phone/Zalo'} for recipient #${i + 1}.`
            )
          );
          return;
        }
      }
    }
    setStep(2);
  };

  const handleApplyPromo = async () => {
    setPromoFeedback('');
    const clean = promoInput.trim().toUpperCase();
    if (!clean) {
      setAppliedPromoCode('');
      setPromoDiscountVnd(0);
      return;
    }
    const res = await apiFetch('/api/promotions/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: clean, subtotal: subtotalVnd }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok || !d.valid) {
      setAppliedPromoCode('');
      setPromoDiscountVnd(0);
      setPromoFeedback(d.error || t('Mã ưu đãi không hợp lệ.', 'Invalid promo code.'));
      return;
    }
    if (d.isGiftVoucher) {
      setAppliedPromoCode('');
      setPromoDiscountVnd(0);
      setPromoFeedback(t('Mã E-Voucher quà tặng dùng để mua cà phê, không áp dụng trừ khi mua thêm thẻ quà tặng.', 'Gift E-Voucher codes redeem on coffee orders.'));
      return;
    }
    setAppliedPromoCode(d.promo.code);
    setPromoDiscountVnd(Math.min(subtotalVnd, Number(d.discountAmount || 0)));
    setPromoFeedback(t(`Đã áp dụng mã ${d.promo.code}`, `Applied ${d.promo.code}`));
  };

  const handleApplyPoints = () => {
    if (!user) {
      setStepError(t('Vui lòng đăng nhập tài khoản ROAR để sử dụng Điểm thưởng.', 'Sign in to redeem ROAR points.'));
      return;
    }
    const requested = Math.max(0, Math.floor(Number(pointsInput || 0)));
    if (requested <= 0) {
      setAppliedPoints(0);
      setPointsDiscountVnd(0);
      return;
    }
    const capped = Math.min(requested, maxPointsRedeemable);
    setAppliedPoints(capped);
    setPointsDiscountVnd(capped * 100);
    setPointsInput(String(capped));
    setStepError('');
  };

  const handleCheckoutSubmit = async () => {
    setStepError('');
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/gift-vouchers/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          productSlug: selectedProduct.slug,
          purchaseMode,
          deliveryChannel,
          senderName: senderName.trim(),
          senderEmail: senderEmail.trim(),
          senderPhone: senderPhone.trim(),
          recipients: purchaseMode === 'gift' ? recipients.map((r) => ({ name: r.name.trim(), contact: r.contact.trim() })) : [],
          selfQuantity,
          giftMessage: giftMessage.trim(),
          promoCode: appliedPromoCode,
          pointsToRedeem: paymentMethod === 'points' ? 0 : appliedPoints,
          paymentMethod,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStepError(d.error || t('Không thể tạo đơn Gift Voucher lúc này.', 'Unable to complete Gift Voucher checkout.'));
        return;
      }
      setCheckoutResult(d);
      setPaymentSubmittedNote(false);
      setTxRef('');
      setCountdownSec(900);
      setStep(3);
      if (d.auth?.user && d.auth?.token) {
        setAuthSession(d.auth.user, d.auth.token);
      } else if (user) {
        refreshUser();
      }
      if (d.order?.paymentStatus === 'paid' && d.membership?.isNewMember) {
        setShowNewMemberPopup(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const copyText = async (id: string, text: string, toastMsg?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast(toastMsg || t('Đã sao chép vào khay nhớ tạm', 'Copied to clipboard'));
      window.setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 2000);
    } catch {
      showToast(text);
    }
  };

  const handleConfirmQrPayment = async () => {
    if (!checkoutResult) return;
    setConfirmingTx(true);
    try {
      const res = await apiFetch(`/api/orders/${encodeURIComponent(checkoutResult.order.orderNumber)}/confirm-payment-reference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: checkoutResult.order.customerEmail,
          transactionRef: txRef.trim(),
        }),
      });
      if (res.ok) {
        setPaymentSubmittedNote(true);
        if (checkoutResult.membership?.isNewMember) {
          setShowNewMemberPopup(true);
        }
        showToast(t('Thanh toán hoàn tất! Vui lòng đợi hệ thống gửi Code E-Voucher.', 'Payment confirmed! Please wait for your E-Voucher code.'));
      } else {
        showToast(t('Không thể ghi nhận xác nhận lúc này. Vui lòng thử lại.', 'Unable to log payment confirmation. Please retry.'));
      }
    } finally {
      setConfirmingTx(false);
    }
  };

  const handleRefreshDispatchStatus = async () => {
    if (!checkoutResult || checkingCodeStatus) return;
    setCheckingCodeStatus(true);
    try {
      const res = await apiFetch(
        `/api/orders/track?orderNumber=${encodeURIComponent(checkoutResult.order.orderNumber)}&email=${encodeURIComponent(checkoutResult.order.customerEmail)}`
      );
      if (res.ok) {
        const d = await res.json();
        const ord = d.order;
        if (ord) {
          setCheckoutResult((prev) =>
            prev
              ? {
                  order: {
                    ...prev.order,
                    paymentStatus: ord.payment_status || prev.order.paymentStatus,
                    orderStatus: ord.order_status || prev.order.orderStatus,
                  },
                  dispatches: Array.isArray(ord.gift_dispatches) && ord.gift_dispatches.length > 0 ? ord.gift_dispatches : prev.dispatches,
                }
              : prev
          );
          if (ord.payment_status === 'paid') {
            showToast(t('Mã E-Voucher của bạn đã được kích hoạt!', 'Your E-Voucher code is now active!'));
          } else {
            showToast(t('Đơn hàng đang được đối soát. Vui lòng đợi trong giây lát.', 'Order is still being verified. Please check back shortly.'));
          }
        }
      }
    } finally {
      setCheckingCodeStatus(false);
    }
  };

  const activePayMeta = GIFT_PAYMENT_METHODS.find((m) => m.id === (checkoutResult?.order.paymentMethod || paymentMethod)) || GIFT_PAYMENT_METHODS[0];
  const qrPayload = checkoutResult
    ? `${activePayMeta.id.toUpperCase()}|${activePayMeta.accountNumber}|${checkoutResult.order.total}|ROAR ${checkoutResult.order.orderNumber}`
    : '';
  const qrMatrix = checkoutResult && activePayMeta.isQR ? buildDeterministicQRMatrix(qrPayload, 21) : [];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('Mua & Tặng Gift Voucher ROAR', 'Buy & Gift ROAR Gift Voucher')}
    >
      <div
        className="w-full max-w-[920px] max-h-[92vh] bg-white dark:bg-[#131E18] text-[#202020] dark:text-[#F1EFEA] rounded-2xl border border-[#202020]/12 dark:border-white/15 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact Top Modal Header */}
        <div className="px-4 sm:px-5 py-2.5 border-b border-[#202020]/10 dark:border-white/10 flex items-center justify-between gap-3 bg-[#F8F5EF] dark:bg-[#0E1512] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Gift className="w-4 h-4 text-[#00552B] dark:text-[#C6A667] shrink-0" />
            <div className="min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <p className="text-xs sm:text-sm font-bold truncate">
                {t('Tặng & Mua E-Voucher ROAR COFFEE®', 'Send & Buy ROAR E-Voucher')}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-[#202020]/60 dark:text-[#F1EFEA]/60 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => step !== 3 && setStep(1)}
                  className={`${step === 1 ? 'font-bold text-[#00552B] dark:text-[#C6A667]' : ''} cursor-pointer`}
                >
                  {t('1. Người nhận & Lời chúc', '1. Recipient & Wish')}
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => step === 2 && setStep(2)}
                  className={`${step === 2 ? 'font-bold text-[#00552B] dark:text-[#C6A667]' : ''} cursor-pointer`}
                >
                  {t('2. Ưu đãi & Thanh toán', '2. Discounts & Pay')}
                </button>
                <span aria-hidden="true">·</span>
                <span className={step === 3 ? 'font-bold text-[#00552B] dark:text-[#C6A667]' : ''}>
                  {t('3. Thanh toán & Nhận Code', '3. Pay & Code')}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('Đóng', 'Close')}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Two-Column Body: overall scroll on small screens, split pane with pinned CTA on desktop */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto lg:overflow-hidden">
          {/* LEFT COLUMN: Compact Summary Card */}
          <div className="lg:col-span-4 bg-[#FAF8F4] dark:bg-[#0E1512] p-3.5 sm:p-4 border-b lg:border-b-0 lg:border-r border-[#202020]/10 dark:border-white/10 space-y-3 lg:overflow-y-auto">
            <div className="flex sm:block items-center gap-3">
              <div className="w-24 h-16 sm:w-full sm:h-32 rounded-lg sm:rounded-xl overflow-hidden border border-[#202020]/10 dark:border-white/10 bg-[#0B120E] relative shrink-0">
                <MediaImage
                  imageKey={selectedProduct.image_key}
                  alt={lang === 'vi' ? selectedProduct.name_vi : selectedProduct.name_en}
                  className="w-full h-full object-cover"
                />
                <div className="hidden sm:flex absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent px-3 py-2 items-end justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#C6A667]">
                    ROAR E-VOUCHER
                  </span>
                  <span className="text-xs font-bold text-white tabular-nums">
                    {formatPrice(unitPriceVnd, unitPriceUsd)}
                  </span>
                </div>
              </div>

              <div className="sm:hidden min-w-0 flex-1 space-y-0.5">
                <h3 className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA] truncate">
                  {lang === 'vi' ? selectedProduct.name_vi : selectedProduct.name_en}
                </h3>
                <p className="text-xs font-bold font-mono text-[#00552B] dark:text-[#C6A667] tabular-nums">
                  {formatPrice(unitPriceVnd, unitPriceUsd)}
                </p>
                <p className="text-[11px] text-[#B91C1C] dark:text-[#FCA5A5]">
                  {t('HSD: 365 ngày', 'Valid: 365 days')}
                </p>
              </div>
            </div>

            {/* Quick Denomination Switcher */}
            {sortedVouchers.length > 1 && step < 3 && (
              <div className="space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#202020]/60 dark:text-[#F1EFEA]/60 block">
                  {t('Chọn nhanh mệnh giá', 'Denomination')}
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {sortedVouchers.map((vp) => {
                    const active = vp.id === selectedProduct.id;
                    const shortLabel = vp.price_vnd >= 1000000 ? `${vp.price_vnd / 1000000}Tr` : `${vp.price_vnd / 1000}k`;
                    return (
                      <button
                        key={vp.id}
                        type="button"
                        onClick={() => {
                          setSelectedProduct(vp);
                          setPromoDiscountVnd(0);
                          setAppliedPromoCode('');
                          setPointsDiscountVnd(0);
                          setAppliedPoints(0);
                        }}
                        className={`py-1 px-1.5 rounded-md text-[11px] font-mono font-bold border transition-colors cursor-pointer tabular-nums ${
                          active
                            ? 'bg-[#00552B] text-white border-[#00552B]'
                            : 'bg-white dark:bg-[#16221C] border-[#202020]/15 dark:border-white/15 hover:border-[#00552B]'
                        }`}
                      >
                        {shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="hidden sm:block text-center space-y-0.5">
              <h3 className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA] leading-snug">
                {lang === 'vi' ? selectedProduct.name_vi : selectedProduct.name_en}
              </h3>
              <p className="text-[11px] font-medium text-[#B91C1C] dark:text-[#FCA5A5]">
                {t('Hạn sử dụng: 365 ngày (kể từ ngày mua)', 'Validity: 365 days from purchase')}
              </p>
            </div>

            {/* Compact Price Breakdown Table */}
            <div className="border-t border-[#202020]/10 dark:border-white/10 pt-2.5 space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-[#202020]/75 dark:text-[#F1EFEA]/75">
                <span>{t('Đơn giá', 'Unit Price')}</span>
                <span className="font-mono tabular-nums">{formatPrice(unitPriceVnd, unitPriceUsd)}</span>
              </div>
              <div className="flex justify-between items-center text-[#202020]/75 dark:text-[#F1EFEA]/75">
                <span>{t('Số lượng', 'Qty')}</span>
                <span className="font-mono font-semibold tabular-nums">{quantity}</span>
              </div>
              <div className="flex justify-between items-center text-[#202020]/75 dark:text-[#F1EFEA]/75">
                <span>{t('Tạm tính', 'Subtotal')}</span>
                <span className="font-mono tabular-nums">{formatPrice(subtotalVnd, subtotalUsd)}</span>
              </div>
              <div className="flex justify-between items-center text-[#202020]/75 dark:text-[#F1EFEA]/75">
                <span>{t('Phí dịch vụ', 'Service Fee')}</span>
                <span className="font-medium text-[#00552B] dark:text-[#C6A667]">{t('Miễn phí', 'Free')}</span>
              </div>
              {promoDiscountVnd > 0 && (
                <div className="flex justify-between items-center text-[#00552B] dark:text-[#C6A667]">
                  <span>{t('Mã ưu đãi', 'Promo')}</span>
                  <span className="font-mono tabular-nums">-{formatPrice(promoDiscountVnd)}</span>
                </div>
              )}
              {pointsDiscountVnd > 0 && (
                <div className="flex justify-between items-center text-[#00552B] dark:text-[#C6A667]">
                  <span>{t('Điểm ROAR', 'Points')}</span>
                  <span className="font-mono tabular-nums">-{formatPrice(pointsDiscountVnd)}</span>
                </div>
              )}
              <div className="border-t border-[#202020]/12 dark:border-white/15 pt-2 flex justify-between items-baseline">
                <span className="font-bold text-sm">{t('Tổng', 'Total')}</span>
                <span className="text-lg font-bold font-mono text-[#00552B] dark:text-[#C6A667] tabular-nums">
                  {formatPrice(checkoutResult ? checkoutResult.order.total : finalTotalVnd)}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Compact Scrollable Step Area + Always-Visible Pinned CTA Footer */}
          <div className="lg:col-span-8 flex flex-col min-h-0">
            <div className="flex-1 lg:overflow-y-auto p-3.5 sm:p-5 space-y-3.5">
            {step === 1 && (
              <div className="space-y-3.5">
                {/* Segmented Toggle: Mua cho tôi vs Mua tặng */}
                <div className="inline-flex p-0.5 rounded-full bg-[#F2EFE8] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setPurchaseMode('self')}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      purchaseMode === 'self'
                        ? 'bg-[#00552B] text-white shadow-sm'
                        : 'text-[#202020]/70 dark:text-[#F1EFEA]/70 hover:text-[#202020] dark:hover:text-white'
                    }`}
                  >
                    {t('Mua cho tôi', 'Buy for Myself')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPurchaseMode('gift')}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      purchaseMode === 'gift'
                        ? 'bg-[#00552B] text-white shadow-sm'
                        : 'text-[#202020]/70 dark:text-[#F1EFEA]/70 hover:text-[#202020] dark:hover:text-white'
                    }`}
                  >
                    {t('Mua tặng', 'Send as a Gift')}
                  </button>
                </div>

                {/* Sender Information */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-[#202020] dark:text-[#F1EFEA]">
                    <User className="w-3.5 h-3.5 text-[#00552B] dark:text-[#C6A667]" />
                    <span>{t('Thông tin của bạn', 'Your Information (Sender)')}</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder={t('Họ và tên *', 'Full name *')}
                      className="sm:col-span-1 bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded-lg px-3 py-2 text-xs sm:text-[13px] focus:outline-none focus:border-[#00552B]"
                    />
                    <input
                      type="tel"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder={t('Số điện thoại', 'Phone number')}
                      className="sm:col-span-1 bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded-lg px-3 py-2 text-xs sm:text-[13px] focus:outline-none focus:border-[#00552B]"
                    />
                    <input
                      type="email"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder={t('Email nhận hóa đơn', 'Receipt email')}
                      className="sm:col-span-1 bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded-lg px-3 py-2 text-xs sm:text-[13px] focus:outline-none focus:border-[#00552B]"
                    />
                  </div>
                </div>

                {/* Delivery Channel Selector (How-to button inline cleanly on the right) */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-[#202020] dark:text-[#F1EFEA]">
                      <Send className="w-3.5 h-3.5 text-[#00552B] dark:text-[#C6A667]" />
                      <span>{t('Phương thức nhận voucher', 'Delivery Channel')}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowHowTo((s) => !s)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#00552B] dark:text-[#C6A667] hover:underline cursor-pointer"
                    >
                      <HelpCircle className="w-3 h-3" />
                      <span>{t('Cách nhận voucher?', 'How it works?')}</span>
                      {showHowTo ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleChannelChange('zalo_sms')}
                      className={`py-2 px-3 rounded-lg border text-xs sm:text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                        deliveryChannel === 'zalo_sms'
                          ? 'border-[#00552B] dark:border-[#C6A667] bg-[#00552B]/6 dark:bg-[#00552B]/25 text-[#00552B] dark:text-[#C6A667]'
                          : 'border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] text-[#202020]/75 dark:text-[#F1EFEA]/75'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>SMS / Zalo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChannelChange('email')}
                      className={`py-2 px-3 rounded-lg border text-xs sm:text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                        deliveryChannel === 'email'
                          ? 'border-[#00552B] dark:border-[#C6A667] bg-[#00552B]/6 dark:bg-[#00552B]/25 text-[#00552B] dark:text-[#C6A667]'
                          : 'border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] text-[#202020]/75 dark:text-[#F1EFEA]/75'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email</span>
                    </button>
                  </div>

                  {showHowTo && (
                    <div className="p-2.5 rounded-lg bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 text-[11px] text-[#202020]/80 dark:text-[#F1EFEA]/80 space-y-1 leading-relaxed">
                      <p>1. {t('Sau khi thanh toán Ví/Điểm (hoặc đối soát VietQR), hệ thống cấp mã ROAR-GIFT-XXXX-XXXX.', 'Once paid via Wallet/Points (or QR verified), unique ROAR-GIFT-XXXX-XXXX codes activate.')}</p>
                      <p>2. {t('Sao chép thiệp kèm mã gửi Zalo/Email hoặc dùng trực tiếp ở bước Giỏ hàng.', 'Copy & share the greeting card via Zalo/Email, or redeem directly at checkout.')}</p>
                    </div>
                  )}
                </div>

                {/* Recipient Section (Gift Mode) OR Quantity Stepper (Self Mode) */}
                {purchaseMode === 'gift' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 relative">
                      <label className="flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-[#202020] dark:text-[#F1EFEA]">
                        <Gift className="w-3.5 h-3.5 text-[#00552B] dark:text-[#C6A667]" />
                        <span>{t('Thông tin người nhận', 'Recipient Details')}</span>
                      </label>
                      <div className="flex items-center gap-3 relative">
                        {recipients.length < 20 && (
                          <button
                            type="button"
                            onClick={addRecipientRow}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>{t('Thêm người nhận', 'Add recipient')}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowAddressBook((v) => !v)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline cursor-pointer"
                        >
                          <BookUser className="w-3.5 h-3.5" />
                          <span>Address Book</span>
                        </button>
                        {showAddressBook && (
                          <div className="absolute right-0 top-6 z-20 w-72 bg-white dark:bg-[#18261F] rounded-xl border border-[#202020]/15 dark:border-white/15 shadow-xl p-3 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold pb-1.5 border-b border-[#202020]/10 dark:border-white/10">
                              <span>{t('Chọn nhanh từ danh bạ', 'Quick Pick Contact')}</span>
                              <button type="button" onClick={() => setShowAddressBook(false)} className="cursor-pointer opacity-60 hover:opacity-100">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {savedContacts.length === 0 ? (
                              <p className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65 py-1">
                                {t('Đăng nhập để lấy danh bạ địa chỉ đã lưu.', 'Sign in to access saved contacts.')}
                              </p>
                            ) : (
                              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                {savedContacts.map((c) => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => pickFromAddressBook(c)}
                                    className="w-full text-left p-2 rounded-lg bg-[#F8F5EF] dark:bg-[#0E1512] hover:bg-[#00552B]/10 text-xs transition-colors cursor-pointer"
                                  >
                                    <span className="font-semibold block">{c.name || c.label}</span>
                                    <span className="text-[11px] opacity-70 font-mono">
                                      {deliveryChannel === 'email' ? c.email || c.phone : c.phone || c.email}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {recipients.map((rec, idx) => (
                        <div key={rec.id} className="flex items-center gap-2">
                          <span className="w-4 text-[11px] font-mono font-bold text-[#202020]/55 dark:text-[#F1EFEA]/55 tabular-nums shrink-0">
                            {idx + 1}.
                          </span>
                          <input
                            type="text"
                            value={rec.name}
                            onChange={(e) => updateRecipient(rec.id, 'name', e.target.value)}
                            placeholder={t('Tên người nhận', 'Recipient name')}
                            className="flex-1 min-w-0 bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded-lg px-3 py-2 text-xs sm:text-[13px] focus:outline-none focus:border-[#00552B]"
                          />
                          <input
                            type={deliveryChannel === 'email' ? 'email' : 'tel'}
                            value={rec.contact}
                            onChange={(e) => updateRecipient(rec.id, 'contact', e.target.value)}
                            placeholder={
                              deliveryChannel === 'email'
                                ? t('Email người nhận', 'Recipient email')
                                : t('SĐT / Zalo người nhận', 'Phone / Zalo')
                            }
                            className="flex-1 min-w-0 bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded-lg px-3 py-2 text-xs sm:text-[13px] font-mono focus:outline-none focus:border-[#00552B]"
                          />
                          <button
                            type="button"
                            onClick={() => removeRecipientRow(rec.id)}
                            aria-label={t('Xóa người nhận', 'Remove recipient')}
                            className="w-7 h-7 rounded-full bg-[#00552B]/10 dark:bg-[#C6A667]/15 text-[#00552B] dark:text-[#C6A667] hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs sm:text-[13px] font-bold">{t('Số lượng E-Voucher muốn mua', 'E-Voucher Quantity')}</p>
                      <p className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65">
                        {t('Mã E-Voucher gửi trực tiếp về thông tin của bạn.', 'Codes delivered straight to your contact.')}
                      </p>
                    </div>
                    <div className="flex items-center border border-[#202020]/15 dark:border-white/15 rounded-lg bg-white dark:bg-[#16221C]">
                      <button
                        type="button"
                        onClick={() => setSelfQuantity((q) => Math.max(1, q - 1))}
                        className="w-8 h-8 flex items-center justify-center hover:bg-black/5 cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-9 text-center text-xs font-mono font-bold tabular-nums">{selfQuantity}</span>
                      <button
                        type="button"
                        onClick={() => setSelfQuantity((q) => Math.min(20, q + 1))}
                        className="w-8 h-8 flex items-center justify-center hover:bg-black/5 cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Gift Message */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-[#202020] dark:text-[#F1EFEA]">
                      <MessageSquareHeart className="w-3.5 h-3.5 text-[#00552B] dark:text-[#C6A667]" />
                      <span>{t('Tin nhắn quà tặng', 'Gift Message')}</span>
                    </label>
                    <span className="text-[11px] font-mono text-[#202020]/55 dark:text-[#F1EFEA]/55 tabular-nums">
                      {giftMessage.length}/300
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={300}
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    placeholder={t('Hãy gửi những lời chúc tốt đẹp nhất đến người nhận nhé!', 'Write a heartfelt wish for your recipient!')}
                    className="w-full bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded-lg p-2.5 text-xs sm:text-[13px] focus:outline-none focus:border-[#00552B] resize-none"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    {wishPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setGiftMessage(preset.text.slice(0, 300))}
                        className="text-[11px] px-2.5 py-1 rounded-md bg-[#F2EFE8] dark:bg-white/8 hover:bg-[#00552B]/12 text-[#202020]/80 dark:text-[#F1EFEA]/80 cursor-pointer transition-colors whitespace-nowrap"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3.5">
                {/* Discount Code & ROAR Point Box */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-[#202020] dark:text-[#F1EFEA]">
                    <Tag className="w-3.5 h-3.5 text-[#00552B] dark:text-[#C6A667]" />
                    <span>{t('Mã giảm giá hoặc Điểm thưởng ROAR', 'Promo Code or ROAR Points')}</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-[#202020]/75 dark:text-[#F1EFEA]/75 block">
                        {t('Mã giảm giá', 'Promo code')}
                      </span>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          placeholder="ROAR10..."
                          className="flex-1 min-w-0 bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded-lg px-2.5 py-1.5 text-xs font-mono uppercase focus:outline-none focus:border-[#00552B]"
                        />
                        <button
                          type="button"
                          onClick={handleApplyPromo}
                          className="px-3.5 py-1.5 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {t('Sử dụng', 'Apply')}
                        </button>
                      </div>
                      {promoFeedback && (
                        <p className={`text-[11px] ${promoDiscountVnd > 0 ? 'text-[#00552B] dark:text-[#C6A667]' : 'text-red-600 dark:text-red-400'}`}>
                          {promoFeedback}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-[#202020]/75 dark:text-[#F1EFEA]/75 flex items-center justify-between">
                        <span>{t('Điểm thưởng ROAR', 'ROAR Points')}</span>
                        <span className="font-mono text-[#00552B] dark:text-[#C6A667] tabular-nums">
                          {availablePoints.toLocaleString('vi-VN')} pts
                        </span>
                      </span>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          min={0}
                          max={maxPointsRedeemable}
                          value={pointsInput}
                          onChange={(e) => setPointsInput(e.target.value)}
                          placeholder={maxPointsRedeemable > 0 ? `Max ${maxPointsRedeemable}` : '0'}
                          disabled={!user || maxPointsRedeemable <= 0}
                          className="flex-1 min-w-0 bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded-lg px-2.5 py-1.5 text-xs font-mono tabular-nums focus:outline-none focus:border-[#00552B] disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={handleApplyPoints}
                          disabled={!user || maxPointsRedeemable <= 0}
                          className="px-3.5 py-1.5 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40"
                        >
                          {t('Sử dụng', 'Use')}
                        </button>
                      </div>
                      {!user && (
                        <p className="text-[11px] text-[#202020]/60 dark:text-[#F1EFEA]/60">
                          <Link to={localePath('/account')} onClick={onClose} className="text-[#00552B] dark:text-[#C6A667] underline font-semibold">
                            {t('Đăng nhập', 'Sign in')}
                          </Link>{' '}
                          {t('để dùng Điểm & Ví ROAR.', 'to use ROAR Points & Wallet.')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Compact Summary Box */}
                <div className="px-3.5 py-2.5 rounded-lg bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4 text-[#202020]/75 dark:text-[#F1EFEA]/75">
                    <span>
                      {t('Giảm giá:', 'Discount:')}{' '}
                      <strong className="font-mono text-[#202020] dark:text-[#F1EFEA] tabular-nums">{formatPrice(promoDiscountVnd)}</strong>
                    </span>
                    <span>
                      ROAR Point:{' '}
                      <strong className="font-mono text-[#202020] dark:text-[#F1EFEA] tabular-nums">{appliedPoints}</strong>
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-[#202020]/75 dark:text-[#F1EFEA]/75">{t('Thanh toán:', 'Total Due:')}</span>
                    <span className="text-base font-bold font-mono text-[#00552B] dark:text-[#C6A667] tabular-nums">
                      {formatPrice(finalTotalVnd)}
                    </span>
                  </div>
                </div>

                {/* Payment Method Selection: Clean 2-Column Compact Grid */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-[#202020] dark:text-[#F1EFEA]">
                    <Wallet className="w-3.5 h-3.5 text-[#00552B] dark:text-[#C6A667]" />
                    <span>{t('Chọn phương thức thanh toán', 'Select Payment Method')}</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {GIFT_PAYMENT_METHODS.map((opt) => {
                      const active = paymentMethod === opt.id;
                      const walletShort = opt.id === 'wallet' && (!user || walletBalanceVnd < finalTotalVnd);
                      const pointsShort = opt.id === 'points' && (!user || availablePoints < pointsNeededFor100Pct);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setPaymentMethod(opt.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg border flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                            active
                              ? 'border-[#00552B] dark:border-[#C6A667] bg-[#00552B]/6 dark:bg-[#00552B]/25'
                              : 'border-[#202020]/12 dark:border-white/12 bg-white dark:bg-[#0E1512] hover:border-[#00552B]/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                active ? 'border-[#00552B] dark:border-[#C6A667]' : 'border-[#202020]/30 dark:border-white/30'
                              }`}
                            >
                              {active && <span className="w-1.5 h-1.5 rounded-full bg-[#00552B] dark:bg-[#C6A667]" />}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate">{lang === 'vi' ? opt.labelVi : opt.labelEn}</p>
                              <p className="text-[10px] text-[#202020]/60 dark:text-[#F1EFEA]/60 truncate">
                                {opt.id === 'wallet' && user
                                  ? t(`Số dư: ${walletBalanceVnd.toLocaleString('vi-VN')}₫`, `Balance: ${walletBalanceVnd.toLocaleString('en-US')}`)
                                  : opt.id === 'points' && user
                                    ? t(`Cần ${pointsNeededFor100Pct.toLocaleString('vi-VN')}đ (có ${availablePoints.toLocaleString('vi-VN')})`, `Needs ${pointsNeededFor100Pct.toLocaleString()} pts`)
                                    : (walletShort || pointsShort) && active
                                      ? (!user ? t('Cần đăng nhập', 'Sign in required') : t('Số dư chưa đủ', 'Low balance'))
                                      : lang === 'vi'
                                        ? opt.subVi
                                        : opt.subEn}
                              </p>
                            </div>
                          </div>
                          <span
                            className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded text-white shrink-0"
                            style={{ backgroundColor: opt.accent }}
                          >
                            {opt.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && checkoutResult && (
              <div className="space-y-3.5">
                {/* CASE 1: Payment Paid Immediately (ROAR Wallet / Points / Reconciled) */}
                {checkoutResult.order.paymentStatus === 'paid' ? (
                  <>
                    <div className="p-4 rounded-xl bg-[#00552B]/10 dark:bg-[#00552B]/30 border border-[#00552B]/30 text-center space-y-1.5">
                      <div className="w-10 h-10 rounded-full bg-[#00552B] text-white flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <h4 className="text-base font-bold text-[#00552B] dark:text-[#C6A667]">
                        {t('Thanh toán hoàn tất · Đã cấp mã E-Voucher!', 'Payment Complete · E-Vouchers Issued!')}
                      </h4>
                      <p className="text-xs text-[#202020]/80 dark:text-[#F1EFEA]/80 max-w-md mx-auto leading-relaxed">
                        {t(
                          `Đơn ${checkoutResult.order.orderNumber} đã thanh toán thành công. Mã E-Voucher đã kích hoạt và sẵn sàng gửi qua ${deliveryChannel === 'email' ? 'Email' : 'SMS / Zalo'}.`,
                          `Order ${checkoutResult.order.orderNumber} is paid. All E-Voucher codes below are active via ${deliveryChannel === 'email' ? 'Email' : 'SMS / Zalo'}.`
                        )}
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      <h4 className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#C6A667]" />
                        <span>
                          {t(
                            `Thiệp & Mã E-Voucher đã kích hoạt (${checkoutResult.dispatches.length})`,
                            `Active Gift E-Voucher Cards (${checkoutResult.dispatches.length})`
                          )}
                        </span>
                      </h4>

                      <div className="space-y-2.5">
                        {checkoutResult.dispatches.map((d) => {
                          const shareText = [
                            `🎁 ${d.sender_name} ${t('gửi tặng bạn Phiếu Quà Tặng ROAR COFFEE® trị giá', 'sent you a ROAR COFFEE® Gift Voucher worth')} ${d.face_value_vnd.toLocaleString('vi-VN')}₫!`,
                            d.gift_message ? `💌 "${d.gift_message}"` : '',
                            `🔑 ${t('Mã E-Voucher:', 'Voucher Code:')} ${d.voucher_code}`,
                            `⏳ ${t('Hạn sử dụng đến:', 'Valid until:')} ${String(d.expires_at).slice(0, 10)}`,
                            `☕ ${t('Nhập mã này tại Giỏ hàng / Thanh toán trên website ROAR COFFEE® để sử dụng ngay.', 'Apply this code at ROAR COFFEE® checkout to redeem.')}`,
                          ]
                            .filter(Boolean)
                            .join('\n');

                          return (
                            <div
                              key={d.id}
                              className="rounded-xl border border-[#C6A667]/45 bg-gradient-to-br from-[#0F1B15] to-[#172820] text-[#F1EFEA] p-3.5 space-y-2.5 shadow-sm"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <span className="text-[11px] font-mono text-[#C6A667] uppercase tracking-wider block">
                                    {d.delivery_channel === 'email' ? 'Email' : 'SMS / Zalo'} · {d.recipient_name} ({d.recipient_contact})
                                  </span>
                                  <p className="text-sm font-bold text-white tabular-nums">
                                    {formatPrice(d.face_value_vnd)} · {t('Hạn đến', 'Valid')} {String(d.expires_at).slice(0, 10)}
                                  </p>
                                </div>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#00552B] text-white">
                                  {t('Đã kích hoạt', 'Active')}
                                </span>
                              </div>

                              {d.gift_message && (
                                <p className="text-xs italic text-[#F1EFEA]/85 bg-white/5 rounded-lg px-2.5 py-1.5">
                                  “{d.gift_message}”
                                </p>
                              )}

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                                <code className="font-mono text-sm font-bold text-[#C6A667] tracking-wider">
                                  {d.voucher_code}
                                </code>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => copyText(`code-${d.id}`, d.voucher_code, t(`Đã sao chép mã ${d.voucher_code}`, `Copied ${d.voucher_code}`))}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-medium cursor-pointer"
                                  >
                                    {copiedId === `code-${d.id}` ? <Check className="w-3 h-3 text-[#C6A667]" /> : <Copy className="w-3 h-3" />}
                                    <span>{t('Sao chép mã', 'Copy Code')}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => copyText(`card-${d.id}`, shareText, t('Đã sao chép thiệp quà tặng để gửi Zalo/SMS/Email!', 'Copied gift greeting card!'))}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#C6A667] hover:bg-[#d6b779] text-[#111111] text-[11px] font-bold cursor-pointer"
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>{t('Sao chép thiệp', 'Share Card')}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : paymentSubmittedNote ? (
                  /* CASE 2: Dedicated Confirmation Screen After User Completes QR / Bank Transfer */
                  <div className="space-y-3.5">
                    <div className="rounded-xl border border-[#00552B]/25 dark:border-[#C6A667]/35 bg-[#F8F5EF] dark:bg-[#0E1512] p-4 sm:p-5 text-center space-y-3">
                      <div className="w-11 h-11 rounded-full bg-[#00552B] text-white flex items-center justify-center mx-auto shadow-sm">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#00552B] dark:text-[#C6A667] font-bold">
                          {t('XÁC NHẬN THANH TOÁN THÀNH CÔNG', 'PAYMENT CONFIRMATION RECEIVED')}
                        </p>
                        <h4 className="text-base sm:text-lg font-bold text-[#202020] dark:text-[#F1EFEA]">
                          {t('Hoàn tất đơn hàng — Đang đợi nhận Code E-Voucher', 'Order Complete — Awaiting E-Voucher Code')}
                        </h4>
                        <p className="text-xs text-[#202020]/75 dark:text-[#F1EFEA]/75 max-w-lg mx-auto leading-relaxed">
                          {t(
                            `Đã ghi nhận thanh toán đơn ${checkoutResult.order.orderNumber}. Ngay khi kế toán xác nhận (1–5 phút), Code E-Voucher sẽ gửi qua ${deliveryChannel === 'email' ? 'Email' : 'SMS / Zalo'}.`,
                            `Payment logged for ${checkoutResult.order.orderNumber}. Once verified (1–5 mins), codes will activate via ${deliveryChannel === 'email' ? 'Email' : 'SMS / Zalo'}.`
                          )}
                        </p>
                      </div>

                      {/* 3-Step Delivery Timeline */}
                      <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                        <div className="rounded-lg bg-[#00552B]/12 dark:bg-[#00552B]/30 border border-[#00552B]/30 p-2 text-[#00552B] dark:text-[#C6A667] font-semibold">
                          <span className="block font-mono text-[10px]">01 · {t('Hoàn tất', 'Done')}</span>
                          <span>{t('Đã thanh toán QR', 'Payment Sent')}</span>
                        </div>
                        <div className="rounded-lg bg-[#C6A667]/18 border border-[#C6A667]/45 p-2 text-[#7A5915] dark:text-[#C6A667] font-semibold">
                          <span className="block font-mono text-[10px]">02 · {t('Đang xử lý', 'Verifying')}</span>
                          <span>{t('Đối soát giao dịch', 'Reconciling')}</span>
                        </div>
                        <div className="rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/12 dark:border-white/12 p-2 text-[#202020]/70 dark:text-[#F1EFEA]/70 font-medium">
                          <span className="block font-mono text-[10px]">03 · {t('Sắp tới', 'Next')}</span>
                          <span>{t('Nhận qua ', 'Via ')}{deliveryChannel === 'email' ? 'Email' : 'SMS/Zalo'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Receipt & Pending Recipients */}
                    <div className="rounded-xl border border-[#202020]/12 dark:border-white/12 bg-white dark:bg-[#0E1512] p-3.5 space-y-2.5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#202020]/10 dark:border-white/10">
                        <div>
                          <span className="text-[#202020]/60 dark:text-[#F1EFEA]/60 text-[11px] block">{t('Mã đơn hàng', 'Order Number')}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs sm:text-sm text-[#00552B] dark:text-[#C6A667]">
                              {checkoutResult.order.orderNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyText('order-no', checkoutResult.order.orderNumber)}
                              className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                              aria-label="Copy order number"
                            >
                              {copiedId === 'order-no' ? <Check className="w-3 h-3 text-[#00552B] dark:text-[#C6A667]" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[#202020]/60 dark:text-[#F1EFEA]/60 text-[11px] block">{t('Tổng thanh toán', 'Amount Paid')}</span>
                          <span className="font-mono font-bold text-xs sm:text-sm tabular-nums">{formatPrice(checkoutResult.order.total)}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="font-semibold text-[#202020]/80 dark:text-[#F1EFEA]/80 block">
                          {t(`Danh sách đợi nhận Code (${checkoutResult.dispatches.length}):`, `Recipients Awaiting Code (${checkoutResult.dispatches.length}):`)}
                        </span>
                        {checkoutResult.dispatches.map((d, idx) => (
                          <div
                            key={d.id}
                            className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-[#F8F5EF] dark:bg-[#16221C] border border-[#202020]/8 dark:border-white/10"
                          >
                            <div className="min-w-0">
                              <span className="font-semibold text-[#202020] dark:text-[#F1EFEA] block truncate">
                                {idx + 1}. {d.recipient_name} · {d.recipient_contact}
                              </span>
                              <span className="text-[10px] font-mono text-[#202020]/60 dark:text-[#F1EFEA]/60">
                                {d.delivery_channel === 'email' ? 'Email' : 'SMS / Zalo'} · {formatPrice(d.face_value_vnd)}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-[#C6A667]/20 text-[#7A5915] dark:text-[#C6A667]">
                              {t('Đợi cấp Code', 'Pending')}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#202020]/10 dark:border-white/10">
                        <button
                          type="button"
                          disabled={checkingCodeStatus}
                          onClick={handleRefreshDispatchStatus}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${checkingCodeStatus ? 'animate-spin' : ''}`} />
                          <span>{checkingCodeStatus ? t('Đang kiểm tra...', 'Checking...') : t('Kiểm tra trạng thái nhận Code', 'Check Code Status')}</span>
                        </button>
                        <div className="flex items-center gap-3 text-[11px] font-semibold">
                          <Link to={localePath('/orders/track')} onClick={onClose} className="text-[#00552B] dark:text-[#C6A667] hover:underline">
                            {t('Tra cứu đơn →', 'Track →')}
                          </Link>
                          {user && (
                            <Link to={localePath('/account?tab=vouchers')} onClick={onClose} className="text-[#00552B] dark:text-[#C6A667] hover:underline">
                              {t('Ví Voucher →', 'My Vouchers →')}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* CASE 3: QR Code Scan & Transfer Step */
                  <>
                    <div className="rounded-xl border border-[#202020]/15 dark:border-white/15 overflow-hidden bg-[#F8F5EF] dark:bg-[#0E1512]">
                      <div className="bg-[#00552B] text-white px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider">
                            {t('MÃ NỘP TIỀN ĐƯỢC CẤP THÀNH CÔNG', 'PAYMENT QR CODE ISSUED')}
                          </p>
                          <p className="text-[11px] text-white/80">
                            {t('Quét mã QR rồi bấm xác nhận bên dưới để hoàn tất', 'Scan QR and confirm transfer below')}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-black/25 px-2 py-0.5 rounded tabular-nums">
                          <Clock className="w-3 h-3 text-[#C6A667]" />
                          {t(`Còn ${countdownSec}s`, `${countdownSec}s`)}
                        </span>
                      </div>

                      <div className="p-3.5 grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
                        <div className="sm:col-span-5 flex flex-col items-center">
                          <div className="bg-white p-2.5 rounded-xl border-2 shadow-sm" style={{ borderColor: activePayMeta.accent }}>
                            <svg viewBox="0 0 21 21" className="w-32 h-32 block" aria-label="Payment QR">
                              <rect width="21" height="21" fill="#FFFFFF" />
                              {qrMatrix.map((row, r) =>
                                row.map((on, c) =>
                                  on ? (
                                    <rect
                                      key={`${r}-${c}`}
                                      x={c}
                                      y={r}
                                      width="1"
                                      height="1"
                                      fill={r < 7 && c < 7 ? activePayMeta.accent : '#111111'}
                                    />
                                  ) : null
                                )
                              )}
                              <rect x="8.3" y="8.3" width="4.4" height="4.4" rx="0.6" fill={activePayMeta.accent} />
                              <text x="10.5" y="11.15" textAnchor="middle" fill="#FFFFFF" fontSize="1.65" fontWeight="700" fontFamily="sans-serif">
                                ROAR
                              </text>
                            </svg>
                          </div>
                        </div>

                        <div className="sm:col-span-7 space-y-2 text-xs">
                          <div className="bg-white dark:bg-[#16221C] rounded-lg p-2.5 border border-[#202020]/10 dark:border-white/10 space-y-1">
                            <div className="flex justify-between gap-2">
                              <span className="opacity-70">{t('Mã đơn:', 'Order:')}</span>
                              <span className="font-mono font-bold">{checkoutResult.order.orderNumber}</span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span className="opacity-70">{t('Kênh:', 'Provider:')}</span>
                              <span className="font-semibold text-right">{lang === 'vi' ? activePayMeta.bankVi : activePayMeta.bankEn}</span>
                            </div>
                            {activePayMeta.accountNumber && (
                              <div className="flex justify-between items-center gap-2">
                                <span className="opacity-70">{t('Số TK:', 'Account:')}</span>
                                <button
                                  type="button"
                                  onClick={() => copyText('acct', activePayMeta.accountNumber)}
                                  className="inline-flex items-center gap-1 font-mono font-bold text-[#00552B] dark:text-[#C6A667] cursor-pointer"
                                >
                                  {activePayMeta.accountNumber}
                                  {copiedId === 'acct' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            )}
                            <div className="flex justify-between items-center gap-2">
                              <span className="opacity-70">{t('Nội dung:', 'Memo:')}</span>
                              <button
                                type="button"
                                onClick={() => copyText('memo', `ROAR ${checkoutResult.order.orderNumber}`)}
                                className="inline-flex items-center gap-1 font-mono font-bold text-[#00552B] dark:text-[#C6A667] cursor-pointer"
                              >
                                ROAR {checkoutResult.order.orderNumber}
                                {copiedId === 'memo' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                            <div className="flex justify-between items-center gap-2 pt-1 border-t border-[#202020]/10 dark:border-white/10">
                              <span className="opacity-70">{t('Số tiền:', 'Amount:')}</span>
                              <span className="font-mono font-bold text-sm text-[#00552B] dark:text-[#C6A667] tabular-nums">
                                {formatPrice(checkoutResult.order.total)}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <input
                              type="text"
                              value={txRef}
                              onChange={(e) => setTxRef(e.target.value)}
                              placeholder={t('Mã tham chiếu giao dịch (tùy chọn)', 'Bank / wallet ref (optional)')}
                              className="w-full bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                            />
                            <button
                              type="button"
                              disabled={confirmingTx}
                              onClick={handleConfirmQrPayment}
                              className="w-full py-2 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white font-bold cursor-pointer disabled:opacity-50"
                            >
                              {confirmingTx
                                ? t('Đang xác nhận hoàn tất...', 'Confirming...')
                                : t('Tôi đã quét mã / chuyển khoản xong →', 'I Have Completed QR / Transfer →')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Preview of pending recipients */}
                    <div className="rounded-xl border border-[#202020]/12 dark:border-white/12 p-3 space-y-1.5 text-xs bg-white dark:bg-[#0E1512]">
                      <p className="font-bold flex items-center gap-1.5 text-[#202020] dark:text-[#F1EFEA]">
                        <Gift className="w-3.5 h-3.5 text-[#00552B] dark:text-[#C6A667]" />
                        <span>
                          {t(
                            `Người nhận đợi cấp mã (${checkoutResult.dispatches.length}):`,
                            `Recipients awaiting code (${checkoutResult.dispatches.length}):`
                          )}
                        </span>
                      </p>
                      <div className="space-y-1">
                        {checkoutResult.dispatches.map((d, idx) => (
                          <div key={d.id} className="flex items-center justify-between gap-2 py-1 border-b last:border-b-0 border-[#202020]/8 dark:border-white/10">
                            <span className="truncate">
                              {idx + 1}. {d.recipient_name} ({d.recipient_contact}) · {d.delivery_channel === 'email' ? 'Email' : 'SMS / Zalo'}
                            </span>
                            <span className="font-mono text-[11px] text-[#202020]/55 dark:text-[#F1EFEA]/55 shrink-0">
                              ROAR-GIFT-••••-••••
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            </div>

            {/* Always-Visible Pinned Footer CTA Row */}
            <div className="shrink-0 px-3.5 sm:px-5 py-3 border-t border-[#202020]/10 dark:border-white/10 bg-white dark:bg-[#131E18] space-y-2">
              {stepError && (
                <p className="text-xs font-medium text-red-700 dark:text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  {stepError}
                </p>
              )}

              {step === 1 && (
                <button
                  type="button"
                  onClick={goToStep2}
                  className="w-full py-2.5 rounded-full bg-[#00552B] hover:bg-[#003D25] text-white font-bold text-sm tracking-wide transition-colors cursor-pointer"
                >
                  {t('Tiếp tục →', 'Continue →')}
                </button>
              )}

              {step === 2 && (
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setStepError('');
                      setStep(1);
                    }}
                    className="px-4 py-2.5 rounded-full border border-[#202020]/20 dark:border-white/20 text-xs sm:text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer whitespace-nowrap"
                  >
                    ← {t('Quay lại', 'Back')}
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleCheckoutSubmit}
                    className="flex-1 py-2.5 rounded-full bg-[#00552B] hover:bg-[#003D25] text-white font-bold text-sm tracking-wider uppercase transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? t('ĐANG XỬ LÝ...', 'PROCESSING...') : t('THANH TOÁN', 'PAY NOW')}
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutResult(null);
                      setPaymentSubmittedNote(false);
                      setShowNewMemberPopup(false);
                      setTxRef('');
                      setStepError('');
                      setStep(1);
                    }}
                    className="px-4 py-2 rounded-full border border-[#00552B] dark:border-[#C6A667] text-[#00552B] dark:text-[#C6A667] text-xs font-semibold hover:bg-[#00552B]/5 cursor-pointer"
                  >
                    {t('Mua / Tặng thêm Voucher khác', 'Buy / Gift Another Voucher')}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 rounded-full bg-[#202020] dark:bg-[#C6A667] text-white dark:text-[#111111] text-xs font-bold cursor-pointer"
                  >
                    {t('Hoàn tất & Đóng', 'Done & Close')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Celebratory Popup for Newly Created ROAR Club Members */}
      {showNewMemberPopup && checkoutResult?.membership?.isNewMember && (
        <div
          className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            setShowNewMemberPopup(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label={t('Chào mừng thành viên mới ROAR CLUB', 'Welcome New ROAR CLUB Member')}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#131E18] text-[#202020] dark:text-[#F1EFEA] border border-[#C6A667]/50 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-[#004624] via-[#00552B] to-[#0B2217] text-white p-6 text-center relative">
              <button
                type="button"
                onClick={() => setShowNewMemberPopup(false)}
                aria-label={t('Đóng thông báo', 'Close welcome modal')}
                className="absolute right-3.5 top-3.5 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-14 h-14 rounded-full bg-[#C6A667] text-[#111111] flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Award className="w-7 h-7" />
              </div>
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#C6A667] font-bold">
                {t('CHÀO MỪNG THÀNH VIÊN MỚI · ROAR CLUB', 'WELCOME NEW MEMBER · ROAR CLUB')}
              </p>
              <h3 className="text-xl font-bold mt-1.5 leading-snug">
                {t(
                  `Chúc mừng ${checkoutResult.membership.fullName || senderName} đã là Thành viên ROAR!`,
                  `Congratulations ${checkoutResult.membership.fullName || senderName} on joining ROAR CLUB!`
                )}
              </h3>
              <p className="text-xs text-white/85 mt-1.5 leading-relaxed">
                {t(
                  'Hệ thống đã tự động khởi tạo thẻ thành viên của bạn qua số điện thoại / email đặt hàng cùng quà chào mừng.',
                  'Your membership card has been automatically created using your contact details with a welcome reward.'
                )}
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div className="rounded-xl bg-[#FAF8F4] dark:bg-[#0E1512] border border-[#C6A667]/35 p-3.5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Mã thành viên:', 'Member Code:')}</span>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        'new-member-code',
                        checkoutResult.membership?.memberCode || '',
                        t('Đã sao chép mã thành viên!', 'Member code copied!')
                      )
                    }
                    className="inline-flex items-center gap-1.5 font-mono font-bold text-sm text-[#00552B] dark:text-[#C6A667] cursor-pointer"
                  >
                    <span>{checkoutResult.membership.memberCode}</span>
                    {copiedId === 'new-member-code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Hạng thành viên:', 'Tier:')}</span>
                  <span className="font-bold text-[#00552B] dark:text-[#C6A667]">
                    {checkoutResult.membership.tier || 'ROAR Member'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#202020]/10 dark:border-white/10">
                  <span className="text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Quà tặng chào mừng:', 'Welcome Gift:')}</span>
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-[#00552B] dark:text-[#C6A667] tabular-nums">
                    <Sparkles className="w-3.5 h-3.5 text-[#C6A667]" />
                    +{checkoutResult.membership.welcomePoints || 50} {t('Điểm ROAR', 'ROAR Points')}
                  </span>
                </div>
              </div>

              <ul className="space-y-1.5 text-xs text-[#202020]/80 dark:text-[#F1EFEA]/80">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00552B] dark:text-[#C6A667] shrink-0 mt-0.5" />
                  <span>{t('Tích lũy điểm ROAR và theo dõi mã E-Voucher ngay trong Ví Voucher của tôi.', 'Earn ROAR points and manage E-Vouchers anytime in My Vouchers.')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00552B] dark:text-[#C6A667] shrink-0 mt-0.5" />
                  <span>{t('Nhận ưu đãi độc quyền & mã giảm giá dành riêng cho thành viên ROAR.', 'Unlock member-only deals and birthday rewards.')}</span>
                </li>
              </ul>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Link
                  to={localePath('/account?tab=vouchers')}
                  onClick={() => {
                    setShowNewMemberPopup(false);
                    onClose();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-full bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-bold text-center transition-colors"
                >
                  {t('Xem Ví Voucher & Quyền lợi →', 'View My Vouchers & Perks →')}
                </Link>
                <button
                  type="button"
                  onClick={() => setShowNewMemberPopup(false)}
                  className="py-2.5 px-4 rounded-full border border-[#202020]/20 dark:border-white/20 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                >
                  {t('Tuyệt vời, Xem đơn hàng', 'Awesome, View Order')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
