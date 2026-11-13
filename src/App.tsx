import { useEffect, useState } from 'react';
import { AnalyticsSection } from './components/AnalyticsSection';
import { HeaderBar } from './components/HeaderBar';
import { KpiGrid } from './components/KpiGrid';
import { SubscriptionModal } from './components/SubscriptionModal';
import { SubscriptionTable } from './components/SubscriptionTable';
import { DEFAULT_EXCHANGE_RATE, STARTER_SUBSCRIPTIONS } from './data/presets';
import type { Currency, SubscriptionItem } from './types/subscription';

const STORAGE_KEYS = {
  ITEMS: 'warroom_subscriptions_v1',
  RATE: 'warroom_usd_twd_rate_v1',
  CURRENCY: 'warroom_display_currency_v1',
};

function loadInitialItems(): SubscriptionItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ITEMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Fallback to starter pack
  }
  return STARTER_SUBSCRIPTIONS;
}

function loadInitialRate(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RATE);
    if (raw) {
      const n = parseFloat(raw);
      if (!Number.isNaN(n) && n > 0) return n;
    }
  } catch {
    // Ignore
  }
  return DEFAULT_EXCHANGE_RATE;
}

function loadInitialCurrency(): Currency {
  const raw = localStorage.getItem(STORAGE_KEYS.CURRENCY);
  return raw === 'USD' ? 'USD' : 'TWD';
}

export function App() {
  const [items, setItems] = useState<SubscriptionItem[]>(loadInitialItems);
  const [exchangeRate, setExchangeRate] = useState<number>(loadInitialRate);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>(loadInitialCurrency);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SubscriptionItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RATE, String(exchangeRate));
  }, [exchangeRate]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENCY, displayCurrency);
  }, [displayCurrency]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
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
      try {
        const parsed = JSON.parse(String(reader.result));
        const importedItems = Array.isArray(parsed) ? parsed : parsed?.items;
        if (!Array.isArray(importedItems)) {
          throw new Error('Invalid format');
        }
        setItems(importedItems);
        if (typeof parsed?.exchangeRate === 'number' && parsed.exchangeRate > 0) {
          setExchangeRate(parsed.exchangeRate);
        }
        showToast(`成功匯入 ${importedItems.length} 筆訂閱資料`);
      } catch {
        showToast('匯入失敗：JSON 格式不正確');
      }
    };
    reader.readAsText(file);
  };

  const handleResetPresets = () => {
    setItems(STARTER_SUBSCRIPTIONS);
    setExchangeRate(DEFAULT_EXCHANGE_RATE);
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
        onResetPresets={handleResetPresets}
        activeCount={activeCount}
        totalCount={items.length}
      />

      <main className="mx-auto mt-6 max-w-7xl space-y-6 px-4 sm:px-6">
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

      {toast && (
        <div className="fixed right-5 bottom-5 z-50 rounded-xl border border-cyan-500/40 bg-slate-900/95 px-4 py-2.5 text-xs font-medium text-cyan-200 shadow-xl backdrop-blur">
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
