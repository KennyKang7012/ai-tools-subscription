import { useRef, useState } from 'react';
import {
  Activity,
  Download,
  Plus,
  RefreshCw,
  RotateCcw,
  Upload,
} from 'lucide-react';
import type { Currency } from '../types/subscription';

interface HeaderBarProps {
  exchangeRate: number;
  onExchangeRateChange: (rate: number) => void;
  displayCurrency: Currency;
  onDisplayCurrencyChange: (currency: Currency) => void;
  onOpenAddModal: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onResetPresets: () => void;
  activeCount: number;
  totalCount: number;
}

export function HeaderBar({
  exchangeRate,
  onExchangeRateChange,
  displayCurrency,
  onDisplayCurrencyChange,
  onOpenAddModal,
  onExportJson,
  onImportJson,
  onResetPresets,
  activeCount,
  totalCount,
}: HeaderBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fetchingRate, setFetchingRate] = useState(false);
  const [rateHint, setRateHint] = useState<string | null>(null);

  const handleFetchLiveRate = async () => {
    setFetchingRate(true);
    setRateHint(null);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      const twd = data?.rates?.TWD;
      if (typeof twd === 'number' && twd > 0) {
        onExchangeRateChange(Number(twd.toFixed(2)));
        setRateHint('已更新即時匯率');
      } else {
        setRateHint('匯率格式異常');
      }
    } catch {
      setRateHint('離線或無法連線，請手動輸入');
    } finally {
      setFetchingRate(false);
      setTimeout(() => setRateHint(null), 3000);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#070B14]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3.5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Brand & War Room Status */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.18)]">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                  訂閱戰情室
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  LIVE · {activeCount}/{totalCount} 啟用
                </span>
              </div>
              <p className="text-xs text-slate-400">
                AI 工具 · 文章寫作 · 影音平台 · USD / TWD 雙幣別即時監控
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Exchange Rate Input */}
          <div className="relative flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/90 px-2.5 py-1.5 text-xs">
            <span className="text-slate-400">1 USD =</span>
            <input
              type="number"
              step="0.1"
              min="1"
              value={exchangeRate}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!Number.isNaN(v) && v > 0) onExchangeRateChange(v);
              }}
              aria-label="USD 兌 TWD 匯率"
              className="font-mono-nums w-14 rounded bg-slate-800 px-1.5 py-0.5 text-center font-semibold text-cyan-300 outline-none ring-1 ring-slate-700 focus:ring-cyan-500"
            />
            <span className="text-slate-400">TWD</span>
            <button
              type="button"
              onClick={handleFetchLiveRate}
              disabled={fetchingRate}
              title="抓取即時 USD/TWD 匯率"
              className="ml-0.5 rounded p-1 text-slate-400 transition hover:bg-slate-800 hover:text-cyan-300 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${fetchingRate ? 'animate-spin' : ''}`} />
            </button>
            {rateHint && (
              <span className="absolute -bottom-7 left-0 whitespace-nowrap rounded bg-slate-800 px-2 py-0.5 text-[11px] text-cyan-300 shadow-lg ring-1 ring-slate-700">
                {rateHint}
              </span>
            )}
          </div>

          {/* Display Currency Toggle */}
          <div className="flex rounded-lg border border-slate-700/80 bg-slate-900/90 p-0.5 text-xs font-medium">
            {(['TWD', 'USD'] as Currency[]).map((curr) => (
              <button
                key={curr}
                type="button"
                onClick={() => onDisplayCurrencyChange(curr)}
                className={`rounded-md px-2.5 py-1 transition ${
                  displayCurrency === curr
                    ? 'bg-cyan-500/20 text-cyan-300 shadow-sm ring-1 ring-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {curr === 'TWD' ? '台幣總覽' : '美金總覽'}
              </button>
            ))}
          </div>

          {/* Utility Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onExportJson}
              title="匯出 JSON 備份"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">匯出</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="匯入 JSON 備份"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
            >
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">匯入</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onImportJson(file);
                  e.target.value = '';
                }
              }}
            />

            <button
              type="button"
              onClick={onResetPresets}
              title="重置為預設展示資料"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden md:inline">範例重置</span>
            </button>
          </div>

          {/* Primary Add CTA */}
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.35)] transition hover:bg-cyan-400 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            新增訂閱
          </button>
        </div>
      </div>
    </header>
  );
}
