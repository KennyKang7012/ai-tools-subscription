import { CalendarClock, Cpu, DollarSign, TrendingUp } from 'lucide-react';
import type { Currency, SubscriptionItem } from '../types/subscription';
import {
  formatCurrency,
  getDaysUntilBilling,
  getMonthlyCostInDisplayCurrency,
  getMonthlyNativePrice,
} from '../utils/currency';

interface KpiGridProps {
  items: SubscriptionItem[];
  displayCurrency: Currency;
  exchangeRate: number;
}

export function KpiGrid({ items, displayCurrency, exchangeRate }: KpiGridProps) {
  const activeItems = items.filter((item) => item.active);
  const pausedItems = items.filter((item) => !item.active);

  const totalMonthly = activeItems.reduce(
    (sum, item) => sum + getMonthlyCostInDisplayCurrency(item, displayCurrency, exchangeRate),
    0
  );

  const pausedSavingsMonthly = pausedItems.reduce(
    (sum, item) => sum + getMonthlyCostInDisplayCurrency(item, displayCurrency, exchangeRate),
    0
  );

  const usdNativeMonthly = activeItems
    .filter((i) => i.currency === 'USD')
    .reduce((sum, i) => sum + getMonthlyNativePrice(i), 0);

  const twdNativeMonthly = activeItems
    .filter((i) => i.currency === 'TWD')
    .reduce((sum, i) => sum + getMonthlyNativePrice(i), 0);

  const aiMonthly = activeItems
    .filter((i) => i.category === 'ai')
    .reduce(
      (sum, i) => sum + getMonthlyCostInDisplayCurrency(i, displayCurrency, exchangeRate),
      0
    );
  const aiSharePct = totalMonthly > 0 ? Math.round((aiMonthly / totalMonthly) * 100) : 0;

  // Highest single cost item
  const highestItem = [...activeItems].sort(
    (a, b) =>
      getMonthlyCostInDisplayCurrency(b, displayCurrency, exchangeRate) -
      getMonthlyCostInDisplayCurrency(a, displayCurrency, exchangeRate)
  )[0];

  // Next upcoming billing item
  const nextBillingItem = [...activeItems].sort(
    (a, b) => getDaysUntilBilling(a.billingDay) - getDaysUntilBilling(b.billingDay)
  )[0];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Card 1: Monthly Total */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/25 bg-slate-900/75 p-5 shadow-[0_0_25px_rgba(6,182,212,0.08)] backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium tracking-wider text-slate-400 uppercase">
            本月實付總支出
          </span>
          <div className="rounded-lg bg-cyan-500/15 p-2 text-cyan-400">
            <DollarSign className="h-4 w-4" />
          </div>
        </div>
        <div className="font-mono-nums mt-3 text-3xl font-bold tracking-tight text-white">
          {formatCurrency(totalMonthly, displayCurrency)}
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="rounded bg-slate-800/90 px-2 py-0.5 font-mono-nums text-cyan-300">
            USD {formatCurrency(usdNativeMonthly, 'USD')}
          </span>
          <span>+</span>
          <span className="rounded bg-slate-800/90 px-2 py-0.5 font-mono-nums text-amber-300">
            {formatCurrency(twdNativeMonthly, 'TWD')}
          </span>
        </div>
      </div>

      {/* Card 2: Annual Projection & Savings */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/75 p-5 backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium tracking-wider text-slate-400 uppercase">
            年度支出推估 (×12)
          </span>
          <div className="rounded-lg bg-violet-500/15 p-2 text-violet-400">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <div className="font-mono-nums mt-3 text-3xl font-bold tracking-tight text-white">
          {formatCurrency(totalMonthly * 12, displayCurrency)}
        </div>
        <div className="mt-2.5 text-xs text-slate-400">
          {pausedItems.length > 0 ? (
            <span className="text-emerald-400">
              已暫停 {pausedItems.length} 項 · 月省{' '}
              <span className="font-mono-nums font-semibold">
                {formatCurrency(pausedSavingsMonthly, displayCurrency)}
              </span>
            </span>
          ) : (
            <span>目前所有訂閱項目皆為啟用狀態</span>
          )}
        </div>
      </div>

      {/* Card 3: AI Share & Active Count */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/75 p-5 backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium tracking-wider text-slate-400 uppercase">
            AI 工具支出佔比
          </span>
          <div className="rounded-lg bg-emerald-500/15 p-2 text-emerald-400">
            <Cpu className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono-nums text-3xl font-bold tracking-tight text-white">
            {aiSharePct}%
          </span>
          <span className="font-mono-nums text-xs text-slate-400">
            ({formatCurrency(aiMonthly, displayCurrency)}/月)
          </span>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-500"
            style={{ width: `${aiSharePct}%` }}
          />
        </div>
      </div>

      {/* Card 4: Highest Cost & Next Billing */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/75 p-5 backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium tracking-wider text-slate-400 uppercase">
            最高單項 & 近期扣款
          </span>
          <div className="rounded-lg bg-amber-500/15 p-2 text-amber-400">
            <CalendarClock className="h-4 w-4" />
          </div>
        </div>
        {highestItem ? (
          <>
            <div className="mt-3 flex items-baseline justify-between gap-2">
              <span className="truncate text-lg font-bold text-white">
                {highestItem.name}
              </span>
              <span className="font-mono-nums shrink-0 text-sm font-semibold text-amber-300">
                {formatCurrency(
                  getMonthlyCostInDisplayCurrency(highestItem, displayCurrency, exchangeRate),
                  displayCurrency
                )}
              </span>
            </div>
            <div className="mt-2.5 text-xs text-slate-400">
              {nextBillingItem && (
                <span>
                  最近扣款：<strong className="text-slate-200">{nextBillingItem.name}</strong>（
                  {getDaysUntilBilling(nextBillingItem.billingDay) === 0
                    ? '今天'
                    : `${getDaysUntilBilling(nextBillingItem.billingDay)} 天後`}
                  ，每月 {nextBillingItem.billingDay} 號）
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="mt-3 text-sm text-slate-500">尚無啟用中的訂閱項目</div>
        )}
      </div>
    </section>
  );
}
