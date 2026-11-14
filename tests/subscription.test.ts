import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  formatBillingScheduleLabel,
  getDaysUntilNextBilling,
  getMonthlyCostInTWD,
  getMonthlyCostInUSD,
  getMonthlyNativePrice,
} from '../src/utils/currency.ts';
import {
  persistItemsIfAllowed,
  safeGetStorageItem,
  safeSetStorageItem,
} from '../src/utils/storage.ts';
import {
  applySubscriptionUpdate,
  buildSubscriptionFormData,
} from '../src/utils/subscriptionHelpers.ts';
import {
  validateImportPayload,
  validateSubscriptionList,
} from '../src/utils/validation.ts';
import type { SubscriptionItem } from '../src/types/subscription.ts';

describe('CR-01: 匯入與本機載入逐筆驗證', () => {
  const validItem: SubscriptionItem = {
    id: 'sub-1',
    name: 'ChatGPT Plus',
    category: 'ai',
    price: 20,
    currency: 'USD',
    billingCycle: 'monthly',
    billingDay: 5,
    active: true,
    updatedAt: '2026-11-14T00:00:00.000Z',
  };

  it('拒絕 {"items":[null]} 與 {"items":[{}]}', () => {
    const resNull = validateImportPayload('{"items":[null]}');
    assert.equal(resNull.ok, false);

    const resEmpty = validateImportPayload('{"items":[{}]}');
    assert.equal(resEmpty.ok, false);
  });

  it('拒絕無效 category、負數／非有限 price、無效 billingDay 與 billingMonth', () => {
    const badCategory = validateImportPayload(
      JSON.stringify({ items: [{ ...validItem, category: 'invalid' }] })
    );
    assert.equal(badCategory.ok, false);

    const negativePrice = validateImportPayload(
      JSON.stringify({ items: [{ ...validItem, price: -5 }] })
    );
    assert.equal(negativePrice.ok, false);

    const nanPrice = validateSubscriptionList([{ ...validItem, price: Number.NaN }]);
    assert.equal(nanPrice.ok, false);

    const infPrice = validateSubscriptionList([{ ...validItem, price: Number.POSITIVE_INFINITY }]);
    assert.equal(infPrice.ok, false);

    const badDay = validateImportPayload(
      JSON.stringify({ items: [{ ...validItem, billingDay: 32 }] })
    );
    assert.equal(badDay.ok, false);

    const badMonth = validateImportPayload(
      JSON.stringify({ items: [{ ...validItem, billingCycle: 'yearly', billingMonth: 13 }] })
    );
    assert.equal(badMonth.ok, false);
  });

  it('拒絕重複 ID', () => {
    const dup = validateSubscriptionList([validItem, { ...validItem, name: 'Duplicate' }]);
    assert.equal(dup.ok, false);
    assert.match(dup.error ?? '', /重複/);
  });

  it('拒絕無效 exchangeRate，但接受合法匯入與舊格式（無 billingMonth）', () => {
    const badRate = validateImportPayload(
      JSON.stringify({ items: [validItem], exchangeRate: -10 })
    );
    assert.equal(badRate.ok, false);

    const validPayload = validateImportPayload(
      JSON.stringify({ items: [validItem], exchangeRate: 31.8 })
    );
    assert.equal(validPayload.ok, true);
    assert.equal(validPayload.data?.items.length, 1);
    assert.equal(validPayload.data?.exchangeRate, 31.8);
  });
});

describe('CR-02 & CR-06: 瀏覽器儲存例外與 StrictMode 防覆寫保護', () => {
  it('讀取拋出 SecurityError 時安全回傳錯誤訊息而不中斷', () => {
    const throwingStorage = {
      getItem() {
        throw new DOMException('Blocked', 'SecurityError');
      },
    };
    const res = safeGetStorageItem(throwingStorage, 'test_key');
    assert.equal(res.value, null);
    assert.ok(res.error);
  });

  it('寫入拋出 QuotaExceededError 時安全回傳失敗與提示而不拋出例外', () => {
    const fullStorage = {
      setItem() {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      },
    };
    const res = safeSetStorageItem(fullStorage, 'test_key', 'value');
    assert.equal(res.ok, false);
    assert.ok(res.error);
  });

  it('CR-06 回歸：損壞資料保護下重複執行儲存副作用（模擬 StrictMode 雙重掛載）不會覆寫原始資料', () => {
    const store = new Map<string, string>([['warroom_subscriptions_v1', '[null]']]);
    const memoryStorage = {
      setItem(k: string, v: string) {
        store.set(k, v);
      },
    };

    // StrictMode mount #1 and #2 (plus subsequent currency/rate re-renders) with allowPersist = false
    for (let i = 0; i < 4; i++) {
      const res = persistItemsIfAllowed(
        memoryStorage,
        'warroom_subscriptions_v1',
        JSON.stringify([{ id: 'starter', name: 'Starter' }]),
        false
      );
      assert.equal(res.ok, true);
      assert.equal(store.get('warroom_subscriptions_v1'), '[null]');
    }

    // Only after explicit user action sets allowPersist = true does storage update
    const writeAfterAction = persistItemsIfAllowed(
      memoryStorage,
      'warroom_subscriptions_v1',
      JSON.stringify([{ id: 'user-1', name: 'User Item' }]),
      true
    );
    assert.equal(writeAfterAction.ok, true);
    assert.match(store.get('warroom_subscriptions_v1') ?? '', /User Item/);
  });
});

