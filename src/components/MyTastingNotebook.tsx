import React, { useEffect, useMemo, useState } from 'react';
import { BookMarked, Coffee, Plus, Sparkles, Star, Trash2 } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { useStore } from '../context/StoreContext';

export interface TastingEntry {
  id: string;
  coffeeName: string;
  method: string;
  ratio: string;
  grindAndTemp: string;
  rating: number;
  notes: string;
  createdAt: string;
}

const BREW_METHODS = [
  'Phin Truyền Thống',
  'Pour-Over V60',
  'Espresso',
  'Cold Brew',
  'Moka Pot',
  'French Press',
];

const QUICK_TEMPLATES: Array<Omit<TastingEntry, 'id' | 'createdAt'>> = [
  {
    coffeeName: 'ROAR Robusta Sẻ Honey · Đắk Nông',
    method: 'Phin Truyền Thống',
    ratio: '25g / 90ml',
    grindAndTemp: 'Xay vừa-thô · 94°C · Ủ 45 giây',
    rating: 5,
    notes: 'Sô-cô-la đen, hậu ngọt mật ong kéo dài, crema dày mượt khi uống cùng 20ml sữa đặc.',
  },
  {
    coffeeName: 'ROAR Arabica Cầu Đất Washed',
    method: 'Pour-Over V60',
    ratio: '15g / 240ml (1:16)',
    grindAndTemp: 'Xay vừa-mịn · 92°C · 2:45',
    rating: 5,
    notes: 'Hương hoa cam, cam chín thanh, hậu vị trà xanh ngọt sạch, rất hợp buổi sáng chill.',
  },
];

