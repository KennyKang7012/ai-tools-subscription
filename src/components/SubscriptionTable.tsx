import { useMemo, useState } from 'react';
import { ArrowUpDown, Edit3, Plus, Search, Trash2 } from 'lucide-react';
import {
  CATEGORY_META,
  type Category,
  type Currency,
  type SubscriptionItem,
} from '../types/subscription';
import {
  formatBillingScheduleLabel,
  formatCurrency,
  getMonthlyCostInDisplayCurrency,
  getMonthlyNativePrice,
} from '../utils/currency';

interface SubscriptionTableProps {
  items: SubscriptionItem[];
  displayCurrency: Currency;
  exchangeRate: number;
  onToggleActive: (id: string) => void;
  onEdit: (item: SubscriptionItem) => void;
  onDelete: (id: string) => void;
  onOpenAddModal: () => void;
}

type FilterTab = 'all' | Category;
type SortKey = 'costDesc' | 'costAsc' | 'billingDay' | 'name';

export function SubscriptionTable({
  items,
  displayCurrency,
  exchangeRate,
  onToggleActive,
  onEdit,
  onDelete,
  onOpenAddModal,
}: SubscriptionTableProps) {
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('costDesc');

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => (filterTab === 'all' ? true : item.category === filterTab))
      .filter((item) => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return (
          item.name.toLowerCase().includes(q) ||
          (item.notes?.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => {
        if (sortKey === 'costDesc') {
          return (
            getMonthlyCostInDisplayCurrency(b, displayCurrency, exchangeRate) -
            getMonthlyCostInDisplayCurrency(a, displayCurrency, exchangeRate)
          );
        }
        if (sortKey === 'costAsc') {
          return (
            getMonthlyCostInDisplayCurrency(a, displayCurrency, exchangeRate) -
            getMonthlyCostInDisplayCurrency(b, displayCurrency, exchangeRate)
          );
        }
        if (sortKey === 'billingDay') {
          return a.billingDay - b.billingDay;
        }
        return a.name.localeCompare(b.name, 'zh-Hant');
      });
  }, [items, filterTab, searchQuery, sortKey, displayCurrency, exchangeRate]);

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: `全部 (${items.length})` },
    { id: 'ai', label: `AI 工具 (${items.filter((i) => i.category === 'ai').length})` },
    {
      id: 'writing',
      label: `文章寫作 (${items.filter((i) => i.category === 'writing').length})`,
    },
    {
      id: 'media',
      label: `影音平台 (${items.filter((i) => i.category === 'media').length})`,
    },
    {
      id: 'other',
      label: `雲端與其他 (${items.filter((i) => i.category === 'other').length})`,
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/75 backdrop-blur">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-slate-800/80 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filterTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Sort */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-56 sm:flex-initial">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋工具名稱或備註..."
              className="w-full rounded-lg border border-slate-700/80 bg-slate-950/70 py-1.5 pr-3 pl-8 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500/60"
            />
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-950/70 px-2.5 py-1.5 text-xs text-slate-300">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              aria-label="排序方式"
              className="bg-transparent text-xs text-slate-200 outline-none"
            >
              <option value="costDesc" className="bg-slate-900">
                費用：高 → 低
              </option>
              <option value="costAsc" className="bg-slate-900">
                費用：低 → 高
              </option>
              <option value="billingDay" className="bg-slate-900">
                扣款日：1 → 31
              </option>
              <option value="name" className="bg-slate-900">
                名稱排序
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800/80 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              <th className="px-5 py-3">狀態</th>
              <th className="px-4 py-3">訂閱工具</th>
              <th className="px-4 py-3">分類</th>
              <th className="px-4 py-3">扣款週期</th>
              <th className="px-4 py-3 text-right">原幣計費</th>
              <th className="px-4 py-3 text-right">
                月均折合 ({displayCurrency})
              </th>
              <th className="px-5 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center">
                  <p className="text-sm text-slate-400">找不到符合條件的訂閱項目</p>
                  <button
                    type="button"
                    onClick={onOpenAddModal}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    新增一筆訂閱
                  </button>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const meta = CATEGORY_META[item.category];
                const monthlyNative = getMonthlyNativePrice(item);
                const monthlyDisplay = getMonthlyCostInDisplayCurrency(
                  item,
                  displayCurrency,
                  exchangeRate
                );

                return (
                  <tr
                    key={item.id}
                    className={`group transition hover:bg-slate-800/40 ${
                      !item.active ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Active Toggle */}
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={item.active}
                        onClick={() => onToggleActive(item.id)}
                        title={item.active ? '點擊暫停（模擬省錢）' : '點擊重新啟用'}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border transition-colors ${
                          item.active
                            ? 'border-emerald-500/50 bg-emerald-500/30'
                            : 'border-slate-700 bg-slate-800'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full transition-transform ${
                            item.active
                              ? 'translate-x-4 bg-emerald-400'
                              : 'translate-x-1 bg-slate-500'
                          }`}
                        />
                      </button>
                    </td>

                    {/* Name & Notes */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-100">{item.name}</div>
                      {item.notes && (
                        <div className="mt-0.5 max-w-xs truncate text-xs text-slate-400">
                          {item.notes}
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                    </td>

                    {/* Billing Schedule */}
                    <td className="px-4 py-3.5 text-xs text-slate-300">
                      <span className="font-mono-nums">{formatBillingScheduleLabel(item)}</span>
                    </td>

                    {/* Native Price */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="font-mono-nums text-xs font-medium text-slate-200">
                        {formatCurrency(item.price, item.currency)}
                        <span className="ml-1 text-[10px] text-slate-400">
                          /{item.billingCycle === 'yearly' ? '年' : '月'}
                        </span>
                      </div>
                      {item.billingCycle === 'yearly' && (
                        <div className="font-mono-nums text-[10px] text-cyan-400">
                          月均 {formatCurrency(monthlyNative, item.currency)}
                        </div>
                      )}
                    </td>

                    {/* Converted Display Cost */}
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-mono-nums text-sm font-bold text-white">
                        {formatCurrency(monthlyDisplay, displayCurrency)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          title="編輯"
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-cyan-300"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(item.id)}
                          title="刪除"
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-500/15 hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
