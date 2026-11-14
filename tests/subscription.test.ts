import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  formatBillingScheduleLabel,
  getDaysUntilNextBilling,
  getMonthlyCostInTWD,
  getMonthlyCostInUSD,
  getMonthlyNativePrice,
} from '../src/utils/currency.ts';
import { safeGetStorageItem, safeSetStorageItem } from '../src/utils/storage.ts';
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

describe('CR-02: 瀏覽器儲存例外處理', () => {
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
});

describe('CR-03 & 雙幣別計算: 年繳扣款日期與攤提', () => {
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

  it('年繳有指定月份時正確計算跨年倒數與 2 月短月份', () => {
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
    // From 2026-11-14 to 2027-03-01: 16 (Nov) + 31 (Dec) + 31 (Jan) + 28 (Feb) + 1 (Mar) = 107 days
    assert.equal(getDaysUntilNextBilling(yearlyMar1, new Date(2026, 10, 14)), 107);
    assert.equal(formatBillingScheduleLabel(yearlyMar1), '每年 3/1');
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
});