export const MyTastingNotebook: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { t } = useI18n();
  const { user, showToast } = useStore();

  const storageKey = useMemo(
    () => `roar_tasting_notebook_v1_${user?.id ? String(user.id) : 'guest'}`,
    [user?.id]
  );

  const [entries, setEntries] = useState<TastingEntry[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [coffeeName, setCoffeeName] = useState('');
  const [method, setMethod] = useState(BREW_METHODS[0]);
  const [ratio, setRatio] = useState('25g / 90ml');
  const [grindAndTemp, setGrindAndTemp] = useState('Xay vừa · 93°C');
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setEntries(parsed);
          return;
        }
      }
    } catch {
      // Ignore storage read errors
    }
    setEntries([]);
  }, [storageKey]);

  const persist = (next: TastingEntry[]) => {
    setEntries(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Ignore quota errors
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = coffeeName.trim();
    if (!cleanName) {
      showToast(t('Vui lòng nhập tên loại cà phê', 'Please enter a coffee name'));
      return;
    }
    const item: TastingEntry = {
      id: `tn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      coffeeName: cleanName.slice(0, 120),
      method: method.slice(0, 40),
      ratio: ratio.trim().slice(0, 40) || '1:15',
      grindAndTemp: grindAndTemp.trim().slice(0, 80),
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      notes: notes.trim().slice(0, 400),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    persist([item, ...entries].slice(0, 40));
    setCoffeeName('');
    setNotes('');
    setFormOpen(false);
    showToast(t('Đã lưu công thức vào Sổ Tay Hương Vị', 'Saved recipe to your Tasting Notebook'));
  };

  const handleLoadTemplate = (tpl: Omit<TastingEntry, 'id' | 'createdAt'>) => {
    const item: TastingEntry = {
      ...tpl,
      id: `tn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    persist([item, ...entries].slice(0, 40));
    showToast(t('Đã thêm công thức mẫu vào sổ tay', 'Added starter recipe to notebook'));
  };

  const handleDelete = (id: string) => {
    persist(entries.filter((e) => e.id !== id));
  };

  const displayedEntries = compact ? entries.slice(0, 4) : entries;

  return (
    <section className="rounded-2xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#00552B] dark:text-[#C6A667] flex items-center gap-1.5">
            <BookMarked className="w-3.5 h-3.5" />
            <span>{t('Sổ Tay Pha Chế & Thử Nếm Cá Nhân', 'Personal Brew & Tasting Notebook')}</span>
          </p>
          <h2 className="text-lg sm:text-xl font-bold text-[#202020] dark:text-[#F1EFEA]">
            {t('Lưu Lại Công Thức Cà Phê Hợp Gu Nhất Của Bạn', 'Log Your Dial-In Coffee Recipes')}
          </h2>
          <p className="text-xs text-[#202020]/70 dark:text-[#F1EFEA]/70">
            {t(
              'Ghi chú liều lượng, nhiệt nước, cỡ xay và cảm nhận hương vị mỗi lần pha — lưu an toàn ngay trên trình duyệt để bạn quay lại xem bất kỳ lúc nào.',
              'Record dose, temperature, grind, and tasting notes for every brew — saved locally so you can dial in your perfect cup.'
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-semibold shrink-0 cursor-pointer transition-colors whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{formOpen ? t('Đóng biểu mẫu', 'Close Form') : t('Ghi chép ly mới', 'New Tasting Log')}</span>
        </button>
      </div>

      {formOpen && (
        <form
          onSubmit={handleAdd}
          className="rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#00552B]/20 dark:border-[#C6A667]/25 p-4 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <label className="block space-y-1 sm:col-span-2">
              <span className="font-semibold text-[#202020]/80 dark:text-[#F1EFEA]/80">
                {t('Tên loại cà phê / Lô rang *', 'Coffee Bean / Roast Lot *')}
              </span>
              <input
                type="text"
                required
                value={coffeeName}
                onChange={(e) => setCoffeeName(e.target.value)}
                placeholder={t('VD: ROAR Robusta Sẻ Honey · Mẻ rang mới', 'e.g., ROAR Cau Dat Arabica Washed')}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15"
              />
            </label>

            <label className="block space-y-1">
              <span className="font-semibold text-[#202020]/80 dark:text-[#F1EFEA]/80">
                {t('Phương pháp pha', 'Brew Method')}
              </span>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15"
              >
                {BREW_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="font-semibold text-[#202020]/80 dark:text-[#F1EFEA]/80">
                {t('Tỷ lệ / Liều lượng', 'Dose / Ratio')}
              </span>
              <input
                type="text"
                value={ratio}
                onChange={(e) => setRatio(e.target.value)}
                placeholder="25g / 90ml"
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15 font-mono"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="block space-y-1">
              <span className="font-semibold text-[#202020]/80 dark:text-[#F1EFEA]/80">
                {t('Cỡ xay · Nhiệt nước · Thời gian', 'Grind · Temp · Brew Time')}
              </span>
              <input
                type="text"
                value={grindAndTemp}
                onChange={(e) => setGrindAndTemp(e.target.value)}
                placeholder={t('Xay vừa · 93°C · 4 phút nhỏ giọt', 'Medium grind · 93°C · 4 min')}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15"
              />
            </label>

            <div className="space-y-1">
              <span className="font-semibold text-[#202020]/80 dark:text-[#F1EFEA]/80 block">
                {t('Độ ưng ý (1–5 sao)', 'Satisfaction Rating')}
              </span>
              <div className="flex items-center gap-1.5 py-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 cursor-pointer"
                    aria-label={`${star} stars`}
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= rating
                          ? 'fill-[#C6A667] text-[#C6A667]'
                          : 'text-[#202020]/25 dark:text-white/25'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-mono font-bold text-[#00552B] dark:text-[#C6A667] ml-1 tabular-nums">
                  {rating}/5
                </span>
              </div>
            </div>
          </div>

          <label className="block space-y-1 text-xs">
            <span className="font-semibold text-[#202020]/80 dark:text-[#F1EFEA]/80">
              {t('Cảm nhận hương vị & điều chỉnh lần sau', 'Tasting Notes & Next Dial-In Adjustment')}
            </span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t(
                'VD: Hậu ngọt cacao rất rõ, lần sau thử giảm nước xuống 85ml để đậm hơn một chút...',
                'e.g., Rich dark cacao finish, next time grind slightly finer for extra sweetness...'
              )}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15"
            />
          </label>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 text-xs font-medium cursor-pointer"
            >
              {t('Hủy', 'Cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-semibold cursor-pointer"
            >
              {t('Lưu vào sổ tay', 'Save Entry')}
            </button>
          </div>
        </form>
      )}

      {displayedEntries.length === 0 ? (
        <div className="rounded-xl bg-[#F8F5EF]/75 dark:bg-[#0E1512] border border-dashed border-[#202020]/15 dark:border-white/15 p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#202020] dark:text-[#F1EFEA]">
            <Coffee className="w-4 h-4 text-[#00552B] dark:text-[#C6A667]" />
            <span>
              {t(
                'Sổ tay đang trống — bắt đầu bằng 1 công thức mẫu chuẩn Barista ROAR:',
                'Your notebook is empty — try adding a ROAR Barista starter recipe:'
              )}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {QUICK_TEMPLATES.map((tpl) => (
              <button
                key={tpl.coffeeName}
                type="button"
                onClick={() => handleLoadTemplate(tpl)}
                className="text-left p-3 rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 hover:border-[#00552B] dark:hover:border-[#C6A667] transition-colors cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#202020] dark:text-[#F1EFEA] truncate">
                    {tpl.coffeeName}
                  </span>
                  <span className="text-[10px] font-mono text-[#00552B] dark:text-[#C6A667] shrink-0 inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {t('Thêm mẫu', 'Use')}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-[#202020]/65 dark:text-[#F1EFEA]/65">
                  {tpl.method} · {tpl.ratio}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {displayedEntries.map((item) => (
            <div
              key={item.id}
              className="rounded-xl bg-[#F8F5EF]/75 dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 p-4 flex flex-col justify-between gap-2.5"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA] leading-snug">
                      {item.coffeeName}
                    </p>
                    <p className="text-[11px] font-mono text-[#00552B] dark:text-[#C6A667] mt-0.5">
                      {item.method} · {item.ratio}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    title={t('Xóa ghi chép', 'Remove log')}
                    className="p-1 text-[#202020]/40 dark:text-[#F1EFEA]/40 hover:text-red-600 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {item.grindAndTemp && (
                  <p className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65">{item.grindAndTemp}</p>
                )}

                {item.notes && (
                  <p className="text-xs text-[#202020]/85 dark:text-[#F1EFEA]/85 leading-relaxed">
                    {item.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#202020]/8 dark:border-white/10 text-[11px]">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= item.rating ? 'fill-[#C6A667] text-[#C6A667]' : 'text-[#202020]/20 dark:text-white/20'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-mono text-[#202020]/50 dark:text-[#F1EFEA]/50 tabular-nums">
                  {item.createdAt}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
