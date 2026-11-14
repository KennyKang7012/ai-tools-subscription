import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Download, X } from 'lucide-react';
import { AnalyticsSection } from './components/AnalyticsSection';
import { ConfirmResetModal } from './components/ConfirmResetModal';
import { HeaderBar } from './components/HeaderBar';
import { KpiGrid } from './components/KpiGrid';
import { SubscriptionModal } from './components/SubscriptionModal';
import { SubscriptionTable } from './components/SubscriptionTable';
import { DEFAULT_EXCHANGE_RATE, STARTER_SUBSCRIPTIONS } from './data/presets';
import type { Currency, SubscriptionItem } from './types/subscription';
import { safeGetStorageItem, safeSetStorageItem } from './utils/storage';
import { validateImportPayload, validateSubscriptionList } from './utils/validation';

const STORAGE_KEYS = {
  ITEMS: 'warroom_subscriptions_v1',
  RATE: 'warroom_usd_twd_rate_v1',
  CURRENCY: 'warroom_display_currency_v1',
};

interface InitialStateBundle {
  items: SubscriptionItem[];
  exchangeRate: number;
  displayCurrency: Currency;
  storageWarning: string | null;
  hasCorruptedStoredItems: boolean;
}

function getBrowserLocalStorage(): Storage | undefined {
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined;
  } catch {
    return undefined;
  }
}

function loadInitialState(): InitialStateBundle {
  const storage = getBrowserLocalStorage();
  let storageWarning: string | null = null;
  let hasCorruptedStoredItems = false;

  // 1. Load & validate subscription items
  let items: SubscriptionItem[] = STARTER_SUBSCRIPTIONS;
  const itemsRead = safeGetStorageItem(storage, STORAGE_KEYS.ITEMS);
  if (itemsRead.error) {
    storageWarning = itemsRead.error;
  } else if (itemsRead.value !== null) {
    try {
      const parsed: unknown = JSON.parse(itemsRead.value);
      const validation = validateSubscriptionList(parsed);
      if (validation.ok && validation.data) {
        items = validation.data;
      } else {
        hasCorruptedStoredItems = true;
        storageWarning = `本機儲存的訂閱資料格式異常（${validation.error ?? '未知錯誤'}），已暫時載入預設範例；為避免覆蓋原資料，在您編輯或重置前不會寫回本機儲存。`;
      }
    } catch {
      hasCorruptedStoredItems = true;
      storageWarning =
        '本機儲存的訂閱資料無法解析為 JSON，已暫時載入預設範例；在您編輯或重置前不會覆蓋原資料。';
    }
  }

  // 2. Load & validate exchange rate
  let exchangeRate = DEFAULT_EXCHANGE_RATE;
  const rateRead = safeGetStorageItem(storage, STORAGE_KEYS.RATE);
  if (rateRead.error) {
    storageWarning = storageWarning ?? rateRead.error;
  } else if (rateRead.value !== null) {
    const n = parseFloat(rateRead.value);
    if (Number.isFinite(n) && n > 0) {
      exchangeRate = n;
    }
  }

  // 3. Load display currency
  let displayCurrency: Currency = 'TWD';
  const currencyRead = safeGetStorageItem(storage, STORAGE_KEYS.CURRENCY);
  if (currencyRead.error) {
    storageWarning = storageWarning ?? currencyRead.error;
  } else if (currencyRead.value === 'USD') {
    displayCurrency = 'USD';
  }

  return {
    items,
    exchangeRate,
    displayCurrency,
    storageWarning,
    hasCorruptedStoredItems,
  };
}