describe('CR-03 & CR-07: 年繳扣款日期、短月份與清除月份回歸', () => {
  it('年繳未指定月份時 getDaysUntilNextBilling 回傳 null 且標籤明確標示', () => {
    const yearlyNoMonth: SubscriptionItem = {
      id: 'y-1',
      name: 'Annual Tool',
      category: 'ai',
      price: 1200,
      currency: 'USD',
      billingCycle: 'yearly',
      billingDay: 15,
      active: true,
      updatedAt: '2026-11-14T00:00:00.000Z',
    };
    assert.equal(getDaysUntilNextBilling(yearlyNoMonth, new Date(2026, 10, 14)), null);
    assert.equal(formatBillingScheduleLabel(yearlyNoMonth), '每年（未指定月份，15 號）');
    assert.equal(getMonthlyNativePrice(yearlyNoMonth), 100);
    assert.equal(getMonthlyCostInTWD(yearlyNoMonth, 32), 3200);
  });

  it('年繳有指定月份時正確計算跨年倒數，且 2 月短月份正確夾緊至 28/29 日', () => {
    const yearlyMar1: SubscriptionItem = {
      id: 'y-2',
      name: 'Annual Pro',
      category: 'ai',
      price: 1200,
      currency: 'USD',
      billingCycle: 'yearly',
      billingMonth: 3,
      billingDay: 1,
      active: true,
      updatedAt: '2026-11-14T00:00:00.000Z',
    };
    // 2026-11-14 -> 2027-03-01: 16 + 31 + 31 + 28 + 1 = 107 days
    assert.equal(getDaysUntilNextBilling(yearlyMar1, new Date(2026, 10, 14)), 107);
    assert.equal(formatBillingScheduleLabel(yearlyMar1), '每年 3/1');

    const monthly31: SubscriptionItem = {
      id: 'm-31',
      name: 'Short Month Tool',
      category: 'other',
      price: 10,
      currency: 'USD',
      billingCycle: 'monthly',
      billingDay: 31,
      active: true,
      updatedAt: '2026-11-14T00:00:00.000Z',
    };
    // 2026-02-01 -> 2026-02-28 (non-leap year): 27 days
    assert.equal(getDaysUntilNextBilling(monthly31, new Date(2026, 1, 1)), 27);
  });

  it('月繳與台幣換算正確', () => {
    const yt: SubscriptionItem = {
      id: 'm-1',
      name: 'YouTube Premium',
      category: 'media',
      price: 199,
      currency: 'TWD',
      billingCycle: 'monthly',
      billingDay: 22,
      active: true,
      updatedAt: '2026-11-14T00:00:00.000Z',
    };
    assert.equal(getDaysUntilNextBilling(yt, new Date(2026, 10, 14)), 8);
    assert.equal(getMonthlyCostInTWD(yt, 32.5), 199);
    assert.ok(Math.abs(getMonthlyCostInUSD(yt, 32.5) - 199 / 32.5) < 1e-9);
  });

  it('CR-07 回歸：年繳選「未指定月份」或改為月繳後，確實清除既有 billingMonth 且不回帶', () => {
    const existingYearlyDec: SubscriptionItem = {
      id: 'preset-chatgpt',
      name: 'ChatGPT Plus',
      category: 'ai',
      price: 240,
      currency: 'USD',
      billingCycle: 'yearly',
      billingMonth: 12,
      billingDay: 5,
      active: true,
      updatedAt: '2026-11-14T00:00:00.000Z',
    };

    // Case 1: Clear billingMonth while keeping yearly
    const clearedForm = buildSubscriptionFormData({
      name: 'ChatGPT Plus',
      category: 'ai',
      price: 240,
      currency: 'USD',
      billingCycle: 'yearly',
      billingDay: 5,
      billingMonth: undefined,
      active: true,
    });
    const afterClear = applySubscriptionUpdate(
      existingYearlyDec,
      clearedForm,
      '2026-11-14T12:00:00.000Z'
    );
    assert.equal(afterClear.billingMonth, undefined);
    assert.equal('billingMonth' in afterClear, false);
    assert.equal(getDaysUntilNextBilling(afterClear, new Date(2026, 10, 14)), null);
    assert.equal(formatBillingScheduleLabel(afterClear), '每年（未指定月份，5 號）');

    // Case 2: Switch yearly (month 12) -> monthly -> yearly (unspecified)
    const monthlyForm = buildSubscriptionFormData({
      name: 'ChatGPT Plus',
      category: 'ai',
      price: 20,
      currency: 'USD',
      billingCycle: 'monthly',
      billingDay: 5,
      billingMonth: 12, // even if passed, monthly must strip it
      active: true,
    });
    const afterMonthly = applySubscriptionUpdate(
      existingYearlyDec,
      monthlyForm,
      '2026-11-14T12:05:00.000Z'
    );
    assert.equal(afterMonthly.billingMonth, undefined);
    assert.equal('billingMonth' in afterMonthly, false);

    const backToYearlyForm = buildSubscriptionFormData({
      name: 'ChatGPT Plus',
      category: 'ai',
      price: 240,
      currency: 'USD',
      billingCycle: 'yearly',
      billingDay: 5,
      billingMonth: undefined,
      active: true,
    });
    const afterBackToYearly = applySubscriptionUpdate(
      afterMonthly,
      backToYearlyForm,
      '2026-11-14T12:10:00.000Z'
    );
    assert.equal(afterBackToYearly.billingMonth, undefined);
    assert.equal(getDaysUntilNextBilling(afterBackToYearly, new Date(2026, 10, 14)), null);
  });
});
