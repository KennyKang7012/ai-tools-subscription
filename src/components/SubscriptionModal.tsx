import { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { QUICK_TEMPLATES, type QuickTemplate } from '../data/presets';
import {
  CATEGORY_META,
  type BillingCycle,
  type Category,
  type Currency,
  type SubscriptionItem,
} from '../types/subscription';
import { buildSubscriptionFormData, type SubscriptionFormData } from '../utils/subscriptionHelpers';

interface SubscriptionModalProps {
  isOpen: boolean;
  editingItem: SubscriptionItem | null;
  onClose: () => void;
  onSave: (data: SubscriptionFormData, existingId?: string) => void;
}

export function SubscriptionModal({
  isOpen,
  editingItem,
  onClose,
  onSave,
}: SubscriptionModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('ai');
  const [price, setPrice] = useState('20');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [billingMonth, setBillingMonth] = useState<string>('');
  const [billingDay, setBillingDay] = useState('1');
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (editingItem) {
      setName(editingItem.name);
      setCategory(editingItem.category);
      setPrice(String(editingItem.price));
      setCurrency(editingItem.currency);
      setBillingCycle(editingItem.billingCycle);
      setBillingMonth(editingItem.billingMonth ? String(editingItem.billingMonth) : '');
      setBillingDay(String(editingItem.billingDay));
      setActive(editingItem.active);
      setNotes(editingItem.notes ?? '');
    } else {
      setName('');
      setCategory('ai');
      setPrice('20');
      setCurrency('USD');
      setBillingCycle('monthly');
      setBillingMonth('');
      setBillingDay('1');
      setActive(true);
      setNotes('');
    }
  }, [isOpen, editingItem]);

  if (!isOpen) return null;

  const applyTemplate = (tpl: QuickTemplate) => {
    setName(tpl.name);
    setCategory(tpl.category);
    setPrice(String(tpl.price));
    setCurrency(tpl.currency);
    setBillingCycle(tpl.billingCycle);
    if (tpl.notes) setNotes(tpl.notes);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = parseFloat(price);
    const numericDay = Math.min(31, Math.max(1, parseInt(billingDay, 10) || 1));
    const parsedMonth = billingMonth ? parseInt(billingMonth, 10) : undefined;
    if (!name.trim() || Number.isNaN(numericPrice) || numericPrice < 0) return;

    onSave(
      buildSubscriptionFormData({
        name,
        category,
        price: numericPrice,
        currency,
        billingCycle,
        billingDay: numericDay,
        billingMonth: parsedMonth,
        active,
        notes,
      }),
      editingItem?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700/80 bg-[#0D1322] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-base font-bold text-white">
            {editingItem ? '編輯訂閱項目' : '新增訂閱項目'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Templates (only when adding) */}
        {!editingItem && (
          <div className="mt-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              一鍵帶入常見工具
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.name}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-200"
                >
                  {tpl.name} ({tpl.currency === 'USD' ? `$${tpl.price}` : `NT$${tpl.price}`})
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-300">
                工具 / 平台名稱 *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：ChatGPT Plus、YouTube Premium"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">
                分類
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
              >
                {Object.values(CATEGORY_META).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">
                {billingCycle === 'yearly' ? '扣款日 (1-31)' : '每月扣款日 (1-31)'}
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={billingDay}
                onChange={(e) => setBillingDay(e.target.value)}
                className="font-mono-nums w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
              />
            </div>

            {billingCycle === 'yearly' && (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  年繳扣款月份（選填，設定後可顯示精確扣款倒數）
                </label>
                <select
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                >
                  <option value="">未指定月份（不顯示倒數）</option>
                  {Array.from({ length: 12 }, (_, idx) => idx + 1).map((m) => (
                    <option key={m} value={String(m)}>
                      每年 {m} 月
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">
                金額 *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="font-mono-nums w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  幣別
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-white outline-none focus:border-cyan-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="TWD">TWD (NT$)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  週期
                </label>
                <select
                  value={billingCycle}
                  onChange={(e) => {
                    const nextCycle = e.target.value as BillingCycle;
                    setBillingCycle(nextCycle);
                    if (nextCycle === 'monthly') {
                      setBillingMonth('');
                    }
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-white outline-none focus:border-cyan-500"
                >
                  <option value="monthly">月繳</option>
                  <option value="yearly">年繳</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-300">
                備註（選填）
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="例如：家庭方案分攤、開發主力工具..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
              />
              啟用並計入本月總支出
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
              >
                取消
              </button>
              <button
                type="submit"
                className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                {editingItem ? '儲存變更' : '加入戰情室'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