export function App() {
  const initialRef = useRef<InitialStateBundle | null>(null);
  if (initialRef.current === null) {
    initialRef.current = loadInitialState();
  }
  const initial = initialRef.current;

  const [items, setItems] = useState<SubscriptionItem[]>(initial.items);
  const [exchangeRate, setExchangeRate] = useState<number>(initial.exchangeRate);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>(initial.displayCurrency);
  const [storageWarning, setStorageWarning] = useState<string | null>(initial.storageWarning);

  // If stored items were corrupted, skip the first mount write so we don't clobber raw storage immediately
  const skipCorruptedItemsWriteRef = useRef(initial.hasCorruptedStoredItems);
  const isFirstItemsEffectRef = useRef(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SubscriptionItem | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  useEffect(() => {
    if (isFirstItemsEffectRef.current) {
      isFirstItemsEffectRef.current = false;
      if (skipCorruptedItemsWriteRef.current) {
        return;
      }
    }
    skipCorruptedItemsWriteRef.current = false;

    const storage = getBrowserLocalStorage();
    const res = safeSetStorageItem(storage, STORAGE_KEYS.ITEMS, JSON.stringify(items));
    if (!res.ok && res.error) {
      setStorageWarning(res.error);
    }
  }, [items]);

  useEffect(() => {
    const storage = getBrowserLocalStorage();
    const res = safeSetStorageItem(storage, STORAGE_KEYS.RATE, String(exchangeRate));
    if (!res.ok && res.error) {
      setStorageWarning(res.error);
    }
  }, [exchangeRate]);

  useEffect(() => {
    const storage = getBrowserLocalStorage();
    const res = safeSetStorageItem(storage, STORAGE_KEYS.CURRENCY, displayCurrency);
    if (!res.ok && res.error) {
      setStorageWarning(res.error);
    }
  }, [displayCurrency]);

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSaveSubscription = (
    data: Omit<SubscriptionItem, 'id' | 'updatedAt'>,
    existingId?: string
  ) => {
    const now = new Date().toISOString();
    if (existingId) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === existingId ? { ...item, ...data, updatedAt: now } : item
        )
      );
      showToast(`已更新「${data.name}」`);
    } else {
      const newItem: SubscriptionItem = {
        ...data,
        id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        updatedAt: now,
      };
      setItems((prev) => [newItem, ...prev]);
      showToast(`已新增「${data.name}」`);
    }
  };

  const handleToggleActive = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, active: !item.active, updatedAt: new Date().toISOString() }
          : item
      )
    );
  };

  const handleDelete = (id: string) => {
    const target = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (target) showToast(`已移除「${target.name}」`);
  };

  const handleExportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      exchangeRate,
      items,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscription-warroom-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('已匯出 JSON 備份檔案');
  };

  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = validateImportPayload(String(reader.result ?? ''));
      if (!result.ok || !result.data) {
        showToast(`匯入失敗（已保留原資料）：${result.error ?? '格式錯誤'}`, true);
        return;
      }

      setItems(result.data.items);
      if (result.data.exchangeRate !== undefined) {
        setExchangeRate(result.data.exchangeRate);
      }
      showToast(`成功匯入 ${result.data.items.length} 筆訂閱資料`);
    };
    reader.onerror = () => {
      showToast('匯入失敗：無法讀取檔案內容', true);
    };
    reader.readAsText(file);
  };

  const handleConfirmResetPresets = () => {
    setItems(STARTER_SUBSCRIPTIONS);
    setExchangeRate(DEFAULT_EXCHANGE_RATE);
    setResetModalOpen(false);
    showToast('已重置為預設展示資料');
  };

  const activeCount = items.filter((i) => i.active).length;

  return (
    <div className="min-h-screen pb-14">
      <HeaderBar
        exchangeRate={exchangeRate}
        onExchangeRateChange={setExchangeRate}
        displayCurrency={displayCurrency}
        onDisplayCurrencyChange={setDisplayCurrency}
        onOpenAddModal={() => {
          setEditingItem(null);
          setModalOpen(true);
        }}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onResetPresets={() => setResetModalOpen(true)}
        activeCount={activeCount}
        totalCount={items.length}
      />

      <main className="mx-auto mt-6 max-w-7xl space-y-6 px-4 sm:px-6">
        {storageWarning && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-200 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <span>{storageWarning}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="inline-flex items-center gap-1 rounded-lg border border-amber-400/40 bg-amber-500/20 px-2.5 py-1 text-[11px] font-medium text-amber-100 transition hover:bg-amber-500/30"
              >
                <Download className="h-3 w-3" />
                匯出備份
              </button>
              <button
                type="button"
                onClick={() => setStorageWarning(null)}
                aria-label="關閉警告"
                className="rounded p-1 text-amber-300 transition hover:bg-amber-500/20"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        <KpiGrid
          items={items}
          displayCurrency={displayCurrency}
          exchangeRate={exchangeRate}
        />

        <AnalyticsSection
          items={items}
          displayCurrency={displayCurrency}
          exchangeRate={exchangeRate}
        />

        <SubscriptionTable
          items={items}
          displayCurrency={displayCurrency}
          exchangeRate={exchangeRate}
          onToggleActive={handleToggleActive}
          onEdit={(item) => {
            setEditingItem(item);
            setModalOpen(true);
          }}
          onDelete={handleDelete}
          onOpenAddModal={() => {
            setEditingItem(null);
            setModalOpen(true);
          }}
        />
      </main>

      <SubscriptionModal
        isOpen={modalOpen}
        editingItem={editingItem}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveSubscription}
      />

      <ConfirmResetModal
        isOpen={resetModalOpen}
        itemCount={items.length}
        onCancel={() => setResetModalOpen(false)}
        onExportBeforeReset={handleExportJson}
        onConfirmReset={handleConfirmResetPresets}
      />

      {toast && (
        <div
          role="status"
          className={`fixed right-5 bottom-5 z-50 rounded-xl border px-4 py-2.5 text-xs font-medium shadow-xl backdrop-blur ${
            toast.isError
              ? 'border-rose-500/50 bg-rose-950/90 text-rose-200'
              : 'border-cyan-500/40 bg-slate-900/95 text-cyan-200'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;
