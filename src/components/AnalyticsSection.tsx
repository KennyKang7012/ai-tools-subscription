import { useState } from 'react';
import {
  CATEGORY_META,
  type Category,
  type Currency,
  type SubscriptionItem,
} from '../types/subscription';
import {
  formatBillingScheduleLabel,
  formatCurrency,
  getDaysUntilNextBilling,
  getMonthlyCostInDisplayCurrency,
} from '../utils/currency';

interface AnalyticsSectionProps {
  items: SubscriptionItem[];
  displayCurrency: Currency;
  exchangeRate: number;
}

const CATEGORIES: Category[] = ['ai', 'writing', 'media', 'other'];

export function AnalyticsSection({
  items,
  displayCurrency,
  exchangeRate,
}: AnalyticsSectionProps) {
  const [hoveredCat, setHoveredCat] = useState<Category | null>(null);
  const activeItems = items.filter((item) => item.active);

  const totalMonthly = activeItems.reduce(
    (sum, item) => sum + getMonthlyCostInDisplayCurrency(item, displayCurrency, exchangeRate),
    0
  );

  // Category breakdown
  const categoryTotals = CATEGORIES.map((cat) => {
    const catItems = activeItems.filter((i) => i.category === cat);
    const amount = catItems.reduce(
      (sum, i) => sum + getMonthlyCostInDisplayCurrency(i, displayCurrency, exchangeRate),
      0
    );
    const pct = totalMonthly > 0 ? (amount / totalMonthly) * 100 : 0;
    return {
      ...CATEGORY_META[cat],
      count: catItems.length,
      amount,
      pct,
    };
  });

  // Donut chart SVG math
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  // Currency split (USD converted vs TWD converted)
  const usdConvertedTotal = activeItems
    .filter((i) => i.currency === 'USD')
    .reduce(
      (sum, i) => sum + getMonthlyCostInDisplayCurrency(i, displayCurrency, exchangeRate),
      0
    );
  const twdConvertedTotal = totalMonthly - usdConvertedTotal;
  const usdSplitPct = totalMonthly > 0 ? (usdConvertedTotal / totalMonthly) * 100 : 0;
  const twdSplitPct = totalMonthly > 0 ? (twdConvertedTotal / totalMonthly) * 100 : 0;

  // Top 5 spenders
  const topSpenders = [...activeItems]
    .sort(
      (a, b) =>
        getMonthlyCostInDisplayCurrency(b, displayCurrency, exchangeRate) -
        getMonthlyCostInDisplayCurrency(a, displayCurrency, exchangeRate)
    )
    .slice(0, 5);
  const maxSpenderCost =
    topSpenders[0]
      ? getMonthlyCostInDisplayCurrency(topSpenders[0], displayCurrency, exchangeRate)
      : 1;

  // Upcoming billing radar (next 5; known dates sorted ascending, unknown yearly dates last)
  const upcomingBills = activeItems
    .map((item) => ({ item, daysLeft: getDaysUntilNextBilling(item) }))
    .sort((a, b) => {
      if (a.daysLeft === null && b.daysLeft === null) return 0;
      if (a.daysLeft === null) return 1;
      if (b.daysLeft === null) return -1;
      return a.daysLeft - b.daysLeft;
    })
    .slice(0, 5);

  const focusedCategory = hoveredCat
    ? categoryTotals.find((c) => c.id === hoveredCat)
    : null;

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Left: Category Donut Chart (4 cols) */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/75 p-5 backdrop-blur lg:col-span-4">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-slate-200">
            分類支出結構
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            懸停區塊可檢視各類別佔比
          </p>
        </div>

        <div className="my-4 flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
          <div className="relative flex h-40 w-40 shrink-0 items-center justify-center">
            <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke="#1e293b"
                strokeWidth="16"
              />
              {totalMonthly > 0 &&
                categoryTotals.map((cat) => {
                  if (cat.amount <= 0) return null;
                  const dashLength = (cat.pct / 100) * circumference;
                  const dashOffset = -cumulativeOffset;
                  cumulativeOffset += dashLength;
                  const isDimmed = hoveredCat !== null && hoveredCat !== cat.id;

                  return (
                    <circle
                      key={cat.id}
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="transparent"
                      stroke={cat.color}
                      strokeWidth={hoveredCat === cat.id ? '19' : '16'}
                      strokeDasharray={`${dashLength} ${circumference}`}
                      strokeDashoffset={dashOffset}
                      className="cursor-pointer transition-all duration-300"
                      style={{ opacity: isDimmed ? 0.3 : 1 }}
                      onMouseEnter={() => setHoveredCat(cat.id)}
                      onMouseLeave={() => setHoveredCat(null)}
                    />
                  );
                })}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] text-slate-400">
                {focusedCategory ? focusedCategory.label : '本月合計'}
              </span>
              <span className="font-mono-nums text-sm font-bold text-white">
                {focusedCategory
                  ? `${focusedCategory.pct.toFixed(0)}%`
                  : formatCurrency(totalMonthly, displayCurrency)}
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="w-full space-y-2">
            {categoryTotals.map((cat) => (
              <div
                key={cat.id}
                onMouseEnter={() => setHoveredCat(cat.id)}
                onMouseLeave={() => setHoveredCat(null)}
                className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1 text-xs transition hover:bg-slate-800/70"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-slate-300">{cat.label}</span>
                  <span className="text-[11px] text-slate-500">({cat.count})</span>
                </div>
                <div className="font-mono-nums text-right">
                  <span className="font-semibold text-slate-200">
                    {formatCurrency(cat.amount, displayCurrency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* USD vs TWD Split Bar */}
        <div className="border-t border-slate-800/80 pt-3">
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-400">
            <span>計價幣別比例</span>
            <span className="font-mono-nums">
              USD {usdSplitPct.toFixed(0)}% / TWD {twdSplitPct.toFixed(0)}%
            </span>
          </div>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="bg-cyan-400 transition-all duration-500"
              style={{ width: `${usdSplitPct}%` }}
              title={`美金計價佔 ${usdSplitPct.toFixed(1)}%`}
            />
            <div
              className="bg-amber-400 transition-all duration-500"
              style={{ width: `${twdSplitPct}%` }}
              title={`台幣計價佔 ${twdSplitPct.toFixed(1)}%`}
            />
          </div>
        </div>
      </div>

      {/* Middle: Top Spenders Ranking (4 cols) */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/75 p-5 backdrop-blur lg:col-span-4">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-slate-200">
            支出排行 Top 5
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            單月攤提成本最高之啟用項目
          </p>
        </div>

        <div className="mt-4 flex-1 space-y-3.5">
          {topSpenders.length === 0 ? (
            <div className="flex h-36 items-center justify-center text-xs text-slate-500">
              尚無啟用中的訂閱項目
            </div>
          ) : (
            topSpenders.map((item, idx) => {
              const cost = getMonthlyCostInDisplayCurrency(
                item,
                displayCurrency,
                exchangeRate
              );
              const barPct = maxSpenderCost > 0 ? (cost / maxSpenderCost) * 100 : 0;
              const meta = CATEGORY_META[item.category];

              return (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono-nums text-[11px] font-bold text-slate-500">
                        0{idx + 1}
                      </span>
                      <span className="truncate font-medium text-slate-200">
                        {item.name}
                      </span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                        {item.currency}
                      </span>
                    </div>
                    <span className="font-mono-nums shrink-0 font-semibold text-slate-200">
                      {formatCurrency(cost, displayCurrency)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/90">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${barPct}%`,
                        backgroundColor: meta.color,
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right: Billing Radar (4 cols) */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/75 p-5 backdrop-blur lg:col-span-4">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-slate-200">
            扣款雷達（Upcoming）
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            依下次扣款日排序，顯示單次實際扣款金額
          </p>
        </div>

        <div className="mt-4 flex-1 space-y-2.5">
          {upcomingBills.length === 0 ? (
            <div className="flex h-36 items-center justify-center text-xs text-slate-500">
              尚無即將扣款項目
            </div>
          ) : (
            upcomingBills.map(({ item, daysLeft }) => {
              const isSoon = daysLeft !== null && daysLeft <= 3;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800/90 bg-slate-950/50 px-3 py-2.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg border text-center ${
                        isSoon
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                          : 'border-slate-700/80 bg-slate-800/70 text-slate-300'
                      }`}
                    >
                      {item.billingCycle === 'yearly' && item.billingMonth ? (
                        <>
                          <span className="font-mono-nums text-[10px] font-bold leading-none">
                            {item.billingMonth}/{item.billingDay}
                          </span>
                          <span className="text-[9px] leading-tight opacity-75">年</span>
                        </>
                      ) : (
                        <>
                          <span className="font-mono-nums text-xs font-bold leading-none">
                            {item.billingDay}
                          </span>
                          <span className="text-[9px] leading-tight opacity-75">
                            {item.billingCycle === 'yearly' ? '年?' : '日'}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-slate-200">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {daysLeft === null ? (
                          <span className="text-slate-400">
                            {formatBillingScheduleLabel(item)}
                          </span>
                        ) : daysLeft === 0 ? (
                          <span className="font-medium text-amber-300">今日扣款</span>
                        ) : (
                          <span>{daysLeft} 天後扣款</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    <div className="font-mono-nums text-xs font-semibold text-white">
                      {formatCurrency(item.price, item.currency)}
                      <span className="ml-0.5 text-[10px] font-normal text-slate-400">
                        /{item.billingCycle === 'yearly' ? '年' : '月'}
                      </span>
                    </div>
                    {item.currency === 'USD' && (
                      <div className="font-mono-nums text-[10px] text-slate-400">
                        ≈ {formatCurrency(item.price * exchangeRate, 'TWD')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
